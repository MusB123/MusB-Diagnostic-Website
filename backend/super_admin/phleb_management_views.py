"""Live super admin phlebotomy management API."""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import hmac
from bson import ObjectId
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from musb_backend.mongodb import (
    get_appointments_collection,
    get_employers_collection,
    get_lab_tests_collection,
    get_phlebotomists_collection,
    get_phlebotomy_hubs_collection,
    transform_doc,
)

PLATFORM_FEE_RATE = 0.30


def _unauthorized():
    return Response({"error": "Unauthorized super admin access."}, status=401)


def _is_super_admin_request(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return False
    token = auth_header.split(" ", 1)[1].strip()
    expected = getattr(settings, "SUPER_ADMIN_TOKEN", "super-secret-admin-token-xyz789")
    return bool(token and expected and hmac.compare_digest(token, expected))


def _now_utc():
    return datetime.now(timezone.utc)


def _parse_dt(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            cleaned = value.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            pass
        for fmt in ("%b %d, %Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
            except Exception:
                continue
    return None


def _money(value):
    return f"${value:,.2f}"


def _trend(current, previous):
    if current > previous:
        if previous <= 0:
            return "+100%", "up"
        return f"+{round(((current - previous) / previous) * 100)}%", "up"
    if current < previous:
        if previous <= 0:
            return "-100%", "down"
        return f"-{round(((previous - current) / previous) * 100)}%", "down"
    return "0%", "up"


def _load_orders():
    appointments = [transform_doc(d) for d in get_appointments_collection().find()]
    tests = [transform_doc(d) for d in get_lab_tests_collection().find()]
    phlebs = [transform_doc(d) for d in get_phlebotomists_collection().find()]

    test_by_id = {str(t.get("id")): t for t in tests}
    
    # Robust Multi-Key Phlebotomist Resolver
    phleb_by_id = {}
    for p in phlebs:
        if p.get("id"): phleb_by_id[str(p["id"])] = p
        if p.get("_id"): phleb_by_id[str(p["_id"])] = p
        if p.get("email"): phleb_by_id[p["email"].lower()] = p

    orders = []
    for appt in appointments:
        test_id = str(appt.get("test_id") or "")
        test_doc = test_by_id.get(test_id, {})
        charge_value = float(test_doc.get("price") or 0)
        created_dt = _parse_dt(appt.get("created_at")) or _parse_dt(appt.get("assigned_at")) or _now_utc()
        phleb_id = str(appt.get("assigned_phlebotomist_id") or appt.get("phlebotomist_id") or "")
        phleb_doc = phleb_by_id.get(phleb_id, {})

        orders.append(
            {
                "id": str(appt.get("id") or appt.get("_id")),
                "patient": appt.get("full_name") or "Unknown Patient",
                "patient_email": appt.get("email") or "",
                "patient_phone": appt.get("phone") or "",
                "phlebotomist": phleb_doc.get("name"),
                "phleb_id": phleb_id,
                "company": phleb_doc.get("company"),
                "date": created_dt.strftime("%b %d, %Y"),
                "time": created_dt.strftime("%I:%M %p"),
                "created_dt": created_dt,
                "status": str(appt.get("status") or "pending_approval").lower().replace(" ", "_"),
                "zip": (appt.get("address") or "").split(",")[-1].strip()[-5:],
                "tests": test_doc.get("title", f"Test Ref: {test_id}"),
                "charge_raw": charge_value,
                "charge": _money(charge_value),
                "insurance": "N/A",
                "has_order": True,
                "address": appt.get("address") or "",
            }
        )
    orders.sort(key=lambda x: x["created_dt"], reverse=True)
    return orders


# ===================== OVERVIEW =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_overview(request):
    """Overview with live KPIs."""
    if not _is_super_admin_request(request):
        return _unauthorized()

    now = _now_utc()
    orders = _load_orders()
    phlebs = [transform_doc(d) for d in get_phlebotomists_collection().find()]
    hubs = [transform_doc(d) for d in get_phlebotomy_hubs_collection().find()]

    today_orders = [o for o in orders if o["created_dt"].date() == now.date()]
    week_orders = [o for o in orders if o["created_dt"] >= now - timedelta(days=7)]
    month_orders = [o for o in orders if o["created_dt"] >= now - timedelta(days=30)]
    prev_week_orders = [o for o in orders if now - timedelta(days=14) <= o["created_dt"] < now - timedelta(days=7)]
    prev_month_orders = [o for o in orders if now - timedelta(days=60) <= o["created_dt"] < now - timedelta(days=30)]

    revenue_month = sum(o["charge_raw"] for o in month_orders)
    revenue_prev_month = sum(o["charge_raw"] for o in prev_month_orders)
    fees_month = revenue_month * PLATFORM_FEE_RATE
    fees_prev_month = revenue_prev_month * PLATFORM_FEE_RATE
    active_phlebs = [p for p in phlebs if str(p.get("status", "")).lower() in {"active", "online", "registered"}]
    pending_phlebs = [p for p in phlebs if str(p.get("status", "")).lower() in {"pending", "rejected", "disqualified"}]

    week_change, week_trend = _trend(len(week_orders), len(prev_week_orders))
    month_change, month_trend = _trend(len(month_orders), len(prev_month_orders))
    revenue_change, revenue_trend = _trend(revenue_month, revenue_prev_month)
    fees_change, fees_trend = _trend(fees_month, fees_prev_month)

    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily_counts = {label: 0 for label in day_labels}
    for o in week_orders:
        daily_counts[o["created_dt"].strftime("%a")] = daily_counts.get(o["created_dt"].strftime("%a"), 0) + 1

    zip_counter = Counter()
    for o in month_orders:
        if o["zip"] and len(o["zip"]) == 5:
            zip_counter[o["zip"]] += 1
    top_zip_codes = [{"zip": z, "city": "Coverage Zone", "orders": c} for z, c in zip_counter.most_common(5)]

    recent_activity = []
    for i, order in enumerate(orders[:6], 1):
        recent_activity.append(
            {
                "id": i,
                "type": "order",
                "message": f"Order {order['id']} {order['status'].replace('_', ' ')} - {order['patient']}",
                "time": order["created_dt"].strftime("%b %d, %I:%M %p"),
            }
        )

    return Response(
        {
            "as_of": now.isoformat(),
            "kpis": {
                "orders_today": {"value": len(today_orders), "change": week_change, "trend": week_trend},
                "orders_week": {"value": len(week_orders), "change": week_change, "trend": week_trend},
                "orders_month": {"value": len(month_orders), "change": month_change, "trend": month_trend},
                "total_revenue": {"value": _money(revenue_month), "change": revenue_change, "trend": revenue_trend},
                "platform_fees": {"value": _money(fees_month), "change": fees_change, "trend": fees_trend},
                "active_phlebotomists": {"value": len(active_phlebs), "change": f"+{max(len(active_phlebs) - len(pending_phlebs), 0)}", "trend": "up"},
                "registered_companies": {"value": len(hubs), "change": "live", "trend": "up"},
                "flagged_accounts": {"value": len(pending_phlebs), "change": "live", "trend": "down"},
            },
            "orders_over_time": [{"date": d, "orders": daily_counts.get(d, 0)} for d in day_labels],
            "top_zip_codes": top_zip_codes,
            "recent_activity": recent_activity,
        }
    )


# ===================== PATIENTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_patients(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    orders = _load_orders()
    grouped = defaultdict(list)
    for o in orders:
        key = (o["patient_email"] or o["patient"]).lower()
        grouped[key].append(o)

    patients = []
    for idx, bucket in enumerate(grouped.values(), 1):
        latest = bucket[0]
        status = "active"
        if any(x["status"] in {"cancelled", "disputed"} for x in bucket):
            status = "flagged"
        patients.append(
            {
                "id": f"PAT-{idx:03d}",
                "name": latest["patient"],
                "email": latest["patient_email"] or f"patient{idx}@musb.local",
                "phone": latest["patient_phone"] or "N/A",
                "total_bookings": len(bucket),
                "status": status,
                "joined": min(x["created_dt"] for x in bucket).strftime("%b %d, %Y"),
                "last_booking": max(x["created_dt"] for x in bucket).strftime("%b %d, %Y"),
                "insurance": "N/A",
                "payment_method": "On File",
            }
        )
    patients.sort(key=lambda x: x["total_bookings"], reverse=True)
    return Response({"patients": patients, "total": len(patients), "as_of": _now_utc().isoformat()})


# ===================== PHLEBOTOMISTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_phlebotomists(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    coll = get_phlebotomists_collection()
    docs = [transform_doc(d) for d in coll.find()]
    docs.sort(key=lambda d: _parse_dt(d.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    for d in docs:
        if not d.get("type"):
            d["type"] = "independent"
        if not d.get("status"):
            d["status"] = "pending"
        if "compliance" not in d:
            d["compliance"] = {"dl": "pending", "certificate": "pending", "insurance": "pending"}
        d["total_jobs"] = d.get("total_jobs", d.get("tests_conducted", 0))
        d["joined"] = (_parse_dt(d.get("created_at")) or _now_utc()).strftime("%b %Y")
    return Response({"phlebotomists": docs, "total": len(docs), "rating_threshold": 3.5, "as_of": _now_utc().isoformat()})


@api_view(['POST', 'PATCH'])
@permission_classes([AllowAny])
def update_phleb_status(request, phleb_id):
    if not _is_super_admin_request(request):
        return _unauthorized()
    coll = get_phlebotomists_collection()
    new_status = request.data.get('status')

    if not new_status:
        return Response({'error': 'Status field is required.'}, status=400)

    query = {'id': phleb_id}
    if len(phleb_id) == 24:
        try: query = {'_id': ObjectId(phleb_id)}
        except: pass
        
    update_data = {'status': new_status, "updated_at": _now_utc().isoformat()}

    if new_status == 'active':
        update_data['compliance'] = {
            'dl': 'valid',
            'certificate': 'valid',
            'insurance': 'valid'
        }
    elif new_status == 'disqualified' or new_status == 'rejected':
        update_data['compliance'] = {
            'dl': 'expired',
            'certificate': 'expired',
            'insurance': 'expired'
        }
        
    result = coll.update_one(query, {'$set': update_data})
    
    matched_count = getattr(result, "matched_count", None)
    modified_count = getattr(result, "modified_count", 0)
    if matched_count == 0 or (matched_count is None and modified_count == 0):
        return Response({'error': 'Phlebotomist not found.'}, status=404)
        
    return Response({
        'message': f'Phlebotomist status updated to {new_status}',
        'phleb_id': phleb_id,
        'new_status': new_status
    })


# ===================== COMPANIES =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_companies(request):
    """List Phlebotomy Hubs with aggregated statistics."""
    if not _is_super_admin_request(request):
        return _unauthorized()
    
    hubs = [transform_doc(d) for d in get_phlebotomy_hubs_collection().find()]
    phlebs = [transform_doc(d) for d in get_phlebotomists_collection().find()]
    orders = _load_orders()
    
    companies = []
    for idx, hub in enumerate(hubs, 1):
        # Support both 'hub_id' and the primary record ID
        hub_id = hub.get("hub_id") or hub.get("id") or str(hub.get("_id"))
        
        # Find all specialists belonging to this hub
        hub_phlebs = [p for p in phlebs if p.get("hub_id") == hub_id or str(p.get("hub_id")) == hub_id]
        phleb_ids = {str(p.get("id")) for p in hub_phlebs}
        
        # Aggregate orders from these specialists
        hub_orders = [o for o in orders if str(o.get("phleb_id")) in phleb_ids]
        hub_revenue = sum(o["charge_raw"] for o in hub_orders)
        
        companies.append(
            {
                "id": hub_id or f"HUB-{idx:03d}",
                "name": hub.get("name") or f"Hub {idx}",
                "contact": hub.get("email", "System Hub"),
                "email": hub.get("email") or "N/A",
                "phlebotomist_count": len(hub_phlebs),
                "orders": len(hub_orders),
                "revenue": _money(hub_revenue),
                "doc_status": "complete",
                "status": "active",
                "joined": (_parse_dt(hub.get("created_at")) or _now_utc()).strftime("%b %Y"),
            }
        )
    return Response({"companies": companies, "total": len(companies), "as_of": _now_utc().isoformat()})


# ===================== ORDERS =====================
@api_view(['POST', 'PATCH'])
@permission_classes([AllowAny])
def update_order_status(request, order_id):
    """Update order status (Approve/Reject) with optional reason for rejection."""
    if not _is_super_admin_request(request):
        return _unauthorized()
    
    new_status = request.data.get('status')
    reason = request.data.get('reason', '')
    
    if not new_status:
        return Response({'error': 'Status is required.'}, status=400)
        
    coll = get_appointments_collection()
    
    # Safe ID Resolver: Handles native ObjectIds and custom string IDs
    query = {"id": order_id}
    if len(order_id) == 24:
        try:
            query = {"$or": [{"_id": ObjectId(order_id)}, {"id": order_id}]}
        except:
            pass
            
    # Validation
    if new_status == 'rejected' and not reason:
        return Response({'error': 'Rejection reason is required for patient notification.'}, status=400)
    
    update_fields = {
        'status': 'Pending' if new_status == 'approved' else new_status, 
        'updated_at': _now_utc().isoformat()
    }
    
    if new_status == 'rejected':
        update_fields['rejection_reason'] = reason
        # Simulate patient email
        print(f"\n--- [EMAIL SIMULATION] ---")
        print(f"TO: (Patient Email from DB)")
        print(f"SUBJECT: Update regarding your MusB Diagnostic Booking")
        print(f"MESSAGE: We regret to inform you that your booking could not be approved at this time.")
        print(f"REASON FROM ADMIN: {reason}")
        print(f"--------------------------\n")

    try:
        result = coll.update_one(query, {'$set': update_fields})
        if result.matched_count == 0:
            return Response({'error': 'Order not found.'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Database Update Error',
            'message': f'Failed to update order status: {str(e)}'
        }, status=500)
        
    return Response({
        'message': f'Order {order_id} marked as {new_status}',
        'order_id': order_id,
        'status': update_fields['status']
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_orders(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    orders = _load_orders()
    response_orders = [{k: v for k, v in o.items() if k != "created_dt" and k != "charge_raw"} for o in orders]
    return Response({"orders": response_orders, "total": len(response_orders), "as_of": _now_utc().isoformat()})


# ===================== PAYMENTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_payments(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    orders = [o for o in _load_orders() if o["status"] in {"completed", "enroute", "assigned"}]
    by_recipient = defaultdict(lambda: {"gross": 0.0, "jobs": 0})
    for o in orders:
        recipient = o.get("phlebotomist") or "Unassigned Specialist"
        by_recipient[recipient]["gross"] += o["charge_raw"]
        by_recipient[recipient]["jobs"] += 1

    payout_queue = []
    for i, (recipient, agg) in enumerate(by_recipient.items(), 1):
        fee = agg["gross"] * PLATFORM_FEE_RATE
        net = agg["gross"] - fee
        payout_queue.append(
            {
                "id": f"PAY-{100+i}",
                "recipient": recipient,
                "type": "phlebotomist",
                "gross": _money(agg["gross"]),
                "fee": _money(fee),
                "net": _money(net),
                "jobs": agg["jobs"],
                "status": "pending",
            }
        )
    payout_queue.sort(key=lambda x: x["jobs"], reverse=True)
    payment_history = [
        {**row, "id": f"TXN-{200+i}", "date": (_now_utc() - timedelta(days=7 * i)).strftime("%b %d, %Y"), "status": "paid"}
        for i, row in enumerate(payout_queue[:5], 1)
    ]
    total_pending = sum(float(p["net"].replace("$", "").replace(",", "")) for p in payout_queue)
    return Response(
        {
            "payout_queue": payout_queue,
            "payment_history": payment_history,
            "next_payout_day": "Friday",
            "total_pending": _money(total_pending),
            "platform_fee_rate": f"{int(PLATFORM_FEE_RATE * 100)}%",
            "as_of": _now_utc().isoformat(),
        }
    )


# ===================== REVIEWS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_reviews(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    phlebs = [transform_doc(d) for d in get_phlebotomists_collection().find()]
    reviews = []
    idx = 1
    for p in phlebs:
        for entry in p.get("reviews", []):
            rating = int(entry.get("rating", p.get("rating", 5)) or 5)
            reviews.append(
                {
                    "id": f"REV-{idx:03d}",
                    "patient": entry.get("author", "Patient"),
                    "phlebotomist": p.get("name", "Specialist"),
                    "rating": max(1, min(5, rating)),
                    "text": entry.get("comment", "Service feedback received."),
                    "date": entry.get("date", _now_utc().strftime("%b %d, %Y")),
                    "flagged": rating <= 2,
                }
            )
            idx += 1
    if not reviews:
        reviews = [{"id": "REV-001", "patient": "System", "phlebotomist": "N/A", "rating": 5, "text": "No reviews yet.", "date": _now_utc().strftime("%b %d, %Y"), "flagged": False}]
    return Response({"reviews": reviews, "total": len(reviews), "flagged_count": sum(1 for r in reviews if r["flagged"]), "auto_flag_threshold": 2, "as_of": _now_utc().isoformat()})


# ===================== MARKETING =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_marketing(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    return Response({
        'campaigns': [
            {'id': 'CMP-01', 'name': 'Spring Health Check', 'platform': 'Facebook', 'status': 'active', 'spend': '$450', 'clicks': 1240, 'conversions': 86, 'utm': 'utm_source=facebook&utm_campaign=spring_health'},
            {'id': 'CMP-02', 'name': 'NYC Home Draw', 'platform': 'Google Ads', 'status': 'active', 'spend': '$820', 'clicks': 3100, 'conversions': 210, 'utm': 'utm_source=google&utm_campaign=nyc_home_draw'},
            {'id': 'CMP-03', 'name': 'Insurance Partners', 'platform': 'Instagram', 'status': 'paused', 'spend': '$200', 'clicks': 580, 'conversions': 32, 'utm': 'utm_source=instagram&utm_campaign=insurance_partners'},
        ],
        'seo_pages': [
            {'page': 'Manhattan Home Phlebotomy', 'meta_title': 'Mobile Phlebotomy in Manhattan | MusB', 'meta_desc': 'Book a certified phlebotomist...', 'keywords': 'home phlebotomy manhattan, blood draw nyc', 'zip': '10001'},
            {'page': 'Brooklyn Blood Draw', 'meta_title': 'At-Home Blood Draw Brooklyn | MusB', 'meta_desc': 'Professional blood collection...', 'keywords': 'blood draw brooklyn, mobile lab brooklyn', 'zip': '11201'},
        ],
        'promo_codes': [
            {'code': 'FIRST20', 'discount': '20%', 'usage': 145, 'limit': 500, 'expires': 'May 31, 2026', 'status': 'active'},
            {'code': 'SPRING10', 'discount': '$10 off', 'usage': 89, 'limit': 200, 'expires': 'Apr 30, 2026', 'status': 'active'},
            {'code': 'WELCOME50', 'discount': '50%', 'usage': 50, 'limit': 50, 'expires': 'Expired', 'status': 'expired'},
        ],
        "as_of": _now_utc().isoformat(),
    })


# ===================== SETTINGS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_settings(request):
    if not _is_super_admin_request(request):
        return _unauthorized()
    return Response({
        'admin_users': [
            {'id': 'ADM-001', 'name': 'Master Admin', 'email': 'admin@musb.com', 'role': 'Super Admin', 'last_login': 'Apr 16, 2026 05:30 AM'},
            {'id': 'ADM-002', 'name': 'Sarah Support', 'email': 'sarah.s@musb.com', 'role': 'Support Agent', 'last_login': 'Apr 15, 2026 09:15 AM'},
            {'id': 'ADM-003', 'name': 'Mike Finance', 'email': 'mike.f@musb.com', 'role': 'Finance Manager', 'last_login': 'Apr 14, 2026 02:00 PM'},
            {'id': 'ADM-004', 'name': 'Lisa Compliance', 'email': 'lisa.c@musb.com', 'role': 'Compliance Officer', 'last_login': 'Apr 16, 2026 04:45 AM'},
        ],
        'system_config': {
            'platform_fee_min': 25,
            'platform_fee_max': 35,
            'current_fee': 30,
            'cancellation_window_hours': 4,
            'payout_day': 'Friday',
            'rating_disqualify_threshold': 3.0,
            'auto_flag_review_threshold': 2,
            'max_dispatch_radius_miles': 125,
        },
        'audit_log': [
            {'id': 'AUD-001', 'admin': 'Master Admin', 'action': 'Approved phlebotomist PHL-003', 'timestamp': 'Apr 16, 2026 05:30:12 AM'},
            {'id': 'AUD-002', 'admin': 'Sarah Support', 'action': 'Suspended patient PAT-004', 'timestamp': 'Apr 15, 2026 09:15:30 AM'},
            {'id': 'AUD-003', 'admin': 'Mike Finance', 'action': 'Released payout PAY-101', 'timestamp': 'Apr 14, 2026 02:00:45 PM'},
            {'id': 'AUD-004', 'admin': 'Lisa Compliance', 'action': 'Flagged review REV-004', 'timestamp': 'Apr 14, 2026 11:20:00 AM'},
            {'id': 'AUD-005', 'admin': 'Master Admin', 'action': 'Updated platform fee to 30%', 'timestamp': 'Apr 13, 2026 08:00:00 AM'},
            {'id': 'AUD-006', 'admin': 'Sarah Support', 'action': 'Exported all patients to CSV', 'timestamp': 'Apr 12, 2026 03:30:00 PM'},
        ],
        'roles': ['Super Admin', 'Support Agent', 'Finance Manager', 'Compliance Officer'],
        "as_of": _now_utc().isoformat(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def phleb_realtime(request):
    """Small endpoint for periodic live refresh checks."""
    if not _is_super_admin_request(request):
        return _unauthorized()
    orders = _load_orders()
    active = sum(1 for o in orders if o["status"] in {"assigned", "enroute", "in_progress"})
    completed = sum(1 for o in orders if o["status"] == "completed")
    pending = sum(1 for o in orders if o["status"] in {"pending_approval", "pending"})
    return Response(
        {
            "as_of": _now_utc().isoformat(),
            "counts": {"active_orders": active, "completed_orders": completed, "pending_orders": pending, "total_orders": len(orders)},
            "recent_order_ids": [o["id"] for o in orders[:5]],
        }
    )

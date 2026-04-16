import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { 
  Search, Droplet, Activity, Bone, Filter, Calendar, ShoppingCart, 
  MessageCircle, Clock, FileWarning, HeartPulse, Loader2, AlertCircle
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import './Catalog.css';

const SAMPLE_TYPES = ['All', 'Blood', 'Urine', 'Swab'];

const TestCatalog = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('All');
  const [selectedSample, setSelectedSample] = useState('All');
  const [selectedTurnaround, setSelectedTurnaround] = useState('All');
  const [maxPrice, setMaxPrice] = useState(150);
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const params = {
      search: searchQuery,
      category: selectedGoal,
      sample_type: selectedSample,
      turnaround: selectedTurnaround,
      max_price: maxPrice
    };
    
    const res = await catalogAPI.getTests(params);
    if (res.ok) {
      setTests(res.data);
    }
    setLoading(false);
  }, [searchQuery, selectedGoal, selectedSample, selectedTurnaround, maxPrice]);

  useEffect(() => {
    const loadCategories = async () => {
      const res = await catalogAPI.getCategories();
      if (res.ok) {
        setCategories(['All', ...res.data.map(c => c.name)]);
      } else {
        // Fallback
        setCategories(['All', 'General Wellness', 'Heart Health', 'Vitamins & Minerals', 'Kidney Health', 'Infectious Disease']);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    // Expert Fix: Pulse search from URL params (e.g. redirected from Home)
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTests();
    }, 300); // Debounce search

    // Expert fix: Revalidate data when window gains focus (tabs switch)
    window.addEventListener('focus', fetchTests);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', fetchTests);
    };
  }, [fetchTests]);

  const handleAddToCart = (test) => {
    addToCart({
      id: test.id,
      title: test.title,
      category: test.category_name,
      price: parseFloat(test.price),
      sampleType: test.sample_type,
      turnaround: test.turnaround,
    });
    setAddedId(test.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const getIcon = (iconName) => {
    const icons = { Droplet, HeartPulse, Activity, Bone, FileWarning };
    const IconComp = icons[iconName] || Activity;
    return <IconComp size={24}/>;
  };

  // Handled by API
  const filteredTests = tests;

  return (
    <div className="catalog-page fade-in">
      <div className="catalog-header-banner">
        <h1 className="catalog-title">Test Catalog & Panels</h1>
        <p className="catalog-subtitle">Search, filter, and easily book your required diagnostic tests.</p>
      </div>

      <div className="catalog-layout">
        
        {/* Sidebar Filters */}
        <aside className="catalog-sidebar glass-panel">
          <div className="sidebar-header">
            <h3><Filter size={18}/> Filters</h3>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchQuery(''); setSelectedGoal('All'); setSelectedSample('All'); 
                setSelectedTurnaround('All'); setMaxPrice(100);
              }}
            >Reset</button>
          </div>

          <div className="filter-block">
            <h4 className="filter-label">HEALTH GOAL</h4>
            <select value={selectedGoal} onChange={(e) => setSelectedGoal(e.target.value)} className="filter-dropdown">
              {categories.map(goal => <option key={goal} value={goal}>{goal}</option>)}
            </select>
          </div>

          <div className="filter-block">
            <h4 className="filter-label">SAMPLE TYPE</h4>
            <div className="radio-group flex-col">
              {SAMPLE_TYPES.map(type => (
                <label key={type} className="radio-label">
                  <input 
                    type="radio" 
                    name="sampleType" 
                    value={type}
                    checked={selectedSample === type}
                    onChange={(e) => setSelectedSample(e.target.value)}
                  /> {type}
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="catalog-main">
          
          {/* Search Bar */}
          <div className="catalog-search-wrap glass-panel">
            <Search className="search-icon-cat" size={20}/>
            <input 
              type="text" 
              className="catalog-search-input"
              placeholder="Search tests by name, keywords, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Test Grid */}
          <div className="test-catalog-grid">
            {loading ? (
              <div className="loading-state full-width">
                <Loader2 className="animate-spin text-primary" size={48}/>
                <p>Loading tests...</p>
              </div>
            ) : filteredTests.length > 0 ? filteredTests.map(test => (
              <div key={test.id} className="test-item-card glass-panel">
                <div className="test-card-top">
                  <div className="test-card-icon">{getIcon(test.icon_name)}</div>
                  <div className="test-card-price">${parseFloat(test.price).toFixed(2)}</div>
                </div>
                
                <h3 className="test-card-title">{test.title}</h3>
                <p className="test-card-desc">{test.description}</p>
                
                <div className="test-card-meta">
                  <div className="meta-item text-secondary">
                    <Droplet size={14}/> {test.sample_type}
                  </div>
                  {test.preparation && (
                    <div className="meta-item">
                      <AlertCircle size={14}/> {test.preparation}
                    </div>
                  )}
                  <div className="meta-item text-muted">
                    <Clock size={14}/> {test.turnaround}
                  </div>
                </div>
                
                <div className="test-card-actions">
                  <button
                    className={`btn ${addedId === test.id ? 'btn-secondary' : 'btn-outline'} action-btn flex-1`}
                    onClick={() => handleAddToCart(test)}
                  >
                    <ShoppingCart size={16}/> {addedId === test.id ? 'Added!' : 'Cart'}
                  </button>
                  <Link to={`/book?test=${test.id}`} className="btn btn-primary action-btn flex-1"><Calendar size={16}/> Book</Link>
                  <button className="btn btn-light icon-btn" title="Need help? Chat with an expert."><MessageCircle size={18}/></button>
                </div>
              </div>
            )) : (
              <div className="no-tests-found">
                <FileWarning size={48} className="text-muted"/>
                <h3>No tests match your criteria.</h3>
                <p>Try adjusting your search or filter settings.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestCatalog;
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import Loading from '../components/Loading';
import { FaSearch, FaSlidersH, FaBook, FaLaptop, FaPencilAlt, FaTools, FaGem, FaEllipsisH, FaTimes, FaArrowRight, FaShoppingBag } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [totalListings, setTotalListings] = useState(0);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');

  const categories = [
    { name: 'Books', icon: FaBook, color: 'bg-amber-500' },
    { name: 'Electronics', icon: FaLaptop, color: 'bg-sky-500' },
    { name: 'Stationery', icon: FaPencilAlt, color: 'bg-rose-500' },
    { name: 'Tools', icon: FaTools, color: 'bg-emerald-500' },
    { name: 'Accessories', icon: FaGem, color: 'bg-purple-500' },
    { name: 'Other', icon: FaEllipsisH, color: 'bg-gray-500' },
  ];

  const conditions = ['new', 'like_new', 'good', 'fair', 'poor'];

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams.entries());
      const { data } = await getListings(params);
      setListings(data.listings || []);
      setTotalListings(data.total || 0);
    } catch (error) {
      toast.error('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (sortBy) params.set('sort_by', sortBy);
    setSearchParams(params);
    setShowFilters(false);
  };

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = search || category || condition || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Blur Background */}
      <div className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden">
        {/* Background Layer - Image 2 (Blurred Products) */}
        <div className="absolute inset-0">
          {/* Blurred background image - products collage */}
          <img
            src="/images/hero-bg.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Fallback gradient if image not loaded */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Floating product shapes with blur effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-[10%] w-48 h-48 rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 opacity-30 blur-2xl transform rotate-12"></div>
            <div className="absolute top-20 right-[15%] w-56 h-56 rounded-3xl bg-gradient-to-br from-violet-400 to-purple-600 opacity-25 blur-2xl transform -rotate-12"></div>
            <div className="absolute bottom-20 left-[20%] w-64 h-64 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 opacity-20 blur-2xl transform rotate-6"></div>
            <div className="absolute bottom-10 right-[10%] w-52 h-52 rounded-3xl bg-gradient-to-br from-rose-400 to-pink-600 opacity-25 blur-2xl transform -rotate-6"></div>
          </div>

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/70"></div>
        </div>

        {/* Floating Product Images - Image 3 style (visible products) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Left product image */}
          <div className="absolute left-[3%] lg:left-[8%] top-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 lg:w-56 lg:h-56 opacity-40 lg:opacity-50">
            <img
              src="/images/product-1.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-2xl animate-float"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>

          {/* Right product image */}
          <div className="absolute right-[3%] lg:right-[8%] top-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 lg:w-56 lg:h-56 opacity-40 lg:opacity-50">
            <img
              src="/images/product-2.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-2xl animate-float-delayed"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <FaShoppingBag className="text-emerald-400" />
              <span className="text-white/90 text-sm font-medium">APSIT Student Marketplace</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
              Buy & Sell with
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent mt-2">
                Your Campus Community
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Discover amazing deals on textbooks, electronics, and more from fellow APSIT students
            </p>
          </div>

          {/* Search Bar - Glassmorphism Style */}
          <form onSubmit={handleFilter} className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden border border-white/50">
              <div className="flex-1 flex items-center px-6 py-4 sm:py-0">
                <FaSearch className="text-slate-400 text-xl flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for books, electronics, gadgets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-3 sm:py-4 text-slate-900 text-lg placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="m-2 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Category Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {categories.slice(0, 4).map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-all"
                >
                  <Icon className="text-sm" />
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
            >
              Start Selling <FaArrowRight className="text-sm" />
            </Link>
            <a
              href="#listings"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all"
            >
              Browse Items
            </a>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 50L48 45.8C96 41.7 192 33.3 288 33.3C384 33.3 480 41.7 576 50C672 58.3 768 66.7 864 62.5C960 58.3 1056 41.7 1152 35.4C1248 29.2 1344 33.3 1392 35.4L1440 37.5V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="#f9fafb"/>
          </svg>
        </div>
      </div>

      {/* Categories Bar */}
      <div id="listings" className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick('')}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                !category
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                    category === cat.name
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {category || 'All Items'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {totalListings} {totalListings === 1 ? 'listing' : 'listings'} available
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                const params = new URLSearchParams(searchParams);
                params.set('sort_by', e.target.value);
                setSearchParams(params);
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                hasActiveFilters
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FaSlidersH />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-xs">
                  {[search, category, condition, minPrice, maxPrice].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-slate-500">Active:</span>
            {search && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium">
                "{search}"
                <button onClick={() => { setSearch(''); handleFilter(); }} className="hover:text-red-500">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
            {condition && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium">
                {condition.replace('_', ' ')}
                <button onClick={() => { setCondition(''); handleFilter(); }} className="hover:text-red-500">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium">
                ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); handleFilter(); }} className="hover:text-red-500">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50"
                >
                  <option value="">Any Condition</option>
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>
                      {cond.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="₹0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleFilter}
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <Loading />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <FaSearch className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No listings found</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "Be the first to list something in this category!"}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/create-listing"
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Create Listing
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

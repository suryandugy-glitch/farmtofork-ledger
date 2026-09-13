import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [stages, setStages] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    stage: '',
    location: '',
    date: '',
    temperature: '',
    humidity: '',
    notes: '',
  });
  const [viewStages, setViewStages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message: string }
  const [editingStageId, setEditingStageId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch stages from backend when component mounts or when viewStages changes
  useEffect(() => {
    if (viewStages) {
      fetchStages();
    }
  }, [viewStages]);

  // Fetch stages from backend
  const fetchStages = async () => {
    setApiLoading(true);
    try {
      const productId = 'PROD001'; // For demo, using a fixed product ID
      const response = await fetch(`http://localhost:5001/stages/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stages');
      }
      const data = await response.json();
      // Convert backend format to frontend format
      const formattedStages = data.map((stage, index) => ({
        id: stage.id || index.toString(),
        productId: stage.productId,
        stage: getStageFromNotes(stage.notes) || 'Unknown',
        location: stage.location,
        date: new Date(stage.timestamp * 1000).toISOString().split('T')[0], // Convert Unix timestamp to YYYY-MM-DD
        temperature: stage.temperature,
        humidity: stage.humidity,
        notes: stage.notes,
        ipfsHash: stage.ipfsHash
      }));
      setStages(formattedStages);
    } catch (error) {
      console.error('Error fetching stages:', error);
      setToast({ type: 'error', message: t('messages.error') });
      // Fallback to mock data if backend fails
      setStages([
        {
          id: 1,
          productId: 'PROD001',
          stage: 'Harvest',
          location: 'Farm A, Maharashtra',
          date: '2026-09-01',
          temperature: 25.0,
          humidity: 60.0,
          notes: 'Organic tomatoes',
          ipfsHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
        },
        {
          id: 2,
          productId: 'PROD001',
          stage: 'Processing',
          location: 'Processing Unit B',
          date: '2026-09-02',
          temperature: 22.0,
          humidity: 55.0,
          notes: 'Washed and sorted',
          ipfsHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
        },
      ]);
    } finally {
      setApiLoading(false);
    }
  };

  // Helper to extract stage from notes (fallback for display)
  const getStageFromNotes = (notes) => {
    const stageMatch = notes.match(/Stage:\s*([^,\n]+)/i);
    return stageMatch ? stageMatch[1].trim() : null;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate form
      if (!formData.productId.trim()) {
        setToast({ type: 'error', message: t('validation.productIdRequired') });
        setLoading(false);
        return;
      }

      if (!formData.stage.trim()) {
        setToast({ type: 'error', message: t('validation.stageRequired') });
        setLoading(false);
        return;
      }

      // Convert date string to Unix timestamp
      const timestamp = Math.floor(new Date(formData.date).getTime() / 1000);

      // Prepare data for backend
      const stageData = {
        productId: formData.productId.trim(),
        location: formData.location.trim(),
        notes: `Stage: ${formData.stage.trim()}\n${formData.notes.trim()}`,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        // In a real app, you would have an IPFS hash here
        ipfsHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };

      // Call backend API
      const response = await fetch('http://localhost:5001/stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stageData),
      });

      if (!response.ok) {
        throw new Error('Failed to add stage');
      }

      const result = await response.json();
      console.log('Stage added successfully:', result);

      // Reset form
      setFormData({
        productId: '',
        stage: '',
        location: '',
        date: '',
        temperature: '',
        humidity: '',
        notes: '',
      });

      // Show success toast
      setToast({ type: 'success', message: t('messages.success') });

      // Refresh stages if viewing
      if (viewStages) {
        fetchStages();
      }
    } catch (error) {
      console.error('Error adding stage:', error);
      setToast({ type: 'error', message: t('messages.error') });
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing form
  const handleClear = () => {
    setFormData({
      productId: '',
      stage: '',
      location: '',
      date: '',
      temperature: '',
      humidity: '',
      notes: '',
    });
  };

  // Handle copying product ID to clipboard
  const handleCopyProductId = (productId) => {
    navigator.clipboard.writeText(productId).then(() => {
      setToast({ type: 'success', message: `${t('messages.copied')} ${productId}` });
    }).catch(() => {
      setToast({ type: 'error', message: t('messages.copyFailed') });
    });
  };

  // Handle editing a stage
  const handleEditStage = (stage) => {
    setEditingStageId(stage.id);
    setEditData({
      productId: stage.productId,
      stage: stage.stage,
      location: stage.location,
      date: stage.date,
      temperature: stage.temperature,
      humidity: stage.humidity,
      notes: stage.notes
    });
  };

  // Handle saving edited stage
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      // In a real app, you would call an update API endpoint
      // For now, we'll simulate by replacing the stage
      setStages(prev =>
        prev.map(stage =>
          stage.id === editingStageId
            ? { ...stage, ...editData }
            : stage
        )
      );

      setToast({ type: 'success', message: t('messages.updated') });
      setEditingStageId(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating stage:', error);
      setToast({ type: 'error', message: t('messages.error') });
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingStageId(null);
    setEditData({});
  };

  // Handle confirming delete
  const handleConfirmDelete = (id) => {
    setConfirmDeleteId(id);
  };

  // Handle canceling delete
  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Handle deleting a stage
  const handleDeleteStage = async (id) => {
    setLoading(true);
    try {
      // In a real app, you would call a delete API endpoint
      // For now, we'll simulate by removing the stage
      setStages(prev => prev.filter(stage => stage.id !== id));
      setToast({ type: 'success', message: t('messages.deleted') });
      setConfirmDeleteId(null);

      // Refresh if viewing stages
      if (viewStages) {
        fetchStages();
      }
    } catch (error) {
      console.error('Error deleting stage:', error);
      setToast({ type: 'error', message: t('messages.error') });
    } finally {
      setLoading(false);
    }
  };

  // Handle exporting data (mock)
  const handleExport = () => {
    setToast({ type: 'info', message: t('messages.exportSuccess') });
    // In real app: generate CSV or JSON and trigger download
  };

  // Handle refreshing stages (mock)
  const handleRefresh = () => {
    setToast({ type: 'info', message: t('messages.refresh') });
    if (viewStages) {
      fetchStages();
    }
  };

  // Handle language change
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-gray-900 dark:from-gray-800 dark:to-gray-900 transition-colors duration-500"
    >
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            toast.type === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-l-4 border-green-500'
              : toast.type === 'error'
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-l-4 border-red-500'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* You can replace with actual icons */}
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✗'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{t(toast.message)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="navbar bg-white dark:bg-gray-800 shadow-md px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {t('navbar.title')}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative language-selector">
            <button
              onClick={(e) => {
                e.currentTarget.parentElement.classList.toggle('open');
              }}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
              aria-label={t('navbar.language')}
            >
              {i18n.language.toUpperCase()}
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute left-0 mt-2 w-32 bg-white dark:bg-gray-700 border rounded shadow-lg z-50">
              {[ 'en', 'hi', 'bn' ].map(lang => (
                <div
                  key={lang}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {lang.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              localStorage.setItem('theme', isDark ? 'dark' : 'light');
            }}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
            aria-label={t('navbar.darkMode')}
          >
            {document.documentElement.classList.contains('dark') ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 35H16a2 2 0 00-2 2v1a2 2 0 002 2h4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 35H16a2 2 0 00-2 2v1a2 2 0 002 2h4" />
              </svg>
            )}
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Home Section */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t('home.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('home.subtitle')}
          </p>
        </motion.div>

        {/* Tabs: Add Stage / View Stages */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewStages(false)}
              className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
                !viewStages
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300'
              } ${
                !viewStages ? 'hover:bg-blue-200 dark:hover:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('addStage.title')}
            </button>
            <button
              onClick={() => setViewStages(true)}
              className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
                viewStages
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300'
              } ${
                viewStages ? 'hover:bg-blue-200 dark:hover:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('viewStages.title')}
            </button>
          </div>

          {/* Add Stage Form */}
          {!viewStages && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product ID Section */}
                <div className="space-y-2">
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.productId')}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      placeholder={t('addStage.productIdPlaceholder')}
                      className="input-field flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyProductId(formData.productId)}
                      disabled={!formData.productId.trim()}
                      className={`px-3 py-2 text-sm transition-colors duration-200 ${
                        formData.productId.trim()
                          ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-400 rounded-md cursor-not-allowed'
                      }`}
                    >
                      📋
                    </button>
                  </div>
                  {formData.productId && !loading && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {t('messages.productIdSet')}: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{formData.productId}</code>
                    </p>
                  )}
                </div>

                {/* Stage Section */}
                <div className="space-y-2">
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.stage')}
                  </label>
                  <input
                    type="text"
                    id="stage"
                    name="stage"
                    value={formData.stage}
                    onChange={handleChange}
                    placeholder={t('addStage.stagePlaceholder')}
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                    required
                  />
                </div>

                {/* Location Section */}
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.location')}
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={t('addStage.locationPlaceholder')}
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                    required
                  />
                </div>

                {/* Date Section */}
                <div className="space-y-2">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.date')}
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                    required
                  />
                </div>

                {/* Temperature and Humidity Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature */}
                  <div className="space-y-2">
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('addStage.temperature')}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="temperature"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        placeholder={t('addStage.temperaturePlaceholder')}
                        className="input-field flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                        step="0.1"
                        required
                      />
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">°C</span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="space-y-2">
                    <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('addStage.humidity')}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="humidity"
                        name="humidity"
                        value={formData.humidity}
                        onChange={handleChange}
                        placeholder={t('addStage.humidityPlaceholder')}
                        className="input-field flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                        step="0.1"
                        required
                      />
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={t('addStage.notesPlaceholder')}
                    rows="4"
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium transition-colors duration-200 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    {t('buttons.clear')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                      loading ? 'pointer-events-none' : ''
                    }`}
                  >
                    {loading ? (
                      <motion.span
                        while={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6 }}
                      >
                        {t('addStage.adding')}
                      </motion.span>
                    ) : (
                      t('addStage.addButton')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* View Stages Table */}
          {viewStages && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-6"
            >
              {(apiLoading && stages.length === 0) ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('viewStages.loading')}
                </p>
              ) : (
                <>
                  {stages.length === 0 && !apiLoading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {t('viewStages.noStages')}
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {t('viewStages.title')}
                          </h2>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleExport}
                            className="px-4 py-2 text-sm font-medium transition-colors duration-200 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700"
                          >
                            {t('buttons.export')}
                          </button>
                          <button
                            onClick={handleRefresh}
                            className="ml-3 px-4 py-2 text-sm font-medium transition-colors duration-200 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700"
                          >
                            {t('buttons.refresh')}
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="relative shadow-md sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-600">
                              <tr>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.productId')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.stage')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.location')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.date')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.temperature')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.humidity')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.notes')}
                                </th>
                                <th className="table-header px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  {t('viewStages.table.actions')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-600">
                              {stages.map(stage => (
                                <tr
                                  key={stage.id}
                                  className={`table-row hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                                    editingStageId === stage.id ? 'border-l-4 border-blue-500' : ''
                                  }`}
                                >
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.productId}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.stage}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.location}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.date}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.temperature}°C</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200>{stage.humidity}%</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="max-w-xs whitespace-normal">
                                      {stage.notes}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 space-x-2">
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleEditStage(stage)}
                                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                                      title={t('buttons.edit')}
                                    >
                                      ✏️
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => handleConfirmDelete(stage.id)}
                                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                                      title={t('buttons.delete')}
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Responsive card view for mobile */}
                          <div className="pt-4">
                            {stages.map(stage => (
                              <div
                                key={stage.id}
                                className={`mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border ${
                                  editingStageId === stage.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
                                } hover:border-gray-300 dark:hover:border-gray-500 transition-colors duration-200`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                                      {stage.stage}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                      {stage.location}
                                    </p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleCopyProductId(stage.productId)}
                                      className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      title={t('messages.copyProductId')}
                                    >
                                      📋
                                    </button>

                                    <button
                                      onClick={() => handleEditStage(stage)}
                                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                                      title={t('buttons.edit')}
                                    >
                                      ✏️
                                    </button>

                                    <button
                                      onClick={() => handleConfirmDelete(stage.id)}
                                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                      title={t('buttons.delete')}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {t('viewStages.table.productId')}:
                                    </span>
                                    <span className="ml-2">{stage.productId}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {t('viewStages.table.date')}:
                                    </span>
                                    <span className="ml-2">{stage.date}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {t('viewStages.table.temperature')}:
                                    </span>
                                    <span className="ml-2">{stage.temperature}°C</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {t('viewStages.table.humidity')}:
                                    </span>
                                    <span className="ml-2">{stage.humidity}%</span>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">{t('viewStages.table.notes')}:</span>
                                    <br />
                                    {stage.notes}
                                  </p>
                                </div>

                                {/* Edit Form */}
                                {editingStageId === stage.id && (
                                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
                                      {t('buttons.edit')}
                                    </h3>
                                    <form onSubmit={handleSaveEdit} className="space-y-3">
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {t('addStage.productId')}
                                        </label>
                                        <input
                                          type="text"
                                          value={editData.productId || ''}
                                          onChange={(e) => setEditData(prev => ({ ...prev, productId: e.target.value }))}
                                          className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {t('addStage.stage')}
                                        </label>
                                        <input
                                          type="text"
                                          value={editData.stage || ''}
                                          onChange={(e) => setEditData(prev => ({ ...prev, stage: e.target.value }))}
                                          className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {t('addStage.location')}
                                        </label>
                                        <input
                                          type="text"
                                          value={editData.location || ''}
                                          onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                                          className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('addStage.date')}
                                          </label>
                                          <input
                                            type="date"
                                            value={editData.date || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                                            className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('addStage.temperature')}
                                          </label>
                                          <div className="flex items-center">
                                            <input
                                              type="number"
                                              value={editData.temperature || ''}
                                              onChange={(e) => setEditData(prev => ({ ...prev, temperature: e.target.value }))}
                                              className="input-field flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                              step="0.1"
                                            />
                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">°C</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('addStage.humidity')}
                                          </label>
                                          <div className="flex items-center">
                                            <input
                                              type="number"
                                              value={editData.humidity || ''}
                                              onChange={(e) => setEditData(prev => ({ ...prev, humidity: e.target.value }))}
                                              className="input-field flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                              step="0.1"
                                            />
                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">%</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {t('addStage.notes')}
                                        </label>
                                        <textarea
                                          value={editData.notes || ''}
                                          onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                          rows="3"
                                          className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                      </div>

                                      <div className="flex justify-end space-x-3">
                                        <button
                                          type="button"
                                          onClick={handleCancelEdit}
                                          className="px-3 py-2 text-sm font-medium transition-colors duration-200 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                        >
                                          {t('buttons.cancel')}
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={loading}
                                          className={`px-3 py-2 text-sm font-medium transition-colors duration-200 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            loading ? 'pointer-events-none' : ''
                                          }`}
                                        >
                                          {loading ? t('messages.saving') : t('buttons.save')}
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                )}

                                {/* Delete Confirmation */}
                                {confirmDeleteId === stage.id && (
                                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500">
                                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-3">
                                      {t('messages.confirmDelete')}
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                      {t('messages.confirmDeleteStage')} "{stage.stage}"?
                                    </p>
                                    <div className="flex justify-end space-x-3">
                                      <button
                                        type="button"
                                        onClick={handleCancelDelete}
                                        className="px-3 py-2 text-sm font-medium transition-colors duration-200 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                      >
                                        {t('buttons.cancel')}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStage(stage.id)}
                                        className="px-3 py-2 text-sm font-medium transition-colors duration-200 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700"
                                      >
                                        {t('buttons.delete')}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="footer mt-12 pt-6 border-t border-gray-200 dark:border-gray-600 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        <p className="mb-2">
          {t('footer.rights')}
        </p>
        <p>
          {t('footer.madeWith')}
        </p>
      </motion.footer>
    </motion.div>
  );
}

export default App;
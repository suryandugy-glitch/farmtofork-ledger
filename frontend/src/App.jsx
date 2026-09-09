import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import './App.css';

// Mock data for stages (in a real app, this would come from backend or blockchain)
const initialStages = [
  { id: 1, productId: 'PROD001', stage: 'Harvest', location: 'Farm A, Maharashtra', date: '2026-09-01', notes: 'Organic tomatoes' },
  { id: 2, productId: 'PROD001', stage: 'Processing', location: 'Processing Unit B', date: '2026-09-02', notes: 'Washed and sorted' },
];

function App() {
  const { t, i18n } = useTranslation();
  const [stages, setStages] = useState(initialStages);
  const [formData, setFormData] = useState({
    productId: '',
    stage: '',
    location: '',
    date: '',
    notes: '',
  });
  const [viewStages, setViewStages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message: string }

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add new stage
    const newStage = {
      id: Date.now(),
      ...formData,
    };
    setStages(prev => [...prev, newStage]);

    // Reset form
    setFormData({
      productId: '',
      stage: '',
      location: '',
      date: '',
      notes: '',
    });

    // Show success toast
    setToast({ type: 'success', message: t('messages.success') });

    setLoading(false);
  };

  // Handle clearing form
  const handleClear = () => {
    setFormData({
      productId: '',
      stage: '',
      location: '',
      date: '',
      notes: '',
    });
  };

  // Handle exporting data (mock)
  const handleExport = () => {
    setToast({ type: 'info', message: t('messages.exportSuccess') });
    // In real app: generate CSV or JSON and trigger download
  };

  // Handle refreshing stages (mock)
  const handleRefresh = () => {
    setToast({ type: 'info', message: t('messages.refresh') });
    // In real app: fetch from blockchain/backend
  };

  // Handle language change
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  // Toast auto-hide after 3 seconds
  // Note: In a real app, we might use a toast library, but for simplicity we'll manage state
  // We'll use a timeout to clear the toast after 3 seconds
  // We'll use useEffect for this, but to keep it simple in this example, we'll just note it.
  // Since we cannot run useEffect in this context without hooks, we'll skip auto-hide for now.
  // In a production app, we would add:
  // useEffect(() => {
  //   if (toast) {
  //     const timer = setTimeout(() => setToast(null), 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [toast]);

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
              className={`flex-1 py-3 text-center font-medium ${
                !viewStages
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('addStage.title')}
            </button>
            <button
              onClick={() => setViewStages(true)}
              className={`flex-1 py-3 text-center font-medium ${
                viewStages
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300'
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.productId')}
                  </label>
                  <input
                    type="text"
                    id="productId"
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    placeholder={t('addStage.productIdPlaceholder')}
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                    required
                  />
                </div>
                <div>
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
                <div>
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
                <div>
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
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addStage.notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={t('addStage.notesPlaceholder')}
                    rows="3"
                    className="input-field w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    {t('buttons.clear')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                      loading ? 'pointer-events-none' : ''
                    }`}
                  >
                    {loading ? t('addStage.adding') : t('addStage.addButton')}
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
              {stages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('viewStages.noStages')}
                </p>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200"
                    >
                      {t('buttons.export')}
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="ml-3 px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      {t('buttons.refresh')}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
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
                            className="table-row hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                          >
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.productId}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.stage}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.location}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.date}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{stage.notes}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 space-x-2">
                              <button
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                title="Delete"
                                onClick={() => setStages(prev => prev.filter(s => s.id !== stage.id))}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
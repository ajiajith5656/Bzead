import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Business Rules */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Business Rules</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Platform Charges
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Profit Calculation
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Tax Settings
              </button>
            </div>
          </div>
        </div>

        {/* Master Data */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Master Data</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Country List
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Category List
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Sub Category List
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Settings</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                General Settings
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                Email Settings
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-left">
                API Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">System Status</h3>
        <p className="text-blue-700">All backend connections are properly configured.</p>
      </div>
    </div>
  );
};

export default SettingsPage;

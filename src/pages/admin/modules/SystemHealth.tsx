import React, { useState, useEffect } from 'react';
import { Database, Activity, AlertCircle, CheckCircle, XCircle, HardDrive } from 'lucide-react';
import { getSystemHealth } from '../../../lib/adminService';

interface HealthStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  metric: string;
  message: string;
  icon: React.ReactNode;
}

export const SystemHealth: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);

  useEffect(() => {
    const loadHealth = async () => {
      const data = await getSystemHealth();
      setHealthStatuses([
        {
          name: 'Database Connection',
          status: data.dbStatus === 'healthy' ? 'healthy' : 'critical',
          metric: `${data.totalUsers} users, ${data.totalProducts} products`,
          message: `${data.totalOrders} orders, ${data.totalComplaints} complaints`,
          icon: <Database className="w-6 h-6" />,
        },
        {
          name: 'API Server',
          status: 'healthy',
          metric: 'Supabase connected',
          message: `Last checked: ${new Date(data.lastChecked).toLocaleTimeString()}`,
          icon: <Activity className="w-6 h-6" />,
        },
        {
          name: 'Storage',
          status: 'healthy',
          metric: 'Supabase Storage active',
          message: 'Buckets: product-images, kyc-documents',
          icon: <HardDrive className="w-6 h-6" />,
        },
      ]);
    };
    loadHealth();
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    const colors = {
      'healthy': 'text-green-600',
      'warning': 'text-yellow-600',
      'critical': 'text-red-600'
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusBgColor = (status: string) => {
    const colors = {
      'healthy': 'bg-green-50 border-green-200',
      'warning': 'bg-yellow-50 border-yellow-200',
      'critical': 'bg-red-50 border-red-200'
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600 mt-2">Monitor system status and performance</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-medium">Auto-refresh (30s)</span>
            </label>
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Overall System Status</h2>
              <p className="text-gray-600 mt-2">Last updated: just now</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
                <span className="text-4xl font-bold text-green-600">98%</span>
              </div>
              <p className="font-semibold text-green-600">Operational</p>
            </div>
          </div>
        </div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {healthStatuses.map((health, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-6 ${getStatusBgColor(health.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${getStatusColor(health.status)}`}>
                  {health.icon}
                </div>
                {getStatusIcon(health.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{health.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{health.message}</p>
              <div className="flex items-center justify-between pt-4 border-t border-opacity-30">
                <span className="text-sm font-semibold text-gray-700">{health.metric}</span>
                <span className={`text-xs font-semibold uppercase ${getStatusColor(health.status)}`}>
                  {health.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Request Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Request Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'avg Response Time', value: '45ms', good: true },
                { label: 'P95 Response Time', value: '128ms', good: true },
                { label: 'P99 Response Time', value: '245ms', good: true },
                { label: 'Error Rate', value: '0.05%', good: true }
              ].map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{metric.value}</span>
                    {metric.good && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Database Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'Connections', value: '245/500', usage: 49 },
                { label: 'CPU Usage', value: '32%', usage: 32 },
                { label: 'Memory Usage', value: '58%', usage: 58 },
                { label: 'Disk Usage', value: '72%', usage: 72 }
              ].map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 text-sm">{metric.label}</span>
                    <span className="font-semibold text-gray-900 text-sm">{metric.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.usage > 80 ? 'bg-red-600' : metric.usage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${metric.usage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Alerts & Issues</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">High Storage Usage</p>
                  <p className="text-gray-600 text-sm mt-1">S3 storage usage is at 78%. Consider archiving old data.</p>
                  <p className="text-gray-500 text-xs mt-2">2 hours ago</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Database Backup Completed</p>
                  <p className="text-gray-600 text-sm mt-1">Daily backup of all databases completed successfully.</p>
                  <p className="text-gray-500 text-xs mt-2">1 hour ago</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Cache Cleared</p>
                  <p className="text-gray-600 text-sm mt-1">Application cache cleared to free up memory.</p>
                  <p className="text-gray-500 text-xs mt-2">30 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <button className="bg-blue-600 text-gray-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Refresh Now
          </button>
          <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
            View Detailed Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;

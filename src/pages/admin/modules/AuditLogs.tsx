import React, { useState, useEffect } from 'react';
import { Clock, Filter, Download, Eye } from 'lucide-react';
import { getAuditLogs } from '../../../lib/adminService';
import { supabase } from '../../../lib/supabase';

interface AuditLog {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed';
}

export const AuditLogs: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      const result = await getAuditLogs({ limit: 50 });
      const fetched = (result.logs || []).map((l: any) => ({
        id: l.id,
        timestamp: l.created_at || l.timestamp || '',
        admin: l.admin_name || l.admin || 'Admin',
        action: l.action || '',
        resource: l.resource || '',
        resourceId: l.resource_id || '',
        details: l.details || '',
        ipAddress: l.ip_address || '',
        status: l.status || 'success',
      }));
      setLogs(fetched);

      // Derive distinct actions from fetched logs
      const uniqueActions = Array.from(new Set(fetched.map((l: AuditLog) => l.action).filter(Boolean)));
      if (uniqueActions.length > 0) {
        setActions(uniqueActions);
      } else {
        // Fallback: try to get distinct actions from DB
        const { data } = await supabase.from('audit_logs').select('action');
        if (data) {
          const fromDb = Array.from(new Set(data.map((r: any) => r.action).filter(Boolean)));
          setActions(fromDb);
        }
      }
    };
    loadLogs();
  }, []);

  const getStatusBadge = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'User Suspended': 'bg-red-100 text-red-800',
      'Product Approved': 'bg-green-100 text-green-800',
      'Order Refund': 'bg-blue-100 text-blue-800',
      'Seller KYC Rejected': 'bg-orange-100 text-orange-800',
      'Promotion Created': 'bg-purple-100 text-purple-800',
      'Report Generated': 'bg-indigo-100 text-indigo-800',
      'Settings Updated': 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all administrative actions and changes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            <button className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Resource</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.admin}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.resource} ({log.resourceId})
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(log.status)}`}>
                        {log.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t p-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">1</span> to <span className="font-semibold">5</span> of <span className="font-semibold">1,234</span> logs
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                disabled>
                Previous
              </button>
              <button className="px-4 py-2 bg-blue-600 text-gray-900 rounded-lg hover:bg-blue-700 transition">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Log Details Modal Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Need detailed information?</h3>
          <p className="text-blue-800 text-sm">
            Click "View" on any log to see complete details including request payload, response, and affected records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

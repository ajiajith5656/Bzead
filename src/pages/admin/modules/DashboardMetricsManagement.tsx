import React from 'react';
import { logger } from '../../../utils/logger';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';

export const DashboardMetricsManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Dashboard Metrics',
    fields: [
      { name: 'totalSales', type: 'number', required: true },
      { name: 'totalExpenses', type: 'number', required: true },
      { name: 'totalProducts', type: 'number', required: true },
      { name: 'totalUsers', type: 'number', required: true },
      { name: 'totalSellers', type: 'number', required: true },
      { name: 'totalBookings', type: 'number', required: true },
      { name: 'ongoingOrders', type: 'number', required: true },
      { name: 'returnsCancellations', type: 'number', required: true },
      { name: 'userRegistrations', type: 'number', required: true },
      { name: 'primeMembers', type: 'number', required: true },
      { name: 'sellerRegistrations', type: 'number', required: true },
    ],
    onFetch: async () => {
      return [
        {
          id: '1',
          totalSales: 5000000,
          totalExpenses: 1000000,
          totalProducts: 5000,
          totalUsers: 50000,
          totalSellers: 500,
          totalBookings: 10000,
          ongoingOrders: 250,
          returnsCancellations: 50,
          userRegistrations: 1000,
          primeMembers: 5000,
          sellerRegistrations: 100,
        },
      ];
    },
    onAdd: async (data) => {
      logger.log('Metrics added', { data });
      return true;
    },
    onEdit: async (id, data) => {
      logger.log('Metrics edited', { id, data });
      return true;
    },
    onDelete: async (id) => {
      logger.log('Metrics deleted', { id });
      return true;
    },
  };

  return <TableManager config={config} />;
};

import React from 'react';

export interface TableConfig {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
  onFetch?: () => void;
  onAdd?: (data: any) => void;
  onEdit?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
}

interface TableManagerProps {
  config: TableConfig;
  onAdd?: (data: any) => void;
  onEdit?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({ config }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{config.name} Management</h2>
      <p className="text-gray-600">Table manager functionality...</p>
    </div>
  );
};

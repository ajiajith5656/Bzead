import React from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';

export const BusinessTypeManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Business Types',
    fields: [
      { name: 'typeName', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
    ],
    onFetch: async () => {
      const { data, error } = await supabase
        .from('business_types')
        .select('id, type_name, description, is_active')
        .order('type_name');
      if (error) { logger.error(error, { context: 'Fetch business types' }); return []; }
      return (data || []).map((bt: any) => ({
        id: bt.id,
        typeName: bt.type_name,
        description: bt.description || '',
        isActive: bt.is_active,
      }));
    },
    onAdd: async (data) => {
      const { error } = await supabase.from('business_types').insert({
        type_name: data.typeName,
        description: data.description,
        is_active: true,
      });
      if (error) { logger.error(error, { context: 'Add business type' }); return false; }
      return true;
    },
    onEdit: async (id, data) => {
      const { error } = await supabase.from('business_types').update({
        type_name: data.typeName,
        description: data.description,
      }).eq('id', id);
      if (error) { logger.error(error, { context: 'Edit business type' }); return false; }
      return true;
    },
    onDelete: async (id) => {
      const { error } = await supabase.from('business_types').delete().eq('id', id);
      if (error) { logger.error(error, { context: 'Delete business type' }); return false; }
      return true;
    },
  };

  return <TableManager config={config} />;
};

import React from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';

export const CountryListManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Countries',
    fields: [
      { name: 'countryName', type: 'text', required: true },
      { name: 'shortCode', type: 'text', required: true },
      { name: 'currency', type: 'text', required: true },
      { name: 'dialCode', type: 'text' },
    ],
    onFetch: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, country_name, short_code, currency_code, dialing_code, is_active')
        .order('country_name');
      if (error) { logger.error(error, { context: 'Fetch countries' }); return []; }
      return (data || []).map((c: any) => ({
        id: c.id,
        countryName: c.country_name,
        shortCode: c.short_code,
        currency: c.currency_code,
        dialCode: c.dialing_code,
        isActive: c.is_active,
      }));
    },
    onAdd: async (data) => {
      const { error } = await supabase.from('countries').insert({
        country_name: data.countryName,
        short_code: data.shortCode,
        currency_code: data.currency,
        dialing_code: data.dialCode,
        is_active: true,
      });
      if (error) { logger.error(error, { context: 'Add country' }); return false; }
      return true;
    },
    onEdit: async (id, data) => {
      const { error } = await supabase.from('countries').update({
        country_name: data.countryName,
        short_code: data.shortCode,
        currency_code: data.currency,
        dialing_code: data.dialCode,
      }).eq('id', id);
      if (error) { logger.error(error, { context: 'Edit country' }); return false; }
      return true;
    },
    onDelete: async (id) => {
      const { error } = await supabase.from('countries').delete().eq('id', id);
      if (error) { logger.error(error, { context: 'Delete country' }); return false; }
      return true;
    },
  };

  return <TableManager config={config} />;
};

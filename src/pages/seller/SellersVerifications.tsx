import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, User, Mail,
  Landmark, FileText, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SellersVerificationsProps {
  onBack: () => void;
  onProceed: (data: any) => void;
  countryCode?: string;
}

// Added comment above fix: Use React.FC to explicitly define component type and resolve JSX children prop resolution issues
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative group transition-colors hover:border-gray-200">
    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-900">
      <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

// Added comment above fix: Explicitly type Input component props instead of using 'any' to improve type safety and error reporting
const Input: React.FC<{ label: string; value?: string; onChange?: (val: string) => void; placeholder?: string; type?: string; required?: boolean; disabled?: boolean; }> = ({ label, value, onChange, placeholder, type = "text", required = false, disabled = false }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    <input 
      type={type}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full bg-[#0d0d0d] border border-gray-900 rounded-xl px-4 py-3.5 text-sm transition-all outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-yellow-500 group-hover:border-gray-200'}`}
    />
  </div>
);

const SellersVerifications: React.FC<SellersVerificationsProps> = ({ onBack, onProceed, countryCode = 'IN' }) => {
  const [countries, setCountries] = useState<{ code: string; name: string; dialCode: string }[]>([]);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [currentCountry, setCurrentCountry] = useState<{ code: string; name: string; dialCode: string }>({ code: 'IN', name: 'India', dialCode: '+91' });

  useEffect(() => {
    const fetchData = async () => {
      const [countriesResp, btResp] = await Promise.all([
        supabase.from('countries').select('short_code, country_name, dialing_code').eq('is_active', true).order('country_name'),
        supabase.from('business_types').select('type_name').eq('is_active', true).order('type_name'),
      ]);
      const mapped = (countriesResp.data || []).map((c: any) => ({ code: c.short_code, name: c.country_name, dialCode: c.dialing_code }));
      setCountries(mapped);
      const found = mapped.find((c: any) => c.code === countryCode) || mapped[0];
      if (found) setCurrentCountry(found);
      setFormData(prev => ({
        ...prev,
        business: { ...prev.business, country: found?.name || '' },
        contact: { ...prev.contact, countryCode: found?.dialCode || '+91' },
        authorised: { ...prev.authorised, country: found?.name || '' },
      }));
      setBusinessTypes((btResp.data || []).map((b: any) => b.type_name));
    };
    fetchData();
  }, [countryCode]);
  
  const [formData, setFormData] = useState({
    business: {
      type: '',
      name: '',
      doorNo: '',
      placeTown: '',
      city: '',
      district: '',
      state: '',
      country: currentCountry.name,
      pincode: ''
    },
    contact: {
      email: '',
      mobile: '',
      countryCode: currentCountry.dialCode
    },
    authorised: {
      name: '',
      doorNo: '',
      placeTown: '',
      city: '',
      district: '',
      state: '',
      country: currentCountry.name,
      pincode: '',
      mobile: ''
    },
    tax: {
      idNumber: ''
    },
    bank: {
      accountNumber: '',
      accountName: '',
      bankName: '',
      ifscIbanSwift: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceed(formData);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-24">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold">Back to Dashboard</span>
        </button>

        <header className="mb-16">
          <h1 className="text-2xl font-semibold mb-3">Store Verification</h1>
          <p className="text-gray-500 text-sm font-medium">Complete your business profile to start selling globally.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* BUSINESS DETAILS */}
          <Section icon={<Building2 className="text-yellow-500" />} title="Business Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Type of business</label>
                <select 
                  required
                  value={formData.business.type}
                  onChange={(e) => setFormData({
                    ...formData, 
                    business: { ...formData.business, type: e.target.value }
                  })}
                  className="w-full bg-[#0d0d0d] border border-gray-900 rounded-xl px-4 py-3.5 text-sm focus:border-yellow-500 transition-all outline-none"
                >
                  <option value="">Select Business Type</option>
                  {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <Input 
                  label="Business name" 
                  placeholder="The name displayed on your store" 
                  value={formData.business.name}
                  onChange={(v: string) => setFormData({...formData, business: {...formData.business, name: v}})}
                  required 
                />
              </div>
              <Input 
                label="Door no and building name" 
                placeholder="Suite 500, Elite Towers" 
                value={formData.business.doorNo}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, doorNo: v }})}
                required 
              />
              <Input 
                label="Place and town" 
                placeholder="Central Business District" 
                value={formData.business.placeTown}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, placeTown: v }})}
                required 
              />
              <Input 
                label="City" 
                placeholder="San Francisco" 
                value={formData.business.city}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, city: v }})}
                required 
              />
              <Input 
                label="District" 
                placeholder="West Coast Region" 
                value={formData.business.district}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, district: v }})}
                required 
              />
              <Input 
                label="State" 
                placeholder="California" 
                value={formData.business.state}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, state: v }})}
                required 
              />
              <Input 
                label="Country" 
                value={formData.business.country}
                disabled 
              />
              <Input 
                label="Pincode" 
                placeholder="94103" 
                value={formData.business.pincode}
                onChange={(v: string) => setFormData({...formData, business: { ...formData.business, pincode: v }})}
              />
            </div>
          </Section>

          {/* CONTACT DETAILS */}
          <Section icon={<Mail className="text-yellow-500" />} title="Contact Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Email" 
                type="email" 
                placeholder="business@example.com" 
                value={formData.contact.email}
                onChange={(v: string) => setFormData({...formData, contact: { ...formData.contact, email: v }})}
                required 
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Mobile number</label>
                <div className="flex gap-2">
                  <div className="w-20 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-xs font-semibold text-gray-500">
                    {formData.contact.countryCode}
                  </div>
                  <input 
                    type="tel"
                    required
                    placeholder="700 000 0000"
                    value={formData.contact.mobile}
                    onChange={(e) => setFormData({...formData, contact: { ...formData.contact, mobile: e.target.value }})}
                    className="flex-1 bg-[#0d0d0d] border border-gray-900 rounded-xl px-4 py-3.5 text-sm focus:border-yellow-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* AUTHORISED PERSON */}
          <Section icon={<User className="text-yellow-500" />} title="Authorised Person">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input 
                  label="Name" 
                  placeholder="Full Legal Name" 
                  value={formData.authorised.name}
                  onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, name: v }})}
                  required 
                />
              </div>
              <Input 
                label="Door no and building name" 
                value={formData.authorised.doorNo}
                onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, doorNo: v }})}
                required 
              />
              <Input 
                label="Place and town" 
                value={formData.authorised.placeTown}
                onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, placeTown: v }})}
                required 
              />
              <Input label="City" value={formData.authorised.city} onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, city: v }})} required />
              <Input label="District" value={formData.authorised.district} onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, district: v }})} required />
              <Input label="State" value={formData.authorised.state} onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, state: v }})} required />
              <Input label="Country" value={formData.authorised.country} disabled />
              <Input label="Pincode" value={formData.authorised.pincode} onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, pincode: v }})} />
              <div className="md:col-span-2">
                <Input 
                  label="Mobile number" 
                  placeholder="+1 700 000 0000" 
                  value={formData.authorised.mobile}
                  onChange={(v: string) => setFormData({...formData, authorised: { ...formData.authorised, mobile: v }})}
                  required 
                />
              </div>
            </div>
          </Section>

          {/* TAX DETAILS */}
          <Section icon={<FileText className="text-yellow-500" />} title="Tax Details">
            <Input 
              label="Tax ID number" 
              placeholder="VAT / GST / EIN Number" 
              value={formData.tax.idNumber}
              onChange={(v: string) => setFormData({...formData, tax: { ...formData.tax, idNumber: v }})}
              required 
            />
          </Section>

          {/* BANK DETAILS */}
          <Section icon={<Landmark className="text-yellow-500" />} title="Bank Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Account number" 
                placeholder="International Format" 
                value={formData.bank.accountNumber}
                onChange={(v: string) => setFormData({...formData, bank: { ...formData.bank, accountNumber: v }})}
                required 
              />
              <Input 
                label="Account name" 
                placeholder="Registered Account Holder" 
                value={formData.bank.accountName}
                onChange={(v: string) => setFormData({...formData, bank: { ...formData.bank, accountName: v }})}
                required 
              />
              <Input 
                label="Bank name" 
                placeholder="Your Commercial Bank" 
                value={formData.bank.bankName}
                onChange={(v: string) => setFormData({...formData, bank: { ...formData.bank, bankName: v }})}
                required 
              />
              <Input 
                label="IFSC / IBAN / SWIFT code" 
                placeholder="Routing Code" 
                value={formData.bank.ifscIbanSwift}
                onChange={(v: string) => setFormData({...formData, bank: { ...formData.bank, ifscIbanSwift: v }})}
                required 
              />
            </div>
          </Section>

          <div className="pt-10">
            <button 
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-5 rounded-2xl transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              Proceed to upload
              <ChevronRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellersVerifications;

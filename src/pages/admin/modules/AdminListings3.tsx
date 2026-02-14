import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductListing, type Specification } from '../../../contexts/ProductListingContext';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  List,
  ListOrdered,
  AlertCircle 
} from 'lucide-react';

export const AdminListings3: React.FC = () => {
  const navigate = useNavigate();
  const { productData, updateStep3, goToNextStep, goToPreviousStep, isStepValid } = useProductListing();
  const { step3 } = productData;

  // Highlight input state
  const [newHighlight, setNewHighlight] = useState('');
  const [newSellerNote, setNewSellerNote] = useState('');
  const [newSpec, setNewSpec] = useState<Omit<Specification, 'id'>>({ key: '', value: '' });

  // Rich text simple state (for formatting preview)
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // Highlight handlers
  const addHighlight = () => {
    if (newHighlight.trim()) {
      updateStep3({ highlights: [...step3.highlights, newHighlight.trim()] });
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    updateStep3({ highlights: step3.highlights.filter((_, i) => i !== index) });
  };

  // Seller note handlers
  const addSellerNote = () => {
    if (newSellerNote.trim()) {
      updateStep3({ sellerNotes: [...step3.sellerNotes, newSellerNote.trim()] });
      setNewSellerNote('');
    }
  };

  const removeSellerNote = (index: number) => {
    updateStep3({ sellerNotes: step3.sellerNotes.filter((_, i) => i !== index) });
  };

  // Specification handlers
  const addSpecification = () => {
    if (newSpec.key.trim() && newSpec.value.trim()) {
      const spec: Specification = {
        id: crypto.randomUUID(),
        key: newSpec.key.trim(),
        value: newSpec.value.trim(),
      };
      updateStep3({ specifications: [...step3.specifications, spec] });
      setNewSpec({ key: '', value: '' });
    }
  };

  const removeSpecification = (id: string) => {
    updateStep3({ specifications: step3.specifications.filter(s => s.id !== id) });
  };

  // Format button handler
  const toggleFormat = (format: string) => {
    setActiveFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleBack = () => {
    goToPreviousStep();
    navigate('/admin/products/new/step2');
  };

  const handleNext = () => {
    if (isStepValid(3)) {
      goToNextStep();
      navigate('/admin/products/new/step4');
    }
  };

  return (
    <div className="space-y-6">
      {/* Highlights Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Highlights
          <span className="text-gray-500 font-normal ml-2">(Bullet points that appear in search results)</span>
        </label>
        
        <div className="space-y-2 mb-3">
          {step3.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="w-2 h-2 bg-white rounded-full" />
              <span className="flex-1 text-gray-700">{highlight}</span>
              <button
                onClick={() => removeHighlight(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
            placeholder="Enter a product highlight"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <button
            onClick={addHighlight}
            disabled={!newHighlight.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* Full Description - Rich Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Description *
          <span className="text-gray-500 font-normal ml-2">(Detailed product description)</span>
        </label>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border border-b-0 border-gray-300 rounded-t-lg bg-gray-50">
          <button
            type="button"
            onClick={() => toggleFormat('bold')}
            className={`p-2 rounded hover:bg-gray-200 ${activeFormats.includes('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat('italic')}
            className={`p-2 rounded hover:bg-gray-200 ${activeFormats.includes('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => toggleFormat('bullet')}
            className={`p-2 rounded hover:bg-gray-200 ${activeFormats.includes('bullet') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat('numbered')}
            className={`p-2 rounded hover:bg-gray-200 ${activeFormats.includes('numbered') ? 'bg-gray-200' : ''}`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        {/* Text Area */}
        <textarea
          value={step3.fullDescription}
          onChange={(e) => updateStep3({ fullDescription: e.target.value })}
          placeholder="Write a detailed description of your product. Include materials, features, usage instructions, and any other relevant information..."
          rows={10}
          className={`w-full px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none ${
            activeFormats.includes('bold') ? 'font-bold' : ''
          } ${activeFormats.includes('italic') ? 'italic' : ''}`}
        />

        <div className="flex justify-between mt-2">
          <p className="text-sm text-gray-500">
            {step3.fullDescription.length} characters
          </p>
          <p className="text-sm text-gray-500">
            Tip: Use paragraphs and formatting to improve readability
          </p>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Specifications
            </label>
            <p className="text-sm text-gray-500">Add technical details (up to 50 specifications)</p>
          </div>
          <span className="text-sm text-gray-500">
            {step3.specifications.length}/50
          </span>
        </div>

        {step3.specifications.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Attribute</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {step3.specifications.map((spec, index) => (
                  <tr key={spec.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4 font-medium text-gray-800">{spec.key}</td>
                    <td className="py-2 px-4 text-gray-600">{spec.value}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => removeSpecification(spec.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {step3.specifications.length < 50 && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Attribute Name</label>
              <input
                type="text"
                value={newSpec.key}
                onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
                placeholder="e.g., Material, Weight, Dimensions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Value</label>
              <input
                type="text"
                value={newSpec.value}
                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                placeholder="e.g., Cotton, 500g, 10x20x5 cm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={addSpecification}
              disabled={!newSpec.key.trim() || !newSpec.value.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </div>

      {/* Seller Notes */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seller Notes
          <span className="text-gray-500 font-normal ml-2">(Optional - Additional notes visible to buyers)</span>
        </label>
        
        <div className="space-y-2 mb-3">
          {step3.sellerNotes.map((note, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={16} className="text-amber-600" />
              <span className="flex-1 text-gray-700">{note}</span>
              <button
                onClick={() => removeSellerNote(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSellerNote}
            onChange={(e) => setNewSellerNote(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSellerNote()}
            placeholder="e.g., Slight color variations may occur, Allow 2-3 days for dispatch"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <button
            onClick={addSellerNote}
            disabled={!newSellerNote.trim()}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Add Note
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Photos
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid(3)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Pricing
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AdminListings3;

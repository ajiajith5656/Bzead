import React from 'react';
import { RotateCcw, CheckCircle, Clock, AlertCircle, Mail } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">Refund Policy</h1>
          </div>
          <p className="text-gray-500">Last updated: February 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-4">Our Commitment to You</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              At Beauzead, we want you to be completely satisfied with your purchase. If you're not happy with your order, we offer a comprehensive refund and return policy to ensure your peace of mind.
            </p>
            <p>
              This Refund Policy outlines the terms and conditions for returning items and requesting refunds. Please read carefully before making your purchase.
            </p>
          </div>
        </section>

        {/* Return Eligibility */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Return Eligibility
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3">30-Day Return Window</h3>
              <p className="text-gray-600 mb-4">
                You may return eligible items within 30 days of delivery for a full refund. The return period is counted from the delivery date shown on your order confirmation.
              </p>
              <p className="text-gray-600 text-sm italic">
                * 15-day return window applies to clearance and final sale items.
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3">Item Condition Requirements</h3>
              <p className="text-gray-600 mb-3">Items must be:</p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Unused and unworn (except to verify functionality)</li>
                <li>• In original or similar condition with no signs of use</li>
                <li>• With all original tags and labels attached</li>
                <li>• Accompanied by original packaging</li>
                <li>• Complete with all components and documentation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Non-Returnable Items */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Non-Returnable Items
          </h2>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p className="text-red-100 mb-4">The following items cannot be returned for a refund:</p>
            <ul className="space-y-2 text-red-100 ml-4">
              <li>• Items marked "Final Sale" or "Non-Returnable"</li>
              <li>• Clearance items (unless defective)</li>
              <li>• Customized or personalized items</li>
              <li>• Items showing signs of wear or use</li>
              <li>• Digital products or downloadable content</li>
              <li>• Underwear, swimwear, or intimate apparel</li>
              <li>• Perishable goods</li>
              <li>• Items used for business purposes</li>
              <li>• Items purchased during special promotions (unless stated otherwise)</li>
            </ul>
          </div>
        </section>

        {/* Return Process */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            How to Return an Item
          </h2>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Initiate Return',
                description: 'Log into your account and go to "My Orders". Select the item you wish to return and click "Initiate Return".'
              },
              {
                step: 2,
                title: 'Select Reason',
                description: 'Choose the reason for your return (changed mind, size/fit, defective, wrong item received, etc.)'
              },
              {
                step: 3,
                title: 'Print Shipping Label',
                description: 'We will provide a prepaid return shipping label. Print it and attach it to your return package.'
              },
              {
                step: 4,
                title: 'Ship Your Return',
                description: 'Drop off your return at any postal facility. Keep your receipt as proof of shipment.'
              },
              {
                step: 5,
                title: 'Receive Refund',
                description: 'Once we receive and inspect your return, your refund will be processed within 5-10 business days.'
              }
            ].map((item) => (
              <div key={item.step} className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 text-black font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-600">{item.title}</h3>
                    <p className="text-gray-600 mt-2">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Processing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Refund Processing Timeline</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="font-semibold text-amber-600 mb-2">Receipt & Inspection (2-3 days):</p>
                <p>Once we receive your return, we'll inspect the item to ensure it meets our return conditions.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Approval & Processing (2-3 days):</p>
                <p>If approved, we'll process your refund and initiate the transaction with your payment provider.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Credit to Account (5-10 business days):</p>
                <p>Refunds typically appear in your original payment method within 5-10 business days. Some financial institutions may take longer.</p>
              </div>
              <div className="bg-blue-900 border border-blue-700 rounded p-3 mt-4">
                <p className="text-blue-100 text-sm">
                  <strong>Note:</strong> Shipping costs are typically non-refundable unless the item is defective or we made an error.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Defective Items */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Defective or Damaged Items</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              If you receive a defective or damaged item, please report it within 7 days of delivery. We offer:
            </p>
            <div className="space-y-3 text-gray-600 ml-4">
              <div>
                <p className="font-semibold text-amber-600">Full Refund:</p>
                <p>Return the defective item for a complete refund including original shipping costs.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600">Replacement:</p>
                <p>Receive a replacement item at no additional cost with free priority shipping.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Wrong Item */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Wrong Item Received</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              If we sent you the wrong item, contact us immediately. We will:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Provide a prepaid return shipping label</li>
              <li>• Send the correct item at no additional cost</li>
              <li>• Process your return upon receipt of the incorrect item</li>
              <li>• Refund any applicable differences in pricing</li>
            </ul>
          </div>
        </section>

        {/* Partial Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Multi-Item Orders & Partial Returns</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              You may return individual items from a multi-item order. Your refund will be calculated based on:
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li>• The item price</li>
              <li>• A proportional share of shipping costs</li>
              <li>• Any applicable discounts or promotions</li>
            </ul>
            <p>
              If returning all items in an order, you'll receive a full refund of the purchase price. Shipping costs are non-refundable unless due to our error.
            </p>
          </div>
        </section>

        {/* International Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">International Orders</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              For international orders, return shipping costs are the responsibility of the customer unless the item is defective or we made an error. Please contact support for specific return instructions for your country.
            </p>
          </div>
        </section>

        {/* Contact Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Need Help?
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              If you have questions about our Refund Policy or need assistance with a return, please contact our customer support team:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li><strong className="text-amber-600">Email:</strong> returns@metricfluxsolutions.shop</li>
              <li><strong className="text-amber-600">Phone:</strong> +447555394997</li>
              <li><strong className="text-amber-600">Live Chat:</strong> Available on our website</li>
              <li><strong className="text-amber-600">Hours:</strong> Monday-Friday, 9AM-6PM GMT</li>
            </ul>
          </div>
        </section>

        {/* Policy Changes */}
        <section className="mb-12">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-100">
              <strong className="text-blue-200">Policy Updates:</strong> Beauzead reserves the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. Your continued use of our platform constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;

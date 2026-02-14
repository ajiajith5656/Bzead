import React from 'react';
import { Truck, Clock, Globe, AlertCircle } from 'lucide-react';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">Shipping Policy</h1>
          </div>
          <p className="text-gray-500">Last updated: February 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-4">Shipping Information</h2>
          <p className="text-gray-600">
            At Beauzead, we are committed to delivering your orders promptly and in excellent condition. Please review our shipping policies below for important information about delivery times, costs, and procedures.
          </p>
        </section>

        {/* Shipping Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Shipping Methods & Costs
          </h2>
          <div className="space-y-4">
            {[
              {
                name: 'Standard Shipping',
                time: '5-7 business days',
                cost: 'FREE on orders over £50, £5.99 otherwise',
                description: 'Reliable and economical shipping for most orders'
              },
              {
                name: 'Express Shipping',
                time: '2-3 business days',
                cost: '£12.99',
                description: 'Faster delivery for urgent orders'
              },
              {
                name: 'Next Day Delivery',
                time: '1 business day',
                cost: '£24.99',
                description: 'Premium overnight delivery service'
              },
              {
                name: 'International Shipping',
                time: '10-15 business days',
                cost: 'Varies by destination',
                description: 'Worldwide shipping to selected countries'
              }
            ].map((method, idx) => (
              <div key={idx} className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-amber-600 mb-3">{method.name}</h3>
                <p className="text-gray-600 mb-3">{method.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery Time</p>
                      <p className="text-gray-200">{method.time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shipping Cost</p>
                    <p className="text-amber-600 font-semibold">{method.cost}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Times */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Delivery Time Frames
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span><strong className="text-amber-600">UK Mainland:</strong> Orders are processed within 24 hours. Delivery times are estimates and may vary based on location and carrier availability.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span><strong className="text-amber-600">Weekends & Holidays:</strong> Orders placed on weekends or holidays will be processed on the next business day.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span><strong className="text-amber-600">Remote Areas:</strong> Deliveries to Scottish Highlands, Northern Ireland, and Isle of Man may take 1-2 additional business days.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span><strong className="text-amber-600">Pre-Order Items:</strong> Items marked as pre-order will be shipped after availability. Estimated dates will be provided.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Shipping Address */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Shipping Address Requirements</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">To ensure successful delivery, please:</p>
            <ul className="space-y-2 text-gray-600 ml-4 mb-4">
              <li>• Provide a complete and accurate delivery address</li>
              <li>• Include apartment/flat number if applicable</li>
              <li>• Verify your postal code</li>
              <li>• Include a contact phone number</li>
              <li>• Use the same address for billing and shipping (or notify us of differences)</li>
            </ul>
            <div className="bg-red-900 border border-red-700 rounded p-3 text-red-100">
              <p className="text-sm">
                <strong>Note:</strong> We are not responsible for undeliverable addresses. If an address is incorrect or incomplete, delivery may be delayed or the package returned to us.
              </p>
            </div>
          </div>
        </section>

        {/* Order Tracking */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Order Tracking & Updates</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              Once your order is shipped, you will receive a tracking number via email. You can:
            </p>
            <ul className="space-y-2 text-gray-600 ml-4 mb-4">
              <li>• Track your package in real-time through your account dashboard</li>
              <li>• Use the tracking link sent to your email</li>
              <li>• Monitor delivery status updates</li>
              <li>• Contact our customer support for shipping inquiries</li>
            </ul>
          </div>
        </section>

        {/* International Shipping */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            International Shipping
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3">Eligible Countries</h3>
              <p className="text-gray-600 mb-3">
                We ship to most countries in Europe, North America, and selected other regions. Check your country's availability at checkout.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3">Customs & Import Duties</h3>
              <p className="text-gray-600">
                International orders are subject to customs regulations and may incur import duties, taxes, or fees. These are the responsibility of the recipient and are not included in shipping costs.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3">Restricted Items</h3>
              <p className="text-gray-600">
                Certain items cannot be shipped internationally. These will be marked as "UK Only" in the product listing.
              </p>
            </div>
          </div>
        </section>

        {/* Damage & Loss */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Damage & Lost Packages
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="font-semibold text-amber-600 mb-2">Upon Delivery:</p>
                <p>Inspect your package immediately upon receipt. If the package is damaged or the contents are missing, take photos and report the issue within 48 hours of delivery.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Lost Packages:</p>
                <p>If your package does not arrive within the estimated delivery window, contact our support team immediately. We will investigate with the carrier and help resolve the issue.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Our Responsibility:</p>
                <p>We will work with our carriers to file claims for lost or damaged packages. Once approved, you will receive a replacement or refund.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Special Handling */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Special Handling & Fragile Items</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              All items are carefully packaged to minimize damage during transit. For fragile items, we use additional protective materials.
            </p>
            <p className="mb-4">
              For items requiring special handling (furniture, electronics, artwork, etc.), please select the appropriate shipping method or contact our support team.
            </p>
            <p>
              Beauzead is not responsible for damage to items caused by improper storage, handling by the recipient, or acts of nature after delivery.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Shipping Support</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              For shipping inquiries or concerns, please contact our customer support team:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li><strong className="text-amber-600">Email:</strong> shipping@metricfluxsolutions.shop</li>
              <li><strong className="text-amber-600">Phone:</strong> +447555394997</li>
              <li><strong className="text-amber-600">Hours:</strong> Monday-Friday, 9AM-6PM GMT</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;

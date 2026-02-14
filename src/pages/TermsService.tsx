import React from 'react';
import { FileText, CheckCircle, AlertCircle, Users } from 'lucide-react';

export const TermsService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">Terms of Service</h1>
          </div>
          <p className="text-gray-500">Last updated: February 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-4">1. Agreement to Terms</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              By accessing and using Beauzead ("Platform"), you accept and agree to be bound by and comply with these Terms of Service. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p>
              Beauzead reserves the right to update and change these Terms of Service from time to time without notice. Your continued use of the Platform following the posting of revised Terms means you accept and agree to the changes.
            </p>
          </div>
        </section>

        {/* Use License */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">2. Use License</h2>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Permitted Uses
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Browse and purchase products and services</li>
                <li>• Create and manage a user account</li>
                <li>• Communicate with sellers and customer support</li>
                <li>• Leave product reviews and ratings</li>
                <li>• Access your order history and account information</li>
              </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-amber-600 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Prohibited Uses
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Unauthorized reproduction or distribution of content</li>
                <li>• Fraudulent activities or misrepresentation</li>
                <li>• Offensive, abusive, or harassing behavior</li>
                <li>• Hacking, unauthorized access, or security breaches</li>
                <li>• Spam, malware, or harmful content</li>
                <li>• Intellectual property infringement</li>
                <li>• Automated scraping or data extraction</li>
              </ul>
            </div>
          </div>
        </section>

        {/* User Accounts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            3. User Accounts & Registration
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="font-semibold text-amber-600 mb-2">Account Responsibility:</p>
                <p>You are responsible for maintaining confidentiality of your password and account information. You agree to accept responsibility for all activities that occur under your account. You must immediately notify Beauzead of any unauthorized use of your account.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Accuracy of Information:</p>
                <p>You warrant that all information provided during registration is true, accurate, current, and complete. You agree to update your information to keep it accurate.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Age Requirement:</p>
                <p>You must be at least 18 years old to use this Platform. By using this Platform, you represent and warrant that you are at least 18 years of age.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Information & Accuracy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">4. Product Information & Accuracy</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              Beauzead makes every effort to ensure that product descriptions, prices, and availability are accurate. However, Beauzead does not guarantee accuracy and completeness of product information.
            </p>
            <p className="mb-4">
              We reserve the right to:
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li>• Limit quantities of products</li>
              <li>• Refuse or cancel orders</li>
              <li>• Correct errors in product information</li>
              <li>• Update pricing at any time</li>
            </ul>
            <p>
              All products are subject to availability and are offered exclusively while quantities last.
            </p>
          </div>
        </section>

        {/* Payment & Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">5. Payment & Pricing</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="font-semibold text-amber-600 mb-2">Payment Terms:</p>
                <p>All payments must be made through the Platform using accepted payment methods. By providing payment information, you authorize Beauzead to charge your account.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Taxes & Fees:</p>
                <p>You are responsible for paying all applicable taxes, duties, and fees associated with your purchases.</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600 mb-2">Currency:</p>
                <p>Prices are displayed in the currency shown on the Platform at the time of purchase.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping & Delivery */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">6. Shipping & Delivery</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              Delivery times are estimates only and not guaranteed. Beauzead is not responsible for delays caused by carriers, customs, or circumstances beyond our control.
            </p>
            <p className="mb-4">
              Risk of loss for products transfers to you upon delivery to the shipping address provided. You are responsible for inspecting products upon receipt.
            </p>
            <p>
              For detailed shipping information, please refer to our Shipping Policy.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">7. Limitation of Liability</h2>
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-yellow-100">
            <p className="mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, BEAUZEAD SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM OR SERVICES.
            </p>
            <p>
              IN NO EVENT SHALL BEAUZEAD'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR THE PRODUCT OR SERVICE IN QUESTION.
            </p>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">8. Dispute Resolution</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              Any dispute arising from these Terms or your use of the Platform shall be governed by and construed in accordance with the laws of the United Kingdom.
            </p>
            <p className="mb-4">
              Before initiating legal proceedings, you agree to attempt to resolve disputes through our customer support team.
            </p>
            <p>
              You agree to submit to the exclusive jurisdiction of the courts in the United Kingdom.
            </p>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">9. Termination</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-gray-600">
            <p className="mb-4">
              Beauzead may terminate or suspend your account and access to the Platform immediately, without notice, for conduct that Beauzead believes violates these Terms or is unlawful, harmful, or abusive.
            </p>
            <p>
              Upon termination, your right to use the Platform will immediately cease.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">10. Contact Information</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              For questions about these Terms of Service, please contact:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li><strong className="text-amber-600">Email:</strong> support@metricfluxsolutions.shop</li>
              <li><strong className="text-amber-600">Address:</strong> 23, MK6 5HH, United Kingdom</li>
              <li><strong className="text-amber-600">Phone:</strong> +447555394997</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsService;

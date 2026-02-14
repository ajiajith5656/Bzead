import React from 'react';
import { Shield, Eye, Lock, Share2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-600">Privacy Policy</h1>
          </div>
          <p className="text-gray-500">Last updated: February 1, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Our Commitment to Privacy
          </h2>
          <p className="text-gray-600 mb-4">
            At Beauzead, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <p className="text-gray-600">
            Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our platform.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Information We Collect</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xl font-semibold text-amber-600 mb-3">Personal Information</h3>
              <p className="text-gray-600 mb-4">We collect information you voluntarily provide to us, such as:</p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Name and contact information (email, phone, address)</li>
                <li>• Account credentials and authentication information</li>
                <li>• Billing and payment information</li>
                <li>• Shipping and delivery addresses</li>
                <li>• Purchase history and preferences</li>
                <li>• Communications and customer service interactions</li>
              </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xl font-semibold text-amber-600 mb-3">Automatically Collected Information</h3>
              <p className="text-gray-600 mb-4">When you visit our platform, we automatically collect:</p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Device information (IP address, browser type, operating system)</li>
                <li>• Usage data (pages visited, time spent, links clicked)</li>
                <li>• Cookies and similar tracking technologies</li>
                <li>• Location data (if permitted)</li>
              </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xl font-semibold text-amber-600 mb-3">Third-Party Information</h3>
              <p className="text-gray-600">
                We may receive information from third-party services, social media platforms, and payment processors to enhance your experience.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">How We Use Your Information</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To process transactions and send related information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To provide customer support and respond to inquiries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To improve our platform and personalize user experience</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To send promotional emails and marketing communications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To prevent fraudulent transactions and enhance security</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600">✓</span>
                <span>To comply with legal obligations and regulations</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6" />
            Data Protection & Security
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              We implement comprehensive security measures to protect your personal information, including:
            </p>
            <ul className="space-y-2 text-gray-600 ml-4 mb-4">
              <li>• SSL/TLS encryption for data in transit</li>
              <li>• Secure servers with firewalls and intrusion detection</li>
              <li>• Role-based access controls</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• Employee training on data protection</li>
            </ul>
            <p className="text-gray-600 text-sm italic">
              While we implement robust security measures, no system is completely secure. We cannot guarantee absolute security of your information.
            </p>
          </div>
        </section>

        {/* Information Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Information Sharing & Disclosure
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">We may share your information with:</p>
            <ul className="space-y-2 text-gray-600 ml-4">
              <li>• Service providers and contractors (payment processors, shipping partners)</li>
              <li>• Sellers and merchants on our platform (for order fulfillment)</li>
              <li>• Law enforcement when required by law</li>
              <li>• Third parties with your consent</li>
            </ul>
            <p className="text-gray-600 mt-4">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </div>
        </section>

        {/* User Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Your Rights & Choices</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <ul className="space-y-3 text-gray-600">
              <li><strong className="text-amber-600">Access:</strong> Request a copy of your personal information</li>
              <li><strong className="text-amber-600">Correction:</strong> Update or correct inaccurate data</li>
              <li><strong className="text-amber-600">Deletion:</strong> Request deletion of your information</li>
              <li><strong className="text-amber-600">Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong className="text-amber-600">Portability:</strong> Transfer your data to another service</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Contact Us</h2>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li><strong className="text-amber-600">Email:</strong> privacy@metricfluxsolutions.shop</li>
              <li><strong className="text-amber-600">Address:</strong> 23, MK6 5HH, United Kingdom</li>
              <li><strong className="text-amber-600">Phone:</strong> +447555394997</li>
            </ul>
          </div>
        </section>

        {/* Updates */}
        <section className="mb-12">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-100">
              <strong className="text-blue-200">Policy Updates:</strong> We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our platform. Your continued use of our services constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

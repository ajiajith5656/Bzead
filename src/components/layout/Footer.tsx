import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { getSellerDomainUrl } from '../../utils/domain';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <h3 className="text-amber-600 text-xl font-bold mb-4">Beauzead</h3>
            <p className="text-gray-500 text-sm mb-4">
              A premium global marketplace platform with a clean, modern design — supporting global commerce for buyers and sellers worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-amber-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Business</h4>
            <ul className="space-y-2">
              <li>
                <a href={getSellerDomainUrl('/signup')} className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Become a Seller
                </a>
              </li>
              <li>
                <a href={getSellerDomainUrl('/login')} className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Seller Login
                </a>
              </li>
              <li>
                <Link to="/affiliate" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm">
                  23, MK6 5HH<br />
                  United Kingdom
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-amber-600" />
                <a href="tel:+447555394997" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  +447555394997
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <a href="mailto:info@metricfluxsolutions.shop" className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                  info@metricfluxsolutions.shop
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; 2026 Beauzead. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button className="text-gray-500 hover:text-amber-600 transition-colors text-sm">
                Cookie Settings
              </button>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500 text-sm">
                🇬🇧 United Kingdom
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

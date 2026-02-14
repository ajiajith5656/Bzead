import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  Globe, 
  Headphones, 
  BarChart3, 
  Users, 
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const SellerLanding = () => {
  // Animated stats
  const [activesellers, setActivesellers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [partners, setPartners] = useState<{ name: string; logo: string }[]>([]);

  useEffect(() => {
    // Animate numbers on load
    const sellersInterval = setInterval(() => {
      setActivesellers(prev => {
        if (prev < 12500) return prev + 125;
        return 12500;
      });
    }, 20);

    const revenueInterval = setInterval(() => {
      setTotalRevenue(prev => {
        if (prev < 450) return prev + 5;
        return 450;
      });
    }, 20);

    return () => {
      clearInterval(sellersInterval);
      clearInterval(revenueInterval);
    };
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from('partner_brands')
        .select('name, logo')
        .eq('is_active', true)
        .order('display_order');
      if (data && data.length > 0) {
        setPartners(data.map((p: any) => ({ name: p.name, logo: p.logo })));
      }
    };
    fetchPartners();
  }, []);

  const valueProps = [
    {
      icon: <Globe className="w-8 h-8 text-amber-500" />,
      title: "Global Selling Portals",
      description: "Ship to 180+ countries with our integrated supply chain network and real-time tracking."
    },
    {
      icon: <Headphones className="w-8 h-8 text-amber-500" />,
      title: "24/7 Premium Support",
      description: "Dedicated account managers and instant chat support to help you succeed at every step."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-amber-500" />,
      title: "Premium Analytics",
      description: "Advanced insights, competitor analysis, and AI-powered recommendations to maximize your sales."
    }
  ];

  const roadmap = [
    {
      step: "01",
      title: "Register",
      description: "Create your seller account in minutes with just your business details and documents."
    },
    {
      step: "02",
      title: "List Products",
      description: "Upload your catalog with our easy-to-use tools and automated product optimization."
    },
    {
      step: "03",
      title: "Scale & Grow",
      description: "Leverage our marketing tools, analytics, and global reach to expand your business."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 animate-pulse" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-20">
            <Link to="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold text-gray-900">Beauzead</span>
            </Link>
            <Link 
              to="/seller/login"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Existing Seller →
            </Link>
          </nav>

          {/* Hero Content */}
          <div className="text-center space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-gradient">
              Your Future is Golden
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Join the world's most prestigious e-commerce platform and unlock unlimited potential for your business
            </p>

            {/* Real-time Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-amber-400" />
                  <div className="text-5xl font-bold text-gray-900">
                    {activesellers.toLocaleString()}+
                  </div>
                </div>
                <div className="text-slate-400 font-medium">Active Sellers</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                  <div className="text-5xl font-bold text-gray-900">
                    ${totalRevenue}M+
                  </div>
                </div>
                <div className="text-slate-400 font-medium">Revenue Generated</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                to="/seller/signup"
                className="group relative px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                to="/seller/signup"
                className="px-5 py-3 bg-slate-800 text-amber-400 font-bold text-lg rounded-full border-2 border-amber-500/50 hover:bg-slate-700 hover:border-amber-400 transition-all hover:scale-105"
              >
                Sell Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div className="py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Beauzead</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We provide everything you need to build and scale a successful online business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform">
                  {prop.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{prop.title}</h3>
                <p className="text-slate-400 leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Roadmap Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Path to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Success</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Three simple steps to start selling and growing your business
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 transform -translate-y-1/2" 
              style={{ marginLeft: '16.66%', marginRight: '16.66%' }} 
            />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {roadmap.map((step, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  {/* Step Number Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-3xl font-bold text-slate-900 shadow-lg shadow-amber-500/50 group-hover:scale-110 transition-transform relative z-10">
                      {step.step}
                    </div>
                  </div>

                  <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-all">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{step.description}</p>
                  </div>

                  {index < roadmap.length - 1 && (
                    <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                      <ArrowRight className="w-8 h-8 text-amber-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/seller/signup"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-lg rounded-full hover:scale-105 transition-all hover:shadow-lg hover:shadow-amber-500/50"
            >
              Start Your Journey
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Elite Trust Section */}
      <div className="py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Elite Brands</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Join thousands of successful sellers who trust Beauzead
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="group relative aspect-square"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="text-4xl font-bold text-slate-600 group-hover:text-amber-400 transition-colors">
                    {partner.logo}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-400 text-lg mb-8">
              Ready to join the elite?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/seller/signup"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-lg rounded-full hover:scale-105 transition-all hover:shadow-lg hover:shadow-amber-500/50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Start Selling Today
              </Link>
              
              <Link
                to="/seller/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 text-amber-400 font-bold text-lg rounded-full border-2 border-amber-500/50 hover:bg-slate-700 hover:border-amber-400 transition-all hover:scale-105"
              >
                Existing Seller Login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2026 Beauzead. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

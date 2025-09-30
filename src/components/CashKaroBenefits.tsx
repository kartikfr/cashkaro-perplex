import React from 'react';
import { CheckCircle, Zap, ShoppingBag, TrendingUp, Clock, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CashKaroBenefits: React.FC = () => {
  const benefits = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Search All Retailers",
      description: "Find products across Amazon, Flipkart, Myntra & AJIO in one unified search",
      highlight: "4 Major Retailers"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Skip 5 CashKaro Steps",
      description: "No need to visit CashKaro, search retailer, find store, click through - we do it all",
      highlight: "1-Click Process"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Instant Cashback Links",
      description: "Get direct cashback-enabled links with all tracking parameters automatically added",
      highlight: "Auto-Tracking"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Time & Effort",
      description: "What used to take 5+ steps now happens in 1 click - search, find, shop, earn",
      highlight: "5x Faster"
    }
  ];

  const traditionalSteps = [
    "Visit CashKaro website",
    "Search for retailer",
    "Find specific store",
    "Click through to retailer",
    "Search for product again"
  ];

  const ourProcess = [
    "Search once across all retailers"
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Zap className="w-4 h-4 mr-2" />
            CashKaro Integration
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why CashKaro Users Love Our Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've streamlined the entire CashKaro cashback process into a single, powerful search experience
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  {benefit.icon}
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {benefit.highlight}
                  </Badge>
                  <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Process Comparison */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Traditional Process */}
          <Card className="p-8 bg-red-50 border-red-200">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Traditional CashKaro Process</h3>
                  <p className="text-sm text-red-700">Time-consuming 5-step process</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {traditionalSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-red-700 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-red-800">{step}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  ⏱️ Average time: 3-5 minutes per search
                </p>
              </div>
            </div>
          </Card>

          {/* Our Process */}
          <Card className="p-8 bg-green-50 border-green-200">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Our Streamlined Process</h3>
                  <p className="text-sm text-green-700">Simple 1-step solution</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {ourProcess.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-green-800 font-medium">{step}</span>
                  </div>
                ))}
                
                <div className="ml-9 space-y-2 text-xs text-green-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Automatic CashKaro tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>All retailers in one search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Direct cashback-enabled links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>No manual store navigation</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-green-200">
                <p className="text-sm text-green-700 font-medium">
                  ⚡ Average time: 30 seconds per search
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Join thousands of CashKaro users who've simplified their shopping</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CashKaroBenefits;

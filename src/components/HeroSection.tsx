import React from 'react';
import { Zap, ShoppingBag, TrendingUp, Shield, ArrowRight, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-image.jpg';

const HeroSection: React.FC = () => {
  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section');
    searchSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary-glow to-orange-500 overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30m-20 0a20 20 0 1 1 40 0a20 20 0 1 1 -40 0'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 opacity-10">
        <div className="w-32 h-32 bg-white rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-20 right-10 opacity-10">
        <div className="w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-16 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[600px]">
          
          {/* Hero Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Star className="w-4 h-4 fill-current" />
              #1 Cashback Search Platform
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Find Products,
                <br />
                <span className="text-white/90 relative">
                  Earn Cashback
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/40 rounded-full"></div>
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl">
                Search across Amazon, Flipkart, Myntra & more in one place. 
                Every purchase automatically earns CashKaro rewards.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                onClick={scrollToSearch}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 h-auto text-lg shadow-lg group"
              >
                <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Searching Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 h-auto text-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="text-2xl lg:text-3xl font-bold text-white">50k+</div>
                <div className="text-sm text-white/70 font-medium">Happy Users</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl lg:text-3xl font-bold text-white">₹2Cr+</div>
                <div className="text-sm text-white/70 font-medium">Cashback Earned</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl lg:text-3xl font-bold text-white">4.9★</div>
                <div className="text-sm text-white/70 font-medium">User Rating</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <img 
                  src={heroImage} 
                  alt="CashKaro Search Interface" 
                  className="w-full max-w-md h-auto rounded-xl shadow-lg"
                />
                
                {/* Floating Stats Cards */}
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Today's Earnings</div>
                      <div className="text-lg font-bold text-green-600">₹1,247</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Products Tracked</div>
                      <div className="text-lg font-bold text-primary">2,847</div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-8 bg-white rounded-2xl p-3 shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Instant</div>
                      <div className="text-sm font-bold text-blue-600">Search</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-3xl blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 fill-background">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
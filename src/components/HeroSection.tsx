import React from 'react';
import { Zap, ShoppingBag, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import heroImage from '@/assets/hero-image.jpg';

const HeroSection: React.FC = () => {
  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section');
    searchSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[600px] bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M20 20c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                Smart Product
                <br />
                <span className="text-primary-glow">Search & Save</span>
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                Search across Amazon, Flipkart, Myntra & AJIO in one place. 
                Every click automatically includes CashKaro cashback tracking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={scrollToSearch}
                className="text-lg px-8"
              >
                <Zap className="w-5 h-5" />
                Start Searching
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
              >
                <ShoppingBag className="w-5 h-5" />
                How It Works
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-sm text-primary-foreground/80 font-medium">Best Prices</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-sm text-primary-foreground/80 font-medium">Auto Cashback</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-sm text-primary-foreground/80 font-medium">Instant Search</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="CashKaro Search Interface" 
                className="w-full h-auto rounded-2xl shadow-glow"
              />
              
              {/* Floating Elements */}
              <Card className="absolute -top-4 -left-4 p-4 bg-white shadow-elegant">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">₹</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Cashback Earned</p>
                    <p className="text-lg font-bold text-primary">₹1,247</p>
                  </div>
                </div>
              </Card>

              <Card className="absolute -bottom-4 -right-4 p-4 bg-white shadow-elegant">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Products Found</p>
                    <p className="text-lg font-bold text-primary">2,847</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-background">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
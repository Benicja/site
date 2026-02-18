import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other' | null>(null);

  useEffect(() => {
    // 1. Detect if it's already installed/standalone
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (!isIos && !isAndroid) return;

    if (isIos) {
      setPlatform('ios');
      // Show for iOS after a small delay if not standalone
      const hasSeenIosTip = localStorage.getItem('pwa_ios_tip_seen');
      if (!hasSeenIosTip) {
        setShowBanner(true);
      }
    } else if (isAndroid) {
      setPlatform('android');
      // Android will trigger 'beforeinstallprompt'
    } else {
      setPlatform('other');
    }

    // 4. Handle Android/Chrome specific prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect when the app has been successfully installed
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowBanner(true); // Keep banner visible to show success
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => {
        setShowBanner(false);
      }, 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      alert('To install on iOS: \n1. Tap the Share button (square with arrow) \n2. Scroll down and tap "Add to Home Screen"');
      localStorage.setItem('pwa_ios_tip_seen', 'true');
      setShowBanner(false);
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User responded to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (platform === 'ios') {
      localStorage.setItem('pwa_ios_tip_seen', 'true');
    }
  };

  if (!showBanner) return null;

  if (isInstalled) {
    return (
      <div className="md:hidden bg-green-50 border-b border-green-100 py-3 px-4 flex items-center justify-center animate-fade-in relative z-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-green-800">
            Successfully installed! Open <span className="font-bold">Benicja</span> from your home screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden bg-gray-100 border-b border-gray-200 py-3 px-4 flex items-center justify-between animate-fade-in relative z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-lg p-0.5 overflow-hidden w-8 h-8 flex-shrink-0 shadow-sm">
          <img src="/images/app_logo.png" alt="App Logo" className="w-full h-full object-cover" />
        </div>
        <p className="text-sm font-medium text-gray-900 pr-4">
          Get the <span className="font-bold font-serif italic text-black">Benicja App</span> on mobile
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          {platform === 'ios' ? 'Show How' : 'Install'}
        </button>
        <button 
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

class WixProductPageOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.isProductPage = this.detectProductPage();
        this.optimizationStartTime = performance.now();
        
        // Scripts that benefit from preloading (don't control their loading, just optimize)
        this.preloadableScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js',
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js'
        ];

        // Scripts that can be safely deferred if not already loaded
        this.deferableScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js',
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js',
            'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.es5.min.js'
        ];

        // Scripts to lazy load only when needed
        this.lazyLoadScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js'
        ];

        this.loadedScripts = new Set();
        this.failedScripts = new Set();
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initOptimization();
    }

    detectProductPage() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        return path.includes('/product-page/') || 
               url.includes('/product-page/') ||
               path.match(/\/[\w-]+\/product-page\/[\w-]+/);
    }

    initOptimization() {
        // Wait for initial DOM load but don't interfere with existing scripts
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startSafeOptimization());
        } else {
            // Use a slight delay to ensure existing scripts start loading first
            setTimeout(() => this.startSafeOptimization(), 100);
        }
    }

    startSafeOptimization() {
        console.log('🛍️ Starting Safe Wix Product Page Optimization...');
        
        try {
            // Step 1: Enhance loading with preloads (non-intrusive)
            this.addResourcePreloads();
            
            // Step 2: Add performance hints to existing scripts
            this.enhanceExistingScripts();
            
            // Step 3: Smart lazy loading for heavy components
            this.setupLazyLoading();
            
            // Step 4: Monitor and report performance
            this.monitorPerformance();
            
        } catch (error) {
            console.warn('⚠️ Optimization error, falling back to default loading:', error);
            this.onOptimizationComplete();
        }
    }

    addResourcePreloads() {
        // Add preload hints without interfering with existing loading
        this.preloadableScripts.forEach(src => {
            if (!this.hasExistingPreload(src)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = src;
                link.as = 'script';
                link.crossOrigin = 'anonymous';
                link.setAttribute('data-wix-optimized', 'true');
                document.head.appendChild(link);
            }
        });

        // Add connection optimizations
        this.addConnectionOptimizations();
    }

    hasExistingPreload(src) {
        const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
        return !!existing;
    }

    addConnectionOptimizations() {
        const optimizations = [
            { rel: 'dns-prefetch', href: '//static.parastorage.com' },
            { rel: 'preconnect', href: 'https://static.parastorage.com', crossOrigin: 'anonymous' },
            { rel: 'dns-prefetch', href: '//browser.sentry-cdn.com' }
        ];

        optimizations.forEach(opt => {
            const existing = document.querySelector(`link[rel="${opt.rel}"][href="${opt.href}"]`);
            if (!existing) {
                const link = document.createElement('link');
                link.rel = opt.rel;
                link.href = opt.href;
                if (opt.crossOrigin) link.crossOrigin = opt.crossOrigin;
                link.setAttribute('data-wix-optimized', 'true');
                document.head.appendChild(link);
            }
        });
    }

    enhanceExistingScripts() {
        // Add performance attributes to existing scripts without breaking them
        const scripts = document.querySelectorAll('script[src]');
        
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (!src) return;

            // Don't modify scripts that are already optimized
            if (script.hasAttribute('data-wix-optimized')) return;

            // Add fetchpriority to important scripts
            if (this.preloadableScripts.some(url => src.includes(url.split('/').pop()))) {
                script.setAttribute('fetchpriority', 'high');
                script.setAttribute('data-wix-optimized', 'enhanced');
            }
            
            // Add defer to heavy scripts that aren't critical
            else if (this.deferableScripts.some(url => src.includes(url.split('/').pop()))) {
                if (!script.async && !script.defer) {
                    script.defer = true;
                    script.setAttribute('data-wix-optimized', 'deferred');
                }
            }
        });
    }

    setupLazyLoading() {
        // Only lazy load ProGallery if we're NOT on a product page
        if (!this.isProductPage) {
            this.deferHeavyComponents();
        }

        // Setup intersection observer for lazy loading when elements come into view
        this.setupIntersectionObserver();
    }

    deferHeavyComponents() {
        // Defer loading of gallery components on non-product pages
        const galleryScript = document.querySelector('script[src*="ProGallery"]');
        if (galleryScript && !galleryScript.hasAttribute('data-wix-optimized')) {
            // Don't remove, just delay loading
            galleryScript.setAttribute('data-lazy-load', 'true');
            galleryScript.setAttribute('data-wix-optimized', 'lazy');
        }
    }

    setupIntersectionObserver() {
        // Lazy load scripts when certain elements become visible
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyScripts();
                        observer.disconnect(); // Load once
                    }
                });
            }, { threshold: 0.1 });

            // Observe gallery containers, product images, etc.
            const lazyElements = document.querySelectorAll('[class*="gallery"], [class*="product"], [class*="image"]');
            lazyElements.forEach(el => observer.observe(el));

            // Fallback timeout
            setTimeout(() => {
                this.loadLazyScripts();
                observer.disconnect();
            }, 5000);
        } else {
            // Fallback for older browsers
            setTimeout(() => this.loadLazyScripts(), 2000);
        }
    }

    loadLazyScripts() {
        // Load deferred scripts if they haven't loaded yet
        const lazyScripts = document.querySelectorAll('script[data-lazy-load="true"]');
        lazyScripts.forEach(script => {
            if (!this.loadedScripts.has(script.src)) {
                script.removeAttribute('data-lazy-load');
                this.loadedScripts.add(script.src);
            }
        });
    }

    monitorPerformance() {
        // Monitor script loading without interfering
        const scripts = document.querySelectorAll('script[src]');
        let loadedCount = 0;
        
        scripts.forEach(script => {
            if (script.readyState === 'complete' || script.complete) {
                loadedCount++;
            } else {
                script.addEventListener('load', () => {
                    loadedCount++;
                    this.checkOptimizationComplete(scripts.length, loadedCount);
                }, { once: true });
                
                script.addEventListener('error', (error) => {
                    this.failedScripts.add(script.src);
                    loadedCount++;
                    this.checkOptimizationComplete(scripts.length, loadedCount);
                }, { once: true });
            }
        });

        // Initial check in case scripts are already loaded
        this.checkOptimizationComplete(scripts.length, loadedCount);
    }

    checkOptimizationComplete(totalScripts, loadedCount) {
        const loadProgress = (loadedCount / totalScripts) * 100;
        
        if (loadProgress >= 80 && !this.isLoaded) {
            // Consider optimization complete when most scripts are loaded
            setTimeout(() => this.onOptimizationComplete(), 1000);
        }
    }

    onOptimizationComplete() {
        if (this.isLoaded) return; // Prevent multiple calls
        
        this.isLoaded = true;
        const optimizationTime = performance.now() - this.optimizationStartTime;
        
        // Dispatch completion event
        const event = new CustomEvent('wix-product-optimization-complete', {
            detail: { 
                optimizationTime: optimizationTime,
                isProductPage: this.isProductPage,
                pageUrl: window.location.href,
                failedScripts: Array.from(this.failedScripts),
                method: 'safe-enhancement'
            }
        });
        document.dispatchEvent(event);

        console.log('🛍️ Safe Wix Product Page Optimization Complete!');
        console.log(`⏱️ Optimization time: ${optimizationTime.toFixed(2)}ms`);
        
        if (this.failedScripts.size > 0) {
            console.warn('⚠️ Some scripts failed to load:', Array.from(this.failedScripts));
        }
    }

    // Public methods
    isOptimizationComplete() {
        return this.isLoaded;
    }

    getPageType() {
        return this.isProductPage ? 'product' : 'other';
    }

    getOptimizationStats() {
        return {
            isComplete: this.isLoaded,
            optimizationTime: performance.now() - this.optimizationStartTime,
            failedScripts: Array.from(this.failedScripts),
            loadedScripts: Array.from(this.loadedScripts)
        };
    }

    // Safe restart method
    restartOptimization() {
        if (this.isLoaded) {
            this.isLoaded = false;
            this.isProductPage = this.detectProductPage();
            this.optimizationStartTime = performance.now();
            
            // Only restart if it's safe to do so
            setTimeout(() => this.startSafeOptimization(), 500);
        }
    }

    // Cleanup method
    cleanup() {
        // Remove only our optimization hints, not original scripts
        const optimizedElements = document.querySelectorAll('[data-wix-optimized="true"]');
        optimizedElements.forEach(el => el.remove());
    }
}

// Register the custom element
customElements.define('wix-product-page-optimizer', WixProductPageOptimizer);

// Safe auto-initialization
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already present
    if (!document.querySelector('wix-product-page-optimizer')) {
        const element = document.createElement('wix-product-page-optimizer');
        document.body.appendChild(element);
    }
});

// Conservative SPA handling
let lastUrl = location.href;
let navigationTimeout;

function handleNavigation() {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        
        // Clear previous timeout
        if (navigationTimeout) clearTimeout(navigationTimeout);
        
        // Wait for navigation to complete before restarting
        navigationTimeout = setTimeout(() => {
            const optimizer = document.querySelector('wix-product-page-optimizer');
            if (optimizer && optimizer.restartOptimization && document.readyState === 'complete') {
                console.log('🔄 Safe navigation restart...');
                optimizer.restartOptimization();
            }
        }, 1500);
    }
}

// Use more conservative navigation detection
if ('MutationObserver' in window) {
    const observer = new MutationObserver(() => {
        // Debounce navigation detection
        if (navigationTimeout) clearTimeout(navigationTimeout);
        navigationTimeout = setTimeout(handleNavigation, 300);
    });
    
    // Only observe URL changes, not all DOM changes
    observer.observe(document, { 
        subtree: false, 
        childList: false, 
        attributes: true, 
        attributeFilter: ['href'] 
    });
}

// Export for external use
window.WixProductPageOptimizer = WixProductPageOptimizer;

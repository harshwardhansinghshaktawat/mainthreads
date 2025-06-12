class WixJSOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.optimizationStartTime = performance.now();
        
        // Critical scripts that need high priority loading
        this.criticalScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js',
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js',
            'https://static.parastorage.com/unpkg/requirejs-bolt@2.3.6/requirejs.min.js'
        ];

        // Medium priority scripts for UI components
        this.mediumPriorityScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[RichContentViewer].f51859d2.bundle.min.js',
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt_menu.069648f0.bundle.min.js'
        ];

        // Scripts that can be safely deferred for better performance
        this.deferableScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/group_6.9a28cbeb.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/consentPolicy.c82a047f.chunk.min.js',
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js',
            'https://static.parastorage.com/services/ecom-platform-cart-icon/1.1570.0/CartIconViewerWidgetNoCss.bundle.min.js'
        ];

        // Optional scripts that can be loaded last
        this.optionalScripts = [
            'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.es5.min.js'
        ];

        this.loadedScripts = new Set();
        this.failedScripts = new Set();
        this.isMobile = this.detectMobileDevice();
        this.optimizedImages = new Set();
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initOptimization();
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               'ontouchstart' in window;
    }

    initOptimization() {
        // Wait for initial DOM load but don't interfere with existing scripts
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startOptimization());
        } else {
            // Use a slight delay to ensure existing scripts start loading first
            setTimeout(() => this.startOptimization(), 100);
        }
    }

    startOptimization() {
        console.log('⚡ Starting Wix JS Library Optimization...');
        
        try {
            // Step 1: Optimize high-priority images for mobile
            if (this.isMobile) {
                this.optimizeHighPriorityImages();
            }
            
            // Step 2: Enhance loading with preloads (non-intrusive)
            this.addResourcePreloads();
            
            // Step 3: Add performance hints to existing scripts
            this.enhanceExistingScripts();
            
            // Step 4: Setup intelligent script loading
            this.setupIntelligentLoading();
            
            // Step 5: Monitor and report performance
            this.monitorPerformance();
            
        } catch (error) {
            console.warn('⚠️ Optimization error, falling back to default loading:', error);
            this.onOptimizationComplete();
        }
    }

    addResourcePreloads() {
        // Add preload hints for critical scripts without interfering with existing loading
        this.criticalScripts.forEach(src => {
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

        // Preload medium priority scripts for faster loading
        this.mediumPriorityScripts.forEach(src => {
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

    optimizeHighPriorityImages() {
        console.log('📱 Optimizing high-priority images for mobile...');
        
        // Find all images with fetchpriority="high"
        const highPriorityImages = document.querySelectorAll('img[fetchpriority="high"]');
        
        highPriorityImages.forEach(img => {
            if (this.optimizedImages.has(img.src)) return;
            
            // Add preload for high-priority images
            if (img.src && !document.querySelector(`link[rel="preload"][href="${img.src}"]`)) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.href = img.src;
                preloadLink.as = 'image';
                preloadLink.setAttribute('fetchpriority', 'high');
                preloadLink.setAttribute('data-wix-optimized', 'true');
                document.head.appendChild(preloadLink);
            }
            
            // Optimize for mobile loading
            if (this.isMobile) {
                img.loading = 'eager'; // Force immediate loading
                img.decoding = 'sync';  // Synchronous decoding for instant display
                
                // Add mobile-specific optimizations
                if (!img.hasAttribute('data-mobile-optimized')) {
                    img.setAttribute('data-mobile-optimized', 'true');
                    
                    // Force browser to prioritize this image
                    if (img.complete) {
                        img.style.opacity = '1';
                    } else {
                        img.addEventListener('load', () => {
                            img.style.opacity = '1';
                        }, { once: true });
                    }
                }
            }
            
            this.optimizedImages.add(img.src);
        });
        
        // Use Intersection Observer to optimize images that come into view
        this.setupImageObserver();
        
        console.log(`📸 Optimized ${highPriorityImages.length} high-priority images`);
    }

    setupImageObserver() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.hasAttribute('fetchpriority') && img.getAttribute('fetchpriority') === 'high') {
                            // Boost priority for images coming into view
                            img.style.willChange = 'transform';
                            img.setAttribute('fetchpriority', 'high');
                            
                            // Preload next images in sequence
                            this.preloadNearbyImages(img);
                        }
                        imageObserver.unobserve(img);
                    }
                });
            }, { 
                threshold: 0.1,
                rootMargin: '50px' // Start loading 50px before image is visible
            });

            // Observe all high-priority images
            document.querySelectorAll('img[fetchpriority="high"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    preloadNearbyImages(currentImg) {
        // Find nearby images and preload them
        const allImages = Array.from(document.querySelectorAll('img[fetchpriority="high"]'));
        const currentIndex = allImages.indexOf(currentImg);
        
        // Preload next 2 images in sequence
        for (let i = 1; i <= 2; i++) {
            const nextImg = allImages[currentIndex + i];
            if (nextImg && nextImg.src && !this.optimizedImages.has(nextImg.src)) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.href = nextImg.src;
                preloadLink.as = 'image';
                preloadLink.setAttribute('data-wix-optimized', 'true');
                document.head.appendChild(preloadLink);
                this.optimizedImages.add(nextImg.src);
            }
        }
    }

    hasExistingPreload(src) {
        const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
        return !!existing;
    }

    addConnectionOptimizations() {
        const optimizations = [
            { rel: 'dns-prefetch', href: '//static.parastorage.com' },
            { rel: 'preconnect', href: 'https://static.parastorage.com', crossOrigin: 'anonymous' },
            { rel: 'dns-prefetch', href: '//browser.sentry-cdn.com' },
            { rel: 'dns-prefetch', href: '//www.googletagmanager.com' }
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

            // Add fetchpriority to critical scripts
            if (this.isCriticalScript(src)) {
                script.setAttribute('fetchpriority', 'high');
                script.setAttribute('data-wix-optimized', 'critical');
            }
            
            // Add medium priority to UI component scripts
            else if (this.isMediumPriorityScript(src)) {
                script.setAttribute('fetchpriority', 'auto');
                if (!script.async && !script.defer) {
                    script.defer = true;
                }
                script.setAttribute('data-wix-optimized', 'medium-priority');
            }
            
            // Add defer to deferrable scripts that aren't critical
            else if (this.isDeferableScript(src)) {
                if (!script.async && !script.defer) {
                    script.defer = true;
                    script.setAttribute('data-wix-optimized', 'deferred');
                }
            }
            
            // Mark optional scripts with low priority
            else if (this.isOptionalScript(src)) {
                script.setAttribute('fetchpriority', 'low');
                script.setAttribute('data-wix-optimized', 'low-priority');
            }
        });
    }

    isCriticalScript(src) {
        return this.criticalScripts.some(url => 
            src.includes(url.split('/').pop()) || 
            src.includes(url.split('/').slice(-2).join('/'))
        );
    }

    isMediumPriorityScript(src) {
        return this.mediumPriorityScripts.some(url => 
            src.includes(url.split('/').pop()) || 
            src.includes(url.split('/').slice(-2).join('/'))
        );
    }

    isDeferableScript(src) {
        return this.deferableScripts.some(url => 
            src.includes(url.split('/').pop()) || 
            src.includes(url.split('/').slice(-2).join('/'))
        );
    }

    isOptionalScript(src) {
        return this.optionalScripts.some(url => 
            src.includes(url.split('/').pop()) || 
            src.includes(url.split('/').slice(-2).join('/'))
        );
    }

    setupIntelligentLoading() {
        // Setup intersection observer for lazy loading when elements come into view
        this.setupIntersectionObserver();
        
        // Setup idle time loading for optional scripts
        this.setupIdleLoading();
    }

    setupIntersectionObserver() {
        // Load heavy scripts when interactive elements become visible
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadVisibilityTriggeredScripts();
                        observer.disconnect(); // Load once
                    }
                });
            }, { threshold: 0.1 });

            // Observe interactive elements that might need heavy scripts
            const interactiveElements = document.querySelectorAll(
                '[class*="gallery"], [class*="animation"], [class*="form"], [class*="interactive"]'
            );
            
            if (interactiveElements.length > 0) {
                interactiveElements.forEach(el => observer.observe(el));
            }

            // Fallback timeout to ensure scripts load eventually
            setTimeout(() => {
                this.loadVisibilityTriggeredScripts();
                observer.disconnect();
            }, 5000);
        } else {
            // Fallback for older browsers
            setTimeout(() => this.loadVisibilityTriggeredScripts(), 2000);
        }
    }

    setupIdleLoading() {
        // Load optional scripts during idle time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadOptionalScripts();
            }, { timeout: 7000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this.loadOptionalScripts(), 3000);
        }
    }

    loadVisibilityTriggeredScripts() {
        // Ensure deferred scripts are prioritized when needed
        const deferredScripts = document.querySelectorAll('script[data-wix-optimized="deferred"]');
        deferredScripts.forEach(script => {
            if (!this.loadedScripts.has(script.src)) {
                script.setAttribute('fetchpriority', 'high');
                this.loadedScripts.add(script.src);
            }
        });
    }

    loadOptionalScripts() {
        // Boost priority of optional scripts during idle time
        const optionalScripts = document.querySelectorAll('script[data-wix-optimized="low-priority"]');
        optionalScripts.forEach(script => {
            if (!this.loadedScripts.has(script.src)) {
                script.setAttribute('fetchpriority', 'auto');
                this.loadedScripts.add(script.src);
            }
        });
    }

    monitorPerformance() {
        // Monitor script loading performance without interfering
        const scripts = document.querySelectorAll('script[src]');
        let loadedCount = 0;
        let errorCount = 0;
        
        scripts.forEach(script => {
            if (script.readyState === 'complete' || script.complete) {
                loadedCount++;
            } else {
                script.addEventListener('load', () => {
                    loadedCount++;
                    this.logScriptLoad(script.src, 'success');
                    this.checkOptimizationProgress(scripts.length, loadedCount, errorCount);
                }, { once: true });
                
                script.addEventListener('error', (error) => {
                    errorCount++;
                    this.failedScripts.add(script.src);
                    this.logScriptLoad(script.src, 'error');
                    this.checkOptimizationProgress(scripts.length, loadedCount, errorCount);
                }, { once: true });
            }
        });

        // Initial check in case scripts are already loaded
        this.checkOptimizationProgress(scripts.length, loadedCount, errorCount);
    }

    logScriptLoad(src, status) {
        const scriptName = src.split('/').pop();
        const emoji = status === 'success' ? '✅' : '❌';
        console.log(`${emoji} ${scriptName} - ${status}`);
    }

    checkOptimizationProgress(totalScripts, loadedCount, errorCount) {
        const completedCount = loadedCount + errorCount;
        const loadProgress = (completedCount / totalScripts) * 100;
        
        // Consider optimization complete when 90% of scripts are processed
        if (loadProgress >= 90 && !this.isLoaded) {
            setTimeout(() => this.onOptimizationComplete(), 500);
        }
    }

    onOptimizationComplete() {
        if (this.isLoaded) return; // Prevent multiple calls
        
        this.isLoaded = true;
        const optimizationTime = performance.now() - this.optimizationStartTime;
        
        // Calculate performance metrics
        const totalScripts = document.querySelectorAll('script[src]').length;
        const optimizedScripts = document.querySelectorAll('script[data-wix-optimized]').length;
        const successRate = ((totalScripts - this.failedScripts.size) / totalScripts) * 100;
        
        // Dispatch completion event
        const event = new CustomEvent('wix-js-optimization-complete', {
            detail: { 
                optimizationTime: optimizationTime,
                totalScripts: totalScripts,
                optimizedScripts: optimizedScripts,
                failedScripts: Array.from(this.failedScripts),
                successRate: successRate,
                pageUrl: window.location.href,
                isMobile: this.isMobile,
                optimizedImages: this.optimizedImages.size
            }
        });
        document.dispatchEvent(event);

        console.log('⚡ Wix JS Library Optimization Complete!');
        console.log(`📊 Stats: ${optimizedScripts}/${totalScripts} scripts optimized`);
        console.log(`⏱️ Optimization time: ${optimizationTime.toFixed(2)}ms`);
        console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
        
        if (this.isMobile) {
            console.log(`📱 Mobile optimization: ${this.optimizedImages.size} high-priority images optimized`);
        }
        
        if (this.failedScripts.size > 0) {
            console.warn('⚠️ Scripts with loading issues:', Array.from(this.failedScripts));
        }
    }

    // Public methods for external use
    isOptimizationComplete() {
        return this.isLoaded;
    }

    getOptimizationStats() {
        const totalScripts = document.querySelectorAll('script[src]').length;
        const optimizedScripts = document.querySelectorAll('script[data-wix-optimized]').length;
        
        return {
            isComplete: this.isLoaded,
            optimizationTime: performance.now() - this.optimizationStartTime,
            totalScripts: totalScripts,
            optimizedScripts: optimizedScripts,
            failedScripts: Array.from(this.failedScripts),
            loadedScripts: Array.from(this.loadedScripts),
            successRate: ((totalScripts - this.failedScripts.size) / totalScripts) * 100,
            isMobile: this.isMobile,
            optimizedImages: this.optimizedImages.size,
            imageOptimizationEnabled: this.isMobile
        };
    }

    // Manual optimization trigger
    reoptimize() {
        if (!this.isLoaded) return;
        
        console.log('🔄 Re-optimizing JS libraries...');
        this.enhanceExistingScripts();
        this.setupIntelligentLoading();
    }

    // Cleanup method
    cleanup() {
        // Remove only our optimization hints, not original scripts
        const optimizedElements = document.querySelectorAll('[data-wix-optimized="true"]');
        optimizedElements.forEach(el => el.remove());
        
        console.log('🧹 Optimization cleanup complete');
    }
}

// Register the custom element
customElements.define('wix-js-optimizer', WixJSOptimizer);

// Auto-initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('wix-js-optimizer')) {
        const element = document.createElement('wix-js-optimizer');
        document.body.appendChild(element);
    }
});

// Export for external use
window.WixJSOptimizer = WixJSOptimizer;

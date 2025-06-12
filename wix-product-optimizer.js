class WixJSOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.optimizationStartTime = performance.now();
        this.isMobile = this.detectMobile(); // Mobile detection

        // Critical scripts that need high priority loading
        this.criticalScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js',
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js',
            'https://static.parastorage.com/unpkg/requirejs-bolt@2.3.6/requirejs.min.js' // Added missing critical script
        ];

        // Scripts that can be safely deferred for better performance
        this.deferableScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/group_6.9a28cbeb.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/consentPolicy.c82a047f.chunk.min.js',
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[RichContentViewer].f51859d2.bundle.min.js', // Added missing script
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt_menu.069648f0.bundle.min.js', // Added missing script
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js',
            'https://static.parastorage.com/services/ecom-platform-cart-icon/1.1570.0/CartIconViewerWidgetNoCss.bundle.min.js'
        ];

        // Optional scripts that can be loaded last
        this.optionalScripts = [
            'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.es5.min.js'
        ];

        this.loadedScripts = new Set();
        this.failedScripts = new Set();
    }

    // Detect mobile devices
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
               window.innerWidth <= 768; // Consider small screens as mobile
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initOptimization();
    }

    initOptimization() {
        // Adjust initialization delay for mobile
        const initDelay = this.isMobile ? 50 : 100; // Shorter delay on mobile for faster loading
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startOptimization());
        } else {
            setTimeout(() => this.startOptimization(), initDelay);
        }
    }

    startOptimization() {
        console.log('⚡ Starting Wix JS Library Optimization...');
        
        try {
            this.addResourcePreloads();
            this.enhanceExistingScripts();
            this.setupIntelligentLoading();
            this.monitorPerformance();
        } catch (error) {
            console.warn('⚠️ Optimization error, falling back to default loading:', error);
            this.onOptimizationComplete();
        }
    }

    addResourcePreloads() {
        // Preload critical scripts, limit concurrent preloads on mobile
        const scriptsToPreload = this.isMobile ? this.criticalScripts.slice(0, 2) : this.criticalScripts; // Limit to 2 on mobile
        scriptsToPreload.forEach(src => {
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

        this.addConnectionOptimizations();
    }

    hasExistingPreload(src) {
        return !!document.querySelector(`link[rel="preload"][href="${src}"]`);
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
        const scripts = document.querySelectorAll('script[src]');
        
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (!src || script.hasAttribute('data-wix-optimized')) return;

            if (this.isCriticalScript(src)) {
                script.setAttribute('fetchpriority', 'high');
                script.setAttribute('data-wix-optimized', 'high-priority');
            } else if (this.isDeferableScript(src)) {
                if (!script.async && !script.defer) {
                    script.defer = true; // Always defer non-critical scripts
                    script.setAttribute('data-wix-optimized', 'deferred');
                    if (this.isMobile) {
                        script.setAttribute('loading', 'lazy'); // Add lazy loading for mobile
                    }
                }
            } else if (this.isOptionalScript(src)) {
                script.setAttribute('fetchpriority', 'low');
                script.setAttribute('data-wix-optimized', 'low-priority');
                if (this.isMobile) {
                    script.setAttribute('loading', 'lazy'); // Lazy load optional scripts on mobile
                }
            }
        });
    }

    isCriticalScript(src) {
        return this.criticalScripts.some(url => 
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
        this.setupIntersectionObserver();
        this.setupIdleLoading();
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                threshold: this.isMobile ? 0.05 : 0.1, // Lower threshold for mobile
                rootMargin: this.isMobile ? '100px' : '200px' // Smaller margin for mobile
            };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadVisibilityTriggeredScripts();
                        observer.disconnect();
                    }
                });
            }, observerOptions);

            const interactiveElements = document.querySelectorAll(
                '[class*="gallery"], [class*="animation"], [class*="form"], [class*="interactive"]'
            );
            
            if (interactiveElements.length > 0) {
                interactiveElements.forEach(el => observer.observe(el));
            }

            // Shorter timeout for mobile
            setTimeout(() => {
                this.loadVisibilityTriggeredScripts();
                observer.disconnect();
            }, this.isMobile ? 3000 : 5000);
        } else {
            setTimeout(() => this.loadVisibilityTriggeredScripts(), this.isMobile ? 1000 : 2000);
        }
    }

    setupIdleLoading() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadOptionalScripts();
            }, { timeout: this.isMobile ? 5000 : 7000 }); // Shorter timeout for mobile
        } else {
            setTimeout(() => this.loadOptionalScripts(), this.isMobile ? 2000 : 3000);
        }
    }

    loadVisibilityTriggeredScripts() {
        const deferredScripts = document.querySelectorAll('script[data-wix-optimized="deferred"]');
        deferredScripts.forEach(script => {
            if (!this.loadedScripts.has(script.src)) {
                script.setAttribute('fetchpriority', this.isMobile ? 'auto' : 'high'); // Lower priority on mobile
                this.loadedScripts.add(script.src);
            }
        });
    }

    loadOptionalScripts() {
        const optionalScripts = document.querySelectorAll('script[data-wix-optimized="low-priority"]');
        optionalScripts.forEach(script => {
            if (!this.loadedScripts.has(script.src)) {
                script.setAttribute('fetchpriority', 'auto');
                this.loadedScripts.add(script.src);
            }
        });
    }

    monitorPerformance() {
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

        this.checkOptimizationProgress(scripts.length, loadedCount, errorCount);
    }

    logScriptLoad(src, status) {
        const scriptName = src.split('/').pop();
        const emoji = status === 'success' ? '✅' : '❌';
        console.log(`${emoji} ${scriptName} - ${status} ${this.isMobile ? '[Mobile]' : '[Desktop]'}`);
    }

    checkOptimizationProgress(totalScripts, loadedCount, errorCount) {
        const completedCount = loadedCount + errorCount;
        const loadProgress = (completedCount / totalScripts) * 100;
        
        if (loadProgress >= 90 && !this.isLoaded) {
            setTimeout(() => this.onOptimizationComplete(), this.isMobile ? 300 : 500); // Faster completion on mobile
        }
    }

    onOptimizationComplete() {
        if (this.isLoaded) return;
        
        this.isLoaded = true;
        const optimizationTime = performance.now() - this.optimizationStartTime;
        
        const totalScripts = document.querySelectorAll('script[src]').length;
        const optimizedScripts = document.querySelectorAll('script[data-wix-optimized]').length;
        const successRate = ((totalScripts - this.failedScripts.size) / totalScripts) * 100;
        
        const event = new CustomEvent('wix-js-optimization-complete', {
            detail: { 
                optimizationTime: optimizationTime,
                totalScripts: totalScripts,
                optimizedScripts: optimizedScripts,
                failedScripts: Array.from(this.failedScripts),
                successRate: successRate,
                pageUrl: window.location.href,
                isMobile: this.isMobile
            }
        });
        document.dispatchEvent(event);

        console.log(`⚡ Wix JS Library Optimization Complete! ${this.isMobile ? '[Mobile]' : '[Desktop]'}`);
        console.log(`📊 Stats: ${optimizedScripts}/${totalScripts} scripts optimized`);
        console.log(`⏱️ Optimization time: ${optimizationTime.toFixed(2)}ms`);
        console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
        
        if (this.failedScripts.size > 0) {
            console.warn('⚠️ Scripts with loading issues:', Array.from(this.failedScripts));
        }
    }

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
            isMobile: this.isMobile
        };
    }

    reoptimize() {
        if (!this.isLoaded) return;
        
        console.log('🔄 Re-optimizing JS libraries...');
        this.enhanceExistingScripts();
        this.setupIntelligentLoading();
    }

    cleanup() {
        const optimizedElements = document.querySelectorAll('[data-wix-optimized="true"]');
        optimizedElements.forEach(el => el.remove());
        
        console.log('🧹 Optimization cleanup complete');
    }
}

customElements.define('wix-js-optimizer', WixJSOptimizer);

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('wix-js-optimizer')) {
        const element = document.createElement('wix-js-optimizer');
        document.body.appendChild(element);
    }
});

window.WixJSOptimizer = WixJSOptimizer;

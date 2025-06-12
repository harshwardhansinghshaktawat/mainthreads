class WixProductPageOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.isProductPage = this.detectProductPage();
        
        // Critical scripts that need to load first for core functionality
        this.criticalScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js'
        ];

        // High priority scripts for product page functionality
        this.highPriorityScripts = [
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/group_6.9a28cbeb.chunk.min.js'
        ];

        // Medium priority UI components
        this.mediumPriorityScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/consentPolicy.c82a047f.chunk.min.js',
            'https://static.parastorage.com/services/ecom-platform-cart-icon/1.1570.0/CartIconViewerWidgetNoCss.bundle.min.js'
        ];

        // Low priority/deferred scripts for enhanced functionality
        this.lowPriorityScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js',
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js'
        ];

        // Optional/unused scripts that can be skipped or loaded last
        this.optionalScripts = [
            'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.es5.min.js'
        ];

        // Store current page URL for dynamic handling
        this.currentPageUrl = window.location.href;
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initProductPageOptimization();
    }

    detectProductPage() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        // Check if URL contains product-page pattern
        return path.includes('/product-page/') || 
               url.includes('/product-page/') ||
               path.match(/\/[\w-]+\/product-page\/[\w-]+/);
    }

    initProductPageOptimization() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startOptimization());
        } else {
            this.startOptimization();
        }
    }

    startOptimization() {
        console.log('🛍️ Starting Wix Product Page Optimization...');
        
        // Remove existing scripts that match our URLs to prevent double loading
        this.removeExistingScripts();
        
        // Preload critical resources first
        this.preloadCriticalResources();
        
        // Load scripts in priority order
        this.loadCriticalScripts().then(() => {
            this.loadHighPriorityScripts().then(() => {
                this.scheduleMediumPriorityLoading();
            });
        });
    }

    removeExistingScripts() {
        const allScripts = [
            ...this.criticalScripts, 
            ...this.highPriorityScripts,
            ...this.mediumPriorityScripts, 
            ...this.lowPriorityScripts,
            ...this.optionalScripts
        ];
        
        const existingScripts = document.querySelectorAll('script[src]');
        
        existingScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && allScripts.some(url => this.matchesScriptUrl(src, url))) {
                script.setAttribute('data-product-optimized', 'true');
            }
        });
    }

    matchesScriptUrl(existingSrc, targetUrl) {
        const existingFilename = existingSrc.split('/').pop();
        const targetFilename = targetUrl.split('/').pop();
        return existingFilename === targetFilename || existingSrc.includes(targetFilename);
    }

    async loadCriticalScripts() {
        console.log('⚡ Loading critical scripts...');
        // Load core Wix infrastructure first
        for (const scriptUrl of this.criticalScripts) {
            await this.loadScript(scriptUrl, { 
                priority: 'high', 
                defer: false,
                critical: true 
            });
        }
    }

    async loadHighPriorityScripts() {
        console.log('🔧 Loading high priority scripts...');
        // Load React and essential product page functionality
        for (const scriptUrl of this.highPriorityScripts) {
            await this.loadScript(scriptUrl, { 
                priority: 'high', 
                defer: false 
            });
        }
    }

    scheduleMediumPriorityLoading() {
        // Use requestIdleCallback for medium priority scripts
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadMediumPriorityScripts(), { timeout: 3000 });
        } else {
            setTimeout(() => this.loadMediumPriorityScripts(), 800);
        }
    }

    async loadMediumPriorityScripts() {
        console.log('🎨 Loading medium priority scripts...');
        // Load UI components in parallel
        const loadPromises = this.mediumPriorityScripts.map(scriptUrl => 
            this.loadScript(scriptUrl, { 
                priority: 'low', 
                defer: true, 
                async: true 
            })
        );

        await Promise.allSettled(loadPromises);
        this.scheduleLowPriorityLoading();
    }

    scheduleLowPriorityLoading() {
        // Further delay low priority scripts
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadLowPriorityScripts(), { timeout: 7000 });
        } else {
            setTimeout(() => this.loadLowPriorityScripts(), 2000);
        }
    }

    async loadLowPriorityScripts() {
        console.log('🎯 Loading low priority scripts...');
        
        // Only load ProGallery if we're actually on a product page
        let scriptsToLoad = this.lowPriorityScripts;
        if (!this.isProductPage) {
            scriptsToLoad = scriptsToLoad.filter(url => !url.includes('ProGallery'));
        }

        // Load remaining scripts with lowest priority
        const loadPromises = scriptsToLoad.map(scriptUrl => 
            this.loadScript(scriptUrl, { 
                priority: 'low', 
                defer: true, 
                async: true 
            })
        );

        await Promise.allSettled(loadPromises);
        this.scheduleOptionalScripts();
    }

    scheduleOptionalScripts() {
        // Load optional scripts only if browser is idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadOptionalScripts(), { timeout: 10000 });
        } else {
            // Skip optional scripts on older browsers
            setTimeout(() => this.onOptimizationComplete(), 100);
        }
    }

    async loadOptionalScripts() {
        console.log('📊 Loading optional scripts...');
        // Load tracking and optional functionality last
        const loadPromises = this.optionalScripts.map(scriptUrl => 
            this.loadScript(scriptUrl, { 
                priority: 'low', 
                defer: true, 
                async: true,
                optional: true 
            })
        );

        await Promise.allSettled(loadPromises);
        this.onOptimizationComplete();
    }

    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if script already exists and isn't marked for optimization
            const existingScript = document.querySelector(`script[src*="${src.split('/').pop()}"]`);
            if (existingScript && !existingScript.hasAttribute('data-product-optimized')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            
            // Apply performance optimizations
            if (options.defer) script.defer = true;
            if (options.async) script.async = true;
            
            // Set resource hints for better loading
            if (options.priority) {
                script.setAttribute('fetchpriority', options.priority);
            }

            // Add loading strategy attributes
            if (options.critical) {
                script.setAttribute('data-critical', 'true');
            }

            script.onload = () => {
                const scriptName = src.split('/').pop();
                const emoji = options.critical ? '🚀' : options.optional ? '📱' : '✅';
                console.log(`${emoji} Optimized loading: ${scriptName}`);
                resolve();
            };
            
            script.onerror = (error) => {
                const scriptName = src.split('/').pop();
                if (options.optional) {
                    console.log(`⏭️ Optional script skipped: ${scriptName}`);
                } else {
                    console.warn(`⚠️ Failed to load: ${scriptName}`, error);
                }
                resolve(); // Continue even if one script fails
            };

            // Append to head for better caching
            document.head.appendChild(script);
        });
    }

    preloadCriticalResources() {
        // Preload only the most critical scripts
        this.criticalScripts.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = src;
            link.as = 'script';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });

        // DNS prefetch for parastorage domain
        const prefetch = document.createElement('link');
        prefetch.rel = 'dns-prefetch';
        prefetch.href = '//static.parastorage.com';
        document.head.appendChild(prefetch);

        // Preconnect for faster loading
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://static.parastorage.com';
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
    }

    onOptimizationComplete() {
        this.isLoaded = true;
        
        // Dispatch custom event for other scripts to listen
        const event = new CustomEvent('wix-product-optimization-complete', {
            detail: { 
                optimizedScripts: [
                    ...this.criticalScripts,
                    ...this.highPriorityScripts,
                    ...this.mediumPriorityScripts,
                    ...this.lowPriorityScripts,
                    ...this.optionalScripts
                ],
                loadTime: performance.now(),
                isProductPage: this.isProductPage,
                pageUrl: this.currentPageUrl
            }
        });
        document.dispatchEvent(event);

        // Clean up old scripts marked for optimization
        setTimeout(() => {
            const oldScripts = document.querySelectorAll('script[data-product-optimized="true"]');
            oldScripts.forEach(script => {
                console.log(`🧹 Removing duplicate script: ${script.src.split('/').pop()}`);
                script.remove();
            });
        }, 3000);

        console.log('🛍️ Wix Product Page Optimization Complete!');
        
        // Log performance metrics
        if (performance.mark) {
            performance.mark('wix-product-optimization-end');
            console.log(`⏱️ Total optimization time: ${performance.now().toFixed(2)}ms`);
        }
    }

    // Public methods for external use
    isOptimizationComplete() {
        return this.isLoaded;
    }

    forceLoadScript(scriptUrl, priority = 'high') {
        return this.loadScript(scriptUrl, { priority });
    }

    getPageType() {
        return this.isProductPage ? 'product' : 'other';
    }

    // Method to manually trigger optimization restart (useful for SPA navigation)
    restartOptimization() {
        this.isLoaded = false;
        this.isProductPage = this.detectProductPage();
        this.currentPageUrl = window.location.href;
        this.startOptimization();
    }
}

// Register the custom element
customElements.define('wix-product-page-optimizer', WixProductPageOptimizer);

// Auto-initialize optimization
document.addEventListener('DOMContentLoaded', () => {
    const optimizer = document.querySelector('wix-product-page-optimizer');
    if (!optimizer) {
        // Auto-create if not present
        const element = document.createElement('wix-product-page-optimizer');
        document.body.appendChild(element);
    }
});

// Handle SPA navigation for dynamic product pages
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        const optimizer = document.querySelector('wix-product-page-optimizer');
        if (optimizer && optimizer.restartOptimization) {
            console.log('🔄 Page navigation detected, restarting optimization...');
            setTimeout(() => optimizer.restartOptimization(), 500);
        }
    }
}).observe(document, { subtree: true, childList: true });

// Export for external use
window.WixProductPageOptimizer = WixProductPageOptimizer;

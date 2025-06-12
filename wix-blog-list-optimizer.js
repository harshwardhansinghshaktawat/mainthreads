class WixBlogListOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.criticalScripts = [];
        
        // Scripts that are causing execution time issues - load with optimization
        this.deferredScripts = [
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js',
            'https://static.parastorage.com/unpkg/requirejs-bolt@2.3.6/requirejs.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/consentPolicy.c82a047f.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js'
        ];
        
        // Core Wix scripts - load first but optimized
        this.mainScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js'
        ];
        
        // Unused/Optional scripts - load only when needed or remove entirely
        this.optionalScripts = [
            'https://static.parastorage.com/services/communities-blog-ooi/1.2764.0/BlogViewerWidgetNoCss.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/group_6.9a28cbeb.chunk.min.js',
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js'
        ];
        
        // Dynamic blog URL detection
        this.blogUrl = this.detectBlogUrl();
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initPerformanceOptimization();
    }

    detectBlogUrl() {
        // Dynamically detect the blog URL pattern
        const currentUrl = window.location.href;
        const blogPattern = /^(https?:\/\/[^/]+\/[^/]*\/?blog)/i;
        const match = currentUrl.match(blogPattern);
        return match ? match[1] : null;
    }

    initPerformanceOptimization() {
        // Preload critical resources first
        this.preloadResources();
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startOptimization());
        } else {
            this.startOptimization();
        }
    }

    startOptimization() {
        // Remove existing scripts that match our URLs to prevent double loading
        this.removeExistingScripts();
        
        // Remove or defer unused scripts to reduce main-thread work
        this.handleUnusedScripts();
        
        // Load critical scripts first with high priority and chunking
        this.loadCriticalScriptsChunked().then(() => {
            // Use requestIdleCallback for non-critical scripts
            this.scheduleNonCriticalLoading();
        });
    }

    removeExistingScripts() {
        const allScripts = [...this.deferredScripts, ...this.mainScripts, ...this.optionalScripts];
        const existingScripts = document.querySelectorAll('script[src]');
        
        existingScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && allScripts.some(url => src.includes(url.split('/').pop()))) {
                // Mark for removal but don't remove immediately to avoid breaking dependencies
                script.setAttribute('data-blog-optimized', 'true');
            }
        });
    }

    handleUnusedScripts() {
        // Remove or defer scripts that are marked as unused
        const existingScripts = document.querySelectorAll('script[src]');
        
        existingScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && this.optionalScripts.some(url => src.includes(url.split('/').pop()))) {
                // Defer loading of unused scripts
                script.setAttribute('data-defer-load', 'true');
                script.remove();
            }
        });
    }

    async loadCriticalScriptsChunked() {
        // Load main Wix scripts in chunks to reduce main-thread blocking
        for (let i = 0; i < this.mainScripts.length; i++) {
            const scriptUrl = this.mainScripts[i];
            await this.loadScript(scriptUrl, { 
                priority: 'high', 
                defer: false,
                chunk: true 
            });
            
            // Small delay between critical scripts to prevent blocking
            if (i < this.mainScripts.length - 1) {
                await this.delay(50);
            }
        }
    }

    scheduleNonCriticalLoading() {
        // Use requestIdleCallback for better performance with longer timeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadNonCriticalScripts(), { timeout: 3000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this.loadNonCriticalScripts(), 800);
        }
    }

    async loadNonCriticalScripts() {
        // Load React first as other scripts might depend on it
        const reactScripts = this.deferredScripts.filter(url => url.includes('react'));
        const otherScripts = this.deferredScripts.filter(url => !url.includes('react'));

        // Load React with small delays to prevent blocking
        for (const scriptUrl of reactScripts) {
            await this.loadScript(scriptUrl, { 
                priority: 'low', 
                defer: true,
                chunk: true 
            });
            await this.delay(100);
        }

        // Load remaining scripts in smaller batches to reduce main-thread work
        const batchSize = 2;
        for (let i = 0; i < otherScripts.length; i += batchSize) {
            const batch = otherScripts.slice(i, i + batchSize);
            const loadPromises = batch.map(scriptUrl => 
                this.loadScript(scriptUrl, { 
                    priority: 'low', 
                    defer: true, 
                    async: true 
                })
            );

            await Promise.allSettled(loadPromises);
            
            // Small delay between batches
            if (i + batchSize < otherScripts.length) {
                await this.delay(200);
            }
        }

        // Load optional scripts only if needed
        this.loadOptionalScriptsOnDemand();
        
        this.onOptimizationComplete();
    }

    loadOptionalScriptsOnDemand() {
        // Load optional scripts only when certain elements are present
        requestIdleCallback(() => {
            // Check if blog viewer elements exist
            const blogElements = document.querySelectorAll('[data-blog-viewer], .blog-viewer, [class*="blog"]');
            if (blogElements.length > 0) {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('BlogViewerWidget')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }

            // Check if forms exist
            const formElements = document.querySelectorAll('form, [data-form], [class*="form"]');
            if (formElements.length > 0) {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('form-app')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }
        }, { timeout: 5000 });
    }

    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector(`script[src*="${src.split('/').pop()}"]`);
            if (existingScript && !existingScript.hasAttribute('data-blog-optimized')) {
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

            // Add loading strategy for chunked loading
            if (options.chunk) {
                script.setAttribute('data-chunk-load', 'true');
            }

            script.onload = () => {
                console.log(`✅ Blog List Optimized loading: ${src.split('/').pop()}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.warn(`⚠️ Blog List - Failed to load: ${src.split('/').pop()}`, error);
                resolve(); // Continue even if one script fails
            };

            // Append to head for better caching
            document.head.appendChild(script);
        });
    }

    preloadResources() {
        // Preload critical resources with high priority
        this.mainScripts.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = src;
            link.as = 'script';
            link.crossOrigin = 'anonymous';
            link.setAttribute('fetchpriority', 'high');
            document.head.appendChild(link);
        });

        // DNS prefetch for parastorage domain
        const prefetch = document.createElement('link');
        prefetch.rel = 'dns-prefetch';
        prefetch.href = '//static.parastorage.com';
        document.head.appendChild(prefetch);

        // Preconnect for faster connections
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://static.parastorage.com';
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onOptimizationComplete() {
        this.isLoaded = true;
        
        // Dispatch custom event for other scripts to listen
        const event = new CustomEvent('wix-blog-list-optimization-complete', {
            detail: { 
                optimizedScripts: [...this.mainScripts, ...this.deferredScripts],
                blogUrl: this.blogUrl,
                loadTime: performance.now(),
                mainThreadReduction: true
            }
        });
        document.dispatchEvent(event);

        // Clean up old scripts marked for optimization
        setTimeout(() => {
            const oldScripts = document.querySelectorAll('script[data-blog-optimized="true"]');
            oldScripts.forEach(script => script.remove());
        }, 3000);

        // Performance monitoring
        this.logPerformanceMetrics();

        console.log('🚀 Wix Blog List Performance Optimization Complete');
    }

    logPerformanceMetrics() {
        // Log performance improvements
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                console.log('📊 Blog List Performance Metrics:', {
                    domContentLoaded: Math.round(navigation.domContentLoadedEventEnd),
                    loadComplete: Math.round(navigation.loadEventEnd),
                    mainThreadOptimization: 'Enabled'
                });
            }
        }
    }

    // Public method to check if optimization is complete
    isOptimizationComplete() {
        return this.isLoaded;
    }

    // Method to manually trigger script loading if needed
    forceLoadScript(scriptUrl) {
        return this.loadScript(scriptUrl, { priority: 'high' });
    }

    // Method to load optional scripts manually
    loadOptionalScript(scriptType) {
        const scriptMap = {
            'blog-viewer': this.optionalScripts.find(s => s.includes('BlogViewerWidget')),
            'forms': this.optionalScripts.find(s => s.includes('form-app')),
            'group-6': this.optionalScripts.find(s => s.includes('group_6'))
        };

        if (scriptMap[scriptType]) {
            return this.loadScript(scriptMap[scriptType], { priority: 'low', defer: true });
        }
    }

    // Get the detected blog URL
    getBlogUrl() {
        return this.blogUrl;
    }
}

// Register the custom element
customElements.define('wix-blog-list-optimizer', WixBlogListOptimizer);

// Auto-initialize if element exists or create one
document.addEventListener('DOMContentLoaded', () => {
    const optimizer = document.querySelector('wix-blog-list-optimizer');
    if (!optimizer) {
        // Auto-create if not present and we're on a blog list page
        const isBlogListPage = window.location.href.includes('/blog') && 
                              !window.location.pathname.includes('/post/');
        
        if (isBlogListPage) {
            const element = document.createElement('wix-blog-list-optimizer');
            document.body.appendChild(element);
        }
    }
});

// Export for external use
window.WixBlogListOptimizer = WixBlogListOptimizer;

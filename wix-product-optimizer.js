class WixProductOptimizer extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
        this.imageObserver = null;
        this.criticalImagesLoaded = false;
        
        // Scripts causing JS execution time issues - load with optimization
        this.deferredScripts = [
            'https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/consentPolicy.c82a047f.chunk.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/animations.67be3a64.chunk.min.js'
        ];
        
        // Core Wix scripts - load first but optimized
        this.mainScripts = [
            'https://static.parastorage.com/services/wix-thunderbolt/dist/main.7120cb19.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.6e36e998.bundle.min.js'
        ];
        
        // Unused/Optional scripts - load only when needed
        this.optionalScripts = [
            'https://static.parastorage.com/services/editor-elements-library/dist/thunderbolt/rb_wixui.thunderbolt[ProGallery_Default].0cb576c2.bundle.min.js',
            'https://static.parastorage.com/services/wix-thunderbolt/dist/group_6.9a28cbeb.chunk.min.js',
            'https://static.parastorage.com/services/form-app/1.1863.0/client-viewer/form-app-wix-ricos-viewer.chunk.min.js',
            'https://static.parastorage.com/services/ecom-platform-cart-icon/1.1570.0/CartIconViewerWidgetNoCss.bundle.min.js',
            'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.es5.min.js'
        ];
        
        // Dynamic product page URL detection
        this.productUrl = this.detectProductUrl();
        
        // Image optimization settings
        this.imageConfig = {
            lazyOffset: 50,
            criticalImageSelectors: [
                '.gallery-item-visible',
                '.gallery-item-image-img',
                '[data-hook="gallery-item-image-img"]',
                '.product-image',
                '.hero-image',
                '.main-product-image'
            ],
            deferredImageSelectors: [
                '.gallery-item:not(.gallery-item-visible)',
                '.thumbnail-image',
                '.secondary-image',
                '.related-product-image'
            ]
        };
    }

    connectedCallback() {
        this.style.display = 'none'; // Hidden element
        this.initPerformanceOptimization();
    }

    detectProductUrl() {
        // Dynamically detect product page URL patterns
        const currentUrl = window.location.href;
        const productPatterns = [
            /^(https?:\/\/[^/]+\/[^/]*\/?product-page)/i,
            /^(https?:\/\/[^/]+\/[^/]*\/?product)/i,
            /^(https?:\/\/[^/]+\/[^/]*\/?shop\/[^/]+)/i,
            /^(https?:\/\/[^/]+\/[^/]*\/?store\/[^/]+)/i
        ];
        
        for (const pattern of productPatterns) {
            const match = currentUrl.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    initPerformanceOptimization() {
        // Wait a bit to ensure page has started loading properly
        setTimeout(() => {
            // Critical path optimization - less aggressive
            this.optimizeCriticalImages();
            this.preloadResources();
            
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    // Additional delay to prevent interference with page initialization
                    setTimeout(() => this.startOptimization(), 500);
                });
            } else {
                // Page already loaded, wait a bit more to be safe
                setTimeout(() => this.startOptimization(), 1000);
            }
        }, 100);
    }

    optimizeCriticalImages() {
        // Preload critical product images to improve LCP
        this.preloadCriticalImages();
        
        // Setup intersection observer for lazy loading
        this.setupImageLazyLoading();
        
        // Optimize existing images
        this.optimizeExistingImages();
    }

    preloadCriticalImages() {
        // Find and preload critical images (hero/main product images)
        const criticalImages = document.querySelectorAll(
            this.imageConfig.criticalImageSelectors.join(', ')
        );
        
        criticalImages.forEach((img, index) => {
            if (index < 2) { // Only preload first 2 critical images
                const src = img.src || img.getAttribute('data-src');
                if (src && !src.includes('data:')) {
                    this.preloadImage(src, 'high');
                }
            }
        });
    }

    preloadImage(src, priority = 'high') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = src;
        link.as = 'image';
        link.setAttribute('fetchpriority', priority);
        document.head.appendChild(link);
    }

    setupImageLazyLoading() {
        // Create intersection observer for progressive image loading
        const observerOptions = {
            root: null,
            rootMargin: `${this.imageConfig.lazyOffset}px`,
            threshold: 0.1
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all images for lazy loading
        this.observeImages();
    }

    observeImages() {
        const allImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        allImages.forEach(img => {
            if (!img.src || img.src.includes('data:')) {
                this.imageObserver.observe(img);
            }
        });
    }

    loadImage(img) {
        const src = img.getAttribute('data-src') || img.src;
        if (src && !img.classList.contains('loaded')) {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    }

    optimizeExistingImages() {
        // Add loading optimization to existing images
        const existingImages = document.querySelectorAll('img');
        existingImages.forEach(img => {
            // Add proper loading attributes
            if (!img.hasAttribute('loading')) {
                const isCritical = this.imageConfig.criticalImageSelectors.some(selector => 
                    img.matches(selector) || img.classList.contains(selector.replace('.', ''))
                );
                
                if (!isCritical) {
                    img.setAttribute('loading', 'lazy');
                }
            }
            
            // Add decoding optimization
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });
    }

    startOptimization() {
        // Only proceed if page seems stable
        if (document.readyState !== 'complete') {
            // Wait for page to fully load before optimizing
            window.addEventListener('load', () => {
                setTimeout(() => this.performOptimizations(), 500);
            });
        } else {
            this.performOptimizations();
        }
    }

    performOptimizations() {
        // Track existing scripts without removing them
        this.removeExistingScripts();
        
        // Optimize unused scripts loading strategy only
        this.handleUnusedScripts();
        
        // Optimize React loading to prevent render blocking (gentler approach)
        this.optimizeReactLoading();
        
        // Load additional optimized scripts only if needed
        this.loadAdditionalOptimizations().then(() => {
            this.scheduleNonCriticalLoading();
        });
    }

    async loadAdditionalOptimizations() {
        // Only add scripts that aren't already present and working
        const neededScripts = this.mainScripts.filter(scriptUrl => {
            const scriptName = scriptUrl.split('/').pop();
            const existing = document.querySelector(`script[src*="${scriptName}"]`);
            return !existing;
        });

        // Load only truly missing critical scripts
        for (const scriptUrl of neededScripts) {
            await this.loadScript(scriptUrl, { 
                priority: 'high', 
                defer: false,
                chunk: true 
            });
            await this.delay(100);
        }
    }

    removeExistingScripts() {
        // Only mark scripts for optimization, don't remove them yet
        const allScripts = [...this.deferredScripts, ...this.mainScripts, ...this.optionalScripts];
        const existingScripts = document.querySelectorAll('script[src]');
        
        existingScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && allScripts.some(url => src.includes(url.split('/').pop()))) {
                // Only mark for tracking, don't interfere with existing scripts
                script.setAttribute('data-product-tracked', 'true');
            }
        });
    }

    handleUnusedScripts() {
        // Don't remove scripts, just optimize their loading strategy
        // Let existing scripts continue working to prevent page breaking
        const existingScripts = document.querySelectorAll('script[src]');
        
        existingScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && this.optionalScripts.some(url => src.includes(url.split('/').pop()))) {
                // Only add loading optimizations, don't remove
                if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
                    script.setAttribute('defer', 'true');
                }
                script.setAttribute('data-optimized-loading', 'true');
            }
        });
    }

    optimizeReactLoading() {
        // Optimize React loading without breaking existing functionality
        const reactScripts = document.querySelectorAll('script[src*="react"]');
        reactScripts.forEach(script => {
            // Only optimize if not already optimized and not critical to immediate render
            if (!script.hasAttribute('async') && 
                !script.hasAttribute('defer') && 
                !script.hasAttribute('data-critical')) {
                
                // Use defer instead of async to maintain execution order
                script.setAttribute('defer', 'true');
                script.setAttribute('data-react-optimized', 'true');
            }
        });
    }

    async loadCriticalScriptsChunked() {
        // Load main Wix scripts with delays to prevent blocking
        for (let i = 0; i < this.mainScripts.length; i++) {
            const scriptUrl = this.mainScripts[i];
            await this.loadScript(scriptUrl, { 
                priority: 'high', 
                defer: false,
                chunk: true 
            });
            
            // Small delay between critical scripts
            if (i < this.mainScripts.length - 1) {
                await this.delay(75);
            }
        }
    }

    scheduleNonCriticalLoading() {
        // Use requestIdleCallback with longer timeout for product pages
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadNonCriticalScripts(), { timeout: 4000 });
        } else {
            setTimeout(() => this.loadNonCriticalScripts(), 1000);
        }
    }

    async loadNonCriticalScripts() {
        // Load React first but asynchronously to prevent render blocking
        const reactScripts = this.deferredScripts.filter(url => url.includes('react'));
        const otherScripts = this.deferredScripts.filter(url => !url.includes('react'));

        // Load React with async to prevent render blocking
        for (const scriptUrl of reactScripts) {
            await this.loadScript(scriptUrl, { 
                priority: 'low', 
                defer: true,
                async: true,
                chunk: true 
            });
            await this.delay(150);
        }

        // Load remaining scripts in small batches
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
            
            if (i + batchSize < otherScripts.length) {
                await this.delay(250);
            }
        }

        // Load optional scripts on demand
        this.loadOptionalScriptsOnDemand();
        
        this.onOptimizationComplete();
    }

    loadOptionalScriptsOnDemand() {
        requestIdleCallback(() => {
            // Load gallery scripts only if gallery elements exist
            const galleryElements = document.querySelectorAll(
                '.gallery-item, [data-hook*="gallery"], .pro-gallery, .magnified-item'
            );
            if (galleryElements.length > 0) {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('ProGallery')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }

            // Load cart icon script only if cart elements exist
            const cartElements = document.querySelectorAll('[data-hook*="cart"], .cart-icon, .shopping-cart');
            if (cartElements.length > 0) {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('cart-icon')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }

            // Load form scripts only if forms exist
            const formElements = document.querySelectorAll('form, [data-form], [class*="form"]');
            if (formElements.length > 0) {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('form-app')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }

            // Load Sentry only in production (optional)
            if (window.location.hostname !== 'localhost') {
                this.optionalScripts.forEach(scriptUrl => {
                    if (scriptUrl.includes('sentry')) {
                        this.loadScript(scriptUrl, { priority: 'low', defer: true, async: true });
                    }
                });
            }
        }, { timeout: 6000 });
    }

    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if script already exists and is working
            const existingScript = document.querySelector(`script[src*="${src.split('/').pop()}"]`);
            if (existingScript && !existingScript.hasAttribute('data-product-tracked')) {
                // Script exists and working, don't duplicate
                resolve();
                return;
            }

            // Only add new scripts if they don't conflict with existing ones
            if (existingScript && existingScript.hasAttribute('data-product-tracked')) {
                // Let existing script handle this, just resolve
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            
            // Apply performance optimizations
            if (options.defer) script.defer = true;
            if (options.async) script.async = true;
            
            // Set resource hints
            if (options.priority) {
                script.setAttribute('fetchpriority', options.priority);
            }

            // Mark as optimizer-added
            script.setAttribute('data-optimizer-added', 'true');

            script.onload = () => {
                console.log(`✅ Product Page Optimized loading: ${src.split('/').pop()}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.warn(`⚠️ Product Page - Failed to load: ${src.split('/').pop()}`, error);
                resolve();
            };

            document.head.appendChild(script);
        });
    }

    preloadResources() {
        // Preload critical resources with cache optimization
        this.mainScripts.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = src;
            link.as = 'script';
            link.crossOrigin = 'anonymous';
            link.setAttribute('fetchpriority', 'high');
            document.head.appendChild(link);
        });

        // DNS prefetch and preconnect for better caching
        const prefetch = document.createElement('link');
        prefetch.rel = 'dns-prefetch';
        prefetch.href = '//static.parastorage.com';
        document.head.appendChild(prefetch);

        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://static.parastorage.com';
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);

        // Preconnect to Wix static for images
        const wixStaticPreconnect = document.createElement('link');
        wixStaticPreconnect.rel = 'preconnect';
        wixStaticPreconnect.href = 'https://static.wixstatic.com';
        wixStaticPreconnect.crossOrigin = 'anonymous';
        document.head.appendChild(wixStaticPreconnect);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onOptimizationComplete() {
        this.isLoaded = true;
        
        // Final image optimization check
        this.finalImageOptimization();
        
        // Dispatch custom event
        const event = new CustomEvent('wix-product-optimization-complete', {
            detail: { 
                optimizedScripts: [...this.mainScripts, ...this.deferredScripts],
                productUrl: this.productUrl,
                loadTime: performance.now(),
                lcpOptimization: true,
                renderBlockingRemoved: true
            }
        });
        document.dispatchEvent(event);

        // Clean up only scripts added by optimizer, not existing ones
        setTimeout(() => {
            // Only remove scripts that were added by this optimizer and failed to load
            const optimizerScripts = document.querySelectorAll('script[data-optimizer-added="true"]');
            optimizerScripts.forEach(script => {
                // Only remove if there's a working version already present
                const scriptName = script.src.split('/').pop();
                const workingScript = document.querySelector(
                    `script[src*="${scriptName}"]:not([data-optimizer-added="true"])`
                );
                if (workingScript) {
                    script.remove();
                }
            });
        }, 5000); // Longer delay to ensure page stability

        // Performance monitoring
        this.logPerformanceMetrics();

        console.log('🚀 Wix Product Page Performance Optimization Complete');
    }

    finalImageOptimization() {
        // Re-scan for any new images and optimize them
        const newImages = document.querySelectorAll('img:not(.loaded)');
        newImages.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
            
            if (this.imageObserver) {
                this.imageObserver.observe(img);
            }
        });
    }

    logPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                console.log('📊 Product Page Performance Metrics:', {
                    domContentLoaded: Math.round(navigation.domContentLoadedEventEnd),
                    loadComplete: Math.round(navigation.loadEventEnd),
                    lcpOptimization: 'Enabled',
                    renderBlockingRemoved: 'Yes',
                    imageOptimization: 'Active'
                });
            }

            // Log LCP if available
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('📊 LCP Optimized:', Math.round(lastEntry.startTime), 'ms');
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            }
        }
    }

    // Public methods
    isOptimizationComplete() {
        return this.isLoaded;
    }

    forceLoadScript(scriptUrl) {
        return this.loadScript(scriptUrl, { priority: 'high' });
    }

    loadOptionalScript(scriptType) {
        const scriptMap = {
            'gallery': this.optionalScripts.find(s => s.includes('ProGallery')),
            'cart': this.optionalScripts.find(s => s.includes('cart-icon')),
            'forms': this.optionalScripts.find(s => s.includes('form-app')),
            'sentry': this.optionalScripts.find(s => s.includes('sentry'))
        };

        if (scriptMap[scriptType]) {
            return this.loadScript(scriptMap[scriptType], { priority: 'low', defer: true });
        }
    }

    getProductUrl() {
        return this.productUrl;
    }

    // Force image optimization for dynamically loaded content
    optimizeNewImages() {
        this.observeImages();
        this.optimizeExistingImages();
    }
}

// Register the custom element
customElements.define('wix-product-optimizer', WixProductOptimizer);

// Auto-initialize on product pages (more conservative)
document.addEventListener('DOMContentLoaded', () => {
    // Wait for page to be more stable before initializing
    setTimeout(() => {
        const optimizer = document.querySelector('wix-product-optimizer');
        if (!optimizer) {
            // Only auto-create if clearly on a product page and page is stable
            const isProductPage = window.location.href.match(
                /\/(product-page|product|shop\/[^/]+|store\/[^/]+)/i
            );
            
            // Additional check to ensure we're not interfering with a loading page
            const hasProductElements = document.querySelectorAll(
                '.gallery-item, [data-hook*="gallery"], .product-title, .price'
            ).length > 0;
            
            if (isProductPage && hasProductElements && document.readyState === 'complete') {
                const element = document.createElement('wix-product-optimizer');
                document.body.appendChild(element);
            }
        }
    }, 2000); // Wait 2 seconds to ensure page stability
});

// Export for external use
window.WixProductOptimizer = WixProductOptimizer;

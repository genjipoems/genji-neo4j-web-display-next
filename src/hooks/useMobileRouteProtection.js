'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const MOBILE_ALLOWED_ROUTES = [
    '/',
    '/mobile-search',
    '/about-this-site',
    '/login'
];

export const useMobileRouteProtection = () => {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if device is mobile or tablet (including large tablets like iPad Pro)
        const isMobile = () => {
            if (typeof window === 'undefined') return false;
            return window.innerWidth <= 1194;
        };

        // Check if current route is allowed on mobile
        const isRouteAllowed = (path) => {
            return MOBILE_ALLOWED_ROUTES.some(route => {
                if (route === '/') return path === route;
                return path.startsWith(route);
            });
        };

        // Redirect if on mobile and route is not allowed
        if (isMobile() && !isRouteAllowed(pathname)) {
            router.push('/');
        }

        // Add resize listener to handle orientation changes
        const handleResize = () => {
            if (isMobile() && !isRouteAllowed(pathname)) {
                router.push('/');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pathname, router]);
};

export default useMobileRouteProtection;

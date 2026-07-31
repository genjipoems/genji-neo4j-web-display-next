'use client';

import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/Navigation.module.css';
import MoreDropDown from './MoreDropDown.prod';
import AboutDropDown from './AboutDropDown.prod';
import { SignIn } from './auth/signin-button.prod';
import NotificationIcon from './NotificationIcon.prod';
import { useSession } from 'next-auth/react';
import LogoSVG from '../../public/images/genji_logo.svg';

const Navigation = () => {
    const [graph, setGraph] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        const fetchCharacterData = async () => {
            try {
                const response = await fetch('/api/character_names');
                const graphData = await response.json();
                setGraph(graphData);
            } catch (error) {
                console.error('Error fetching character data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCharacterData();
    }, []);

    const isActive = (path) => {
        if (path === '/') {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    return (
        <div className={styles.navFrame}>
            <div className={styles.navContainer}>
                {/* Logo and Title */}
                <div className={styles.logoContainer}>
                    <Link href="/" className={styles.logoLink}>
                        <div className={styles.logo}>
                            <LogoSVG width={240} height={80} />
                        </div>
                    </Link>
                </div>
                
                {/* Navigation Links */}
                <div className={styles.navLinksWrapper}>
                    <nav className={styles.navLinks}>
                        {/* Poem Search */}
                        <Link 
                            href="/search" 
                            className={isActive('/search') ? styles.active : ''}
                        >
                            poem search
                        </Link>
                        
                        {/* Characters Dropdown */}
                        <Link 
                            href="/characters" 
                            className={isActive('/characters') ? styles.active : ''}
                        >
                            characters
                        </Link>
                        
                        {/* Chapters Dropdown */}
                        <Link 
                            href="/chapters" 
                            className={isActive('/chapters') ? styles.active : ''}
                        >
                            chapters
                        </Link>
                        {/* Poem Location Map */}
                        <Link 
                            href="/poem-map" 
                            className={isActive('/poem-map') ? styles.active : ''}
                        >
                            poem map
                        </Link>

                        {/* More Dropdown */}
                        <MoreDropDown />
                        
                        {/* About Dropdown */}
                        <AboutDropDown />

                    </nav>

                    <div className={styles.userControls}>
                        {session && <NotificationIcon />}
                        <SignIn />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navigation;
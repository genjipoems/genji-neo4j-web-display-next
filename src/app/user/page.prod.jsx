'use client'
import UserInfo from '../../components/userpage/UserInfo.prod';
import FavList from "../../components//userpage/UserFavPoemList.prod";
import UserView from "../../components/userpage/UserView.prod";
import Notification from '../../components/userpage/UserNotificationLog.prod';
import ReviewNotification from '../../components/userpage/AdminReviewNotification.prod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../../styles/pages/userPage.module.css';

// user page
const Page = () => {
  const [activeTab, setActiveTab] = useState('info');
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  if (!session) {
    return null;
  }

  return (
    <div>
      
      <section className={styles.frame}>
        <div className={styles.Container}>
          <h1 className={styles.title}>User Page</h1>
        </div>
      </section>
    
      <div className={styles.pageContainer}>
        <div className={styles.sidebar}>
          <div className={styles.userBrief}>
          {/* show avatar */}
          {session.user.image ? (
            <img 
              src={session.user.image}
              alt="User avatar"
              className={styles.userAvatar}
            />
          ) : (
            <div className={styles.defaultAvatar}>
              {/* defaul avatar */}
              {session.user.name?.[0] || '?'}
            </div>
          )}
            <h2>{session.user.name || session.user.email}</h2>
          </div>
          
          <nav className={styles.navigation}>
            <button 
              className={`${styles.navButton} ${activeTab === 'info' ? styles.active : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <span className={styles.icon}>🎈</span>
              Profile Information
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'favorites' ? styles.active : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <span className={styles.icon}>⭐</span>
              Favorite Poems
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'notification' ? styles.active : ''}`}
              onClick={() => setActiveTab('notification')}
            >
              <span className={styles.icon}>🔔</span>
              Activity Notifications
            </button>

            {session?.user?.role === "admin" && 
              <button 
                className={`${styles.navButton} ${activeTab === 'users' ? styles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <span className={styles.icon}>👤</span>
                Users
              </button>
            }

            {session?.user?.role === "admin" && 
              <button 
                className={`${styles.navButton} ${activeTab === 'Review Notification' ? styles.active : ''}`}
                onClick={() => setActiveTab('Review Notification')}
              >
                <span className={styles.icon}>✅</span>
                Review Notification
              </button>
            }   
          </nav>
        </div>

        <main className={styles.mainContent}>
          <div className={styles.contentCard}>
            {activeTab === 'info' && <UserInfo />}
            {activeTab === 'favorites' && <FavList />}
            {activeTab === 'users' && <UserView />}
            {activeTab === 'notification' && <Notification />}
            {activeTab === 'Review Notification' && <ReviewNotification />}
          </div>
        </main>
      </div>
    </div>
    
  );
};

export default Page;
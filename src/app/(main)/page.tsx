'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight, Facebook, Instagram, Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './uffda.module.css';

const BRAND_LOGO = '/brand/uff-da-logo.png';

const featuredItems = [
  { name: 'Tot Chopper', description: 'Crispy. Savory. Addictive.' },
  { name: 'Uff-Da Smash', description: 'Bold, stacked, and made to satisfy.' },
  { name: 'Nordic Tacos', description: 'A Midwest twist, built for the road.' },
];

const navItems = [
  ['Home', 'home'], ['Our Story', 'story'], ['Menu', 'menu'], ['Find Us', 'find-us'], ['Gallery', 'gallery'],
] as const;

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.siteShell}>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <button className={styles.brandButton} onClick={() => goTo('home')} aria-label="UFF-DA home">
          <Image src={BRAND_LOGO} alt="UFF-DA Minnesota" width={1000} height={577} priority className={styles.navLogo} />
        </button>
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)} className={styles.navLink}>{label}</button>)}
        </nav>
        <div className={styles.socialNav}>
          <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
          <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
        </div>
        <button className={styles.mobileToggle} onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        {mobileOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            {navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)}>{label}</button>)}
            <div className={styles.mobileSocials}>
              <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <div className={styles.heroCopy}>
            <Image src={BRAND_LOGO} alt="UFF-DA Minnesota, established 2024" width={1000} height={577} priority className={styles.heroLogo} />
            <p className={styles.heroLead}>Good food. Midwest soul.</p>
            <p className={styles.heroSub}>Bold flavors inspired by where we&apos;re from and the people we feed.</p>
            <button className={styles.primaryCta} onClick={() => goTo('find-us')}>Find us <ArrowRight size={17} strokeWidth={1.8} /></button>
          </div>
          <div className={styles.heroMedia} aria-label="UFF-DA food truck visual">
            <div className={styles.truckMark} aria-hidden="true">UFF-DA<span>MINNESOTA</span></div>
          </div>
        </section>

        <section id="story" className={styles.storySection}>
          <div className={styles.storyCopy}>
            <div className={styles.eyebrow}><span>✣</span> Our story</div>
            <h2>A little expression.<br />A lot of heart.</h2>
            <div className={styles.redRule} />
            <p>“Uff-da” is more than a saying—it&apos;s a familiar Midwest reaction for the moments that deserve a little extra emphasis.</p>
            <p>We&apos;re building that same spirit into the food: welcoming, unfussy, memorable, and made for the people gathered around it.</p>
            <button className={styles.outlineCta} onClick={() => goTo('gallery')}>See the vibe <ArrowRight size={16} /></button>
          </div>
          <div className={styles.storyMedia} aria-label="UFF-DA brand photography placeholder" />
        </section>

        <section id="menu" className={styles.menuSection}>
          <div className={styles.menuIntro}>
            <div className={styles.eyebrowDark}><span>✣</span> The menu</div>
            <h2>Bold. Fresh.<br />Midwest made.</h2>
            <div className={styles.redRule} />
            <p>We keep it simple: quality ingredients, made with care, and packed with flavor.</p>
            <a className={styles.primaryCta} href="#menu-grid" onClick={(event) => { event.preventDefault(); document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>View menu <ArrowRight size={17} /></a>
          </div>
          <div id="menu-grid" className={styles.menuGrid}>
            {featuredItems.map((item) => (
              <article className={styles.menuCard} key={item.name}>
                <div className={styles.menuImageWrap} aria-hidden="true" />
                <h3>{item.name}</h3><p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="gallery" className={styles.galleryBand}>
          <div className={styles.galleryMedia} aria-label="UFF-DA gallery photography placeholder" />
          <div id="find-us" className={styles.findPanel}>
            <div className={styles.eyebrowDark}><span>✣</span> Find UFF-DA</div>
            <h2>Always on the move.</h2>
            <div className={styles.redRule} />
            <p>You can&apos;t always find us in the same place—but that&apos;s half the fun.</p>
            <p>Follow along to see where we&apos;ll be next, what&apos;s cooking, and what&apos;s happening around the truck.</p>
            <div className={styles.socialButtons}>
              <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" className={styles.facebookButton}><Facebook size={18} /> Facebook</a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <button onClick={() => goTo('home')} className={styles.footerBrand} aria-label="Back to top">
          <Image src={BRAND_LOGO} alt="UFF-DA Minnesota" width={1000} height={577} className={styles.navLogo} />
        </button>
        <nav aria-label="Footer navigation" className={styles.footerNav}>{navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)}>{label}</button>)}</nav>
        <div className={styles.footerMeta}>© {new Date().getFullYear()} UFF-DA<br />Minnesota</div>
      </footer>
    </div>
  );
}

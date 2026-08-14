'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Facebook, Instagram, Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './uffda.module.css';

// The landing page is exported to /docs and served from /foodtruck/ on GitHub Pages.
// Relative public-asset URLs remain valid both in the static Pages build and local dev.
const asset = (path: string) => path.replace(/^\//, '');

const navItems = [
  ['Home', 'home'],
  ['Our Story', 'story'],
  ['Menu', 'menu'],
  ['Find Us', 'find-us'],
  ['Gallery', 'gallery'],
] as const;

function BurgerIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 29h44M13 25c1-10 9-16 19-16s18 6 19 16H13Z"/><path d="M12 34h40l-5 7H17l-5-7Zm3 12h34l-4 8H19l-4-8Z"/><path d="M20 18h.5M31.5 14h.5M43 18h.5"/></svg>;
}

function WingIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M50 11c-7 1-14 6-19 13-4 5-6 11-6 16-5 1-10 4-13 8 5 4 12 5 19 2 8-3 15-10 19-18 4-8 4-16 0-21Z"/><path d="M25 40c7-1 14-6 19-13M19 45c6 1 12-1 17-5M32 34c-1-4 0-8 3-12"/></svg>;
}

function FriesIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 25h30l-4 31H21l-4-31Z"/><path d="M21 25 19 8M28 25 27 5M35 25l1-19M42 25l3-16M18 33h28"/></svg>;
}

function MinnesotaIcon() {
  return (
    <img
      src={asset('/brand/mn-outline.png')}
      alt=""
      aria-hidden="true"
      style={{
        width: '60px',
        height: '60px',
        objectFit: 'contain',
        display: 'block',
        filter: 'invert(1) sepia(1) saturate(8000%) hue-rotate(344deg) brightness(.92) contrast(1.08)',
      }}
    />
  );
}

const features = [
  { title: 'Smash Burgers', copy: 'Crispy edges, juicy centers, stacked with flavor.', Icon: BurgerIcon },
  { title: 'Wings Done Right', copy: 'Dry-rubbed or sauced. Bold flavor in every bite.', Icon: WingIcon },
  { title: 'Fries', copy: 'Hot, crispy fries served as the perfect side.', Icon: FriesIcon },
  { title: 'Midwest Proud', copy: 'Local at heart. Serving Minnesota with pride.', Icon: MinnesotaIcon },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
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
          <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" className={styles.navLogo} />
        </button>
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {navItems.map(([label, id], index) => <button key={id} onClick={() => goTo(id)} className={`${styles.navLink} ${index === 0 ? styles.activeNav : ''}`}>{label}</button>)}
        </nav>
        <div className={styles.socialNav}>
          <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={22} /></a>
          <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={20} /></a>
        </div>
        <button className={styles.mobileToggle} onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={26} /> : <Menu size={26} />}</button>
        {mobileOpen && <nav className={styles.mobileNav} aria-label="Mobile navigation">{navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)}>{label}</button>)}</nav>}
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <img src={asset('/brand/hero-uffda-food.webp')} alt="UFF-DA smash burger, fries, wings, and food truck" className={styles.heroImage} />
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" className={styles.heroLogo} />
            <h1>Good Food.<br />Midwest Soul.</h1>
            <div className={styles.redRule} />
            <p>Smash burgers, bold wings, and crispy fries<br className={styles.desktopBreak} /> made with real ingredients and big flavor.</p>
            <button className={styles.primaryCta} onClick={() => goTo('menu')}>View Menu <ArrowRight size={19} strokeWidth={1.8} /></button>
          </div>
        </section>

        <section className={styles.featureStrip} aria-label="UFF-DA specialties">
          {features.map(({ title, copy, Icon }) => <article className={styles.featureItem} key={title}><div className={styles.featureIcon}><Icon /></div><div><h2>{title}</h2><p>{copy}</p></div></article>)}
        </section>

        <section id="story" className={styles.storySection}>
          <div className={styles.sectionKicker}>Our Story</div><h2>Built around the food people actually crave.</h2><p>UFF-DA is a Minnesota food truck centered on hard-seared smash burgers, wings with serious dry-rub and sauce options, and hot, crispy fries. Straightforward food, strong flavor, and a Midwest point of view.</p>
        </section>

        <section id="menu" className={styles.menuSection}>
          <div className={styles.sectionHeading}><span>The Menu</span><h2>Three things. Done right.</h2></div>
          <div className={styles.menuGrid}>
            <article><span>01</span><h3>Smash Burgers</h3><p>Thin patties smashed hard on the griddle for lacey, caramelized edges and a juicy center. Built with melty cheese, pickles, onion, and craveable house sauces.</p></article>
            <article><span>02</span><h3>Wings</h3><p>A rotating mix of dry rubs and sauces, from savory and smoky to sweet, tangy, and hot. Crisp outside, juicy inside, tossed fresh.</p></article>
            <article><span>03</span><h3>Fries</h3><p>Hot, crispy fries served as a simple, craveable side that pairs with the burgers and wings.</p></article>
          </div>
        </section>

        <section id="gallery" className={styles.gallerySection}>
          <div className={styles.galleryCopy}><span>UFF-DA</span><h2>Big flavor. No filler.</h2><p>The visual language stays focused on the food: seared beef, glossy wings, crisp fries, and the red-black-white identity that makes the truck recognizable from across the lot.</p></div>
          <div className={styles.galleryImage}><img src={asset('/brand/hero-uffda-food.webp')} alt="UFF-DA food lineup" /></div>
        </section>

        <section id="find-us" className={styles.findSection}>
          <div><span>Find UFF-DA</span><h2>Follow the truck.</h2><p>Locations and service times move. Follow UFF-DA on social for the current stop, specials, wing flavors, and what is coming off the griddle.</p></div>
          <div className={styles.socialButtons}><a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={19} /> Instagram</a><a href={siteConfig.social.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a></div>
        </section>
      </main>

      <footer className={styles.footer}><img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" /><div>Smash Burgers · Wings · Fries</div><div>© {new Date().getFullYear()} UFF-DA</div></footer>
    </div>
  );
}

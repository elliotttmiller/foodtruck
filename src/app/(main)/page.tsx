'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Facebook, Instagram, Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './uffda.module.css';

const asset = (path: string) => path.replace(/^\//, '');

const navItems = [
  ['Home', 'home'],
  ['Our Story', 'story'],
  ['Menu', 'menu'],
  ['Find Us', 'find-us'],
] as const;

function BurgerIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 29h44M13 25c1-10 9-16 19-16s18 6 19 16H13Z"/><path d="M12 34h40l-5 7H17l-5-7Zm3 12h34l-4 8H19l-4-8Z"/><path d="M20 18h.5M31.5 14h.5M43 18h.5"/></svg>;
}

function WingIcon() {
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true">
      <path d="M8 42c7-3 11-10 15-18 4-9 10-15 18-17 7-2 12 1 13 7 1 6-2 14-7 20-6 7-14 11-23 13-7 2-13 1-16-5Z" />
      <path d="M42 19c6-6 13-9 20-8 6 1 10 5 9 11-1 7-6 13-12 18-7 5-14 8-22 7" />
      <path d="M50 43c6-2 10-7 14-13 5-8 11-13 18-12 6 1 9 5 7 11-2 7-8 13-14 18-7 5-14 7-20 5-3-1-5-4-5-9Z" />
      <path d="M15 39c6-2 11-7 15-14M24 43c7-3 13-8 17-15M48 18c5 1 10 4 13 8M55 38c6-3 11-8 15-14M63 46c7-3 13-8 17-15" />
      <path d="M8 42c2 3 6 4 10 3M50 43c2 3 5 5 9 5" />
    </svg>
  );
}

function FriesIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 25h30l-4 31H21l-4-31Z"/><path d="M21 25 19 8M28 25 27 5M35 25l1-19M42 25l3-16M18 33h28"/></svg>;
}

function MinnesotaIcon() {
  return <img src={asset('/brand/mn-outline.svg')} alt="" aria-hidden="true" className={styles.mnIcon} />;
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

        <section id="find-us" className={styles.findSection}>
          <div><span>Find UFF-DA</span><h2>Follow the truck.</h2><p>Locations and service times move. Follow UFF-DA on social for the current stop, specials, wing flavors, and what is coming off the griddle.</p></div>
          <div className={styles.socialButtons}><a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={19} /> Instagram</a><a href={siteConfig.social.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a></div>
        </section>
      </main>

      <footer className={styles.footer}><img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" /><div>Smash Burgers · Wings · Fries</div><div>© {new Date().getFullYear()} UFF-DA</div></footer>
    </div>
  );
}

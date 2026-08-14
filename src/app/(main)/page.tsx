'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Facebook, Instagram, Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './uffda.module.css';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';
const asset = (path: string) => `${BASE_PATH}${path}`;

const navItems = [
  ['Home', 'home'],
  ['Our Story', 'story'],
  ['Menu', 'menu'],
  ['Find Us', 'find-us'],
  ['Gallery', 'gallery'],
] as const;

function BurgerIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 27h40M14 24c2-10 10-15 18-15s16 5 18 15H14Zm-2 8h40M14 40h36l-4 8H18l-4-8Zm2 12h32"/><path d="M20 18h1M31 15h1M43 19h1"/></svg>;
}

function WingIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M48 12c-6 2-11 8-14 15-7 2-13 8-17 15-2 4-2 8 1 10 4 4 14 0 22-8 8-8 13-18 13-25 0-3-2-6-5-7Z"/><path d="M18 49c7 1 16-3 22-10"/></svg>;
}

function FriesIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 21h28l-3 35H21l-3-35Z"/><path d="M22 21 20 8M28 21 28 5M35 21l1-14M42 21l2-12M18 30h28"/></svg>;
}

function MinnesotaIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 7h19l-1 7 5 4-4 6 6 7-9 5-3 9-7 2-4 10-5-9 2-8-4-7 4-8-2-8 3-10Z"/></svg>;
}

const features = [
  { title: 'Smash Burgers', copy: 'Crispy edges, juicy centers, stacked with flavor.', Icon: BurgerIcon },
  { title: 'Wings Done Right', copy: 'Dry-rubbed or sauced. Bold flavor in every bite.', Icon: WingIcon },
  { title: 'Loaded Fries', copy: 'Crispy fries with craveable toppings and sauces.', Icon: FriesIcon },
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
          {navItems.map(([label, id], index) => (
            <button key={id} onClick={() => goTo(id)} className={`${styles.navLink} ${index === 0 ? styles.activeNav : ''}`}>
              {label}
            </button>
          ))}
        </nav>

        <div className={styles.socialNav}>
          <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={22} /></a>
          <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={20} /></a>
        </div>

        <button className={styles.mobileToggle} onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {mobileOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            {navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)}>{label}</button>)}
          </nav>
        )}
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <img src={asset('/brand/hero-uffda-food.webp')} alt="UFF-DA smash burger, fries, wings, and food truck" className={styles.heroImage} />
          <div className={styles.heroShade} />

          <div className={styles.heroContent}>
            <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" className={styles.heroLogo} />
            <h1>Good Food.<br />Midwest Soul.</h1>
            <div className={styles.redRule} />
            <p>Smash burgers, bold wings, and loaded fries<br className={styles.desktopBreak} /> made with real ingredients and big flavor.</p>
            <button className={styles.primaryCta} onClick={() => goTo('menu')}>
              View Menu <ArrowRight size={19} strokeWidth={1.8} />
            </button>
          </div>
        </section>

        <section className={styles.featureStrip} aria-label="UFF-DA specialties">
          {features.map(({ title, copy, Icon }) => (
            <article className={styles.featureItem} key={title}>
              <div className={styles.featureIcon}><Icon /></div>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="story" className={styles.storySection}>
          <div className={styles.sectionKicker}>Our Story</div>
          <h2>Built around the food people actually crave.</h2>
          <p>UFF-DA is a Minnesota food truck centered on hard-seared smash burgers, wings with serious dry-rub and sauce options, and hot, crispy fries. Straightforward food, strong flavor, and a Midwest point of view.</p>
        </section>

        <section id="menu" className={styles.menuSection}>
          <div className={styles.sectionHeading}><span>The Menu</span><h2>Three things. Done right.</h2></div>
          <div className={styles.menuGrid}>
            <article><span>01</span><h3>Smash Burgers</h3><p>Thin patties smashed hard on the griddle for lacey, caramelized edges and a juicy center. Built with melty cheese, pickles, onion, and craveable house sauces.</p></article>
            <article><span>02</span><h3>Wings</h3><p>A rotating mix of dry rubs and sauces, from savory and smoky to sweet, tangy, and hot. Crisp outside, juicy inside, tossed fresh.</p></article>
            <article><span>03</span><h3>Fries</h3><p>Hot, crispy fries served straight or loaded with sauces and toppings designed to stand beside the burgers and wings—not disappear behind them.</p></article>
          </div>
        </section>

        <section id="gallery" className={styles.gallerySection}>
          <div className={styles.galleryCopy}>
            <span>UFF-DA</span>
            <h2>Big flavor. No filler.</h2>
            <p>The visual language stays focused on the food: seared beef, glossy wings, crisp fries, and the red-black-white identity that makes the truck recognizable from across the lot.</p>
          </div>
          <div className={styles.galleryImage}><img src={asset('/brand/hero-uffda-food.webp')} alt="UFF-DA food lineup" /></div>
        </section>

        <section id="find-us" className={styles.findSection}>
          <div>
            <span>Find UFF-DA</span>
            <h2>Follow the truck.</h2>
            <p>Locations and service times move. Follow UFF-DA on social for the current stop, specials, wing flavors, and what is coming off the griddle.</p>
          </div>
          <div className={styles.socialButtons}>
            <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={19} /> Instagram</a>
            <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" />
        <div>Smash Burgers · Wings · Fries</div>
        <div>© {new Date().getFullYear()} UFF-DA</div>
      </footer>
    </div>
  );
}

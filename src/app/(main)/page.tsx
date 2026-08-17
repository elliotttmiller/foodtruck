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
  return <img src={asset('/brand/burger-outline.svg')} alt="" aria-hidden="true" />;
}

function WingIcon() {
  return <img src={asset('/brand/wings-outline.svg')} alt="" aria-hidden="true" />;
}

function FriesIcon() {
  return <img src={asset('/brand/fries-outline.svg')} alt="" aria-hidden="true" />;
}

function MinnesotaIcon() { return <img src={asset('/brand/mn-outline.svg')} alt="" aria-hidden="true" className={styles.mnIcon} />; }

const features = [
  { title: 'Smash Burgers', copy: 'Crispy edges, juicy centers, stacked with flavor.', Icon: BurgerIcon },
  { title: 'Wings Done Right', copy: 'Handcrafted, one-of-a-kind dry rubs and bold sauces. Flavor that’s unmistakably UFF-DA.', Icon: WingIcon },
  { title: 'Fries', copy: 'Hot, crispy fries served as the perfect side.', Icon: FriesIcon },
  { title: 'Midwest Proud', copy: 'Local at heart. Serving Minnesota with pride.', Icon: MinnesotaIcon },
];

const menuItems = [
  { title: 'Smash Burgers', copy: 'Thin patties smashed hard on the griddle for lacey, caramelized edges and a juicy center. Built with melty cheese, pickles, onion, and craveable house sauces.', image: '/brand/menu-smash-burger.webp', crop: styles.menuBurger, alt: 'UFF-DA smash burger with melted cheese, pickles, onion, and house sauce' },
  { title: 'Wings', copy: 'Built around our handcrafted, one-of-a-kind dry rubs—original seasoning blends developed in-house to bring flavors you won’t find just anywhere. Or go sauced, with bold options from savory and smoky to sweet, tangy, and hot. Crisp outside, juicy inside, and packed with UFF-DA flavor.', image: '/brand/menu-wings.webp', crop: styles.menuWings, alt: 'UFF-DA sauced chicken wings' },
  { title: 'Fries', copy: 'Hot, crispy fries served as a simple, craveable side that pairs with the burgers and wings.', image: '/brand/menu-fries.webp', crop: styles.menuFries, alt: 'UFF-DA hot crispy fries' },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 16); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  const goTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className={styles.siteShell}>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <button className={styles.brandButton} onClick={() => goTo('home')} aria-label="UFF-DA home"><img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" className={styles.navLogo} /></button>
        <nav className={styles.desktopNav} aria-label="Primary navigation">{navItems.map(([label, id], index) => <button key={id} onClick={() => goTo(id)} className={`${styles.navLink} ${index === 0 ? styles.activeNav : ''}`}>{label}</button>)}</nav>
        <div className={styles.socialNav}><a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={22} /></a><a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={20} /></a></div>
        <button className={styles.mobileToggle} onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={26} /> : <Menu size={26} />}</button>
        {mobileOpen && <nav className={styles.mobileNav} aria-label="Mobile navigation">{navItems.map(([label, id]) => <button key={id} onClick={() => goTo(id)}>{label}</button>)}</nav>}
      </header>
      <main>
        <section id="home" className={styles.hero}>
          <picture>
            <source media="(max-width: 820px)" srcSet={asset('/brand/hero-uffda-food-mobile.webp')} />
            <img src={asset('/brand/hero-uffda-food.webp')} alt="UFF-DA smash burger, fries, wings, and food truck" className={styles.heroImage} />
          </picture>
          <div className={styles.heroShade} />
          <div className={styles.heroContent}><h1>Good Food.<br />Midwest Soul.</h1><div className={styles.redRule} /><p>Smash burgers, bold wings, and crispy fries<br className={styles.desktopBreak} /> made with real ingredients and big flavor.</p><button className={styles.primaryCta} onClick={() => goTo('menu')}>View Menu <ArrowRight size={19} strokeWidth={1.8} /></button></div>
        </section>
        <section className={styles.featureStrip} aria-label="UFF-DA specialties">{features.map(({ title, copy, Icon }) => <article className={styles.featureItem} key={title}><div className={styles.featureIcon}><Icon /></div><div><h2>{title}</h2><p>{copy}</p></div></article>)}</section>

        <section id="story" className={styles.storySection}>
          <div className={styles.storyInner}>
            <div className={styles.storyHeader}>
              <div className={styles.storyTitleBlock}>
                <div className={styles.sectionKicker}>Our Story</div>
                <h2>Good food.<br />Done right.</h2>
              </div>
              <div className={styles.storyLead}>
                <p>UFF-DA started with a simple idea: take the food people already love and give them something they can’t get everywhere else. We’re always experimenting, creating our own flavor combinations, sauces, seasonings, and twists that bring something different to the table.</p>
                <p>Our one-of-a-kind dry rubs are a big part of that—developed in-house by pushing beyond the usual seasonings and building bold, original flavor combinations you won’t find anywhere else. Some flavors are familiar, others are unexpected—but everything we make is built to stand on its own and taste unmistakably UFF-DA.</p>
              </div>
            </div>

            <div className={styles.storyDivider} />

            <div className={styles.storyDetails}>
              <article className={styles.storyDetail}>
                <span>What we make</span>
                <p>Our menu is built around hard-seared smash burgers with crispy edges and juicy centers, bold wings tossed in sauce or coated in our signature dry rubs, and hot, crispy fries made to go with just about everything.</p>
              </article>
              <article className={styles.storyDetail}>
                <span>Why it matters</span>
                <p>For us, good food is about more than what’s on the menu. It’s about serving something you’re genuinely excited to hand across the counter—fresh, satisfying food made with the same attention we’d expect if we were the ones ordering it.</p>
              </article>
              <article className={styles.storyDetail}>
                <span>The UFF-DA standard</span>
                <p>Every item is about taking something familiar and making it worth coming back for. Keep it straightforward, do it well, and serve seriously good food with flavors you won’t find just anywhere.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="menu" className={styles.menuSection}>
          <div className={styles.sectionHeading}><span>The Menu</span><h2>Three things. Done right.</h2></div>
          <div className={styles.menuGrid}>{menuItems.map(item => <article key={item.title}><div className={styles.menuPhoto}><img src={asset(item.image)} alt={item.alt} className={item.crop} loading="lazy" /></div><div className={styles.menuCopy}><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}</div>
        </section>
        <section id="find-us" className={styles.findSection}><div><span>Find UFF-DA</span><h2>Follow the truck.</h2><p>Locations and service times move. Follow UFF-DA on social for the current stop, specials, wing flavors, and what is coming off the griddle.</p></div><div className={styles.socialButtons}><a href={siteConfig.social.instagram} target="_blank" rel="noreferrer"><Instagram size={19} /> Instagram</a><a href={siteConfig.social.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a></div></section>
      </main>
      <footer className={styles.footer}><img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Minnesota" /><div>Smash Burgers · Wings · Fries</div><div>© {new Date().getFullYear()} UFF-DA</div></footer>
    </div>
  );
}

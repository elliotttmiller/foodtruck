'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Facebook, Instagram, Mail, MapPin, Menu, Phone, Users, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './booking.module.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';
const asset = (path: string) => `${basePath}/${path.replace(/^\//, '')}`;

const eventTypes = ['Private Party', 'Corporate Event', 'Wedding', 'Community Event', 'School / Sports Event', 'Festival', 'Other'];

export default function BookUsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || '').trim();
    const subject = `UFF-DA booking inquiry — ${value('eventType') || 'Event'} — ${value('eventDate') || 'Date TBD'}`;
    const body = [
      'New UFF-DA booking inquiry',
      '',
      `Name: ${value('name')}`,
      `Email: ${value('email')}`,
      `Phone: ${value('phone')}`,
      `Event type: ${value('eventType')}`,
      `Event date: ${value('eventDate')}`,
      `Preferred service time: ${value('serviceTime') || 'TBD'}`,
      `Estimated guests: ${value('guestCount')}`,
      `Venue / city: ${value('location')}`,
      '',
      'Event details:',
      value('details') || 'No additional details provided.',
    ].join('\n');

    setSubmitted(true);
    window.location.href = `mailto:${siteConfig.emailContact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="UFF-DA Eats home">
          <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Eats" />
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href="/#story">Our Story</Link>
          <Link href="/#find-us">Find Us</Link>
          <Link href="/book-us" className={styles.active}>Book Us</Link>
        </nav>
        <div className={styles.socialNav}>
          <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={23} /></a>
          <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={20} /></a>
        </div>
        <button className={styles.mobileToggle} onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        {mobileOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/#story" onClick={() => setMobileOpen(false)}>Our Story</Link>
            <Link href="/#find-us" onClick={() => setMobileOpen(false)}>Find Us</Link>
            <Link href="/book-us" onClick={() => setMobileOpen(false)} className={styles.active}>Book Us</Link>
          </nav>
        )}
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.kicker}>Bring UFF-DA to your event</div>
            <h1>Book the truck.</h1>
            <p>Planning a private party, company event, wedding, festival, or community gathering? Tell us what you have in mind and we’ll follow up with availability and next steps.</p>
            <div className={styles.heroMeta}>
              <span><MapPin size={17} /> Serving Minnesota</span>
              <span><CalendarDays size={17} /> Dates subject to availability</span>
            </div>
          </div>
        </section>

        <section className={styles.bookingSection}>
          <div className={styles.bookingGrid}>
            <aside className={styles.infoPanel}>
              <div className={styles.infoKicker}>Booking inquiries</div>
              <h2>Tell us about your event.</h2>
              <p className={styles.infoIntro}>A few details up front help us understand your event, estimate service needs, and respond with the right information.</p>

              <div className={styles.steps}>
                <div><span>01</span><div><strong>Send the details</strong><p>Share your date, guest count, location, and event type.</p></div></div>
                <div><span>02</span><div><strong>We review availability</strong><p>We’ll look at the schedule and the service requirements for your event.</p></div></div>
                <div><span>03</span><div><strong>We follow up</strong><p>We’ll contact you to confirm fit, details, and next steps.</p></div></div>
              </div>

              <div className={styles.contactCard}>
                <span>Prefer to reach out directly?</span>
                <a href={`tel:${siteConfig.phoneE164}`}><Phone size={17} /> {siteConfig.phoneDisplay}</a>
                <a href={`mailto:${siteConfig.emailContact}`}><Mail size={17} /> {siteConfig.emailContact}</a>
              </div>
            </aside>

            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <span>Event inquiry</span>
                <h2>Request a booking</h2>
                <p>This is an inquiry, not a confirmed reservation. We’ll follow up after reviewing your event details.</p>
              </div>

              <form onSubmit={submitInquiry} className={styles.form}>
                <div className={styles.twoCol}>
                  <label>Full name<input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>
                  <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
                </div>

                <div className={styles.twoCol}>
                  <label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="(555) 555-5555" required /></label>
                  <label>Event type<select name="eventType" defaultValue="" required><option value="" disabled>Select event type</option>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                </div>

                <div className={styles.threeCol}>
                  <label>Event date<input name="eventDate" type="date" required /></label>
                  <label>Service time<input name="serviceTime" type="text" placeholder="e.g. 5–8 PM" /></label>
                  <label>Estimated guests<div className={styles.inputIcon}><Users size={17} /><input name="guestCount" type="number" min="1" inputMode="numeric" placeholder="100" required /></div></label>
                </div>

                <label>Event location<input name="location" type="text" placeholder="Venue name, city, or address" required /></label>
                <label>Tell us about the event<textarea name="details" rows={6} placeholder="Anything helpful to know—event schedule, venue setup, audience, service expectations, or other details." /></label>

                <div className={styles.submitRow}>
                  <button type="submit">Send booking inquiry <ArrowRight size={19} /></button>
                  <span><CheckCircle2 size={17} /> No commitment until details are confirmed.</span>
                </div>
                {submitted && <p className={styles.status} role="status">Your email app should open with the inquiry details ready to send.</p>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <img src={asset('/brand/uff-da-logo-white.webp')} alt="UFF-DA Eats" />
        <div>Smash Burgers · Wings · Fries</div>
        <div>© {new Date().getFullYear()} UFF-DA Eats</div>
      </footer>
    </div>
  );
}

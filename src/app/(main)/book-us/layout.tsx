import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book UFF-DA | Food Truck Booking Inquiry',
  description: 'Request UFF-DA for your Minnesota event. Send booking details for private parties, corporate events, weddings, festivals, community events, and more.',
};

export default function BookUsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

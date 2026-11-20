import type { Metadata } from 'next';
import { TaieContact } from '@/components/taie-contact';
export const metadata: Metadata = {
  title: 'Chat | Tamil AI Image Editor',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function ContactPage() {
  return <TaieContact />;
}

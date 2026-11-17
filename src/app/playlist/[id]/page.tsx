import PlaylistClient from '@/components/PlaylistClient';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function PlaylistPage() {
  return <PlaylistClient />;
}

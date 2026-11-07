export type FleetCar = {
  slug: string;
  name: string;
  price: string;
  model: string;
  people: string;
  bags: string;
  tag: string;
  image: string;
  alt: string;
  width: number;
  height: number;
};

export const fleet: FleetCar[] = [
  {
    slug: 'premium-van',
    name: 'Premium Van',
    price: 'Mulai dari €200',
    model: 'Mercedes V-Class or similar',
    people: '7 orang',
    bags: '5 koper',
    tag: 'Favorit keluarga',
    image: '/mobil/premium-van.webp',
    alt: 'Premium Van Mercedes V-Class hitam',
    width: 480,
    height: 279,
  },
  {
    slug: 'vip-van',
    name: 'VIP Van',
    price: 'Mulai dari €250',
    model: 'Mercedes Sprinter or similar',
    people: '8 orang',
    bags: '10 koper',
    tag: 'Favorit keluarga + oleh-oleh',
    image: '/mobil/vip-van.webp',
    alt: 'VIP Van Mercedes Sprinter hitam',
    width: 480,
    height: 320,
  },
  {
    slug: 'economy-van',
    name: 'Economy Van',
    price: 'Mulai dari €175',
    model: 'Nissan Combi Primastar or similar',
    people: '8 orang',
    bags: '6 koper',
    tag: 'Favorit grup',
    image: '/mobil/economy-van.webp',
    alt: 'Economy Van Nissan Primastar',
    width: 480,
    height: 270,
  },
  {
    slug: 'big-van',
    name: 'Big Van',
    price: 'Mulai dari €450',
    model: 'Mercedes Sprinter 16s',
    people: '16 orang',
    bags: '6 koper',
    tag: 'Favorit keluarga besar',
    image: '/mobil/big-van.webp',
    alt: 'Big Van Mercedes Sprinter 16 kursi',
    width: 480,
    height: 360,
  },
  {
    slug: 'compact-suv',
    name: 'Compact Suv',
    price: 'Mulai dari €150',
    model: 'Lexus NX300H / Peugeot 5008',
    people: '3 orang',
    bags: '3 koper',
    tag: 'Favorit untuk pasangan / keluarga',
    image: '/mobil/compact-suv.webp',
    alt: 'Compact SUV Lexus NX300H',
    width: 480,
    height: 264,
  },
  {
    slug: 'luxury-sedan',
    name: 'Luxury Sedan',
    price: 'Mulai dari €250',
    model: 'Mercedes S-Class or similar',
    people: '3 orang',
    bags: '3 koper',
    tag: 'Favorit Executive',
    image: '/mobil/luxury-sedan.webp',
    alt: 'Luxury Sedan Mercedes S-Class',
    width: 480,
    height: 320,
  },
];

export const airports = [
  { id: 'CDG', label: 'CDG — Charles de Gaulle' },
  { id: 'Orly', label: 'Orly' },
  { id: 'Beauvais', label: 'Beauvais' },
] as const;

export function mobilByValue(value: string) {
  const needle = value.trim().toLowerCase();
  return fleet.find((car) => car.slug === needle || car.name.toLowerCase() === needle) ?? null;
}

export function airportByValue(value: string) {
  const needle = value.trim().toLowerCase();
  return airports.find((airport) => airport.id.toLowerCase() === needle) ?? null;
}

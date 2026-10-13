/** Authored unit inputs with already-resolved URLs, independent of DOM and the website catalogue. */
export const createGalleryContent = () => [1, 2, 3].map((number) => ({
  title: `Place ${number}`,
  era: `Era ${number}`,
  description: `Description ${number}`,
  source: `https://example.org/source/${number}`,
  tour: number === 2 ? "https://example.org/AutoMovie/manor/?view=exterior" : null,
  images: [
    { src: `https://example.org/AutoMovie/shots/place-${number}.png`, alt: `Place ${number}`, label: undefined as string | undefined },
    { src: `https://example.org/AutoMovie/shots/place-${number}-room-1.png`, alt: `Place ${number} room 1`, label: "Room 1" },
    { src: `https://example.org/AutoMovie/shots/place-${number}-room-2.png`, alt: `Place ${number} room 2`, label: "Room 2" },
  ],
}));

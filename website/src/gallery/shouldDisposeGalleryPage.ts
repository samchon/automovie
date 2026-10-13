/** A BFCache transition retains its gallery; an actual page departure releases it. */
export function shouldDisposeGalleryPage(persisted: boolean): boolean {
  return !persisted;
}

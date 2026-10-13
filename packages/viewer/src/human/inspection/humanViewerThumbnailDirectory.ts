/**
 * The directory name that holds every thumbnail of one display source
 * revision, the first sixteen hex digits of its digest.
 * The caller supplies the already established source revision; this helper
 * does not validate a path or choose which revision may be removed.
 */
export const humanViewerThumbnailDirectory = (revision: string): string =>
  revision.slice(0, 16);

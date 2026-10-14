/**
 * A persisted BFCache transition retains its gallery; an actual page departure requests release.
 *
 * @evidence contracts/common.md#principled-implementation PageTransitionEvent.persisted distinguishes a retained page from a departing one using the browser's lifecycle observation.
 * @evidence contracts/common.md#clear-and-simple-design The predicate leaves event binding and disposal effects with collection.ts while exposing the lifecycle decision to portable tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer, user-agent check or navigation-name exception replaces the native persisted flag.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes retention from a release request without certifying native cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Boolean negation costs constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each lifecycle observation is evaluated independently without cached page state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This decision owns no listener or gallery; the entry point performs the requested cleanup.
 */
export function shouldDisposeGalleryPage(persisted: boolean): boolean {
  return !persisted;
}

/**
 * Plain primary clicks enhance a link; modified or other clicks stay native.
 *
 * @evidence contracts/common.md#principled-implementation Native button and modifier observations determine whether the authored link can be intercepted, preserving standard modified-click navigation.
 * @evidence contracts/common.md#clear-and-simple-design One pure predicate supplies GalleryController.open while the native adapter owns preventDefault and dialog effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission uses the current event facts uniformly without changing browser methods or recognizing individual links.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes enhanced primary clicks from native modified or other-button behavior.
 * @evidence contracts/performance.md#efficient-algorithms Five scalar checks cost constant time and storage regardless of collection size.
 * @evidence contracts/performance.md#reuse-equivalent-work Each event is inspected independently; event effects are not cached or shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No event or DOM node is retained after the predicate returns.
 */
export function acceptGalleryClick(input: {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    input.button === 0 &&
    !input.ctrlKey &&
    !input.metaKey &&
    !input.shiftKey &&
    !input.altKey
  );
}

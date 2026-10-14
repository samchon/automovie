/**
 * Unmodified left/right arrows navigate views; every other key retains native behavior.
 *
 * @evidence contracts/common.md#principled-implementation Arrow identity and native modifier facts map to a signed unit direction, with zero leaving the event unintercepted.
 * @evidence contracts/common.md#clear-and-simple-design The predicate chooses direction only; GalleryController owns wraparound and the host owns event interception.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No key is remapped for a particular building, test or browser method replacement.
 * @evidence contracts/common.md#meaningful-documentation The comment describes the accepted key pair and preserved native behavior for all other input.
 * @evidence contracts/performance.md#efficient-algorithms A fixed set of scalar comparisons costs constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current key facts are read once without retaining or replaying event decisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No listener or input object survives this pure call.
 */
export function galleryKeyDirection(input: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): -1 | 0 | 1 {
  if (input.key !== "ArrowLeft" && input.key !== "ArrowRight") return 0;
  if (input.ctrlKey || input.metaKey || input.altKey || input.shiftKey)
    return 0;
  return input.key === "ArrowRight" ? 1 : -1;
}

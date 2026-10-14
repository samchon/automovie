/**
 * Append to each rendered measured row the named reasons its channel's reach ends early (`connectedBodyReach`), and that a target past the reach is refused by name.
 *
 * @evidence contracts/common.md#principled-implementation Each limitation is attached only to its channel's existing measured note, with the metadata id escaped as a CSS identifier so punctuation cannot change selector meaning.
 * @evidence contracts/common.md#clear-and-simple-design This DOM annotation consumes the reach owner's limitation map without recalculating source domains or editing the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent measured rows remain absent rather than gaining fabricated controls, and named limitations are copied from actual shared reach results.
 * @evidence contracts/common.md#meaningful-documentation The comment states per-channel note placement and the named refusal consequence of exceeding evaluable reach.
 * @evidence contracts/performance.md#efficient-algorithms For k limited channels the helper performs k DOM selector searches over r rendered nodes and joins n limitation characters, with worst-case O(kr+n) time and transient selector and joined-text storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Annotation is a DOM publication effect used after control redraw, with no numerical task cache or retained lookup index.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The helper acquires no listener or external resource; appended text belongs to the parent-owned row until replacement.
 */
export function annotateConnectedBodyReach(
  container: HTMLElement,
  limits: ReadonlyMap<string, readonly string[]>,
): void {
  for (const [channel, notes] of limits) {
    const note: HTMLElement | null = container.querySelector<HTMLElement>(
      `#${CSS.escape("body-scale-" + channel)}`,
    );
    if (note !== null)
      note.textContent +=
        " " + notes.join(" ") + " A target past this reach is refused by name.";
  }
}

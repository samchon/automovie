/**
 * Append to each rendered measured row the named reasons its channel's reach
 * ends early (`connectedBodyReach`), and that a target past the reach
 * is refused by name.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Tells the user where a measured channel's reach ends and that a target past it is refused by name.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Appends the named reach limits to each measured row the editor screen shows.
 * @author Samchon
 */
export function annotateConnectedBodyReach(
  container: HTMLElement,
  limits: ReadonlyMap<string, readonly string[]>,
): void {
  for (const [channel, notes] of limits) {
    const note = container.querySelector<HTMLElement>(
      `[id="body-scale-${channel}"]`,
    );
    if (note !== null)
      note.textContent +=
        " " + notes.join(" ") + " A target past this reach is refused by name.";
  }
}

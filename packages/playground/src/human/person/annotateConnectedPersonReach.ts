/**
 * Append to each rendered measured row the named reasons its channel's reach
 * ends early (`connectedPersonBodyReach`), and that a target past the reach
 * is refused by name.
 *
 * @author Samchon
 */
export function annotateConnectedPersonReach(
  container: HTMLElement,
  limits: ReadonlyMap<string, readonly string[]>,
): void {
  for (const [channel, notes] of limits) {
    const note = container.querySelector<HTMLElement>(`[id="body-scale-${channel}"]`);
    if (note !== null)
      note.textContent += " " + notes.join(" ") + " A target past this reach is refused by name.";
  }
}

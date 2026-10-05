import type { IConnectedPersonBodyReach } from "../person/IConnectedPersonBodyReach";

/**
 * Show, beside the measured controls, what the body view cannot evaluate.
 *
 * A channel whose reach ends early at an unavailable envelope corrective gets
 * that named reason appended to its row note, and a channel whose own
 * endpoint is unavailable is listed as a disabled input naming the missing
 * source target. Nothing is hidden: the reach comes from
 * `connectedPersonBodyReach`, the one owner of that judgement, and a request
 * past it is refused by name by the inverse or the runtime.
 *
 * @author Samchon
 */
export function renderBodyReachNotes(
  dom: Document,
  container: HTMLElement,
  reach: IConnectedPersonBodyReach,
  query: string,
): void {
  for (const [channel, notes] of reach.limits) {
    const note = container.querySelector<HTMLElement>(`[id="body-scale-${channel}"]`);
    if (note !== null)
      note.textContent += " " + notes.join(" ") + " A target past this reach is refused by name.";
  }
  const unavailable = new Set(reach.basis.unavailableTargets ?? []);
  const listed = reach.missing.filter((channel) => channel.id.toLowerCase().includes(query));
  if (listed.length === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Unavailable on this generation (${listed.length})`;
  group.append(summary);
  for (const channel of listed) {
    const row = dom.createElement("div");
    const label = dom.createElement("label");
    const input = dom.createElement("input");
    const reason = dom.createElement("small");
    row.className = "row";
    label.textContent = channel.id.replace(/([a-z])([A-Z])/gu, "$1 $2");
    input.type = "number";
    input.disabled = true;
    input.setAttribute("aria-label", label.textContent + " (unavailable)");
    reason.textContent = [channel.positive, channel.negative]
      .filter((target) => target !== null && unavailable.has(target))
      .map((target) => `The source target ${target} is unavailable on this generation.`)
      .join(" ");
    row.append(label, input, reason);
    group.append(row);
  }
  container.append(group);
}

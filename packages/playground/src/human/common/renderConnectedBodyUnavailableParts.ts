import type { IAutoMovieHumanBodyGeneratedAnatomy } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body's named anatomical parts that this body does not generate, as disabled rows grouped by their reason, under one collapsed group.
 *
 * The parts come from the generated-anatomy report (`assembleHumanBodyGeneratedAnatomy`), which lists every `AutoMovieHumanBodyPartId` once with each region owner's answer, so the editor keeps no second list of bones and muscles. A part that resolved is not listed here. Only parts whose id matches the search are listed, and nothing is appended when none match. Each row names the part and the reason code its region owner gave, such as `missing-bone-landmark` for a humerus the source registers no landmarks for.
 *
 * @evidence contracts/common.md#principled-implementation Only generated-anatomy entries with unavailable status and matching ids are grouped by their supplied reason code; resolved parts do not receive gap rows.
 * @evidence contracts/common.md#clear-and-simple-design The region report remains authoritative for anatomy inventory, this renderer groups its visible gaps, and the shared disabled-row producer supplies presentation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second hand-kept anatomy catalogue fabricates missing parts, and unavailable report entries remain named rather than being portrayed as resolved geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment names report provenance, reason grouping, excluded resolved parts, search filtering and empty-result behavior.
 * @evidence contracts/performance.md#efficient-algorithms One p-part scan appends ids into reason lists in O(p) expected grouping time; a retained count avoids flattening those lists, and O(a) row DOM and grouped ids represent a matching unavailable parts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each redraw publishes its current report gaps without caching numerical anatomy or sharing mutable DOM groups.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Grouped ids and report references are temporary, returned DOM is parent-container-owned until replacement, and this renderer acquires no anatomy resources or listeners.
 */
export function renderConnectedBodyUnavailableParts(
  dom: Document,
  container: HTMLElement,
  anatomy: IAutoMovieHumanBodyGeneratedAnatomy,
  query: string,
): void {
  const byReason: Map<string, string[]> = new Map();
  let count: number = 0;
  for (const part of Object.values(anatomy.parts))
    if (
      part.status === "unavailable" &&
      part.id.toLowerCase().includes(query)
    ) {
      const ids: string[] = byReason.get(part.reason) ?? [];
      ids.push(part.id);
      byReason.set(part.reason, ids);
      ++count;
    }
  if (byReason.size === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Anatomical parts not generated (${count})`;
  group.append(summary);
  for (const [reason, ids] of byReason) {
    const inner: HTMLDetailsElement = dom.createElement("details");
    const title: HTMLElement = dom.createElement("summary");
    title.textContent = `${reason} (${ids.length})`;
    inner.append(title);
    for (const id of ids)
      inner.append(
        createConnectedDisabledRow(
          dom,
          id,
          `Not generated on this body: ${reason}.`,
        ),
      );
    group.append(inner);
  }
  container.append(group);
}

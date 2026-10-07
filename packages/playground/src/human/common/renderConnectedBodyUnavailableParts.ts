import type { IAutoMovieHumanBodyGeneratedAnatomy } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body's named anatomical parts that this body does not generate,
 * as disabled rows grouped by their reason, under one collapsed group.
 *
 * The parts come from the generated-anatomy report
 * (`assembleHumanBodyGeneratedAnatomy`), which lists every
 * `AutoMovieHumanBodyPartId` once with each region owner's answer, so the
 * editor keeps no second list of bones and muscles. A part that resolved is
 * not listed here. Only parts whose id matches the search are listed, and
 * nothing is appended when none match. Each row names the part and the
 * reason code its region owner gave, such as `missing-bone-landmark` for a
 * humerus the source registers no landmarks for.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows each anatomical part the body cannot generate, with its reason, instead of hiding it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Lists the unavailable parts from the generated-anatomy report as disabled rows grouped by reason.
 * @author Samchon
 */
export function renderConnectedBodyUnavailableParts(
  dom: Document,
  container: HTMLElement,
  anatomy: IAutoMovieHumanBodyGeneratedAnatomy,
  query: string,
): void {
  const byReason = new Map<string, string[]>();
  for (const part of Object.values(anatomy.parts))
    if (part.status === "unavailable" && part.id.toLowerCase().includes(query))
      byReason.set(part.reason, [
        ...(byReason.get(part.reason) ?? []),
        part.id,
      ]);
  if (byReason.size === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Anatomical parts not generated (${[...byReason.values()].flat().length})`;
  group.append(summary);
  for (const [reason, ids] of byReason) {
    const inner = dom.createElement("details");
    const title = dom.createElement("summary");
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

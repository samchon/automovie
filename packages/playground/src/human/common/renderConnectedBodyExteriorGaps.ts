import { HUMAN_BODY_EXTERIOR_GAPS } from "@automovie/human/body/anatomy/surface/HUMAN_BODY_EXTERIOR_GAPS";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the anatomical surface targets the body cannot answer yet
 * (`HUMAN_BODY_EXTERIOR_GAPS`), one disabled row per request path naming its
 * reason and the missing landmark, rule or tissue, under one collapsed group.
 * Only paths matching the search are listed; nothing is appended when none
 * match.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows each anatomical target the body cannot answer, with the dependency it lacks, instead of hiding it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Lists the unbound request paths as disabled rows naming their reason.
 * @author Samchon
 */
export function renderConnectedBodyExteriorGaps(dom: Document, container: HTMLElement, query: string): void {
  const listed = HUMAN_BODY_EXTERIOR_GAPS.filter((gap) => gap.path.toLowerCase().includes(query));
  if (listed.length === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Anatomical targets not answerable yet (${listed.length})`;
  group.append(summary);
  for (const gap of listed) group.append(createConnectedDisabledRow(dom, gap.path, `${gap.reason}: ${gap.detail}`));
  container.append(group);
}

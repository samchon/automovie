import { HUMAN_BODY_EXTERIOR_GAPS } from "@automovie/human/body/anatomy/surface/HUMAN_BODY_EXTERIOR_GAPS";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the anatomical surface targets the body cannot answer yet (`HUMAN_BODY_EXTERIOR_GAPS`), one disabled row per request path naming its reason and the missing landmark, rule or tissue, under one collapsed group. Only paths matching the search are listed; nothing is appended when none match.
 *
 * @evidence contracts/common.md#principled-implementation The Human surface-gap catalogue supplies request paths and exact reason/detail text, while case-normalized search selects which unavailable targets are shown.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue ownership stays with anatomy and the renderer groups shared disabled rows without implementing missing measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unanswerable targets remain disabled with their actual missing cause rather than receiving a guessed rule or tissue model.
 * @evidence contracts/common.md#meaningful-documentation The comment names gap provenance, per-path reason details, collapsed grouping and empty filtered output.
 * @evidence contracts/performance.md#efficient-algorithms Filtering g catalogue gaps scans their path text once per redraw and retains a matching references; constructing a disabled rows adds O(a) DOM and reason text output.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This renderer coordinates no numerical work or cross-redraw result cache; callers require separate DOM nodes for their container.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent owns appended group DOM until replacement or close, temporary filtered references end with the call, and no listener or external handle is acquired.
 */
export function renderConnectedBodyExteriorGaps(
  dom: Document,
  container: HTMLElement,
  query: string,
): void {
  const listed: (typeof HUMAN_BODY_EXTERIOR_GAPS)[number][] =
    HUMAN_BODY_EXTERIOR_GAPS.filter(
      (gap: (typeof HUMAN_BODY_EXTERIOR_GAPS)[number]): boolean =>
        gap.path.toLowerCase().includes(query),
    );
  if (listed.length === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Anatomical targets not answerable yet (${listed.length})`;
  group.append(summary);
  for (const gap of listed)
    group.append(
      createConnectedDisabledRow(dom, gap.path, `${gap.reason}: ${gap.detail}`),
    );
  container.append(group);
}

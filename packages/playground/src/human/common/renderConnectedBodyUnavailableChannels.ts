import type { IAutoMovieHumanBodyBasisChannel } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body channels the generation cannot evaluate, as disabled rows naming each missing source target, under a collapsed group. Only channels matching the search query are listed; nothing is appended when none match.
 *
 * @evidence contracts/common.md#principled-implementation Search filters actual missing-endpoint channels and each disabled row names only endpoints present in the source's unavailable set.
 * @evidence contracts/common.md#clear-and-simple-design This renderer owns the collapsed gap group while reach derivation owns missing channel classification and the shared row producer owns disabled presentation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source responses stay visible and uneditable rather than becoming guessed measurements or hidden controls.
 * @evidence contracts/common.md#meaningful-documentation The comment states source-target naming, search filtering, collapsed grouping and the empty-result no-op.
 * @evidence contracts/performance.md#efficient-algorithms Filtering m missing rows costs O(m) id inspections and retains a matching references; each matched channel checks at most two endpoints with set lookup and builds O(a) DOM rows.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Redraw creates independent gap DOM and coordinates no source mesh or numerical result reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Matched row nodes transfer to the parent container until replacement or close, while temporary filtered references acquire no external resources.
 */
export function renderConnectedBodyUnavailableChannels(
  dom: Document,
  container: HTMLElement,
  missing: readonly IAutoMovieHumanBodyBasisChannel[],
  unavailable: ReadonlySet<string>,
  query: string,
): void {
  const listed: IAutoMovieHumanBodyBasisChannel[] = missing.filter(
    (channel: IAutoMovieHumanBodyBasisChannel): boolean =>
      channel.id.toLowerCase().includes(query),
  );
  if (listed.length === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Unavailable on this generation (${listed.length})`;
  group.append(summary);
  for (const channel of listed)
    group.append(
      createConnectedDisabledRow(
        dom,
        channel.id,
        [channel.positive, channel.negative]
          .filter(
            (target: string | null): boolean =>
              target !== null && unavailable.has(target),
          )
          .map(
            (target: string | null): string =>
              `The source target ${target} is unavailable on this generation.`,
          )
          .join(" "),
      ),
    );
  container.append(group);
}

import type { IAutoMovieHumanPersonChannelAlias } from "@automovie/human";

import { createConnectedDisabledRow } from "../common/createConnectedDisabledRow";

/**
 * Append face channels defined through body channels as disabled rows naming their editable body owner, under a collapsed group. Nothing is appended when no aliases exist.
 *
 * @evidence contracts/common.md#principled-implementation Authored alias records select the explanatory rows; this adapter does not create a second face control for the same generation channel.
 * @evidence contracts/common.md#clear-and-simple-design A details group delegates row construction to the ordinary disabled-row helper and directs edits to the existing body section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rows describe supplied aliases without deriving anatomical equivalence or inventing missing channels.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies disabled aliases, body ownership and the empty-input effect.
 * @evidence contracts/performance.md#efficient-algorithms One pass creates O(a) rows and DOM storage for a aliases; each label includes only its supplied channel names.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rendering appends owned DOM once per caller render; reusing old nodes would require a replacement contract this helper does not own.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The container owns the group and a rows until replacement/removal; no workers, timers or requests are acquired. Repeated calls append more groups unless the caller clears its container.
 *
 * @author Samchon
 */
export function renderConnectedPersonAliasedChannels(
  dom: Document,
  container: HTMLElement,
  aliases: readonly IAutoMovieHumanPersonChannelAlias[],
): void {
  if (aliases.length === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Defined once by the body (${aliases.length})`;
  group.append(summary);
  for (const alias of aliases)
    group.append(
      createConnectedDisabledRow(
        dom,
        alias.face,
        `The person defines this once through the body channel ${alias.body}; edit it in the body section.`,
      ),
    );
  container.append(group);
}

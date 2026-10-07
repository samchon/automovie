import type { IAutoMovieHumanPersonChannelAlias } from "@automovie/human";

import { createConnectedDisabledRow } from "../common/createConnectedDisabledRow";

/**
 * Append the face channels the generation defines once through a body
 * channel, as disabled rows naming that body channel, under a collapsed group.
 * Nothing is appended when the generation has no alias.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Shows face channels the generation defines through a body channel as named, uneditable rows.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Appends each aliased face channel as a disabled row naming its body channel.
 * @author Samchon
 */
export function renderConnectedPersonAliasedChannels(
  dom: Document,
  container: HTMLElement,
  aliases: readonly IAutoMovieHumanPersonChannelAlias[],
): void {
  if (aliases.length === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
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

import type { IAutoMovieHumanPersonChannelAlias } from "@automovie/human";

import { createConnectedPersonDisabledRow } from "./createConnectedPersonDisabledRow";

/**
 * Append the face channels the generation defines once through a body
 * channel, as disabled rows naming that body channel, under a collapsed group.
 * Nothing is appended when the generation has no alias.
 *
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
      createConnectedPersonDisabledRow(
        dom,
        alias.face,
        `The person defines this once through the body channel ${alias.body}; edit it in the body section.`,
      ),
    );
  container.append(group);
}

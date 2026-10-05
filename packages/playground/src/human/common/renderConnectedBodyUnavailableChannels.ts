import type { IAutoMovieHumanBodyBasisChannel } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body channels the generation cannot evaluate, as disabled rows
 * naming each missing source target, under a collapsed group. Only channels
 * matching the search query are listed; nothing is appended when none match.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lists the body channels the generation cannot evaluate, naming each missing source target.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Appends the matching unavailable channels as disabled rows under a collapsed group.
 * @author Samchon
 */
export function renderConnectedBodyUnavailableChannels(
  dom: Document,
  container: HTMLElement,
  missing: readonly IAutoMovieHumanBodyBasisChannel[],
  unavailable: ReadonlySet<string>,
  query: string,
): void {
  const listed = missing.filter((channel) => channel.id.toLowerCase().includes(query));
  if (listed.length === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Unavailable on this generation (${listed.length})`;
  group.append(summary);
  for (const channel of listed)
    group.append(
      createConnectedDisabledRow(
        dom,
        channel.id,
        [channel.positive, channel.negative]
          .filter((target) => target !== null && unavailable.has(target))
          .map((target) => `The source target ${target} is unavailable on this generation.`)
          .join(" "),
      ),
    );
  container.append(group);
}

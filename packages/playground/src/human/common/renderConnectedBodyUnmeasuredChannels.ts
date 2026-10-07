import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import { humanBodyChannelReading } from "@automovie/human/body/measure/humanBodyChannelReading";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body view's source channels that no measurement names, as
 * disabled rows under one collapsed group.
 *
 * The body editor offers a channel only through a measurement: a rule of its
 * own in `HUMAN_BODY_MEASUREMENTS`, or a binding that solves an anatomical
 * target along it in `HUMAN_BODY_EXTERIOR_TARGETS`, as `humanBodyChannelReading`
 * answers. Every other channel is a
 * source response with no anatomical name, so it is listed, not hidden, and
 * not offered as a slider. The list is derived from the basis and the two
 * tables, so it shrinks as rules and bindings are added. Only channels
 * matching the search are listed; nothing is appended when none match.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows each source channel no measurement names instead of hiding it or offering it as a sculpt slider.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Lists the channels without a rule or binding as disabled rows derived from the basis and the two tables.
 * @author Samchon
 */
export function renderConnectedBodyUnmeasuredChannels(
  dom: Document,
  container: HTMLElement,
  basis: IAutoMovieHumanBodyBasis,
  query: string,
): void {
  const listed = basis.channels.filter(
    (channel) =>
      channel.id.toLowerCase().includes(query) &&
      humanBodyChannelReading(channel.id) === undefined,
  );
  if (listed.length === 0) return;
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Source channels no measurement names (${listed.length})`;
  group.append(summary);
  for (const channel of listed)
    group.append(
      createConnectedDisabledRow(
        dom,
        channel.id,
        `No measurement rule or anatomical target names the source response ${channel.positive}; it is not offered as a control.`,
      ),
    );
  container.append(group);
}

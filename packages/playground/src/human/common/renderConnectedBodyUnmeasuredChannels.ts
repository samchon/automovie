import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import { humanBodyChannelReading } from "@automovie/human/body/measure/humanBodyChannelReading";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the body view's source channels that no measurement names, as disabled rows under one collapsed group.
 *
 * The body editor offers a channel only through a measurement: a rule of its own in `HUMAN_BODY_MEASUREMENTS`, or a binding that solves an anatomical target along it in `HUMAN_BODY_EXTERIOR_TARGETS`, as `humanBodyChannelReading` answers. Every other channel is a source response with no anatomical name, so it is listed, not hidden, and not offered as a slider. The list is derived from the basis and the two tables, so it shrinks as rules and bindings are added. Only channels matching the search are listed; nothing is appended when none match.
 *
 * @evidence contracts/common.md#principled-implementation The shared channel-reading owner distinguishes own measurements and anatomical target bindings from unnamed source responses, and only the latter receive disabled gap rows.
 * @evidence contracts/common.md#clear-and-simple-design Measurement catalogue ownership stays with Human; this renderer applies search and groups the resulting unavailable controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unnamed source responses are listed instead of acquiring invented anatomical units or arbitrary morph sliders.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the two measurement authorities, evolving derived inventory, disabled presentation, filtering and empty-result behavior.
 * @evidence contracts/performance.md#efficient-algorithms Filtering c source channels invokes the shared catalogue reading for each matching id; its catalogue scan cost remains included, and a matches require O(a) temporary references and disabled-row DOM.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This gap redraw shares no numerical result or persistent channel-reading cache across source revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary listed references end with redraw and row DOM remains with the parent container until replacement or close; no worker or GPU handle is created.
 */
export function renderConnectedBodyUnmeasuredChannels(
  dom: Document,
  container: HTMLElement,
  basis: IAutoMovieHumanBodyBasis,
  query: string,
): void {
  const listed: IAutoMovieHumanBodyBasis["channels"] = basis.channels.filter(
    (channel: IAutoMovieHumanBodyBasis["channels"][number]): boolean =>
      channel.id.toLowerCase().includes(query) &&
      humanBodyChannelReading(channel.id) === undefined,
  );
  if (listed.length === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
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

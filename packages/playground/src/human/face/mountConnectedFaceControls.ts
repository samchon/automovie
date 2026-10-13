import { createHumanFaceComponentTree } from "@automovie/human/face/basis/createHumanFaceComponentTree";
import { createHumanFaceControlMap } from "@automovie/human/face/basis/createHumanFaceControlMap";
import { measureHumanFaceBasisChannels } from "@automovie/human/face/channels/measureHumanFaceBasisChannels";
import type { IAutoMovieHumanFaceBasis, IAutoMovieHumanFaceBasisDocument, IAutoMovieHumanFaceChannelScale } from "@automovie/human";

import type { IAppendConnectedFaceControlRowProps } from "./IAppendConnectedFaceControlRowProps";
import type { IConnectedFaceControlsProps } from "./IConnectedFaceControlsProps";
import { appendConnectedFaceComponentGroups } from "./appendConnectedFaceComponentGroups";
import { appendConnectedFaceControlRow } from "./appendConnectedFaceControlRow";
import { createConnectedFaceChannelControl } from "./createConnectedFaceChannelControl";

/**
 * Present simple coordinates or the canonical fine shape/performance controls. Presentation changes never write a document. Simple input lowers from one captured fine origin, combining pending group values before a transaction; fine input composes with the latest draft. The panel owns admission/history. Only owned document coordinates are authored values; omission displays zero. A basis-bound component tree groups fine controls for navigation; it changes neither saved channel IDs nor the basis's evaluation order or shared skin. Jaw opening and gaze display source endpoint degrees, and forward/lateral jaw excursions display millimetres. They lower to the same flat weights.
 *
 * @evidence contracts/common.md#principled-implementation Basis-bound simple projection lowers combined group values over one captured fine origin, fine controls replace coordinates over the latest draft, and own-property checks distinguish authored values from omitted neutral zero.
 * @evidence contracts/common.md#clear-and-simple-design Mode/search/group DOM stays in the mount, shared channel producers own display-unit lowering, and the parent owns complete document admission, history and publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional simple-map absence selects canonical fine controls, navigation never renames saved channels, and source endpoints remain distinguished from universal clinical limits.
 * @evidence contracts/common.md#meaningful-documentation The comment explains captured-origin simple composition, latest-draft fine edits, omitted neutral values, navigation-only trees and source unit conversion.
 * @evidence contracts/performance.md#efficient-algorithms Basis endpoint scales and map/tree adapters are constructed once per mount; scale measurement includes sparse endpoint and articulated vertex work. Each redraw scans c selected channels or s projected controls and constructs matching DOM, with projection/tree traversal costs included in their respective paths.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable basis scales, simple map and component tree adapters are reused across redraw; a simple render captures one origin and combines pending group values until parent redraw invalidates it, while latest draft supplies unrelated authored fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mount retains basis adapters, scale maps and selection/search DOM until parent removal; replacing row children releases old row/listener reachability, and numerical requests remain transaction-owned.
 */
export function mountConnectedFaceControls(
  app: HTMLElement,
  props: IConnectedFaceControlsProps,
): {
  /** Rebuild rows and simple origin against the current draft and selected presentation. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const container: HTMLElement = app.querySelector<HTMLElement>(
    '[data-role="basis-controls"]',
  )!;
  const kind: HTMLSelectElement = app.querySelector<HTMLSelectElement>(
    '[data-role="control-kind"]',
  )!;
  const project: ReturnType<typeof createHumanFaceControlMap> | undefined =
    props.map === undefined
      ? undefined
      : createHumanFaceControlMap({ basis: props.basis, map: props.map });
  const anatomy: ReturnType<typeof createHumanFaceComponentTree> | undefined =
    props.components === undefined
      ? undefined
      : createHumanFaceComponentTree(props.basis, props.components);
  const scales: Map<string, IAutoMovieHumanFaceChannelScale> = new Map(
    measureHumanFaceBasisChannels(props.basis).map((scale: IAutoMovieHumanFaceChannelScale): [string, IAutoMovieHumanFaceChannelScale] => [
      scale.id,
      scale,
    ]),
  );
  const search: HTMLInputElement = dom.createElement("input");
  search.id = "face-control-search";
  search.type = "search";
  search.placeholder = "Find a control: nose, lip, cheek, ear…";
  search.setAttribute("aria-label", "Find a facial control");
  search.style.width = "100%";
  container.before(search);
  const level: HTMLSelectElement = dom.createElement("select");
  level.id = "face-control-level";
  level.setAttribute("aria-label", "Control detail level");
  for (const [value, label] of [
    ["simple", "Simple"],
    ["fine", "Fine detail"],
  ]) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = value;
    option.textContent = label;
    level.append(option);
  }
  if (project !== undefined) kind.before(level);
  else level.value = "fine";
  const render: () => void = (): void => {
    const document: IAutoMovieHumanFaceBasisDocument = props.document();
    const simple: boolean = project !== undefined && level.value === "simple";
    kind.hidden = simple;
    app.querySelector<HTMLElement>('[data-role="control-help"]')!.textContent =
      simple
        ? "Simple edits preserve your fine adjustments, including differences between the two sides. Each range accounts for those adjustments. Values describe authored shapes, not physical measurements."
        : "0 is the source neutral. Most controls are authored endpoint weights; jaw opening and gaze show degrees, and jaw forward/lateral motion shows millimetres within this basis's endpoints. These limits are not universal clinical ranges.";
    const query: string = search.value.toLowerCase().replace(/\s/g, "");
    container.replaceChildren();
    const row: (target: HTMLElement) => IAppendConnectedFaceControlRowProps = (target: HTMLElement): IAppendConnectedFaceControlRowProps => ({
      target,
      simple,
      query,
      change: props.change,
      refuse: props.refuse,
      render,
    });
    if (simple && project !== undefined) {
      const projection: ReturnType<ReturnType<typeof createHumanFaceControlMap>> = project(document.shape);
      let values: Record<string, number> = {};
      for (const control of projection.controls)
        appendConnectedFaceControlRow(
          {
            ...control,
            edit: (value: number): IAutoMovieHumanFaceBasisDocument => {
              const candidate: Record<string, number> = { ...values, [control.id]: value };
              const shape: Record<string, number> = projection.resolve(candidate);
              values = candidate;
              return { ...structuredClone(props.document()), shape };
            },
          },
          row(container),
        );
      return;
    }
    const channels: IAutoMovieHumanFaceBasis["channels"] = props.basis.channels.filter(
      (channel: IAutoMovieHumanFaceBasis["channels"][number]): boolean => channel.kind === kind.value,
    );
    const byId: Map<string, IAutoMovieHumanFaceBasis["channels"][number]> = new Map(channels.map((channel: IAutoMovieHumanFaceBasis["channels"][number]): [string, IAutoMovieHumanFaceBasis["channels"][number]] => [channel.id, channel]));
    const appendChannel: (channel: IAutoMovieHumanFaceBasis["channels"][number], target: HTMLElement) => void = (
      channel: (typeof channels)[number],
      target: HTMLElement,
    ): void =>
      appendConnectedFaceControlRow(
        createConnectedFaceChannelControl({
          basis: props.basis,
          channel,
          scale: scales.get(channel.id)!,
          group: anatomy?.channelPaths.get(channel.id)?.join(" "),
          document,
          latest: props.document,
        }),
        row(target),
      );
    if (anatomy === undefined)
      for (const channel of channels) appendChannel(channel, container);
    else
      appendConnectedFaceComponentGroups(
        anatomy.root,
        container,
        (id: string, group: HTMLElement): void => {
          const channel: IAutoMovieHumanFaceBasis["channels"][number] | undefined = byId.get(id);
          if (channel !== undefined) appendChannel(channel, group);
        },
      );
  };
  kind.onchange = render;
  level.onchange = render;
  search.oninput = render;
  return { refresh: render };
}

import {
  createHumanFaceComponentTree,
  createHumanFaceControlMap,
  measureHumanFaceBasisChannels,
} from "@automovie/human";

import type { IAppendConnectedFaceControlRowProps } from "./IAppendConnectedFaceControlRowProps";
import type { IConnectedFaceControlsProps } from "./IConnectedFaceControlsProps";
import { appendConnectedFaceComponentGroups } from "./appendConnectedFaceComponentGroups";
import { appendConnectedFaceControlRow } from "./appendConnectedFaceControlRow";
import { createConnectedFaceChannelControl } from "./createConnectedFaceChannelControl";

/**
 * Present simple coordinates or the canonical fine shape/performance controls.
 * Presentation changes never write a document. Simple input lowers from one
 * captured fine origin, combining pending group values before a transaction;
 * fine input composes with the latest draft. The panel owns admission/history.
 * Only owned document coordinates are authored values; omission displays zero.
 * A basis-bound component tree groups fine controls for navigation; it changes
 * neither saved channel IDs nor the basis's evaluation order or shared skin.
 * Jaw opening and gaze display source endpoint degrees, and forward/lateral
 * jaw excursions display millimetres. They lower to the same flat weights.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes editable and searchable fine shape and performance channels.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Shows current values, effective domains and endpoint displacement without changing replay on a mode switch.
 */
export function mountConnectedFaceControls(
  app: HTMLElement,
  props: IConnectedFaceControlsProps,
) {
  const dom = app.ownerDocument;
  const container = app.querySelector<HTMLElement>('[data-role="basis-controls"]')!;
  const kind = app.querySelector<HTMLSelectElement>('[data-role="control-kind"]')!;
  const project =
    props.map === undefined
      ? undefined
      : createHumanFaceControlMap({ basis: props.basis, map: props.map });
  const anatomy =
    props.components === undefined
      ? undefined
      : createHumanFaceComponentTree(props.basis, props.components);
  const scales = new Map(
    measureHumanFaceBasisChannels(props.basis).map((scale) => [
      scale.id,
      scale,
    ]),
  );
  const search = dom.createElement("input");
  search.id = "face-control-search";
  search.type = "search";
  search.placeholder = "Find a control: nose, lip, cheek, ear…";
  search.setAttribute("aria-label", "Find a facial control");
  search.style.width = "100%";
  container.before(search);
  const level = dom.createElement("select");
  level.id = "face-control-level";
  level.setAttribute("aria-label", "Control detail level");
  for (const [value, label] of [
    ["simple", "Simple"],
    ["fine", "Fine detail"],
  ]) {
    const option = dom.createElement("option");
    option.value = value;
    option.textContent = label;
    level.append(option);
  }
  if (project !== undefined) kind.before(level);
  else level.value = "fine";
  const render = (): void => {
    const document = props.document();
    const simple = project !== undefined && level.value === "simple";
    kind.hidden = simple;
    app.querySelector<HTMLElement>('[data-role="control-help"]')!.textContent = simple
      ? "Simple edits preserve your fine adjustments, including differences between the two sides. Each range accounts for those adjustments. Values describe authored shapes, not physical measurements."
      : "0 is the source neutral. Most controls are authored endpoint weights; jaw opening and gaze show degrees, and jaw forward/lateral motion shows millimetres within this basis's endpoints. These limits are not universal clinical ranges.";
    const query = search.value.toLowerCase().replace(/\s/g, "");
    container.replaceChildren();
    const row = (target: HTMLElement): IAppendConnectedFaceControlRowProps => ({ target, simple, query,
      change: props.change, refuse: props.refuse, render });
    if (simple) {
      const projection = project(document.shape);
      let values: Record<string, number> = {};
      for (const control of projection.controls)
        appendConnectedFaceControlRow({
          ...control,
          edit: (value) => {
            const candidate = { ...values, [control.id]: value };
            const shape = projection.resolve(candidate);
            values = candidate;
            return { ...structuredClone(props.document()), shape };
          },
        }, row(container));
      return;
    }
    const channels = props.basis.channels.filter((channel) => channel.kind === kind.value);
    const byId = new Map(channels.map((channel) => [channel.id, channel]));
    const appendChannel = (channel: (typeof channels)[number], target: HTMLElement): void =>
      appendConnectedFaceControlRow(createConnectedFaceChannelControl({
        basis: props.basis,
        channel,
        scale: scales.get(channel.id)!,
        group: anatomy?.channelPaths.get(channel.id)?.join(" "),
        document,
        latest: props.document,
      }), row(target));
    if (anatomy === undefined)
      for (const channel of channels) appendChannel(channel, container);
    else
      appendConnectedFaceComponentGroups(anatomy.root, container, (id, group) => {
        const channel = byId.get(id);
        if (channel !== undefined) appendChannel(channel, group);
      });
  };
  kind.onchange = render;
  level.onchange = render;
  search.oninput = render;
  return { refresh: render };
}

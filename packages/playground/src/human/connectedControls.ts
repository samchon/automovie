import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceComponentTree,
  type IAutoMovieHumanFaceControlMap,
  type IAutoMovieHumanFaceEndpointScale,
  createHumanFaceComponentTree,
  createHumanFaceControlMap,
  measureHumanFaceBasisChannels,
} from "@automovie/human";

import { connectedFaceArticulationDegrees } from "./anatomy/connectedFaceArticulationDegrees";

/**
 * Present simple coordinates or the canonical fine shape/performance controls.
 * Presentation changes never write a document. Simple input lowers from one
 * captured fine origin, combining pending group values before a transaction;
 * fine input composes with the latest draft. The panel owns admission/history.
 * Only owned document coordinates are authored values; omission displays zero.
 * A basis-bound component tree groups fine controls for navigation; it changes
 * neither saved channel IDs nor the basis's evaluation order or shared skin.
 * Jaw opening and gaze display their basis endpoint's physical degrees while
 * lowering edited degrees back to the same flat performance weights.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes editable and searchable fine shape and performance channels.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Shows current values, effective domains and endpoint displacement without changing replay on a mode switch.
 */
export function mountConnectedFaceControls(
  app: HTMLElement,
  props: {
    basis: IAutoMovieHumanFaceBasis;
    map?: IAutoMovieHumanFaceControlMap;
    components?: IAutoMovieHumanFaceComponentTree;
    document: () => IAutoMovieHumanFaceBasisDocument;
    change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;
    refuse: (error: unknown) => void;
  },
) {
  const dom = app.ownerDocument;
  const container = app.querySelector<HTMLElement>("#basis-controls")!;
  const kind = app.querySelector<HTMLSelectElement>("#control-kind")!;
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
  const describe = (
    sign: string,
    scale: IAutoMovieHumanFaceEndpointScale,
    angle: number | null = null,
  ): string => {
    const degree = angle === null ? null : sign === "-" ? -angle : angle;
    const amount =
      degree === null
        ? `${sign}1`
        : `${degree >= 0 ? "+" : ""}${degree.toFixed(2)}°`;
    return (
      `${amount} moves ${(scale.displacement * 1000).toFixed(2)} mm rms, ` +
      `${(scale.peak * 1000).toFixed(2)} mm peak on ${scale.vertices} vertices`
    );
  };
  const search = dom.createElement("input");
  search.id = "control-search";
  search.type = "search";
  search.placeholder = "Find a control: nose, lip, cheek, ear…";
  search.setAttribute("aria-label", "Find a facial control");
  search.style.width = "100%";
  container.before(search);
  const level = dom.createElement("select");
  level.id = "control-level";
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
    app.querySelector<HTMLElement>("#control-help")!.textContent = simple
      ? "Simple edits preserve your fine adjustments, including differences between the two sides. Each range accounts for those adjustments. Values describe authored shapes, not physical measurements."
      : "0 is the source neutral. Most controls are authored endpoint weights; jaw opening and gaze show degrees within this basis's supported endpoints. These limits are not universal clinical ranges.";
    const query = search.value.toLowerCase().replace(/\s/g, "");
    container.replaceChildren();
    const append = (
      control: {
        id: string;
        label: string;
        description: string;
        minimum: number;
        maximum: number;
        value: number;
        group?: string;
        edit: (value: number) => IAutoMovieHumanFaceBasisDocument;
      },
      target: HTMLElement = container,
    ): void => {
      if (
        !(control.id + control.label + (control.group ?? ""))
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(query)
      )
        return;
      const row = dom.createElement("div"),
        label = dom.createElement("label"),
        entry = dom.createElement("div");
      row.className = "row";
      label.textContent = control.label;
      const slider = dom.createElement("input"),
        number = dom.createElement("input");
      slider.type = "range";
      number.type = "number";
      for (const input of [slider, number]) {
        input.min = String(control.minimum);
        input.max = String(control.maximum);
        input.step = "any";
        input.value = String(control.value);
      }
      number.id = (simple ? "simple-" : "control-") + control.id;
      slider.id = number.id + "-slider";
      label.htmlFor = number.id;
      slider.setAttribute("aria-label", control.label + " slider");
      const edit = async (value: string): Promise<void> => {
        try {
          if (value.trim() === "")
            throw new Error("A numeric value is required.");
          await props.change(control.edit(Number(value)));
        } catch (error) {
          props.refuse(error);
          render();
        }
      };
      slider.oninput = () => {
        number.value = slider.value;
      };
      slider.onchange = () => edit(slider.value);
      number.onchange = () => edit(number.value);
      entry.append(slider, number);
      const note = dom.createElement("small");
      note.id = (simple ? "simple-description-" : "scale-") + control.id;
      note.textContent = control.description;
      row.append(label, entry, note);
      target.append(row);
    };
    if (simple) {
      const projection = project(document.shape);
      let values: Record<string, number> = {};
      for (const control of projection.controls)
        append({
          ...control,
          edit: (value) => {
            const candidate = { ...values, [control.id]: value };
            const shape = projection.resolve(candidate);
            values = candidate;
            return { ...structuredClone(props.document()), shape };
          },
        });
    } else {
      const channels = props.basis.channels.filter(
        (channel) => channel.kind === kind.value,
      );
      const byId = new Map(channels.map((channel) => [channel.id, channel]));
      const appendChannel = (
        channel: (typeof channels)[number],
        target: HTMLElement,
      ): void => {
        const scale = scales.get(channel.id)!;
        const angle = connectedFaceArticulationDegrees(props.basis, channel.id);
        const unit = angle ?? 1;
        append(
          {
            ...channel,
            label:
              channel.id.replace(/([a-z])([A-Z])/g, "$1 $2") +
              (angle === null ? "" : " (°)"),
            group: anatomy?.channelPaths.get(channel.id)?.join(" "),
            minimum: Math.min(channel.minimum * unit, channel.maximum * unit),
            maximum: Math.max(channel.minimum * unit, channel.maximum * unit),
            value: Object.hasOwn(document[channel.kind], channel.id)
              ? document[channel.kind][channel.id] * unit
              : 0,
            description: [
              ...(channel.description === undefined
                ? []
                : [channel.description]),
              describe("+", scale.positive, angle),
              ...(scale.negative === null
                ? []
                : [describe("-", scale.negative, angle)]),
            ].join(" · "),
            edit: (value) => {
              const next = structuredClone(props.document());
              next[channel.kind] = {
                ...next[channel.kind],
                [channel.id]: value / unit,
              };
              return next;
            },
          },
          target,
        );
      };
      if (anatomy === undefined)
        for (const channel of channels) appendChannel(channel, container);
      else {
        const visit = (
          node: IAutoMovieHumanFaceComponentTree.Node,
          parent: HTMLElement,
        ): void => {
          const group = dom.createElement("details");
          group.dataset.component = node.id;
          group.open = true;
          const summary = dom.createElement("summary");
          summary.textContent = node.label;
          group.append(summary);
          parent.append(group);
          for (const id of node.channels) {
            const channel = byId.get(id);
            if (channel !== undefined) appendChannel(channel, group);
          }
          for (const child of node.children) visit(child, group);
          if (group.querySelector(".row") === null) group.remove();
        };
        visit(anatomy.root, container);
      }
    }
  };
  kind.onchange = render;
  level.onchange = render;
  search.oninput = render;
  return { refresh: render };
}

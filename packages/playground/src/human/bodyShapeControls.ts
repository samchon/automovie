/**
 * Render the connected body's named shape channels in one selected group.
 * The panel owns the committed document and transaction order; this module
 * owns each control's label, measured scale, and scalar input events. Every
 * event reads the current draft so a control retained across another edit
 * cannot overwrite that edit with an old document.
 */
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

/**
 * Bind one group's measured shape channels to document edits. The basis and
 * measurement rows have the same channel identities; the parent replaces the
 * container whenever group, search or committed state changes.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Presents the named detailed body channels as scalar controls in the selected group.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Turns a scalar control edit into a numerical document edit while displaying its measured scale.
 */
export function renderBodyShapeControls(props: {
  dom: Document;
  container: HTMLElement;
  basis: IAutoMovieHumanBodyBasis;
  scales: Map<string, IAutoMovieHumanBodyChannelScale>;
  kind: string;
  query: string;
  current: () => IAutoMovieHumanBodyBasisDocument;
  change: (document: IAutoMovieHumanBodyBasisDocument) => void;
  refuse: (error: unknown) => void;
}): void {
  const mm = (metres: number | null): string =>
    metres === null ? "n/a" : (metres * 1000).toFixed(1) + " mm";
  const describe = (scale: IAutoMovieHumanBodyChannelScale): string => {
    if (scale.measurement !== null) {
      const m = scale.measurement;
      return (
        `${m.kind} ${m.id}: neutral ${mm(m.neutral)} · +1 → ${mm(m.positive)}` +
        (scale.negative === null ? "" : ` · -1 → ${mm(m.negative)}`)
      );
    }
    const side = (sign: string, end: typeof scale.positive): string =>
      `${sign}1 moves ${mm(end.displacement)} rms, ${mm(end.peak)} peak on ${end.vertices} vertices`;
    return [
      side("+", scale.positive),
      ...(scale.negative === null ? [] : [side("-", scale.negative)]),
    ].join(" · ");
  };
  for (const channel of props.basis.channels.filter(
    (one) =>
      one.group === props.kind && one.id.toLowerCase().includes(props.query),
  )) {
    const row = props.dom.createElement("div"),
      label = props.dom.createElement("label"),
      entry = props.dom.createElement("div"),
      slider = props.dom.createElement("input"),
      number = props.dom.createElement("input"),
      note = props.dom.createElement("small");
    row.className = "row";
    label.textContent = channel.id.replace(/([a-z])([A-Z])/g, "$1 $2");
    slider.type = "range";
    number.type = "number";
    number.min = String(channel.minimum);
    slider.min = number.min;
    number.max = String(channel.maximum);
    slider.max = number.max;
    slider.step = "0.01";
    number.step = "any";
    number.value = String(props.current().shape[channel.id] ?? 0);
    slider.value = number.value;
    number.id = "control-" + channel.id;
    slider.id = number.id + "-slider";
    label.htmlFor = number.id;
    slider.setAttribute("aria-label", label.textContent + " slider");
    const editValue = (value: string): void => {
      if (value.trim() === "") {
        props.refuse("A numeric value is required.");
        return;
      }
      const next = structuredClone(props.current());
      if (Number(value) === 0) delete next.shape[channel.id];
      else next.shape[channel.id] = Number(value);
      props.change(next);
    };
    slider.oninput = () => {
      number.value = slider.value;
    };
    slider.onchange = () => editValue(slider.value);
    number.onchange = () => editValue(number.value);
    entry.append(slider, number);
    note.id = "scale-" + channel.id;
    note.textContent = describe(props.scales.get(channel.id)!);
    row.append(label, entry, note);
    props.container.append(row);
  }
}

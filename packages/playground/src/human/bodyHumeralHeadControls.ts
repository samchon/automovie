import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

type Radii = IAutoMovieHumanBodyBasisDocument["humeralHeads"];

/**
 * Bind independent anatomical radii, in source millimetres, to a body edit.
 *
 * The left and right humeral heads may differ. A blank side removes only its
 * direct measurement, letting the adult CT prior supply that side when the
 * body lies in the sampled population. No vertex, shaft contour or joint
 * placement is exposed as an input. Inputs stay mounted while poses rebuild;
 * only a changed committed measurement refreshes their displayed value.
 */
export function renderBodyHumeralHeadControls(props: {
  dom: Document;
  container: HTMLElement;
  current: () => IAutoMovieHumanBodyBasisDocument;
  onChange: (document: IAutoMovieHumanBodyBasisDocument) => void;
  onRefuse: (error: Error) => void;
}): { refresh: (radii: Radii, force?: boolean) => void } {
  const sides = [
    ["left", "leftRadiusMillimetres"],
    ["right", "rightRadiusMillimetres"],
  ] as const;
  const inputs = new Map<(typeof sides)[number][1], HTMLInputElement>();
  const committed = new Map<(typeof sides)[number][1], number | undefined>();
  props.container.replaceChildren();
  for (const [side, key] of sides) {
    const row = props.dom.createElement("div");
    const label = props.dom.createElement("label");
    const input = props.dom.createElement("input");
    const apply = props.dom.createElement("button");
    row.className = "row";
    input.id = `humeral-head-${side}`;
    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.placeholder = "adult CT estimate";
    label.htmlFor = input.id;
    label.textContent = `${side === "left" ? "Left" : "Right"} humeral head radius (mm)`;
    apply.textContent = "Set radius";
    apply.onclick = () => {
      const text = input.value.trim();
      const value = text === "" ? undefined : Number(text);
      if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
        props.onRefuse(new Error("A measured humeral-head radius must be a positive number of millimetres."));
        return;
      }
      const next = structuredClone(props.current());
      const radii = { ...next.humeralHeads };
      if (value === undefined) delete radii[key];
      else radii[key] = value;
      if (Object.keys(radii).length === 0) delete next.humeralHeads;
      else next.humeralHeads = radii;
      props.onChange(next);
    };
    row.append(label, input, apply);
    props.container.append(row);
    inputs.set(key, input);
  }
  return {
    refresh: (radii, force = false) => {
      for (const [, key] of sides) {
        const value = radii?.[key];
        if (!force && committed.has(key) && committed.get(key) === value) continue;
        inputs.get(key)!.value = value === undefined ? "" : String(value);
        committed.set(key, value);
      }
    },
  };
}

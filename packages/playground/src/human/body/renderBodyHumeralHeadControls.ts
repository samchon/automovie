import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

type Radii = IAutoMovieHumanBodyBasisDocument["humeralHeads"];

/**
 * Bind independent anatomical radii, in source millimetres, to a body edit.
 *
 * Left and right values remain independent. Blank removes that side's entered radius, leaving the numerical owner's population prior when supported. A pose-only refresh preserves unfinished text; changed committed radii update it, and force explicitly restores text after refusal.
 *
 * @evidence contracts/common.md#principled-implementation Each side accepts a finite positive millimetre radius or explicit omission, composes against the latest body draft and preserves the opposite side before submitting the complete document.
 * @evidence contracts/common.md#clear-and-simple-design Two persistent radius rows emit document edits and expose committed-value refresh, while prior selection, geometry and document admission remain with the numerical owner and panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inputs expose named radii rather than vertices or fitted placement, and blank values do not invent a radius outside the population prior's supported domain.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies millimetres, side independence, blank prior behavior, draft preservation and forced refresh after refusal; props name mounting and transaction hooks.
 * @evidence contracts/performance.md#efficient-algorithms Mounting and refreshing visit two fixed sides; applying a radius clones d body-document data in O(d) work and preserves its unrelated fields rather than rebuilding geometry locally.
 * @evidence contracts/performance.md#reuse-equivalent-work Two last-committed radius entries suppress equivalent text refreshes so pose-only builds preserve typed drafts; force deliberately invalidates this display reuse after a refused edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two input references and committed scalar entries remain with the mounted rows until panel retirement; the container owns their listeners and no worker or renderer is acquired here.
 */
export function renderBodyHumeralHeadControls(props: {
  /** Document that creates the two radius rows. */
  dom: Document;

  /** Mount whose children are replaced by these controls. */
  container: HTMLElement;

  /** Latest body draft against which a side edit composes. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Submit the edited body document to its transaction owner. */
  onChange: (document: IAutoMovieHumanBodyBasisDocument) => void;

  /** Report invalid local radius text without submitting an edit. */
  onRefuse: (error: Error) => void;
}): {
  /** Refresh changed committed millimetre radii; force also replaces unfinished text when values are equal. */
  refresh: (radii: Radii, force?: boolean) => void;
} {
  const sides: readonly (readonly [
    "left" | "right",
    keyof NonNullable<Radii>,
  ])[] = [
    ["left", "leftRadiusMillimetres"],
    ["right", "rightRadiusMillimetres"],
  ];
  const inputs: Map<keyof NonNullable<Radii>, HTMLInputElement> = new Map();
  const committed: Map<keyof NonNullable<Radii>, number | undefined> =
    new Map();
  props.container.replaceChildren();
  for (const [side, key] of sides) {
    const row: HTMLDivElement = props.dom.createElement("div");
    const label: HTMLLabelElement = props.dom.createElement("label");
    const input: HTMLInputElement = props.dom.createElement("input");
    const apply: HTMLButtonElement = props.dom.createElement("button");
    row.className = "row";
    input.id = `humeral-head-${side}`;
    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.placeholder = "adult CT estimate";
    label.htmlFor = input.id;
    label.textContent = `${side === "left" ? "Left" : "Right"} humeral head radius (mm)`;
    apply.textContent = "Set radius";
    apply.onclick = (): void => {
      const text: string = input.value.trim();
      const value: number | undefined = text === "" ? undefined : Number(text);
      if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
        props.onRefuse(
          new Error(
            "A measured humeral-head radius must be a positive number of millimetres.",
          ),
        );
        return;
      }
      const next: IAutoMovieHumanBodyBasisDocument = structuredClone(
        props.current(),
      );
      const radii: NonNullable<Radii> = { ...next.humeralHeads };
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
    refresh: (radii: Radii, force: boolean = false): void => {
      for (const [, key] of sides) {
        const value: number | undefined = radii?.[key];
        if (!force && committed.has(key) && committed.get(key) === value)
          continue;
        inputs.get(key)!.value = value === undefined ? "" : String(value);
        committed.set(key, value);
      }
    },
  };
}

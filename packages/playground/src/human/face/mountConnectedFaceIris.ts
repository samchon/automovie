import type {
  IAutoMovieHumanFaceBasisDocument,
  IPortraitIrisPigment,
} from "@automovie/human";

import type { IConnectedFaceAppearanceProps } from "./IConnectedFaceAppearanceProps";

/**
 * The iris pigment of both eyes, shown as the default when a document adds pigment: the constructed portrait eye's shared dark-brown palette, not any subject's colour.
 */
const DEFAULT_PIGMENT: IPortraitIrisPigment = {
  base: [0.009, 0.006, 0.004],
  variation: [0.05, 0.031, 0.012],
};

/**
 * Edit each eye's iris pigment without editing JSON.
 *
 * The section writes the document's `iris` field through the panel's existing transaction, validation and undo path, so a pigment the builder refuses (a band outside the unit range, or a basis without articulated eyes) leaves the committed document as it was. The eye selection and the "both eyes" switch are view state: with the switch on, an edit writes that one RGB coordinate to both eyes while preserving their other coordinates; off, only the selected eye changes. Existing differences between eyes therefore survive bilateral edits to other coordinates. Inputs show linear RGB, the unit the builder paints in. Adding starts from the constructed portrait eye's shared palette; removing restores the basis texture.
 *
 * @evidence contracts/common.md#principled-implementation Linear base and variation vectors author the iris override, one-eye or both-eye selection controls exactly which vectors change, and finite entry enters ordinary face admission for supported articulated eyes and unit ranges.
 * @evidence contracts/common.md#clear-and-simple-design The mount owns eye-selection DOM and candidate vector updates while the existing appearance transaction owns numerical palette painting, history and refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The brown starting palette is generic styling rather than a named subject colour, and missing or refused articulated iris support receives no fabricated accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies linear RGB, bilateral versus unilateral authoring, basis texture restoration and numerical refusal/undo ownership.
 * @evidence contracts/performance.md#efficient-algorithms Refresh creates six scalar inputs for two RGB vectors; each edit clones d document values and replaces one or two fixed three-element vectors before shared numerical construction, in O(d) copying work and constant iris-coordinate work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selection is view state and candidate edits remain distinct user effects; iris texture reuse belongs to the numerical/rendering owner, not this mount.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent owns section and selection DOM until close; replacing entries releases previous row/listener reachability, while pending builds and GPU texture retirement remain transaction-owned.
 */
export function mountConnectedFaceIris(
  app: HTMLElement,
  props: IConnectedFaceAppearanceProps,
): {
  /** Redraw selected-eye pigment values from the current draft. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const section: HTMLDetailsElement = dom.createElement("details");
  section.id = "face-iris";
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = "Iris pigment";
  const eye: HTMLSelectElement = dom.createElement("select");
  eye.id = "iris-eye";
  eye.setAttribute("aria-label", "Eye");
  for (const [value, text] of [
    ["left", "Subject's left eye"],
    ["right", "Subject's right eye"],
  ]) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = value;
    option.textContent = text;
    eye.append(option);
  }
  const bothLabel: HTMLLabelElement = dom.createElement("label");
  const both: HTMLInputElement = dom.createElement("input");
  both.type = "checkbox";
  both.id = "iris-both";
  both.checked = true;
  bothLabel.append(both, " Edit both eyes together");
  const add: HTMLButtonElement = dom.createElement("button");
  add.id = "iris-add";
  add.textContent = "Add iris pigment";
  const remove: HTMLButtonElement = dom.createElement("button");
  remove.id = "iris-remove";
  remove.textContent = "Remove iris pigment";
  const entries: HTMLDivElement = dom.createElement("div");
  section.append(summary, eye, bothLabel, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const commit: (edit: (next: IAutoMovieHumanFaceBasisDocument) => void) => Promise<void> = async (
    edit: (next: IAutoMovieHumanFaceBasisDocument) => void,
  ): Promise<void> => {
    try {
      const next: IAutoMovieHumanFaceBasisDocument = structuredClone(props.document());
      edit(next);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  add.onclick = (): Promise<void> =>
    commit((next: IAutoMovieHumanFaceBasisDocument): void => {
      next.iris = {
        left: structuredClone(DEFAULT_PIGMENT),
        right: structuredClone(DEFAULT_PIGMENT),
      };
    });
  remove.onclick = (): Promise<void> =>
    commit((next: IAutoMovieHumanFaceBasisDocument): void => {
      delete next.iris;
    });
  const refresh: () => void = (): void => {
    entries.replaceChildren();
    const iris: IAutoMovieHumanFaceBasisDocument["iris"] = props.document().iris;
    add.disabled = iris !== undefined && iris !== null;
    remove.disabled = !add.disabled;
    if (iris === undefined || iris === null) return;
    const side: "left" | "right" = eye.value as "left" | "right";
    for (const field of ["base", "variation"] as const)
      ["R", "G", "B"].forEach((channel: string, axis: number): void => {
        const label: HTMLLabelElement = dom.createElement("label");
        label.style.display = "block";
        label.textContent = `${field === "base" ? "Limbal base" : "Stroma variation"} linear ${channel}`;
        const input: HTMLInputElement = dom.createElement("input");
        input.type = "number";
        input.id = `iris-${field}-${channel.toLowerCase()}`;
        input.step = "any";
        input.value = String(iris[side][field][axis]);
        input.onchange = (): Promise<void> =>
          commit((next: IAutoMovieHumanFaceBasisDocument): void => {
            const value: number = Number(input.value);
            if (input.value.trim() === "" || !Number.isFinite(value))
              throw new Error("An iris pigment channel needs a finite number.");
            const sides: readonly ("left" | "right")[] = both.checked ? ["left", "right"] : [side];
            for (const one of sides) {
              const vector: number[] = [...next.iris![one][field]];
              vector[axis] = value;
              next.iris![one] = { ...next.iris![one], [field]: vector };
            }
          });
        label.append(input);
        entries.append(label);
      });
  };
  eye.onchange = refresh;
  return { refresh };
}

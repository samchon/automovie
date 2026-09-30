import type {
  IAutoMovieHumanFaceBasisDocument,
  IPortraitIrisPigment,
} from "@automovie/human";

/**
 * The iris pigment of both eyes, shown as the default when a document adds
 * pigment: the constructed portrait eye's shared dark-brown palette, not any
 * subject's colour.
 */
const DEFAULT_PIGMENT: IPortraitIrisPigment = {
  base: [0.009, 0.006, 0.004],
  variation: [0.05, 0.031, 0.012],
};

/**
 * Edit each eye's iris pigment without editing JSON.
 *
 * The section writes the document's `iris` field through the panel's
 * existing transaction, validation and undo path, so a pigment the builder
 * refuses (a band outside the unit range, or a basis without articulated
 * eyes) leaves the committed document as it was. The eye selection and the
 * "both eyes" switch are view state: with the switch on, an edit writes the
 * same pigment to both eyes, which is the common case; off, only the selected
 * eye changes, which is how heterochromia is authored. Inputs show linear
 * RGB, the unit the builder paints in. Adding starts from the constructed
 * portrait eye's shared palette; removing restores the basis texture.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes each eye's iris pigment as numerical controls in the editor.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Routes iris pigment creation, editing and removal through the shared document history.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Edits the per-eye base and variation endpoints the connected iris rule paints.
 */
export function mountConnectedFaceIris(
  app: HTMLElement,
  props: {
    document: () => IAutoMovieHumanFaceBasisDocument;
    change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;
    refuse: (error: unknown) => void;
  },
) {
  const dom = app.ownerDocument;
  const section = dom.createElement("details");
  section.id = "face-iris";
  const summary = dom.createElement("summary");
  summary.textContent = "Iris pigment";
  const eye = dom.createElement("select");
  eye.id = "iris-eye";
  eye.setAttribute("aria-label", "Eye");
  for (const [value, text] of [
    ["left", "Subject's left eye"],
    ["right", "Subject's right eye"],
  ]) {
    const option = dom.createElement("option");
    option.value = value;
    option.textContent = text;
    eye.append(option);
  }
  const bothLabel = dom.createElement("label");
  const both = dom.createElement("input");
  both.type = "checkbox";
  both.id = "iris-both";
  both.checked = true;
  bothLabel.append(both, " Edit both eyes together");
  const add = dom.createElement("button");
  add.id = "iris-add";
  add.textContent = "Add iris pigment";
  const remove = dom.createElement("button");
  remove.id = "iris-remove";
  remove.textContent = "Remove iris pigment";
  const entries = dom.createElement("div");
  section.append(summary, eye, bothLabel, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const commit = async (
    edit: (next: IAutoMovieHumanFaceBasisDocument) => void,
  ): Promise<void> => {
    try {
      const next = structuredClone(props.document());
      edit(next);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  add.onclick = () =>
    commit((next) => {
      next.iris = {
        left: structuredClone(DEFAULT_PIGMENT),
        right: structuredClone(DEFAULT_PIGMENT),
      };
    });
  remove.onclick = () =>
    commit((next) => {
      delete next.iris;
    });
  const refresh = (): void => {
    entries.replaceChildren();
    const iris = props.document().iris;
    add.disabled = iris !== undefined && iris !== null;
    remove.disabled = !add.disabled;
    if (iris === undefined || iris === null) return;
    const side = eye.value as "left" | "right";
    for (const field of ["base", "variation"] as const)
      ["R", "G", "B"].forEach((channel, axis) => {
        const label = dom.createElement("label");
        label.style.display = "block";
        label.textContent = `${field === "base" ? "Limbal base" : "Stroma variation"} linear ${channel}`;
        const input = dom.createElement("input");
        input.type = "number";
        input.id = `iris-${field}-${channel.toLowerCase()}`;
        input.step = "any";
        input.value = String(iris[side][field][axis]);
        input.onchange = () =>
          commit((next) => {
            const value = Number(input.value);
            if (input.value.trim() === "" || !Number.isFinite(value))
              throw new Error("An iris pigment channel needs a finite number.");
            const sides = both.checked ? (["left", "right"] as const) : [side];
            for (const one of sides) {
              const vector = [...next.iris![one][field]];
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

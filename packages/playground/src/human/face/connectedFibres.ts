import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

/** A dark-brown fibre, the default when a card gains pigment. */
const DEFAULT_PIGMENT: [number, number, number] = [0.03, 0.018, 0.011];

/**
 * Edit the fibre pigment and density of the basis's brow and lash cards
 * without editing JSON.
 *
 * The section lists only the basis materials the fibre rule can paint: an
 * embedded texture whose alpha is coverage (mask or blend). It writes the
 * selected material's `pigment` and `density` override through the panel's
 * existing transaction, validation and undo path, so a value the builder
 * refuses leaves the committed document as it was, and it keeps any colour
 * or roughness already authored on that material. Inputs show linear RGB,
 * the unit the rule paints in. Adding starts from a dark-brown fibre at the
 * card's own density, not any subject's colour; removing restores the card.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes brow and lash fibre colour and density as numerical controls in the editor.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Routes fibre pigment creation, editing and removal through the shared document history.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-fibre Edits the per-material pigment and density the connected fibre rule paints.
 */
export function mountConnectedFaceFibres(
  app: HTMLElement,
  props: {
    basis: IAutoMovieHumanFaceBasis;
    document: () => IAutoMovieHumanFaceBasisDocument;
    change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;
    refuse: (error: unknown) => void;
  },
) {
  const dom = app.ownerDocument;
  const cards = props.basis.materials.filter(
    (material) =>
      typeof material.baseColorTexture === "string" &&
      (material.alphaMode === "mask" || material.alphaMode === "blend"),
  );
  const section = dom.createElement("details");
  section.id = "face-fibres";
  const summary = dom.createElement("summary");
  summary.textContent = "Brow and lash fibres";
  const select = dom.createElement("select");
  select.id = "fibre-material";
  select.setAttribute("aria-label", "Fibre card");
  for (const material of cards) {
    const option = dom.createElement("option");
    option.value = material.id;
    option.textContent = material.name;
    select.append(option);
  }
  const add = dom.createElement("button");
  add.id = "fibre-add";
  add.textContent = "Add fibre pigment";
  const remove = dom.createElement("button");
  remove.id = "fibre-remove";
  remove.textContent = "Remove fibre pigment";
  const entries = dom.createElement("div");
  section.append(summary, select, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const commit = async (
    edit: (next: IAutoMovieHumanFaceBasisDocument, id: string) => void,
  ): Promise<void> => {
    try {
      const next = structuredClone(props.document());
      edit(next, select.value);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  add.onclick = () =>
    commit((next, id) => {
      next.materials = {
        ...next.materials,
        [id]: {
          ...next.materials?.[id],
          pigment: [...DEFAULT_PIGMENT],
          density: 1,
        },
      };
    });
  remove.onclick = () =>
    commit((next, id) => {
      const {
        pigment: _pigment,
        density: _density,
        ...rest
      } = next.materials![id]!;
      if (Object.keys(rest).length === 0) delete next.materials![id];
      else next.materials![id] = rest;
    });
  const refresh = (): void => {
    entries.replaceChildren();
    const override = props.document().materials?.[select.value];
    const authored =
      override?.pigment !== undefined || override?.density !== undefined;
    add.disabled = cards.length === 0 || authored;
    remove.disabled = !authored;
    if (!authored) return;
    type Override = NonNullable<
      IAutoMovieHumanFaceBasisDocument["materials"]
    >[string];
    const pigment = override!.pigment ?? DEFAULT_PIGMENT;
    const fields: {
      text: string;
      id: string;
      value: number;
      apply: (current: Override, value: number) => Override;
    }[] = [
      ...["R", "G", "B"].map((channel, axis) => ({
        text: `Fibre linear ${channel}`,
        id: `fibre-${channel.toLowerCase()}`,
        value: pigment[axis]!,
        apply: (current: Override, value: number): Override => {
          const next = [...(current.pigment ?? DEFAULT_PIGMENT)] as [
            number,
            number,
            number,
          ];
          next[axis] = value;
          return { ...current, pigment: next };
        },
      })),
      {
        text: "Density",
        id: "fibre-density",
        value: override!.density ?? 1,
        apply: (current, value) => ({ ...current, density: value }),
      },
    ];
    for (const field of fields) {
      const label = dom.createElement("label");
      label.style.display = "block";
      label.textContent = field.text;
      const input = dom.createElement("input");
      input.type = "number";
      input.id = field.id;
      input.step = "any";
      input.value = String(field.value);
      input.onchange = () =>
        commit((next, id) => {
          const value = Number(input.value);
          if (input.value.trim() === "" || !Number.isFinite(value))
            throw new Error("A fibre value needs a finite number.");
          next.materials![id] = field.apply(next.materials![id]!, value);
        });
      label.append(input);
      entries.append(label);
    }
  };
  select.onchange = refresh;
  return { refresh };
}

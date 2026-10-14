import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IConnectedFaceAppearanceProps } from "./IConnectedFaceAppearanceProps";

type Override = NonNullable<
  IAutoMovieHumanFaceBasisDocument["materials"]
>[string];
type FibreField = {
  text: string;
  id: string;
  value: number;
  apply: (current: Override, value: number) => Override;
};

/** A dark-brown fibre, the default when a card gains pigment. */
const DEFAULT_PIGMENT: [number, number, number] = [0.03, 0.018, 0.011];

/**
 * Edit the fibre pigment and density of the basis's brow and lash cards without editing JSON.
 *
 * The section lists only the basis materials the fibre rule can paint: an embedded texture whose alpha is coverage (mask or blend). It writes the selected material's `pigment` and `density` override through the panel's existing transaction, validation and undo path, so a value the builder refuses leaves the committed document as it was, and it keeps any colour or roughness already authored on that material. Inputs show linear RGB, the unit the rule paints in. Adding starts from a dark-brown fibre at the card's own density, not any subject's colour; removing restores the card.
 *
 * @evidence contracts/common.md#principled-implementation Only source textures with coverage alpha receive fibre controls, linear RGB and density overrides preserve other material fields, and finite entry is admitted through the shared face transaction.
 * @evidence contracts/common.md#clear-and-simple-design The mount owns fibre-card selection and DOM while the existing appearance hooks supply latest draft, document admission and refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The dark-brown default is generic styling data rather than a subject palette, unsupported materials receive no fibre rule, and finite conversion alone does not claim range acceptance.
 * @evidence contracts/common.md#meaningful-documentation The comment states alpha eligibility, linear pigment units, density defaults, preserved overrides, adding/removing and last-valid refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms Filtering m materials builds a card options once; each refresh creates four fields for the selected authored override, while edits clone d document values and copy its material map before ordinary numerical construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fibre selection is view state and no numerical result cache is owned here; current draft reads preserve other pending material fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent owns section/options DOM until close and replaced entries release prior row/listener reachability; transaction promises and their worker frames remain panel-owned.
 */
export function mountConnectedFaceFibres(
  app: HTMLElement,
  props: IConnectedFaceAppearanceProps,
): {
  /** Redraw the selected card's authored fibre overrides from the latest draft. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const cards: IConnectedFaceAppearanceProps["basis"]["materials"] =
    props.basis.materials.filter(
      (
        material: IConnectedFaceAppearanceProps["basis"]["materials"][number],
      ): boolean =>
        typeof material.baseColorTexture === "string" &&
        (material.alphaMode === "mask" || material.alphaMode === "blend"),
    );
  const section: HTMLDetailsElement = dom.createElement("details");
  section.id = "face-fibres";
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = "Brow and lash fibres";
  const select: HTMLSelectElement = dom.createElement("select");
  select.id = "fibre-material";
  select.setAttribute("aria-label", "Fibre card");
  for (const material of cards) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = material.id;
    option.textContent = material.name;
    select.append(option);
  }
  const add: HTMLButtonElement = dom.createElement("button");
  add.id = "fibre-add";
  add.textContent = "Add fibre pigment";
  const remove: HTMLButtonElement = dom.createElement("button");
  remove.id = "fibre-remove";
  remove.textContent = "Remove fibre pigment";
  const entries: HTMLDivElement = dom.createElement("div");
  section.append(summary, select, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const commit: (
    edit: (next: IAutoMovieHumanFaceBasisDocument, id: string) => void,
  ) => Promise<void> = async (
    edit: (next: IAutoMovieHumanFaceBasisDocument, id: string) => void,
  ): Promise<void> => {
    try {
      const next: IAutoMovieHumanFaceBasisDocument = structuredClone(
        props.document(),
      );
      edit(next, select.value);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  add.onclick = (): Promise<void> =>
    commit((next: IAutoMovieHumanFaceBasisDocument, id: string): void => {
      next.materials = {
        ...next.materials,
        [id]: {
          ...next.materials?.[id],
          pigment: [...DEFAULT_PIGMENT],
          density: 1,
        },
      };
    });
  remove.onclick = (): Promise<void> =>
    commit((next: IAutoMovieHumanFaceBasisDocument, id: string): void => {
      const {
        pigment: _pigment,
        density: _density,
        ...rest
      }: Override = next.materials![id]!;
      if (Object.keys(rest).length === 0) delete next.materials![id];
      else next.materials![id] = rest;
    });
  const refresh: () => void = (): void => {
    entries.replaceChildren();
    const override: Override | undefined =
      props.document().materials?.[select.value];
    const authored: boolean =
      override?.pigment !== undefined || override?.density !== undefined;
    add.disabled = cards.length === 0 || authored;
    remove.disabled = !authored;
    if (!authored) return;
    const pigment: [number, number, number] =
      override!.pigment ?? DEFAULT_PIGMENT;
    const fields: FibreField[] = [
      ...["R", "G", "B"].map(
        (channel: string, axis: number): FibreField => ({
          text: `Fibre linear ${channel}`,
          id: `fibre-${channel.toLowerCase()}`,
          value: pigment[axis]!,
          apply: (current: Override, value: number): Override => {
            const next: [number, number, number] = [
              ...(current.pigment ?? DEFAULT_PIGMENT),
            ];
            next[axis] = value;
            return { ...current, pigment: next };
          },
        }),
      ),
      {
        text: "Density",
        id: "fibre-density",
        value: override!.density ?? 1,
        apply: (current: Override, value: number): Override => ({
          ...current,
          density: value,
        }),
      },
    ];
    for (const field of fields) {
      const label: HTMLLabelElement = dom.createElement("label");
      label.style.display = "block";
      label.textContent = field.text;
      const input: HTMLInputElement = dom.createElement("input");
      input.type = "number";
      input.id = field.id;
      input.step = "any";
      input.value = String(field.value);
      input.onchange = (): Promise<void> =>
        commit((next: IAutoMovieHumanFaceBasisDocument, id: string): void => {
          const value: number = Number(input.value);
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

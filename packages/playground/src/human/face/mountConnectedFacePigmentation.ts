import type {
  IAutoMovieHumanFaceBasisDocument,
  IPortraitColourField,
} from "@automovie/human";
import type { IConnectedFaceAppearanceProps } from "./IConnectedFaceAppearanceProps";

type PigmentCoordinate = { key: "center" | "radius" | "gain" | "strength"; axis: number };

/**
 * Author reference-space colour envelopes without editing JSON. Surface and region selection are view state. Every edit clones the latest document and enters the panel's existing transaction, validation and undo path. Centres and radii display millimetres and store metres; gains remain linear RGB. Neutral defaults add no colour until the author changes gain and strength. No field, surface name or placement is tied to a study subject.
 *
 * @evidence contracts/common.md#principled-implementation Current draft cloning and named-region lookup preserve unrelated fields, metre envelopes cross the millimetre display boundary once, and own skin-map properties keep source ids distinct from prototype names.
 * @evidence contracts/common.md#clear-and-simple-design The mount owns surface/region selection and coordinate inputs while shared appearance hooks retain document admission, history and refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neutral generic fields do not encode subject landmarks or colours, finite UI entry does not replace coupled range admission, and removed region identities refuse rather than redirecting an edit.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies reference coordinates, unit boundaries, neutral gain/strength, view-only selection, latest-draft cloning and transaction ownership.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans s surfaces for options, refresh scans p selected-surface regions and creates ten coordinate rows, and each edit clones d document values plus an O(p) named-region scan; new-name selection uses an O(p) name set rather than repeated full-list scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selection and region edits are authored effects without a numerical cache here; latest draft access preserves pending fields and model reuse stays with the viewport.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent owns section and selection DOM until close, entry replacement releases previous rows/listeners, and region count follows admitted document data with no extra local cap or independent GPU resource.
 */
export function mountConnectedFacePigmentation(
  app: HTMLElement,
  props: IConnectedFaceAppearanceProps,
): {
  /** Redraw the selected surface's region fields from the current draft. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const section: HTMLDetailsElement = dom.createElement("details");
  section.id = "face-pigmentation";
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = "Pigmentation regions";
  const style: HTMLStyleElement = dom.createElement("style");
  style.textContent =
    "#face-pigmentation label{display:grid;grid-template-columns:145px 1fr;gap:8px;margin:5px 0}#face-pigmentation input{width:100%;min-width:0;padding:3px}";
  const help: HTMLParagraphElement = dom.createElement("p");
  help.textContent =
    "Position and extent use the shared neutral head: X left, Y up, Z forward. " +
    "Colour follows face shape and expression. Small regions need enough surface samples.";
  const surface: HTMLSelectElement = dom.createElement("select");
  surface.id = "pigment-surface";
  surface.setAttribute("aria-label", "Pigmentation surface");
  for (const item of props.basis.surfaces) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = item.id;
    option.textContent = item.id;
    surface.append(option);
  }
  const region: HTMLSelectElement = dom.createElement("select");
  region.id = "pigment-region";
  region.setAttribute("aria-label", "Pigmentation region");
  const add: HTMLButtonElement = dom.createElement("button");
  add.id = "pigment-add";
  add.textContent = "Add region";
  const remove: HTMLButtonElement = dom.createElement("button");
  remove.id = "pigment-remove";
  remove.textContent = "Remove region";
  const entries: HTMLDivElement = dom.createElement("div");
  section.append(summary, style, help, surface, region, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const fieldsOf: (document: IAutoMovieHumanFaceBasisDocument, id: string) => IPortraitColourField[] = (
    document: IAutoMovieHumanFaceBasisDocument,
    id: string,
  ): IPortraitColourField[] =>
    Object.hasOwn(document.skin ?? {}, id) ? document.skin![id] : [];

  // Capture a surface before awaiting the worker. A later selection must not
  // redirect an in-flight edit to another surface.
  const edit: (update: (fields: IPortraitColourField[]) => void) => Promise<void> = async (
    update: (fields: IPortraitColourField[]) => void,
  ): Promise<void> => {
    try {
      const id: string = surface.value;
      const next: IAutoMovieHumanFaceBasisDocument = structuredClone(props.document());
      const fields: IPortraitColourField[] = fieldsOf(next, id);
      update(fields);
      next.skin ??= {};
      if (fields.length === 0) delete next.skin[id];
      else
        Object.defineProperty(next.skin, id, {
          value: fields,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };

  const editField: (name: string, update: (field: IPortraitColourField) => void) => Promise<void> = (
    name: string,
    update: (field: IPortraitColourField) => void,
  ): Promise<void> =>
    edit((fields: IPortraitColourField[]): void => {
      const field: IPortraitColourField | undefined = fields.find((one: IPortraitColourField): boolean => one.name === name);
      if (field === undefined)
        throw new Error("This pigmentation region is no longer present.");
      update(field);
    });

  const refresh: () => void = (): void => {
    const selected: string = region.value;
    const fields: IPortraitColourField[] = fieldsOf(props.document(), surface.value);
    region.replaceChildren();
    for (const field of fields) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = field.name;
      option.textContent = field.name;
      region.append(option);
    }
    if (fields.some((field: IPortraitColourField): boolean => field.name === selected))
      region.value = selected;
    const index: number = fields.findIndex((field: IPortraitColourField): boolean => field.name === region.value);
    add.disabled = !props.basis.surfaces.some(
      (one: IConnectedFaceAppearanceProps["basis"]["surfaces"][number]): boolean => one.id === surface.value,
    );
    remove.disabled = index < 0;
    entries.replaceChildren();
    if (index < 0) return;
    const field: IPortraitColourField = fields[index];
    const nameLabel: HTMLLabelElement = dom.createElement("label");
    nameLabel.textContent = "Name";
    const name: HTMLInputElement = dom.createElement("input");
    name.id = "pigment-name";
    name.value = field.name;
    name.onchange = (): Promise<void> =>
      editField(field.name, (item: IPortraitColourField): void => {
        item.name = name.value;
      });
    nameLabel.append(name);
    entries.append(nameLabel);
    const controls: PigmentCoordinate[] = [
      ...(["center", "radius", "gain"] as const).flatMap((key: "center" | "radius" | "gain"): PigmentCoordinate[] =>
        [0, 1, 2].map((axis: number): PigmentCoordinate => ({ key, axis })),
      ),
      { key: "strength" as const, axis: 0 },
    ];
    for (const { key, axis } of controls) {
      const metric: boolean = key === "center" || key === "radius";
      const scale: number = metric ? 1000 : 1;
      const label: HTMLLabelElement = dom.createElement("label");
      label.textContent =
        key === "strength"
          ? "Strength"
          : `${key === "gain" ? "Linear gain" : key === "center" ? "Centre" : "Radius"} ${
              (key === "gain" ? ["R", "G", "B"] : ["X", "Y", "Z"])[axis]
            }${metric ? " (mm)" : ""}`;
      const input: HTMLInputElement = dom.createElement("input");
      input.id = `pigment-${key}-${axis}`;
      input.type = "number";
      input.step = "any";
      if (key !== "center") input.min = "0";
      // A gain above one lightens (the builder folds it into the material).
      if (key === "strength") input.max = "1";
      input.value = String(
        (key === "strength" ? field.strength : field[key][axis]) * scale,
      );
      input.onchange = (): Promise<void> =>
        editField(field.name, (item: IPortraitColourField): void => {
          const value: number = Number(input.value) / scale;
          if (input.value.trim() === "" || !Number.isFinite(value))
            throw new Error("Pigmentation controls require a finite number.");
          if (key === "strength") item.strength = value;
          else item[key][axis] = value;
        });
      label.append(input);
      entries.append(label);
    }
  };
  add.onclick = (): Promise<void> =>
    edit((fields: IPortraitColourField[]): void => {
      const names: Set<string> = new Set(fields.map((field: IPortraitColourField): string => field.name));
      let ordinal: number = 1;
      while (names.has(`Region ${ordinal}`)) ordinal++;
      fields.push({
        name: `Region ${ordinal}`,
        center: [0, 0, 0],
        radius: [0.01, 0.01, 0.01],
        gain: [1, 1, 1],
        strength: 0,
      });
    });
  remove.onclick = (): Promise<void> => {
    const name: string = region.value;
    return edit((fields: IPortraitColourField[]): void => {
      const index: number = fields.findIndex((field: IPortraitColourField): boolean => field.name === name);
      if (index < 0)
        throw new Error("This pigmentation region is no longer present.");
      fields.splice(index, 1);
    });
  };
  surface.onchange = refresh;
  region.onchange = refresh;
  return { refresh };
}

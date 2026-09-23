import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IPortraitColourField,
} from "@automovie/human";

/**
 * Author reference-space colour envelopes without editing JSON. Surface and
 * region selection are view state. Every edit clones the latest document and
 * enters the panel's existing transaction, validation and undo path. Centres
 * and radii display millimetres and store metres; gains remain linear RGB.
 * Neutral defaults add no colour until the author changes gain and strength.
 * No field, surface name or placement is tied to a study subject.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Makes regional reflectance independently editable through numerical controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Routes surface field creation, editing and removal through the shared document history.
 */
export function mountConnectedFacePigmentation(
  app: HTMLElement,
  props: {
    basis: IAutoMovieHumanFaceBasis;
    document: () => IAutoMovieHumanFaceBasisDocument;
    change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;
    refuse: (error: unknown) => void;
  },
) {
  const dom = app.ownerDocument;
  const section = dom.createElement("details");
  section.id = "face-pigmentation";
  const summary = dom.createElement("summary");
  summary.textContent = "Pigmentation regions";
  const style = dom.createElement("style");
  style.textContent =
    "#face-pigmentation label{display:grid;grid-template-columns:145px 1fr;gap:8px;margin:5px 0}#face-pigmentation input{width:100%;min-width:0;padding:3px}";
  const help = dom.createElement("p");
  help.textContent =
    "Position and extent use the shared neutral head: X left, Y up, Z forward. " +
    "Colour follows face shape and expression. Small regions need enough surface samples.";
  const surface = dom.createElement("select");
  surface.id = "pigment-surface";
  surface.setAttribute("aria-label", "Pigmentation surface");
  for (const item of props.basis.surfaces) {
    const option = dom.createElement("option");
    option.value = item.id;
    option.textContent = item.id;
    surface.append(option);
  }
  const region = dom.createElement("select");
  region.id = "pigment-region";
  region.setAttribute("aria-label", "Pigmentation region");
  const add = dom.createElement("button");
  add.id = "pigment-add";
  add.textContent = "Add region";
  const remove = dom.createElement("button");
  remove.id = "pigment-remove";
  remove.textContent = "Remove region";
  const entries = dom.createElement("div");
  section.append(summary, style, help, surface, region, add, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const fieldsOf = (
    document: IAutoMovieHumanFaceBasisDocument,
    id: string,
  ): IPortraitColourField[] =>
    Object.hasOwn(document.skin ?? {}, id) ? document.skin![id] : [];

  // Capture a surface before awaiting the worker. A later selection must not
  // redirect an in-flight edit to another surface.
  const edit = async (
    update: (fields: IPortraitColourField[]) => void,
  ): Promise<void> => {
    try {
      const id = surface.value;
      const next = structuredClone(props.document());
      const fields = fieldsOf(next, id);
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

  const editField = (
    name: string,
    update: (field: IPortraitColourField) => void,
  ): Promise<void> =>
    edit((fields) => {
      const field = fields.find((one) => one.name === name);
      if (field === undefined)
        throw new Error("This pigmentation region is no longer present.");
      update(field);
    });

  const refresh = (): void => {
    const selected = region.value;
    const fields = fieldsOf(props.document(), surface.value);
    region.replaceChildren();
    for (const field of fields) {
      const option = dom.createElement("option");
      option.value = field.name;
      option.textContent = field.name;
      region.append(option);
    }
    if (fields.some((field) => field.name === selected))
      region.value = selected;
    const index = fields.findIndex((field) => field.name === region.value);
    add.disabled = !props.basis.surfaces.some(
      (one) => one.id === surface.value,
    );
    remove.disabled = index < 0;
    entries.replaceChildren();
    if (index < 0) return;
    const field = fields[index];
    const nameLabel = dom.createElement("label");
    nameLabel.textContent = "Name";
    const name = dom.createElement("input");
    name.id = "pigment-name";
    name.value = field.name;
    name.onchange = () =>
      editField(field.name, (item) => {
        item.name = name.value;
      });
    nameLabel.append(name);
    entries.append(nameLabel);
    const controls = [
      ...(["center", "radius", "gain"] as const).flatMap((key) =>
        [0, 1, 2].map((axis) => ({ key, axis })),
      ),
      { key: "strength" as const, axis: 0 },
    ];
    for (const { key, axis } of controls) {
      const metric = key === "center" || key === "radius";
      const scale = metric ? 1000 : 1;
      const label = dom.createElement("label");
      label.textContent =
        key === "strength"
          ? "Strength"
          : `${key === "gain" ? "Linear gain" : key === "center" ? "Centre" : "Radius"} ${
              (key === "gain" ? ["R", "G", "B"] : ["X", "Y", "Z"])[axis]
            }${metric ? " (mm)" : ""}`;
      const input = dom.createElement("input");
      input.id = `pigment-${key}-${axis}`;
      input.type = "number";
      input.step = "any";
      if (key !== "center") input.min = "0";
      if (!metric) input.max = "1";
      input.value = String(
        (key === "strength" ? field.strength : field[key][axis]) * scale,
      );
      input.onchange = () =>
        editField(field.name, (item) => {
          const value = Number(input.value) / scale;
          if (input.value.trim() === "" || !Number.isFinite(value))
            throw new Error("Pigmentation controls require a finite number.");
          if (key === "strength") item.strength = value;
          else item[key][axis] = value;
        });
      label.append(input);
      entries.append(label);
    }
  };
  add.onclick = () =>
    edit((fields) => {
      let ordinal = 1;
      while (fields.some((field) => field.name === `Region ${ordinal}`))
        ordinal++;
      fields.push({
        name: `Region ${ordinal}`,
        center: [0, 0, 0],
        radius: [0.01, 0.01, 0.01],
        gain: [1, 1, 1],
        strength: 0,
      });
    });
  remove.onclick = () => {
    const name = region.value;
    return edit((fields) => {
      const index = fields.findIndex((field) => field.name === name);
      if (index < 0)
        throw new Error("This pigmentation region is no longer present.");
      fields.splice(index, 1);
    });
  };
  surface.onchange = refresh;
  region.onchange = refresh;
  return { refresh };
}

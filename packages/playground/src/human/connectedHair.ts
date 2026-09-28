import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceHair,
} from "@automovie/human";

import { connectedHairFields } from "./connectedHairFields";

/**
 * Author numerical scalp layers through the connected panel's ordinary history.
 * Domain and layer selections are view state. Edits resolve the captured layer
 * identity in the latest document, so a stale control cannot redirect an edit
 * after selection or removal. Refusal restores committed values through refresh.
 * The simple mean-length input scales the six fine lengths together, preserving
 * their ratios; only those fine lengths are stored. All other coordinates remain
 * independently editable. New layers are an explicit generic styling starting
 * point in head metres, with no named portrait preset or hidden groom resource.
 * A gathering block is submitted atomically because an individual anchor or
 * radius may be unreachable until its companion lengths and tail are authored.
 * Rejected input remains in the visible draft so a user can correct it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Makes numeric hair layers, enums and a detail-preserving simple length control directly editable.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Sends fine canonical hair values through the same document transaction as facial shape and colour.
 */
export function mountConnectedFaceHair(
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
  section.id = "face-hair";
  const summary = dom.createElement("summary");
  summary.textContent = "Numerical hair";
  const help = dom.createElement("p");
  help.textContent =
    "Mean length scales all regional lengths together. Fine controls retain independent lengths, hairline, combing, curl and colour. Strip count describes geometry, not biological hair density.";
  const domains = props.basis.surfaces.flatMap((surface) =>
    (surface.hairDomains ?? []).map((domain) => ({
      surface: surface.id,
      domain: domain.id,
    })),
  );
  const domain = dom.createElement("select");
  domain.id = "hair-domain";
  domain.setAttribute("aria-label", "New hair growth domain");
  for (const [index, item] of domains.entries()) {
    const option = dom.createElement("option");
    option.value = String(index);
    option.textContent = `${item.surface} / ${item.domain}`;
    domain.append(option);
  }
  const selected = dom.createElement("select");
  selected.id = "hair-layer";
  selected.setAttribute("aria-label", "Hair layer");
  const add = dom.createElement("button"),
    remove = dom.createElement("button");
  add.id = "hair-add";
  add.textContent = "Add layer";
  remove.id = "hair-remove";
  remove.textContent = "Remove layer";
  const entries = dom.createElement("div");
  const gatherDrafts = new Map<string, Record<string, string>>();
  section.append(summary, help, domain, add, selected, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const edit = async (
    update: (layers: IAutoMovieHumanFaceHair.Layer[]) => void,
  ): Promise<void> => {
    try {
      const next = structuredClone(props.document());
      next.hair ??= { layers: [] };
      update(next.hair.layers);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  const editLayer = (
    id: string,
    update: (layer: IAutoMovieHumanFaceHair.Layer) => void,
  ): Promise<void> =>
    edit((layers) => {
      const layer = layers.find((item) => item.id === id);
      if (layer === undefined)
        throw new Error("This hair layer is no longer present.");
      update(layer);
    });
  const labelled = (
    parent: HTMLElement,
    title: string,
    input: HTMLElement,
  ): void => {
    const label = dom.createElement("label");
    label.style.display = "block";
    label.textContent = title + " ";
    label.append(input);
    parent.append(label);
  };
  const refresh = (): void => {
    const selection = selected.value,
      layers = props.document().hair?.layers ?? [];
    selected.replaceChildren();
    for (const layer of layers) {
      const option = dom.createElement("option");
      option.value = layer.id;
      option.textContent = layer.id;
      selected.append(option);
    }
    if (layers.some((layer) => layer.id === selection))
      selected.value = selection;
    const layer = layers.find((item) => item.id === selected.value);
    add.disabled = domains.length === 0 || layers.length >= 8;
    remove.disabled = layer === undefined;
    entries.replaceChildren();
    if (layer === undefined) return;
    const id = layer.id;
    const name = dom.createElement("input");
    name.id = "hair-name";
    name.value = id;
    name.onchange = () =>
      editLayer(id, (item) => {
        item.id = name.value;
      });
    labelled(entries, "Layer name", name);
    const binding = dom.createElement("select");
    binding.id = "hair-layer-domain";
    for (const [index, source] of domains.entries()) {
      const option = dom.createElement("option");
      option.value = String(index);
      option.textContent = `${source.surface} / ${source.domain}`;
      binding.append(option);
    }
    binding.value = String(
      domains.findIndex(
        (source) =>
          source.surface === layer.surface && source.domain === layer.domain,
      ),
    );
    binding.onchange = () =>
      editLayer(id, (item) => {
        const source =
          binding.value === "" ? undefined : domains[Number(binding.value)];
        if (source === undefined)
          throw new Error("Select a resident hair growth domain.");
        item.surface = source.surface;
        item.domain = source.domain;
      });
    labelled(entries, "Growth domain", binding);
    const roots = dom.createElement("input");
    roots.id = "hair-root-region";
    roots.type = "checkbox";
    roots.checked = layer.rootRegion !== undefined;
    roots.onchange = () =>
      editLayer(id, (item) => {
        if (roots.checked)
          item.rootRegion = { center: [0, 0, 0], spread: [0.1, 0.1, 0.1] };
        else delete item.rootRegion;
      });
    labelled(entries, "Localize roots", roots);
    // The guide hierarchy integrates an eighth of the roots and grows the
    // rest from their four nearest same-side guides, the ratio a production
    // groom uses; the fields below edit both once it is on.
    const guides = dom.createElement("input");
    guides.id = "hair-guides";
    guides.type = "checkbox";
    guides.checked = layer.guides !== undefined;
    guides.onchange = () =>
      editLayer(id, (item) => {
        if (guides.checked) item.guides = { fraction: 0.125, neighbours: 4 };
        else delete item.guides;
      });
    labelled(entries, "Guide hierarchy", guides);
    const mean = dom.createElement("input");
    mean.id = "hair-mean-length";
    mean.type = "number";
    mean.step = "any";
    mean.min = "0";
    mean.value = String(
      (layer.lengthAxes.reduce((sum, value) => sum + value, 0) / 6) * 1000,
    );
    mean.onchange = () =>
      editLayer(id, (item) => {
        const value = Number(mean.value) / 1000;
        if (mean.value.trim() === "" || !Number.isFinite(value) || value <= 0)
          throw new Error(
            "Mean hair length requires a positive finite number.",
          );
        const previous =
          item.lengthAxes.reduce((sum, length) => sum + length, 0) / 6;
        if (Number(mean.value) === previous * 1000) return;
        item.lengthAxes = item.lengthAxes.map(
          (length) => length * (value / previous),
        ) as typeof item.lengthAxes;
      });
    labelled(entries, "Mean regional length (mm)", mean);
    const mode = dom.createElement("select");
    mode.id = "hair-curl-mode";
    for (const value of ["wave", "helix"] as const) {
      const option = dom.createElement("option");
      option.value = value;
      option.textContent = value;
      mode.append(option);
    }
    mode.value = layer.curl.mode;
    mode.onchange = () =>
      editLayer(id, (item) => {
        if (mode.value !== "wave" && mode.value !== "helix")
          throw new Error("Select a supported curl mode.");
        item.curl.mode = mode.value;
      });
    labelled(entries, "Curl mode", mode);
    const part = dom.createElement("input");
    part.id = "hair-part";
    part.type = "checkbox";
    part.checked = layer.part !== undefined;
    part.onchange = () =>
      editLayer(id, (item) => {
        if (part.checked)
          item.part = {
            normal: [1, 0, 0],
            offset: 0,
            transitionWidth: 0.004,
            bias: [0, 0, -1],
            strength: 1,
            reach: 0.05,
          };
        else delete item.part;
      });
    labelled(entries, "Parting field", part);
    if (layer.part !== undefined) {
      const region = dom.createElement("input");
      region.id = "hair-part-region";
      region.type = "checkbox";
      region.checked = layer.part.region !== undefined;
      region.onchange = () =>
        editLayer(id, (item) => {
          if (item.part === undefined)
            throw new Error("This parting field is no longer present.");
          if (region.checked)
            item.part.region = { center: [0, 0, 0], spread: [0.1, 0.1, 0.1] };
          else delete item.part.region;
        });
      labelled(entries, "Localize parting", region);
    }
    const gathering = dom.createElement("details");
    gathering.id = "hair-gather";
    const gatheringTitle = dom.createElement("summary");
    gatheringTitle.textContent = "Gather at a scalp tie";
    gathering.append(gatheringTitle);
    const guidance = dom.createElement("p");
    guidance.textContent =
      "Set the tie position and tail together. Every root must have enough length to reach the tie. Applying gathering sets the guide fraction to one. Tail radius and reach may both be left blank.";
    gathering.append(guidance);
    const saved = layer.gather;
    const values: Record<string, string> = {
      polar:
        saved === undefined ? "" : String((saved.anchor.polar * 180) / Math.PI),
      azimuth:
        saved === undefined
          ? ""
          : String((saved.anchor.azimuth * 180) / Math.PI),
      radius: saved === undefined ? "" : String(saved.radius * 1000),
      strength: saved === undefined ? "1" : String(saved.strength),
      tailX: String(saved?.tail.direction[0] ?? 0),
      tailY: String(saved?.tail.direction[1] ?? -1),
      tailZ: String(saved?.tail.direction[2] ?? 0),
      spreadRadius:
        saved?.tail.spread === undefined
          ? ""
          : String(saved.tail.spread.radius * 1000),
      spreadReach:
        saved?.tail.spread === undefined
          ? ""
          : String(saved.tail.spread.reach * 1000),
      ...gatherDrafts.get(id),
    };
    const inputs = {} as Record<keyof typeof values, HTMLInputElement>;
    for (const [key, label] of [
      ["polar", "Tie polar angle (degrees from crown)"],
      ["azimuth", "Tie azimuth (degrees from front)"],
      ["radius", "Tie radius (mm)"],
      ["strength", "Gather strength"],
      ["tailX", "Tail direction X left"],
      ["tailY", "Tail direction Y up"],
      ["tailZ", "Tail direction Z forward"],
      ["spreadRadius", "Tail volume radius (mm, optional)"],
      ["spreadReach", "Tail volume transition (mm, optional)"],
    ] as const) {
      const input = dom.createElement("input");
      input.id = `hair-gather-${key}`;
      input.type = "number";
      input.step = "any";
      input.value = values[key];
      inputs[key] = input;
      labelled(gathering, label, input);
    }
    const applyGather = dom.createElement("button");
    applyGather.id = "hair-gather-apply";
    applyGather.textContent =
      saved === undefined ? "Add gathering" : "Apply gathering";
    applyGather.onclick = async () => {
      const draft = Object.fromEntries(
        Object.entries(inputs).map(([key, input]) => [key, input.value]),
      );
      gatherDrafts.set(id, draft);
      try {
        const read = (key: string, scale = 1): number => {
          const raw = draft[key];
          if (raw.trim() === "")
            throw new Error("Gathering fields need complete finite numbers.");
          const value = Number(raw) / scale;
          if (!Number.isFinite(value))
            throw new Error("Gathering fields need complete finite numbers.");
          return value;
        };
        const optional =
          draft.spreadRadius!.trim() !== "" || draft.spreadReach!.trim() !== "";
        const gather: NonNullable<IAutoMovieHumanFaceHair.Layer["gather"]> = {
          anchor: {
            polar: read("polar", 180 / Math.PI),
            azimuth: read("azimuth", 180 / Math.PI),
          },
          radius: read("radius", 1000),
          strength: read("strength"),
          tail: {
            direction: [read("tailX"), read("tailY"), read("tailZ")],
            ...(optional
              ? {
                  spread: {
                    radius: read("spreadRadius", 1000),
                    reach: read("spreadReach", 1000),
                  },
                }
              : {}),
          },
        };
        const next = structuredClone(props.document());
        const current = next.hair?.layers.find((item) => item.id === id);
        if (current === undefined)
          throw new Error("This hair layer is no longer present.");
        current.gather = gather;
        if (current.guides !== undefined) current.guides.fraction = 1;
        await props.change(next);
        // The panel's editor returns a resolved promise on a refused build.
        // Its committed document and status, not promise resolution, decide
        // whether the draft can be discarded.
        if (
          app.querySelector<HTMLElement>("#face-status")?.dataset.state ===
            "error" ||
          JSON.stringify(props.document()) !== JSON.stringify(next)
        )
          return;
        gatherDrafts.delete(id);
        refresh();
      } catch (error) {
        props.refuse(error);
      }
    };
    const removeGather = dom.createElement("button");
    removeGather.id = "hair-gather-remove";
    removeGather.textContent = "Remove gathering";
    removeGather.disabled = saved === undefined;
    removeGather.onclick = () => {
      gatherDrafts.delete(id);
      return editLayer(id, (item) => {
        delete item.gather;
      });
    };
    gathering.append(applyGather, removeGather);
    entries.append(gathering);
    const fine = dom.createElement("details"),
      title = dom.createElement("summary");
    title.textContent = "Fine hair parameters";
    fine.append(title);
    entries.append(fine);
    for (const field of connectedHairFields(layer)) {
      const input = dom.createElement("input");
      input.id = "hair-" + field.id;
      input.type = "number";
      input.step = "any";
      input.value = String(field.read(layer) * field.scale);
      input.onchange = () =>
        editLayer(id, (item) => {
          const value = Number(input.value) / field.scale;
          if (input.value.trim() === "" || !Number.isFinite(value))
            throw new Error("Hair controls require a finite number.");
          const current = connectedHairFields(item).find(
            (one) => one.id === field.id,
          );
          if (current === undefined)
            throw new Error("This fine hair field is no longer present.");
          if (Number(input.value) !== current.read(item) * current.scale)
            current.write(item, value);
        });
      labelled(fine, field.label, input);
    }
  };
  add.onclick = () =>
    edit((layers) => {
      const source =
        domain.value === "" ? undefined : domains[Number(domain.value)];
      if (source === undefined)
        throw new Error("Select a resident hair growth domain.");
      let ordinal = 1;
      while (layers.some((layer) => layer.id === `Layer ${ordinal}`)) ordinal++;
      layers.push({
        id: `Layer ${ordinal}`,
        ...source,
        count: 256,
        seed: 0,
        hairline: {
          front: Math.PI,
          left: Math.PI,
          right: Math.PI,
          back: Math.PI,
        },
        lengthAxes: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
        lengthVariation: 0.1,
        samplingStep: 0.001,
        clearance: 0.0005,
        flow: [0, -1, -0.2],
        lift: { strength: 0.3, reach: 0.015 },
        curl: { mode: "wave", angle: 0, wavelength: 0.03, reach: 0.02 },
        taper: { tipWidth: 0.1, start: 0.7 },
        finish: {
          color: [0.03, 0.02, 0.015],
          roughness: 0.7,
          fibres: 12,
          coverage: 0.8,
          normal: 0.2,
          shade: 1,
        },
      });
    });
  remove.onclick = () => {
    const id = selected.value;
    return edit((layers) => {
      const index = layers.findIndex((layer) => layer.id === id);
      if (index < 0) throw new Error("This hair layer is no longer present.");
      layers.splice(index, 1);
    });
  };
  selected.onchange = refresh;
  return { refresh };
}

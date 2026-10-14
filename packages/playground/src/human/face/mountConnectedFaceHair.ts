import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceHair,
} from "@automovie/human";

import type { IConnectedFaceAppearanceProps } from "./IConnectedFaceAppearanceProps";
import { connectedHairFields } from "./connectedHairFields";

type HairDomain = { surface: string; domain: string };

/**
 * Author numerical scalp layers through the connected panel's ordinary history. Domain and layer selections are view state. Edits resolve the captured layer identity in the latest document, so a stale control cannot redirect an edit after selection or removal. Refresh reads the parent's current draft; its recovery policy owns the committed document. The simple mean-length input scales the six fine lengths together, preserving their ratios; only those fine lengths are stored. All other coordinates remain independently editable. New layers are an explicit generic styling starting point in head metres, with no named portrait preset or hidden groom resource. A gathering block is submitted atomically because an individual anchor or radius may be unreachable until its companion lengths and tail are authored. Rejected input remains in the visible draft so a user can correct it. Gathering drafts use layer id and are removed after that id leaves the current document, including accepted renames or removal.
 *
 * @evidence contracts/common.md#principled-implementation Latest-layer identity protects edits after selection changes, mean length scales six stored lengths proportionally, and gathering submits its coupled block atomically with finite unit conversion before Human admission.
 * @evidence contracts/common.md#clear-and-simple-design The mount owns selected layer/domain and text drafts, fine descriptors own scalar access, and the shared appearance transaction owns numerical grooming and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic new-layer parameters are explicit styling data rather than a named portrait preset, strip count is not biological density, and void transaction completion alone cannot clear a refused gathering draft.
 * @evidence contracts/common.md#meaningful-documentation The comment explains captured identity, ratio-preserving mean length, stored fine coordinates, generic starting units, atomic gathering and id-scoped draft invalidation.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans source surfaces and h hair domains, refresh scans l admitted layers and constructs f selected-layer fields, and each edit clones d document values then resolves one layer; gathering confirmation serializes current and requested documents, adding O(d) text work before draft clearance.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mount reuses domain options and retains gathering text by current layer id, while numerical groom/texture reuse stays with the builder and viewport rather than a UI result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parent removal releases section DOM, row replacement retires old input reachability, and refresh removes gathering drafts for departed layer ids; current layer drafts have no extra local cap beyond admitted layer population, while pending numerical resources remain transaction-owned.
 */
export function mountConnectedFaceHair(
  app: HTMLElement,
  props: IConnectedFaceAppearanceProps,
): {
  /** Redraw latest selected-layer controls and retire drafts for absent layer identities. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const section: HTMLDetailsElement = dom.createElement("details");
  section.id = "face-hair";
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = "Numerical hair";
  const help: HTMLParagraphElement = dom.createElement("p");
  help.textContent =
    "Mean length scales all regional lengths together. Fine controls retain independent lengths, hairline, combing, curl and colour. Strip count describes geometry, not biological hair density.";
  const domains: HairDomain[] = props.basis.surfaces.flatMap(
    (
      surface: IConnectedFaceAppearanceProps["basis"]["surfaces"][number],
    ): HairDomain[] =>
      (surface.hairDomains ?? []).map(
        (
          domain: NonNullable<
            IConnectedFaceAppearanceProps["basis"]["surfaces"][number]["hairDomains"]
          >[number],
        ): HairDomain => ({
          surface: surface.id,
          domain: domain.id,
        }),
      ),
  );
  const domain: HTMLSelectElement = dom.createElement("select");
  domain.id = "hair-domain";
  domain.setAttribute("aria-label", "New hair growth domain");
  for (const [index, item] of domains.entries()) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = String(index);
    option.textContent = `${item.surface} / ${item.domain}`;
    domain.append(option);
  }
  const selected: HTMLSelectElement = dom.createElement("select");
  selected.id = "hair-layer";
  selected.setAttribute("aria-label", "Hair layer");
  const add: HTMLButtonElement = dom.createElement("button");
  const remove: HTMLButtonElement = dom.createElement("button");
  add.id = "hair-add";
  add.textContent = "Add layer";
  remove.id = "hair-remove";
  remove.textContent = "Remove layer";
  const entries: HTMLDivElement = dom.createElement("div");
  const gatherDrafts: Map<string, Record<string, string>> = new Map();
  section.append(summary, help, domain, add, selected, remove, entries);
  app.querySelector("#face-appearance")!.after(section);

  const edit: (
    update: (layers: IAutoMovieHumanFaceHair.Layer[]) => void,
  ) => Promise<void> = async (
    update: (layers: IAutoMovieHumanFaceHair.Layer[]) => void,
  ): Promise<void> => {
    try {
      const next: IAutoMovieHumanFaceBasisDocument = structuredClone(
        props.document(),
      );
      next.hair ??= { layers: [] };
      update(next.hair.layers);
      await props.change(next);
    } catch (error) {
      props.refuse(error);
    }
    refresh();
  };
  const editLayer: (
    id: string,
    update: (layer: IAutoMovieHumanFaceHair.Layer) => void,
  ) => Promise<void> = (
    id: string,
    update: (layer: IAutoMovieHumanFaceHair.Layer) => void,
  ): Promise<void> =>
    edit((layers: IAutoMovieHumanFaceHair.Layer[]): void => {
      const layer: IAutoMovieHumanFaceHair.Layer | undefined = layers.find(
        (item: IAutoMovieHumanFaceHair.Layer): boolean => item.id === id,
      );
      if (layer === undefined)
        throw new Error("This hair layer is no longer present.");
      update(layer);
    });
  const labelled: (
    parent: HTMLElement,
    title: string,
    input: HTMLElement,
  ) => void = (
    parent: HTMLElement,
    title: string,
    input: HTMLElement,
  ): void => {
    const label: HTMLLabelElement = dom.createElement("label");
    label.style.display = "block";
    label.textContent = title + " ";
    label.append(input);
    parent.append(label);
  };
  const refresh: () => void = (): void => {
    const selection: string = selected.value;
    const layers: IAutoMovieHumanFaceHair.Layer[] =
      props.document().hair?.layers ?? [];
    const live: Set<string> = new Set(
      layers.map((layer: IAutoMovieHumanFaceHair.Layer): string => layer.id),
    );
    for (const id of gatherDrafts.keys())
      if (!live.has(id)) gatherDrafts.delete(id);
    selected.replaceChildren();
    for (const layer of layers) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = layer.id;
      option.textContent = layer.id;
      selected.append(option);
    }
    if (
      layers.some(
        (layer: IAutoMovieHumanFaceHair.Layer): boolean =>
          layer.id === selection,
      )
    )
      selected.value = selection;
    const layer: IAutoMovieHumanFaceHair.Layer | undefined = layers.find(
      (item: IAutoMovieHumanFaceHair.Layer): boolean =>
        item.id === selected.value,
    );
    add.disabled = domains.length === 0 || layers.length >= 8;
    remove.disabled = layer === undefined;
    entries.replaceChildren();
    if (layer === undefined) return;
    const id: string = layer.id;
    const name: HTMLInputElement = dom.createElement("input");
    name.id = "hair-name";
    name.value = id;
    name.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        item.id = name.value;
      });
    labelled(entries, "Layer name", name);
    const binding: HTMLSelectElement = dom.createElement("select");
    binding.id = "hair-layer-domain";
    for (const [index, source] of domains.entries()) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = String(index);
      option.textContent = `${source.surface} / ${source.domain}`;
      binding.append(option);
    }
    binding.value = String(
      domains.findIndex(
        (source: HairDomain): boolean =>
          source.surface === layer.surface && source.domain === layer.domain,
      ),
    );
    binding.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        const source: HairDomain | undefined =
          binding.value === "" ? undefined : domains[Number(binding.value)];
        if (source === undefined)
          throw new Error("Select a resident hair growth domain.");
        item.surface = source.surface;
        item.domain = source.domain;
      });
    labelled(entries, "Growth domain", binding);
    const roots: HTMLInputElement = dom.createElement("input");
    roots.id = "hair-root-region";
    roots.type = "checkbox";
    roots.checked = layer.rootRegion !== undefined;
    roots.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        if (roots.checked)
          item.rootRegion = { center: [0, 0, 0], spread: [0.1, 0.1, 0.1] };
        else delete item.rootRegion;
      });
    labelled(entries, "Localize roots", roots);
    // This authored starting choice integrates an eighth of the roots and
    // grows the rest from four nearest same-side guides; it is not a universal
    // groom ratio. The fields below edit both values once guidance is on.
    const guides: HTMLInputElement = dom.createElement("input");
    guides.id = "hair-guides";
    guides.type = "checkbox";
    guides.checked = layer.guides !== undefined;
    guides.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        if (guides.checked) item.guides = { fraction: 0.125, neighbours: 4 };
        else delete item.guides;
      });
    labelled(entries, "Guide hierarchy", guides);
    const mean: HTMLInputElement = dom.createElement("input");
    mean.id = "hair-mean-length";
    mean.type = "number";
    mean.step = "any";
    mean.min = "0";
    mean.value = String(
      (layer.lengthAxes.reduce(
        (sum: number, value: number): number => sum + value,
        0,
      ) /
        6) *
        1000,
    );
    mean.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        const value: number = Number(mean.value) / 1000;
        if (mean.value.trim() === "" || !Number.isFinite(value) || value <= 0)
          throw new Error(
            "Mean hair length requires a positive finite number.",
          );
        const previous: number =
          item.lengthAxes.reduce(
            (sum: number, length: number): number => sum + length,
            0,
          ) / 6;
        if (Number(mean.value) === previous * 1000) return;
        item.lengthAxes = item.lengthAxes.map(
          (length: number): number => length * (value / previous),
        ) as typeof item.lengthAxes;
      });
    labelled(entries, "Mean regional length (mm)", mean);
    const mode: HTMLSelectElement = dom.createElement("select");
    mode.id = "hair-curl-mode";
    for (const value of ["wave", "helix"] as const) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = value;
      option.textContent = value;
      mode.append(option);
    }
    mode.value = layer.curl.mode;
    mode.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        if (mode.value !== "wave" && mode.value !== "helix")
          throw new Error("Select a supported curl mode.");
        item.curl.mode = mode.value;
      });
    labelled(entries, "Curl mode", mode);
    const part: HTMLInputElement = dom.createElement("input");
    part.id = "hair-part";
    part.type = "checkbox";
    part.checked = layer.part !== undefined;
    part.onchange = (): Promise<void> =>
      editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
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
      const region: HTMLInputElement = dom.createElement("input");
      region.id = "hair-part-region";
      region.type = "checkbox";
      region.checked = layer.part.region !== undefined;
      region.onchange = (): Promise<void> =>
        editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
          if (item.part === undefined)
            throw new Error("This parting field is no longer present.");
          if (region.checked)
            item.part.region = { center: [0, 0, 0], spread: [0.1, 0.1, 0.1] };
          else delete item.part.region;
        });
      labelled(entries, "Localize parting", region);
    }
    const gathering: HTMLDetailsElement = dom.createElement("details");
    gathering.id = "hair-gather";
    const gatheringTitle: HTMLElement = dom.createElement("summary");
    gatheringTitle.textContent = "Gather at a scalp tie";
    gathering.append(gatheringTitle);
    const guidance: HTMLParagraphElement = dom.createElement("p");
    guidance.textContent =
      "Set the tie position and tail together. Every root must have enough length to reach the tie. Applying gathering sets an existing guide fraction to one. Tail radius and reach may both be left blank.";
    gathering.append(guidance);
    const saved: IAutoMovieHumanFaceHair.Layer["gather"] = layer.gather;
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
    const inputs: Record<keyof typeof values, HTMLInputElement> = {};
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
      const input: HTMLInputElement = dom.createElement("input");
      input.id = `hair-gather-${key}`;
      input.type = "number";
      input.step = "any";
      input.value = values[key];
      inputs[key] = input;
      labelled(gathering, label, input);
    }
    const applyGather: HTMLButtonElement = dom.createElement("button");
    applyGather.id = "hair-gather-apply";
    applyGather.textContent =
      saved === undefined ? "Add gathering" : "Apply gathering";
    applyGather.onclick = async (): Promise<void> => {
      const draft: Record<string, string> = Object.fromEntries(
        Object.entries(inputs).map(
          ([key, input]: [string, HTMLInputElement]): [string, string] => [
            key,
            input.value,
          ],
        ),
      );
      gatherDrafts.set(id, draft);
      try {
        const read: (key: string, scale?: number) => number = (
          key: string,
          scale: number = 1,
        ): number => {
          const raw: string = draft[key];
          if (raw.trim() === "")
            throw new Error("Gathering fields need complete finite numbers.");
          const value: number = Number(raw) / scale;
          if (!Number.isFinite(value))
            throw new Error("Gathering fields need complete finite numbers.");
          return value;
        };
        const optional: boolean =
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
        const next: IAutoMovieHumanFaceBasisDocument = structuredClone(
          props.document(),
        );
        const current: IAutoMovieHumanFaceHair.Layer | undefined =
          next.hair?.layers.find(
            (item: IAutoMovieHumanFaceHair.Layer): boolean => item.id === id,
          );
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
    const removeGather: HTMLButtonElement = dom.createElement("button");
    removeGather.id = "hair-gather-remove";
    removeGather.textContent = "Remove gathering";
    removeGather.disabled = saved === undefined;
    removeGather.onclick = (): Promise<void> => {
      gatherDrafts.delete(id);
      return editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
        delete item.gather;
      });
    };
    gathering.append(applyGather, removeGather);
    entries.append(gathering);
    const fine: HTMLDetailsElement = dom.createElement("details");
    const title: HTMLElement = dom.createElement("summary");
    title.textContent = "Fine hair parameters";
    fine.append(title);
    entries.append(fine);
    for (const field of connectedHairFields(layer)) {
      const input: HTMLInputElement = dom.createElement("input");
      input.id = "hair-" + field.id;
      input.type = "number";
      input.step = "any";
      input.value = String(field.read(layer) * field.scale);
      input.onchange = (): Promise<void> =>
        editLayer(id, (item: IAutoMovieHumanFaceHair.Layer): void => {
          const value: number = Number(input.value) / field.scale;
          if (input.value.trim() === "" || !Number.isFinite(value))
            throw new Error("Hair controls require a finite number.");
          const current:
            | ReturnType<typeof connectedHairFields>[number]
            | undefined = connectedHairFields(item).find(
            (one: ReturnType<typeof connectedHairFields>[number]): boolean =>
              one.id === field.id,
          );
          if (current === undefined)
            throw new Error("This fine hair field is no longer present.");
          if (Number(input.value) !== current.read(item) * current.scale)
            current.write(item, value);
        });
      labelled(fine, field.label, input);
    }
  };
  add.onclick = (): Promise<void> =>
    edit((layers: IAutoMovieHumanFaceHair.Layer[]): void => {
      const source: HairDomain | undefined =
        domain.value === "" ? undefined : domains[Number(domain.value)];
      if (source === undefined)
        throw new Error("Select a resident hair growth domain.");
      let ordinal: number = 1;
      while (
        layers.some(
          (layer: IAutoMovieHumanFaceHair.Layer): boolean =>
            layer.id === `Layer ${ordinal}`,
        )
      )
        ordinal++;
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
  remove.onclick = (): Promise<void> => {
    const id: string = selected.value;
    return edit((layers: IAutoMovieHumanFaceHair.Layer[]): void => {
      const index: number = layers.findIndex(
        (layer: IAutoMovieHumanFaceHair.Layer): boolean => layer.id === id,
      );
      if (index < 0) throw new Error("This hair layer is no longer present.");
      layers.splice(index, 1);
    });
  };
  selected.onchange = refresh;
  return { refresh };
}

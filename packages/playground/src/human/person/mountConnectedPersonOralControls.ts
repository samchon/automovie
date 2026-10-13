import type { IAutoMovieHumanFaceOral } from "@automovie/human/face/structures/IAutoMovieHumanFaceOral";

import type { IConnectedPersonOralControlsProps } from "./IConnectedPersonOralControlsProps";

/**
 * Edit 32 permanent crown codes, both arches, oral space and independent tongue identity/performance through the ordinary person transaction. Blank dimensions omit overrides; source geometry then belongs to the oral owner. Three presence states distinguish source omission from explicit presence/absence. Apply constructs an oral override even when all numeric fields are empty; Remove omits that override. Units are authored millimetres, not clinical crown axes or hidden-root measurements.
 *
 * @evidence contracts/common.md#principled-implementation Quadrant/position codes identify the fixed permanent-crown population; finite entered scalars and explicit presence form a sparse oral record while blank fields retain omission and owner construction decides geometry.
 * @evidence contracts/common.md#clear-and-simple-design One field-map reader serves crown, arch, space and tongue groups, and one commit replaces/removes oral data through the existing panel transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No eruption observation, clinical dimension or population default is guessed. A reported publication can be accepted history or a labelled refused construction draft; the transaction's Boolean alone does not distinguish them.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies fixed crown codes, three-state presence, omission/removal and authored versus unmeasured clinical dimensions.
 * @evidence contracts/performance.md#efficient-algorithms Fixed fields produce constant-size DOM/maps and one scan per apply/refresh. Commit clones the whole n-size person document before the worker's full construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Field controls are reused by refresh without replacing active numeric input; each apply is an independent authored transaction and no numerical result is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed field/presence maps and handlers live with the panel DOM. There is no local close or repeated-click task cap; panel/transport owners withdraw stale intents and close numerical work, while detached DOM releases controls without external references.
 *
 * @author Samchon
 */
export function mountConnectedPersonOralControls(
  props: IConnectedPersonOralControlsProps,
): { refresh: () => void } {
  const inputs: Map<string, HTMLInputElement> = new Map();
  const presence: Map<string, HTMLSelectElement> = new Map();
  const toothFields: readonly ["widthMm", "depthMm", "heightMm"] = ["widthMm", "depthMm", "heightMm"];
  const archFields: readonly ["widthMm", "depthMm", "elevationMm", "projectionMm", "gingivalHeightMm", "gingivalThicknessMm"] = [
    "widthMm",
    "depthMm",
    "elevationMm",
    "projectionMm",
    "gingivalHeightMm",
    "gingivalThicknessMm",
  ] as const;
  const spaceFields: readonly ["palateHeightMm", "floorDepthMm", "wallClearanceMm", "posteriorReachMm"] = [
    "palateHeightMm",
    "floorDepthMm",
    "wallClearanceMm",
    "posteriorReachMm",
  ] as const;
  const tongueFields: readonly ["widthMm", "lengthMm", "heightMm", "dorsumRiseMm"] = [
    "widthMm",
    "lengthMm",
    "heightMm",
    "dorsumRiseMm",
  ] as const;
  const performanceFields: readonly ["tongueTipLiftMm", "tongueTipAdvanceMm", "tongueTipLateralMm"] = [
    "tongueTipLiftMm",
    "tongueTipAdvanceMm",
    "tongueTipLateralMm",
  ] as const;
  const ids: `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`[] = ([1, 2, 3, 4] as const).flatMap((quadrant: 1 | 2 | 3 | 4): `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`[] =>
    ([1, 2, 3, 4, 5, 6, 7, 8] as const).map(
      (position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` => `${quadrant}${position}` as const,
    ),
  );
  const help: HTMLParagraphElement = props.dom.createElement("p");
  help.textContent =
    "Coarse source oral assembly. Dimensions are authored millimetres; blank values retain source shape. Crown dimensions use the source head axes. Clinical crown axes, tissue thickness and hidden roots remain unmeasured.";
  props.container.append(help);
  const group: (prefix: string, label: string, fields: readonly string[]) => HTMLDetailsElement = (
    prefix: string,
    label: string,
    fields: readonly string[],
  ): HTMLDetailsElement => {
    const details: HTMLDetailsElement = props.dom.createElement("details"),
      summary: HTMLElement = props.dom.createElement("summary");
    summary.textContent = label;
    details.append(summary);
    for (const field of fields) {
      const row: HTMLDivElement = props.dom.createElement("div"),
        caption: HTMLLabelElement = props.dom.createElement("label"),
        input: HTMLInputElement = props.dom.createElement("input");
      row.className = "row";
      input.type = "number";
      input.step = "any";
      input.id = "oral-" + prefix + "-" + field;
      caption.htmlFor = input.id;
      caption.textContent = field + " (mm)";
      row.append(caption, input);
      details.append(row);
      inputs.set(prefix + ":" + field, input);
    }
    props.container.append(details);
    return details;
  };
  for (const id of ids) {
    const details: HTMLDetailsElement = group("tooth-" + id, "Tooth " + id, toothFields);
    const select: HTMLSelectElement = props.dom.createElement("select");
    select.id = "oral-tooth-" + id + "-present";
    select.setAttribute("aria-label", "Tooth " + id + " presence");
    for (const [value, label] of [
      ["", "Source presence"],
      ["true", "Present"],
      ["false", "Absent"],
    ]) {
      const option: HTMLOptionElement = props.dom.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    details.append(select);
    presence.set(id, select);
  }
  group("maxillary", "Upper arch and gingiva", archFields);
  group("mandibular", "Lower arch and gingiva", archFields);
  group("space", "Palate, floor and walls", spaceFields);
  group("tongue", "Tongue identity", tongueFields);
  group("performance", "Tongue performance", performanceFields);
  const read: <K extends string>(prefix: string, fields: readonly K[]) => Partial<Record<K, number>> = <K extends string>(
    prefix: string,
    fields: readonly K[],
  ): Partial<Record<K, number>> => {
    const values: Partial<Record<K, number>> = {};
    for (const field of fields) {
      const text: string = inputs.get(prefix + ":" + field)!.value.trim();
      if (text === "") continue;
      const value: number = Number(text);
      if (!Number.isFinite(value))
        throw new Error(
          "A finite oral " + prefix + " " + field + " is required.",
        );
      values[field] = value;
    }
    return values;
  };
  const commit: (oral: IAutoMovieHumanFaceOral | undefined) => Promise<void> = async (
    oral: IAutoMovieHumanFaceOral | undefined,
  ): Promise<void> => {
    const ticket: number = props.reserve();
    props.busy("Applying oral assembly...");
    try {
      const person: ReturnType<typeof props.current> = structuredClone(props.current());
      if (oral === undefined) delete person.face.oral;
      else person.face.oral = oral;
      if ((await props.change(person, ticket)) && props.isCurrent(ticket))
        props.report(
          oral === undefined
            ? "Oral assembly removed."
            : "Oral assembly applied.",
        );
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  const apply: HTMLButtonElement = props.dom.createElement("button"),
    remove: HTMLButtonElement = props.dom.createElement("button");
  apply.type = "button";
  remove.type = "button";
  apply.id = "oral-apply";
  remove.id = "oral-remove";
  apply.textContent = "Generate oral assembly";
  remove.textContent = "Remove oral assembly";
  apply.onclick = (): void => {
    try {
      const oral: IAutoMovieHumanFaceOral = {};
      const teeth: NonNullable<IAutoMovieHumanFaceOral["teeth"]> = {};
      for (const id of ids) {
        const tooth: Partial<Record<(typeof toothFields)[number], number>> = read("tooth-" + id, toothFields);
        const selected: string = presence.get(id)!.value;
        if (Object.keys(tooth).length !== 0 || selected !== "")
          teeth[id] = {
            ...tooth,
            ...(selected === "" ? {} : { present: selected === "true" }),
          };
      }
      if (Object.keys(teeth).length !== 0) oral.teeth = teeth;
      const maxillary: Partial<Record<(typeof archFields)[number], number>> = read("maxillary", archFields),
        mandibular: Partial<Record<(typeof archFields)[number], number>> = read("mandibular", archFields);
      const space: Partial<Record<(typeof spaceFields)[number], number>> = read("space", spaceFields),
        tongue: Partial<Record<(typeof tongueFields)[number], number>> = read("tongue", tongueFields),
        performance: Partial<Record<(typeof performanceFields)[number], number>> = read("performance", performanceFields);
      if (Object.keys(maxillary).length !== 0) oral.maxillary = maxillary;
      if (Object.keys(mandibular).length !== 0) oral.mandibular = mandibular;
      if (Object.keys(space).length !== 0) oral.space = space;
      if (Object.keys(tongue).length !== 0) oral.tongue = tongue;
      if (Object.keys(performance).length !== 0) oral.performance = performance;
      void commit(oral);
    } catch (error) {
      props.refuse(error);
    }
  };
  remove.onclick = (): void => void commit(undefined);
  props.container.append(apply, remove);
  const fill: <K extends string>(prefix: string, fields: readonly K[], values: Partial<Record<K, number>> | undefined) => void = <K extends string>(
    prefix: string,
    fields: readonly K[],
    values: Partial<Record<K, number>> | undefined,
  ): void => {
    for (const field of fields) {
      const input: HTMLInputElement = inputs.get(prefix + ":" + field)!;
      if (props.dom.activeElement !== input)
        input.value = values?.[field]?.toString() ?? "";
    }
  };
  return {
    refresh: (): void => {
      const oral: IAutoMovieHumanFaceOral | undefined = props.current().face.oral;
      for (const id of ids) {
        fill("tooth-" + id, toothFields, oral?.teeth?.[id]);
        const select: HTMLSelectElement = presence.get(id)!;
        if (props.dom.activeElement !== select)
          select.value = oral?.teeth?.[id]?.present?.toString() ?? "";
      }
      fill("maxillary", archFields, oral?.maxillary);
      fill("mandibular", archFields, oral?.mandibular);
      fill("space", spaceFields, oral?.space);
      fill("tongue", tongueFields, oral?.tongue);
      fill("performance", performanceFields, oral?.performance);
    },
  };
}

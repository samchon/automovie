import type { IAutoMovieHumanFaceOral } from "@automovie/human/face/structures/IAutoMovieHumanFaceOral";

import type { IConnectedPersonOralControlsProps } from "./IConnectedPersonOralControlsProps";

/**
 * Edit every permanent crown, both arches, oral space and independent tongue
 * identity/performance through the connected person's existing transaction.
 * Blank dimensions retain source geometry. Presence has three states, so an
 * omitted source trait is not rewritten as a personal eruption observation.
 * Apply generates the assembly even with empty numerical fields; Remove
 * returns to the historical source assembly. Save/load and history retain
 * exact authored values. No clinical population settings are filled in.
 * @author Samchon
 */
export function mountConnectedPersonOralControls(
  props: IConnectedPersonOralControlsProps,
) {
  const inputs = new Map<string, HTMLInputElement>();
  const presence = new Map<string, HTMLSelectElement>();
  const toothFields = ["widthMm", "depthMm", "heightMm"] as const;
  const archFields = [
    "widthMm",
    "depthMm",
    "elevationMm",
    "projectionMm",
    "gingivalHeightMm",
    "gingivalThicknessMm",
  ] as const;
  const spaceFields = [
    "palateHeightMm",
    "floorDepthMm",
    "wallClearanceMm",
    "posteriorReachMm",
  ] as const;
  const tongueFields = [
    "widthMm",
    "lengthMm",
    "heightMm",
    "dorsumRiseMm",
  ] as const;
  const performanceFields = [
    "tongueTipLiftMm",
    "tongueTipAdvanceMm",
    "tongueTipLateralMm",
  ] as const;
  const ids = ([1, 2, 3, 4] as const).flatMap((quadrant) =>
    ([1, 2, 3, 4, 5, 6, 7, 8] as const).map(
      (position) => `${quadrant}${position}` as const,
    ),
  );
  const help = props.dom.createElement("p");
  help.textContent =
    "Coarse source oral assembly. Dimensions are authored millimetres; blank values retain source shape. Crown dimensions use the source head axes. Clinical crown axes, tissue thickness and hidden roots remain unmeasured.";
  props.container.append(help);
  const group = (
    prefix: string,
    label: string,
    fields: readonly string[],
  ): HTMLDetailsElement => {
    const details = props.dom.createElement("details"),
      summary = props.dom.createElement("summary");
    summary.textContent = label;
    details.append(summary);
    for (const field of fields) {
      const row = props.dom.createElement("div"),
        caption = props.dom.createElement("label"),
        input = props.dom.createElement("input");
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
    const details = group("tooth-" + id, "Tooth " + id, toothFields);
    const select = props.dom.createElement("select");
    select.id = "oral-tooth-" + id + "-present";
    select.setAttribute("aria-label", "Tooth " + id + " presence");
    for (const [value, label] of [
      ["", "Source presence"],
      ["true", "Present"],
      ["false", "Absent"],
    ]) {
      const option = props.dom.createElement("option");
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
  const read = <K extends string>(
    prefix: string,
    fields: readonly K[],
  ): Partial<Record<K, number>> => {
    const values: Partial<Record<K, number>> = {};
    for (const field of fields) {
      const text = inputs.get(prefix + ":" + field)!.value.trim();
      if (text === "") continue;
      const value = Number(text);
      if (!Number.isFinite(value))
        throw new Error(
          "A finite oral " + prefix + " " + field + " is required.",
        );
      values[field] = value;
    }
    return values;
  };
  const commit = async (
    oral: IAutoMovieHumanFaceOral | undefined,
  ): Promise<void> => {
    const ticket = props.reserve();
    props.busy("Applying oral assembly...");
    try {
      const person = structuredClone(props.current());
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
  const apply = props.dom.createElement("button"),
    remove = props.dom.createElement("button");
  apply.type = "button";
  remove.type = "button";
  apply.id = "oral-apply";
  remove.id = "oral-remove";
  apply.textContent = "Generate oral assembly";
  remove.textContent = "Remove oral assembly";
  apply.onclick = () => {
    try {
      const oral: IAutoMovieHumanFaceOral = {};
      const teeth: NonNullable<IAutoMovieHumanFaceOral["teeth"]> = {};
      for (const id of ids) {
        const tooth = read("tooth-" + id, toothFields);
        const selected = presence.get(id)!.value;
        if (Object.keys(tooth).length !== 0 || selected !== "")
          teeth[id] = {
            ...tooth,
            ...(selected === "" ? {} : { present: selected === "true" }),
          };
      }
      if (Object.keys(teeth).length !== 0) oral.teeth = teeth;
      const maxillary = read("maxillary", archFields),
        mandibular = read("mandibular", archFields);
      const space = read("space", spaceFields),
        tongue = read("tongue", tongueFields),
        performance = read("performance", performanceFields);
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
  remove.onclick = () => void commit(undefined);
  props.container.append(apply, remove);
  const fill = <K extends string>(
    prefix: string,
    fields: readonly K[],
    values: Partial<Record<K, number>> | undefined,
  ): void => {
    for (const field of fields) {
      const input = inputs.get(prefix + ":" + field)!;
      if (props.dom.activeElement !== input)
        input.value = values?.[field]?.toString() ?? "";
    }
  };
  return {
    refresh: (): void => {
      const oral = props.current().face.oral;
      for (const id of ids) {
        fill("tooth-" + id, toothFields, oral?.teeth?.[id]);
        const select = presence.get(id)!;
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

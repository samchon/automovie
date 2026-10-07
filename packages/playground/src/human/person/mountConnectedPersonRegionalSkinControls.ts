import type { IAutoMovieHumanFaceRegionalRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceRegionalRelief";
import type { IAutoMovieHumanFaceSkinRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceSkinRelief";
import type { IConnectedPersonSkinReliefControlsProps } from "./IConnectedPersonSkinReliefControlsProps";

/**
 * Edit source-host regional skin identity independently of performed folds.
 * Existing nasolabial settings and raw clinical observations are preserved.
 * Blank regions are omitted; an authored region requires its support width.
 * The person worker owns geometry admission, last-valid history and saving.
 * @author Samchon
 */
export function mountConnectedPersonRegionalSkinControls(props: IConnectedPersonSkinReliefControlsProps) {
  const regions = ["forehead", "glabellar", "marionetteLeft", "marionetteRight", "philtralLeft", "philtralRight", "perioralUpper", "perioralLower"] as const;
  const common = ["restOffsetMm", "foldDepthMm", "performance", "widthMm"] as const;
  const inputs = new Map<string, HTMLInputElement>();
  const fields = (region: typeof regions[number]): readonly (keyof IAutoMovieHumanFaceRegionalRelief)[] =>
    region === "forehead" ? [...common, "lengthMm", "elevationMm"] : region === "glabellar" ? [...common, "lengthMm"] : common;
  const help = props.dom.createElement("p");
  help.textContent = "Regional source skin: positive resting offset adds an outward ridge along the local skin normal, negative adds an inward hollow. Fold depth and its performed fraction are independent. Forehead guide height and length are authored dimensions; clinical age and severity grades remain observations.";
  props.container.append(help);
  for (const region of regions) {
    const details = props.dom.createElement("details"), summary = props.dom.createElement("summary");
    summary.textContent = region; details.append(summary);
    for (const field of fields(region)) {
      const row = props.dom.createElement("div"), label = props.dom.createElement("label"), input = props.dom.createElement("input");
      row.className = "row"; input.type = "number"; input.step = "any";
      input.id = "skin-region-" + region + "-" + field; label.htmlFor = input.id;
      label.textContent = field + (field === "performance" ? " (fraction 0–1)" : " (mm)");
      row.append(label, input); details.append(row); inputs.set(region + ":" + field, input);
    }
    props.container.append(details);
  }
  const commit = async (regions: IAutoMovieHumanFaceSkinRelief.Regions | undefined): Promise<void> => {
    const ticket = props.reserve(); props.busy("Applying regional skin...");
    try {
      const person = structuredClone(props.current());
      if (regions === undefined) {
        if (person.face.skinRelief !== undefined) {
          delete person.face.skinRelief.regions;
          if (Object.keys(person.face.skinRelief).length === 0) delete person.face.skinRelief;
        }
      } else person.face.skinRelief = { ...person.face.skinRelief, regions };
      if (await props.change(person, ticket) && props.isCurrent(ticket))
        props.report(regions === undefined ? "Regional skin removed." : "Regional skin applied.");
    } catch (error) { if (props.isCurrent(ticket)) props.refuse(error); }
  };
  const apply = props.dom.createElement("button"), remove = props.dom.createElement("button");
  apply.type = "button";
  remove.type = "button";
  apply.id = "skin-regions-apply";
  remove.id = "skin-regions-remove";
  apply.textContent = "Apply regional skin"; remove.textContent = "Remove regional skin";
  apply.onclick = () => {
    try {
      const record: IAutoMovieHumanFaceSkinRelief.Regions = {};
      for (const region of regions) {
        const values: Partial<IAutoMovieHumanFaceRegionalRelief> = {};
        for (const field of fields(region)) {
          const text = inputs.get(region + ":" + field)!.value.trim(); if (text === "") continue;
          const value = Number(text); if (!Number.isFinite(value)) throw new Error("A finite regional skin " + region + " " + field + " is required.");
          values[field] = value;
        }
        if (Object.keys(values).length === 0) continue;
        if (values.widthMm === undefined) throw new Error("Regional skin " + region + " requires a support width.");
        record[region] = { ...values, widthMm: values.widthMm };
      }
      void commit(Object.keys(record).length === 0 ? undefined : record);
    } catch (error) { props.refuse(error); }
  };
  remove.onclick = () => void commit(undefined); props.container.append(apply, remove);
  return { refresh: (): void => {
    const record = props.current().face.skinRelief?.regions;
    for (const region of regions) for (const field of fields(region)) {
      const input = inputs.get(region + ":" + field)!;
      if (props.dom.activeElement !== input) input.value = record?.[region]?.[field]?.toString() ?? "";
    }
  } };
}

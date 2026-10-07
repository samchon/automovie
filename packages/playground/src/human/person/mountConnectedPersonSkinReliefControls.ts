import type { IAutoMovieHumanFaceNasolabialRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceNasolabialRelief";
import type { IAutoMovieHumanFaceSkinRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceSkinRelief";

import type { IConnectedPersonSkinReliefControlsProps } from "./IConnectedPersonSkinReliefControlsProps";

/**
 * Edit independent resting and smile-dependent nasolabial relief on the
 * connected person. Inputs are additional authored millimetres, separate from
 * the clinical observations panel. A completely empty side is omitted; a
 * present side requires its support width. Apply uses the worker's geometry
 * admission and history, and Remove restores the source relief. No assumed
 * population setting is filled in. Save/load and undo/redo refresh the actual
 * recorded values, preserving an active input while it is being typed.
 *
 * @author Samchon
 */
export function mountConnectedPersonSkinReliefControls(
  props: IConnectedPersonSkinReliefControlsProps,
) {
  const fields: (keyof IAutoMovieHumanFaceNasolabialRelief)[] = [
    "restDepthMm", "smileDepthMm", "widthMm",
  ];
  const inputs = new Map<string, HTMLInputElement>();
  const help = props.dom.createElement("p");
  help.textContent = "Additional nasolabial relief in mm. Resting depth and the extra depth at full smile are independent. Clinical severity grades remain observations.";
  props.container.append(help);
  for (const side of ["left", "right"] as const)
    for (const field of fields) {
      const row = props.dom.createElement("div");
      const label = props.dom.createElement("label");
      const input = props.dom.createElement("input");
      row.className = "row";
      input.id = `skin-relief-${side}-${field}`;
      input.type = "number";
      input.step = "any";
      label.htmlFor = input.id;
      label.textContent = `${side} ${field} (mm)`;
      row.append(label, input);
      props.container.append(row);
      inputs.set(input.id, input);
    }
  const apply = props.dom.createElement("button");
  const remove = props.dom.createElement("button");
  apply.type = "button";
  remove.type = "button";
  apply.id = "skin-relief-apply";
  remove.id = "skin-relief-remove";
  apply.textContent = "Apply skin relief";
  remove.textContent = "Remove nasolabial relief";
  props.container.append(apply, remove);
  const commit = async (relief: IAutoMovieHumanFaceSkinRelief | undefined): Promise<void> => {
    const ticket = props.reserve();
    props.busy("Applying skin relief…");
    try {
      const person = structuredClone(props.current());
      if (relief === undefined) {
        if (person.face.skinRelief !== undefined) {
          delete person.face.skinRelief.nasolabial;
          if (Object.keys(person.face.skinRelief).length === 0) delete person.face.skinRelief;
        }
      } else person.face.skinRelief = { ...person.face.skinRelief, nasolabial: relief.nasolabial };
      const success = await props.change(person, ticket);
      if (success && props.isCurrent(ticket))
        props.report(relief === undefined ? "Skin relief removed." : "Skin relief applied.");
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  apply.onclick = () => {
    try {
      const nasolabial: IAutoMovieHumanFaceSkinRelief.Nasolabial = {};
      for (const side of ["left", "right"] as const) {
        const values: Partial<IAutoMovieHumanFaceNasolabialRelief> = {};
        for (const field of fields) {
          const text = inputs.get(`skin-relief-${side}-${field}`)!.value.trim();
          if (text === "") continue;
          const value = Number(text);
          if (!Number.isFinite(value))
            throw new Error(`A finite ${side} ${field} is required.`);
          values[field] = value;
        }
        if (Object.keys(values).length === 0) continue;
        if (values.widthMm === undefined)
          throw new Error(`A ${side} support width is required for skin relief.`);
        nasolabial[side] = { ...values, widthMm: values.widthMm };
      }
      void commit(Object.keys(nasolabial).length === 0 ? undefined : { nasolabial });
    } catch (error) {
      props.refuse(error);
    }
  };
  remove.onclick = () => void commit(undefined);
  return {
    refresh: (): void => {
      const relief = props.current().face.skinRelief?.nasolabial;
      for (const side of ["left", "right"] as const)
        for (const field of fields) {
          const input = inputs.get(`skin-relief-${side}-${field}`)!;
          if (props.dom.activeElement !== input)
            input.value = relief?.[side]?.[field]?.toString() ?? "";
        }
    },
  };
}

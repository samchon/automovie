import type { IAutoMovieHumanFaceNasolabialRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceNasolabialRelief";
import type { IAutoMovieHumanFaceSkinRelief } from "@automovie/human/face/structures/IAutoMovieHumanFaceSkinRelief";

import type { IConnectedPersonSkinReliefControlsProps } from "./IConnectedPersonSkinReliefControlsProps";

/**
 * Edit independent resting and smile-dependent nasolabial relief in authored millimetres, separately from clinical observations. Empty sides omit overrides; entered sides require support width. Removal deletes only nasolabial overrides and preserves regional skin settings. Refresh reads the displayed draft and preserves an active input's text; generation admission and history belong to the ordinary person transaction.
 *
 * @evidence contracts/common.md#principled-implementation Finite entered values and required support width produce left/right sparse records without converting clinical severity into geometry; deletion preserves other skin-relief members.
 * @evidence contracts/common.md#clear-and-simple-design One field map supports apply and refresh, and one commit delegates publication to the existing person panel rather than owning a second geometry/history path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population setting is supplied for blank fields. Successful publication can be accepted history or a labelled refused construction draft, so the status message does not independently certify admission.
 * @evidence contracts/common.md#meaningful-documentation The comment defines authored units, omission/support requirements, preserved regional settings and active-input refresh behavior.
 * @evidence contracts/performance.md#efficient-algorithms Two sides with three fields bound DOM/scan work; commit clones the whole person document before its numerical construction and admission costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refresh reuses existing controls and preserves active entry; effectful applies are not merged and this form caches no numerical result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Six inputs and their handlers live with the panel DOM. This adapter exposes no close or pending-click cap; the enclosing panel and numerical transport own stale-intent withdrawal, shutdown and displayed-frame retirement.
 *
 * @author Samchon
 */
export function mountConnectedPersonSkinReliefControls(
  props: IConnectedPersonSkinReliefControlsProps,
): { refresh: () => void } {
  const fields: (keyof IAutoMovieHumanFaceNasolabialRelief)[] = [
    "restDepthMm",
    "smileDepthMm",
    "widthMm",
  ];
  const inputs: Map<string, HTMLInputElement> = new Map();
  const help: HTMLParagraphElement = props.dom.createElement("p");
  help.textContent =
    "Additional nasolabial relief in mm. Resting depth and the extra depth at full smile are independent. Clinical severity grades remain observations.";
  props.container.append(help);
  for (const side of ["left", "right"] as const)
    for (const field of fields) {
      const row: HTMLDivElement = props.dom.createElement("div");
      const label: HTMLLabelElement = props.dom.createElement("label");
      const input: HTMLInputElement = props.dom.createElement("input");
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
  const apply: HTMLButtonElement = props.dom.createElement("button");
  const remove: HTMLButtonElement = props.dom.createElement("button");
  apply.type = "button";
  remove.type = "button";
  apply.id = "skin-relief-apply";
  remove.id = "skin-relief-remove";
  apply.textContent = "Apply skin relief";
  remove.textContent = "Remove nasolabial relief";
  props.container.append(apply, remove);
  const commit: (
    relief: IAutoMovieHumanFaceSkinRelief | undefined,
  ) => Promise<void> = async (
    relief: IAutoMovieHumanFaceSkinRelief | undefined,
  ): Promise<void> => {
    const ticket: number = props.reserve();
    props.busy("Applying skin relief…");
    try {
      const person: ReturnType<typeof props.current> = structuredClone(
        props.current(),
      );
      if (relief === undefined) {
        if (person.face.skinRelief !== undefined) {
          delete person.face.skinRelief.nasolabial;
          if (Object.keys(person.face.skinRelief).length === 0)
            delete person.face.skinRelief;
        }
      } else
        person.face.skinRelief = {
          ...person.face.skinRelief,
          nasolabial: relief.nasolabial,
        };
      const success: boolean = await props.change(person, ticket);
      if (success && props.isCurrent(ticket))
        props.report(
          relief === undefined
            ? "Skin relief removed."
            : "Skin relief applied.",
        );
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  apply.onclick = (): void => {
    try {
      const nasolabial: IAutoMovieHumanFaceSkinRelief.Nasolabial = {};
      for (const side of ["left", "right"] as const) {
        const values: Partial<IAutoMovieHumanFaceNasolabialRelief> = {};
        for (const field of fields) {
          const text: string = inputs
            .get(`skin-relief-${side}-${field}`)!
            .value.trim();
          if (text === "") continue;
          const value: number = Number(text);
          if (!Number.isFinite(value))
            throw new Error(`A finite ${side} ${field} is required.`);
          values[field] = value;
        }
        if (Object.keys(values).length === 0) continue;
        if (values.widthMm === undefined)
          throw new Error(
            `A ${side} support width is required for skin relief.`,
          );
        nasolabial[side] = { ...values, widthMm: values.widthMm };
      }
      void commit(
        Object.keys(nasolabial).length === 0 ? undefined : { nasolabial },
      );
    } catch (error) {
      props.refuse(error);
    }
  };
  remove.onclick = (): void => void commit(undefined);
  return {
    refresh: (): void => {
      const relief: IAutoMovieHumanFaceSkinRelief.Nasolabial | undefined =
        props.current().face.skinRelief?.nasolabial;
      for (const side of ["left", "right"] as const)
        for (const field of fields) {
          const input: HTMLInputElement = inputs.get(
            `skin-relief-${side}-${field}`,
          )!;
          if (props.dom.activeElement !== input)
            input.value = relief?.[side]?.[field]?.toString() ?? "";
        }
    },
  };
}

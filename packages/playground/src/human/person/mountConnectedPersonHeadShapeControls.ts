import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeFieldSource";

import type { IConnectedPersonHeadShapeControlsProps } from "./IConnectedPersonHeadShapeControlsProps";

/**
 * Edit registered source-relative head traits by anatomical group.
 * The head view supplies every available trait, unit and signed source envelope;
 * these are authored differences rather than clinical measurements. Blank input
 * stays absent until Apply, and Remove restores omission. No zero, mean or fitted
 * value is inserted. Raw body-channel authorship remains independent and a
 * duplicate is reported without silently deleting either input. The shared
 * person transaction owns geometry admission, intent ordering and history, so
 * failures retain the last valid document and save/export continue to use it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Offers anatomical group and trait selection with source-unit numerical editing on the person screen.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Displays current authored differences, omission and actual source support instead of inferred defaults.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Applies and removes traits through the existing person intent and commit owner.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Leaves stale replies and failed geometry to the same transactional admission path as other person edits.
 * @author Samchon
 */
export function mountConnectedPersonHeadShapeControls(
  props: IConnectedPersonHeadShapeControlsProps,
) {
  const title = props.dom.createElement("h3");
  title.textContent = "Head, face, neck and ears";
  props.container.append(title);
  if (props.source === undefined || props.source.fields.length === 0) {
    const unavailable = props.dom.createElement("small");
    unavailable.textContent =
      "Independent numerical head traits are unavailable in this source generation. Existing measurement and face controls remain available.";
    props.container.append(unavailable);
    return { refresh: (): void => {} };
  }
  const groups = new Map<string, IAutoMovieHumanPersonHeadShapeFieldSource[]>();
  for (const field of props.source.fields) {
    const path = field.id.split(".");
    const group = path[0] === "ears" ? path.slice(0, 2).join(".") : path[0];
    const fields = groups.get(group) ?? [];
    fields.push(field);
    groups.set(group, fields);
  }
  const labels: Record<string, string> = {
    cranial: "Cranium",
    facial: "Cheeks, mandible and chin",
    cervical: "Neck and submental profile",
    nasalExterior: "Nose",
    "ears.left": "Left ear",
    "ears.right": "Right ear",
  };
  const refreshers: (() => void)[] = [];
  for (const [group, fields] of groups) {
    const box = props.dom.createElement("fieldset");
    const legend = props.dom.createElement("legend");
    legend.textContent = labels[group] ?? group;
    const member = props.dom.createElement("select");
    member.setAttribute("aria-label", legend.textContent + " trait");
    for (const field of fields) {
      const option = props.dom.createElement("option");
      option.value = field.id;
      option.textContent = field.id
        .split(".")
        .at(-1)!
        .replace(/([a-z])([A-Z])/gu, "$1 $2");
      member.append(option);
    }
    const number = props.dom.createElement("input");
    number.type = "number";
    number.step = "any";
    number.setAttribute("aria-label", legend.textContent + " difference");
    const state = props.dom.createElement("small");
    const support = props.dom.createElement("small");
    const apply = props.dom.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply difference";
    const remove = props.dom.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove difference";
    box.append(legend, member, number, state, support, apply, remove);
    props.container.append(box);
    const selected = (): IAutoMovieHumanPersonHeadShapeFieldSource => {
      const field = fields.find((candidate) => candidate.id === member.value);
      if (field === undefined)
        throw new Error("A registered head trait must be selected.");
      return field;
    };
    const refresh = (): void => {
      const field = selected();
      const person = props.current();
      const value = person.headShape?.[field.id];
      const unit = field.unit === "degree" ? "degrees" : "mm";
      number.value = value === undefined ? "" : String(value);
      number.placeholder = "Difference in " + unit;
      number.min = String(field.minimum);
      number.max = String(field.maximum);
      state.textContent =
        value === undefined
          ? "Omitted: source neutral"
          : `Current input: ${value} ${unit}`;
      const duplicate = person.body.shape[field.bodyChannel] !== undefined;
      support.textContent =
        `Source support: ${field.minimum} to ${field.maximum} ${unit}. ${field.qualification}` +
        (duplicate
          ? " Raw body channel " +
            field.bodyChannel +
            " is authored; remove that input before applying this trait."
          : "");
      remove.disabled = value === undefined;
    };
    const commit = async (erase: boolean): Promise<void> => {
      const ticket = props.reserve();
      try {
        const field = selected();
        const person = structuredClone(props.current());
        if (erase) {
          if (person.headShape !== undefined) {
            delete person.headShape[field.id];
            if (Object.keys(person.headShape).length === 0)
              delete person.headShape;
          }
        } else {
          if (
            number.value.trim() === "" ||
            !Number.isFinite(Number(number.value))
          )
            throw new Error(
              "Enter a finite source difference; omission is restored with Remove difference.",
            );
          if (person.body.shape[field.bodyChannel] !== undefined)
            throw new Error(
              "Head trait " +
                field.id +
                " and raw body channel " +
                field.bodyChannel +
                " cannot author the same trait. Remove the raw channel input first.",
            );
          person.headShape ??= {};
          person.headShape[field.id] = Number(number.value);
        }
        props.busy("Building head difference…");
        const success = await props.change(person, ticket);
        if (success && props.isCurrent(ticket))
          props.report(field.id + (erase ? " omitted." : " applied."));
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    member.onchange = refresh;
    apply.onclick = () => {
      void commit(false);
    };
    remove.onclick = () => {
      void commit(true);
    };
    refreshers.push(refresh);
    refresh();
  }
  return {
    refresh: (): void => {
      refreshers.forEach((refresh) => refresh());
    },
  };
}

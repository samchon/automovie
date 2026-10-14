import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeFieldSource";

import type { IConnectedPersonHeadShapeControlsProps } from "./IConnectedPersonHeadShapeControlsProps";

/**
 * Edit registered source-relative head traits by anatomical group. The head view supplies every available trait, unit and signed source envelope; these are authored differences rather than clinical measurements. Blank input stays absent until Apply, and Remove restores omission. No zero, mean or fitted value is inserted. Raw body-channel authorship remains independent and a duplicate is reported without silently deleting either input.
 *
 * The shared person transaction owns geometry admission, intent ordering and history, so the panel distinguishes accepted history from labelled refused construction drafts. Build refusal preserves the display; cleanup refusal can follow publication. Save and qualified export use the actual displayed state rather than this control's Boolean as an acceptance verdict.
 *
 * @evidence contracts/common.md#principled-implementation Only source-registered anatomical trait ids and signed unit/envelope metadata are offered, with latest complete-person composition and shared intent-bound transaction for apply/remove.
 * @evidence contracts/common.md#clear-and-simple-design Group/member inputs stay in this section while generation registration, raw-channel ownership and numerical admission/history remain existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing traits stay unavailable, blank values receive no inferred zero/mean, duplicate raw body authorship refuses without silent deletion and source differences are not clinical measurements.
 * @evidence contracts/common.md#meaningful-documentation The comment explains source-relative quantities, optional omission, duplicate ownership refusal and current person transaction boundaries.
 * @evidence contracts/performance.md#efficient-algorithms One field pass groups f source traits; each group refresh/commit finds its selected field within that group's list, and commit clones the current complete document before editing one sparse key. Refresh visits g groups plus their lookups without repeating numerical construction itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source groups and one refresher per group are reused for the mount, while authored document fields are read at event/refresh time; no geometry or transaction outcome is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finite source-group DOM and refresher closures live with the parent panel; pending transactions leave through its worker settlement/close, and external mounted handles/elements remain caller-owned after subtree removal.
 *
 * @author Samchon
 */
export function mountConnectedPersonHeadShapeControls(
  props: IConnectedPersonHeadShapeControlsProps,
): { /** Repaint source-relative trait fields from current authored person state. */ refresh: () => void } {
  const title: HTMLHeadingElement = props.dom.createElement("h3");
  title.textContent = "Head, face, neck and ears";
  props.container.append(title);
  if (props.source === undefined || props.source.fields.length === 0) {
    const unavailable: HTMLElement = props.dom.createElement("small");
    unavailable.textContent =
      "Independent numerical head traits are unavailable in this source generation. Existing measurement and face controls remain available.";
    props.container.append(unavailable);
    return { refresh: (): void => {} };
  }
  const groups: Map<string, IAutoMovieHumanPersonHeadShapeFieldSource[]> = new Map();
  for (const field of props.source.fields) {
    const path: string[] = field.id.split(".");
    const group: string = path[0] === "ears" ? path.slice(0, 2).join(".") : path[0];
    const fields: IAutoMovieHumanPersonHeadShapeFieldSource[] = groups.get(group) ?? [];
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
    const box: HTMLFieldSetElement = props.dom.createElement("fieldset");
    const legend: HTMLLegendElement = props.dom.createElement("legend");
    legend.textContent = labels[group] ?? group;
    const member: HTMLSelectElement = props.dom.createElement("select");
    member.setAttribute("aria-label", legend.textContent + " trait");
    for (const field of fields) {
      const option: HTMLOptionElement = props.dom.createElement("option");
      option.value = field.id;
      option.textContent = field.id
        .split(".")
        .at(-1)!
        .replace(/([a-z])([A-Z])/gu, "$1 $2");
      member.append(option);
    }
    const number: HTMLInputElement = props.dom.createElement("input");
    number.type = "number";
    number.step = "any";
    number.setAttribute("aria-label", legend.textContent + " difference");
    const state: HTMLElement = props.dom.createElement("small");
    const support: HTMLElement = props.dom.createElement("small");
    const apply: HTMLButtonElement = props.dom.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply difference";
    const remove: HTMLButtonElement = props.dom.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove difference";
    box.append(legend, member, number, state, support, apply, remove);
    props.container.append(box);
    const selected: () => IAutoMovieHumanPersonHeadShapeFieldSource = (): IAutoMovieHumanPersonHeadShapeFieldSource => {
      const field: IAutoMovieHumanPersonHeadShapeFieldSource | undefined = fields.find((candidate: IAutoMovieHumanPersonHeadShapeFieldSource): boolean => candidate.id === member.value);
      if (field === undefined)
        throw new Error("A registered head trait must be selected.");
      return field;
    };
    const refresh: () => void = (): void => {
      const field: IAutoMovieHumanPersonHeadShapeFieldSource = selected();
      const person: ReturnType<IConnectedPersonHeadShapeControlsProps["current"]> = props.current();
      const value: number | undefined = person.headShape?.[field.id];
      const unit: string = field.unit === "degree" ? "degrees" : "mm";
      number.value = value === undefined ? "" : String(value);
      number.placeholder = "Difference in " + unit;
      number.min = String(field.minimum);
      number.max = String(field.maximum);
      state.textContent =
        value === undefined
          ? "Omitted: source neutral"
          : `Current input: ${value} ${unit}`;
      const duplicate: boolean = person.body.shape[field.bodyChannel] !== undefined;
      support.textContent =
        `Source support: ${field.minimum} to ${field.maximum} ${unit}. ${field.qualification}` +
        (duplicate
          ? " Raw body channel " +
            field.bodyChannel +
            " is authored; remove that input before applying this trait."
          : "");
      remove.disabled = value === undefined;
    };
    const commit: (erase: boolean) => Promise<void> = async (erase: boolean): Promise<void> => {
      const ticket: number = props.reserve();
      try {
        const field: IAutoMovieHumanPersonHeadShapeFieldSource = selected();
        const person: ReturnType<IConnectedPersonHeadShapeControlsProps["current"]> = structuredClone(props.current());
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
        const success: boolean = await props.change(person, ticket);
        if (success && props.isCurrent(ticket))
          props.report(field.id + (erase ? " omitted." : " applied."));
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    member.onchange = refresh;
    apply.onclick = (): void => {
      void commit(false);
    };
    remove.onclick = (): void => {
      void commit(true);
    };
    refreshers.push(refresh);
    refresh();
  }
  return {
    refresh: (): void => {
      refreshers.forEach((refresh: () => void): void => refresh());
    },
  };
}

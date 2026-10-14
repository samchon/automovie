import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonInputCatalogueControlsProps } from "./IConnectedPersonInputCatalogueControlsProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import { readConnectedPersonInput } from "./readConnectedPersonInput";
import { writeConnectedPersonInput } from "./writeConnectedPersonInput";

/**
 * Mount a searchable catalogue of owner-described numeric scalars and choices. Each row shows literal document paths, omission/null meaning, units and authored range/default metadata. Browser bounds are entry aids; numerical admission belongs to the generation owner.
 *
 * Apply, owner defaults, explicit null disabling and removal all use the ordinary person transaction. Its successful Boolean can represent an accepted publication or a labelled refused construction draft; current-intent checks only authorize the explanatory report. A false result can follow earlier publication when settlement fails. Undescribed families are named without inventing their ranges.
 *
 * Refresh rebuilds rows from the current document/catalogue, releasing obsolete row seeds with the replaced DOM. A hair-group command writes only entered values into one candidate; blank fields preserve existing data and no complete styling record is guessed.
 *
 * @evidence contracts/common.md#principled-implementation Descriptor paths/defaults define each control; finite numeric and closed-choice checks precede literal-path copying, while null disabling and omission removal use their distinct owner paths and admission remains the panel's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One update function handles individual and group edits through the same person transaction, and current catalogue metadata supplies search/group rows rather than a second set of anatomical rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Browser bounds and metadata are not clinical validation, unknown families receive no guessed limits and successful reports do not certify accepted history instead of a construction draft.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes authored range aids, null/removal effects, transaction outcomes and sparse group entry.
 * @evidence contracts/performance.md#efficient-algorithms Refresh counts groups and filters rows in one catalogue pass plus text/DOM work, using O(n) control storage for n descriptors. Each write clones the complete document; a group of k entered values currently repeats that clone k times before one build, with no measured speed claim.
 * @evidence contracts/performance.md#reuse-equivalent-work The current catalogue is evaluated once per render and each group count is reused for its option. Numerical results are not cached; each effectful edit reserves its own panel intent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacing rows/options releases obsolete handlers and descriptor/control maps when external references are absent. The container retains search/filter handlers until panel teardown; this adapter has no local close or pending-click cap and the panel/worker owns request cancellation and retirement.
 *
 * @author Samchon
 */
export function mountConnectedPersonInputCatalogue(
  props: IConnectedPersonInputCatalogueControlsProps,
): { refresh: () => void } {
  const dom: Document = props.dom;
  const inputs: () => IConnectedPersonInputDescriptor[] =
    (): IConnectedPersonInputDescriptor[] =>
      typeof props.inputs === "function" ? props.inputs() : props.inputs;
  const search: HTMLInputElement = dom.createElement("input");
  search.type = "search";
  search.placeholder = "Find an input: helix, lobule, lash, eye, nose…";
  search.setAttribute("aria-label", "Find a numerical input");
  search.style.width = "100%";
  const select: HTMLSelectElement = dom.createElement("select");
  select.setAttribute("aria-label", "Numerical input group");
  const rows: HTMLDivElement = dom.createElement("div");
  rows.dataset.role = "catalogue-rows";
  const absent: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Inputs without an owner-published range (${props.undescribed.length} families)`;
  absent.append(summary);
  for (const family of props.undescribed) {
    const line: HTMLElement = dom.createElement("small");
    line.textContent = `${family.paths} · ${family.unit} · range not supplied · edited in: ${family.edited}`;
    absent.append(line);
  }
  props.container.append(search, select, rows, absent);
  const update: (
    current: IAutoMovieHumanPersonDocument,
    input: IConnectedPersonInputDescriptor,
    value: number | string | null | undefined,
  ) => IAutoMovieHumanPersonDocument = (
    current: IAutoMovieHumanPersonDocument,
    input: IConnectedPersonInputDescriptor,
    value: number | string | null | undefined,
  ): IAutoMovieHumanPersonDocument => {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error(
        "Enter a finite " +
          input.unit +
          " value for " +
          input.path.join(" › ") +
          ".",
      );
    if (typeof value === "string" && !input.choices?.includes(value))
      throw new Error(
        "Choose an owner-defined value for " + input.path.join(" › ") + ".",
      );
    const prepared: IAutoMovieHumanPersonDocument =
      value === undefined
        ? current
        : (props.prepare?.(current, input.path) ?? current);
    const path: readonly string[] =
      value === undefined
        ? (input.removePath ?? input.path)
        : value === null
          ? (input.disablePath ?? input.path)
          : input.path;
    return writeConnectedPersonInput(
      prepared,
      path,
      value,
      input.seed,
      input.seedPath,
    );
  };
  const commit: (
    input: IConnectedPersonInputDescriptor,
    value: number | string | null | undefined,
  ) => Promise<void> = async (
    input: IConnectedPersonInputDescriptor,
    value: number | string | null | undefined,
  ): Promise<void> => {
    const ticket: number = props.reserve();
    try {
      const current: IAutoMovieHumanPersonDocument = props.current();
      const path: readonly string[] =
        value === undefined
          ? (input.removePath ?? input.path)
          : value === null
            ? (input.disablePath ?? input.path)
            : input.path;
      const next: IAutoMovieHumanPersonDocument = update(current, input, value);
      props.busy("Building " + input.label + "…");
      if ((await props.change(next, ticket)) && props.isCurrent(ticket))
        props.report(
          path.join(" › ") +
            (value === undefined
              ? " removed."
              : " set to " + value + " " + input.unit + "."),
        );
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  const render: () => void = (): void => {
    const query: string = search.value.toLowerCase().replace(/\s/gu, "");
    const person: IAutoMovieHumanPersonDocument = props.current();
    const catalogue: IConnectedPersonInputDescriptor[] = inputs();
    const selected: string = select.value;
    const groups: Map<string, number> = new Map();
    for (const input of catalogue)
      groups.set(input.group, (groups.get(input.group) ?? 0) + 1);
    select.replaceChildren();
    for (const [group, count] of groups) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = group;
      option.textContent = group + " (" + count + ")";
      select.append(option);
    }
    if (groups.has(selected)) select.value = selected;
    rows.replaceChildren();
    const controls: Map<
      IConnectedPersonInputDescriptor,
      HTMLInputElement | HTMLSelectElement
    > = new Map<
      IConnectedPersonInputDescriptor,
      HTMLInputElement | HTMLSelectElement
    >();
    for (const input of catalogue) {
      const name: string = (input.group + input.label + input.path.join(""))
        .toLowerCase()
        .replace(/\s/gu, "");
      if (query === "" ? input.group !== select.value : !name.includes(query))
        continue;
      const value: ReturnType<typeof readConnectedPersonInput> =
        readConnectedPersonInput(person, input.path);
      const row: HTMLDivElement = dom.createElement("div");
      row.className = "row";
      row.dataset.path = input.path.join("/");
      const label: HTMLLabelElement = dom.createElement("label");
      label.textContent = `${input.label} (${input.unit})`;
      const entry: HTMLDivElement = dom.createElement("div");
      let control: HTMLInputElement | HTMLSelectElement;
      if (input.choices === undefined) {
        const number: HTMLInputElement = dom.createElement("input");
        number.type = "number";
        number.step = input.step === null ? "any" : String(input.step);
        if (input.minimum !== null && !input.minimumExclusive)
          number.min = String(input.minimum);
        if (input.maximum !== null && !input.maximumExclusive)
          number.max = String(input.maximum);
        number.value = typeof value === "number" ? String(value) : "";
        control = number;
      } else {
        const choice: HTMLSelectElement = dom.createElement("select");
        const omitted: HTMLOptionElement = dom.createElement("option");
        omitted.value = "";
        omitted.textContent =
          "Choose an explicit trait; omission retains the original field";
        choice.append(omitted);
        for (const name of input.choices) {
          const option: HTMLOptionElement = dom.createElement("option");
          option.value = name;
          option.textContent = name;
          choice.append(option);
        }
        choice.value = typeof value === "string" ? value : "";
        control = choice;
      }
      control.setAttribute("aria-label", input.group + " " + input.label);
      controls.set(input, control);
      const apply: HTMLButtonElement = dom.createElement("button");
      apply.type = "button";
      apply.textContent = "Apply";
      apply.onclick = (): void =>
        void commit(
          input,
          input.choices === undefined
            ? control.value.trim() === ""
              ? Number.NaN
              : Number(control.value)
            : control.value,
        );
      entry.append(control, apply);
      if (input.ownerDefault !== null) {
        const defaults: HTMLButtonElement = dom.createElement("button");
        defaults.type = "button";
        defaults.textContent = "Apply owner default";
        defaults.onclick = (): void => void commit(input, input.ownerDefault!);
        entry.append(defaults);
      }
      if (input.ownerChoice !== undefined) {
        const defaults: HTMLButtonElement = dom.createElement("button");
        defaults.type = "button";
        defaults.textContent = "Apply original choice";
        defaults.onclick = (): void => void commit(input, input.ownerChoice!);
        entry.append(defaults);
      }
      if (input.disablePath !== undefined) {
        const disable: HTMLButtonElement = dom.createElement("button");
        disable.type = "button";
        disable.textContent = "Disable operation";
        disable.onclick = (): void => void commit(input, null);
        entry.append(disable);
      }
      if (input.removable) {
        const remove: HTMLButtonElement = dom.createElement("button");
        remove.type = "button";
        remove.textContent =
          input.removePath === undefined ? "Remove" : "Remove record";
        remove.disabled =
          value === undefined &&
          (input.disablePath === undefined ||
            readConnectedPersonInput(person, input.disablePath) !== null);
        remove.onclick = (): void => void commit(input, undefined);
        entry.append(remove);
      }
      const state: HTMLElement = dom.createElement("small");
      state.textContent =
        (value === undefined
          ? "Omitted: " + input.omission
          : value === null
            ? "Operation explicitly disabled"
            : `Current: ${value} ${input.unit}`) +
        " · Owner range: " +
        (input.choices !== undefined
          ? input.choices.join(", ")
          : input.minimum === null && input.maximum === null
            ? "not supplied"
            : `${input.minimum === null ? "unbounded below" : (input.minimumExclusive ? "> " : "≥ ") + input.minimum} and ${input.maximum === null ? "unbounded above" : (input.maximumExclusive ? "< " : "≤ ") + input.maximum} ${input.unit}`) +
        (input.ownerDefault === null
          ? ""
          : ` · Owner default: ${input.ownerDefault} ${input.unit}`);
      const ground: HTMLElement = dom.createElement("small");
      ground.textContent = input.path.join(" › ") + " · " + input.qualification;
      row.append(label, entry, state, ground);
      rows.append(row);
    }
    if (query === "" && select.value.startsWith("Hair · ")) {
      const applyGroup: HTMLButtonElement = dom.createElement("button");
      applyGroup.type = "button";
      applyGroup.textContent = "Apply entered group values together";
      applyGroup.onclick = async (): Promise<void> => {
        const ticket: number = props.reserve();
        try {
          let next: IAutoMovieHumanPersonDocument = props.current();
          let entered: number = 0;
          for (const [input, control] of controls) {
            if (control.value.trim() === "") continue;
            next = update(
              next,
              input,
              input.choices === undefined
                ? Number(control.value)
                : control.value,
            );
            entered++;
          }
          if (entered === 0)
            throw new Error(
              "Enter the named group values first; no styling defaults are inferred.",
            );
          props.busy("Building " + select.value + "…");
          if ((await props.change(next, ticket)) && props.isCurrent(ticket))
            props.report(select.value + " applied.");
        } catch (error) {
          if (props.isCurrent(ticket)) props.refuse(error);
        }
      };
      const help: HTMLElement = dom.createElement("small");
      help.textContent =
        "A new operation needs its complete named record. Blank fields keep existing data; enter all required values together when no original record exists.";
      rows.append(applyGroup, help);
    }
  };
  search.oninput = render;
  select.onchange = render;
  render();
  return { refresh: render };
}

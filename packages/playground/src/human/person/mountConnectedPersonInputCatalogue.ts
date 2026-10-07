import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonInputCatalogueControlsProps } from "./IConnectedPersonInputCatalogueControlsProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import { readConnectedPersonInput } from "./readConnectedPersonInput";
import { writeConnectedPersonInput } from "./writeConnectedPersonInput";

/**
 * Mount one searchable list of the person document's described numerical
 * scalars and closed choices, each row drawn from its descriptor alone.
 *
 * A row states the input's document path, its current value or what its
 * omission means, and its owner's range or "not supplied". Its number field
 * takes the owner's bounds and step as entry aids only; admission is the
 * owner's, so a value the owner refuses comes back as the owner's own
 * message and changes nothing. Apply writes the one value and Remove deletes
 * it, both through the panel's one person transaction, so history, drafts,
 * save and export treat a catalogue edit like any other. Families without an
 * owner descriptor are named below the list with where they are edited; no
 * bound is supplied for them here.
 *
 * Optional null operation removal differs from removing a sparse overlay,
 * which restores its original field. Rows and groups are drawn from the
 * current owner catalogue on refresh, so loading another document changes
 * the resident hair populations without retaining their previous seeds.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Edits listed numerical inputs through the person transaction with the last valid person kept on a refusal.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Shows each face input with its owner's unit and envelope and no clinical claim of its own.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Draws every row from one descriptor list and names the inputs that list cannot describe.
 * @author Samchon
 */
export function mountConnectedPersonInputCatalogue(
  props: IConnectedPersonInputCatalogueControlsProps,
) {
  const { dom } = props;
  const inputs = (): IConnectedPersonInputDescriptor[] =>
    typeof props.inputs === "function" ? props.inputs() : props.inputs;
  const search = dom.createElement("input");
  search.type = "search";
  search.placeholder = "Find an input: helix, lobule, lash, eye, nose…";
  search.setAttribute("aria-label", "Find a numerical input");
  search.style.width = "100%";
  const select = dom.createElement("select");
  select.setAttribute("aria-label", "Numerical input group");
  const rows = dom.createElement("div");
  rows.dataset.role = "catalogue-rows";
  const absent = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Inputs without an owner-published range (${props.undescribed.length} families)`;
  absent.append(summary);
  for (const family of props.undescribed) {
    const line = dom.createElement("small");
    line.textContent = `${family.paths} · ${family.unit} · range not supplied · edited in: ${family.edited}`;
    absent.append(line);
  }
  props.container.append(search, select, rows, absent);
  const update = (
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
    const prepared =
      value === undefined
        ? current
        : (props.prepare?.(current, input.path) ?? current);
    const path =
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
  const commit = async (
    input: IConnectedPersonInputDescriptor,
    value: number | string | null | undefined,
  ): Promise<void> => {
    const ticket = props.reserve();
    try {
      const current = props.current();
      const path =
        value === undefined
          ? (input.removePath ?? input.path)
          : value === null
            ? (input.disablePath ?? input.path)
            : input.path;
      const next = update(current, input, value);
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
  const render = (): void => {
    const query = search.value.toLowerCase().replace(/\s/gu, "");
    const person = props.current();
    const catalogue = inputs();
    const selected = select.value;
    const groups = [...new Set(catalogue.map((input) => input.group))];
    select.replaceChildren();
    for (const group of groups) {
      const option = dom.createElement("option");
      option.value = group;
      option.textContent =
        group +
        " (" +
        catalogue.filter((input) => input.group === group).length +
        ")";
      select.append(option);
    }
    if (groups.includes(selected)) select.value = selected;
    rows.replaceChildren();
    const controls = new Map<
      IConnectedPersonInputDescriptor,
      HTMLInputElement | HTMLSelectElement
    >();
    for (const input of catalogue) {
      const name = (input.group + input.label + input.path.join(""))
        .toLowerCase()
        .replace(/\s/gu, "");
      if (query === "" ? input.group !== select.value : !name.includes(query))
        continue;
      const value = readConnectedPersonInput(person, input.path);
      const row = dom.createElement("div");
      row.className = "row";
      row.dataset.path = input.path.join("/");
      const label = dom.createElement("label");
      label.textContent = `${input.label} (${input.unit})`;
      const entry = dom.createElement("div");
      let control: HTMLInputElement | HTMLSelectElement;
      if (input.choices === undefined) {
        const number = dom.createElement("input");
        number.type = "number";
        number.step = input.step === null ? "any" : String(input.step);
        if (input.minimum !== null && !input.minimumExclusive)
          number.min = String(input.minimum);
        if (input.maximum !== null && !input.maximumExclusive)
          number.max = String(input.maximum);
        number.value = typeof value === "number" ? String(value) : "";
        control = number;
      } else {
        const choice = dom.createElement("select");
        const omitted = dom.createElement("option");
        omitted.value = "";
        omitted.textContent =
          "Choose an explicit trait; omission retains the original field";
        choice.append(omitted);
        for (const name of input.choices) {
          const option = dom.createElement("option");
          option.value = name;
          option.textContent = name;
          choice.append(option);
        }
        choice.value = typeof value === "string" ? value : "";
        control = choice;
      }
      control.setAttribute("aria-label", input.group + " " + input.label);
      controls.set(input, control);
      const apply = dom.createElement("button");
      apply.type = "button";
      apply.textContent = "Apply";
      apply.onclick = () =>
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
        const defaults = dom.createElement("button");
        defaults.type = "button";
        defaults.textContent = "Apply owner default";
        defaults.onclick = () => void commit(input, input.ownerDefault!);
        entry.append(defaults);
      }
      if (input.ownerChoice !== undefined) {
        const defaults = dom.createElement("button");
        defaults.type = "button";
        defaults.textContent = "Apply original choice";
        defaults.onclick = () => void commit(input, input.ownerChoice!);
        entry.append(defaults);
      }
      if (input.disablePath !== undefined) {
        const disable = dom.createElement("button");
        disable.type = "button";
        disable.textContent = "Disable operation";
        disable.onclick = () => void commit(input, null);
        entry.append(disable);
      }
      if (input.removable) {
        const remove = dom.createElement("button");
        remove.type = "button";
        remove.textContent =
          input.removePath === undefined ? "Remove" : "Remove record";
        remove.disabled =
          value === undefined &&
          (input.disablePath === undefined ||
            readConnectedPersonInput(person, input.disablePath) !== null);
        remove.onclick = () => void commit(input, undefined);
        entry.append(remove);
      }
      const state = dom.createElement("small");
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
      const ground = dom.createElement("small");
      ground.textContent = input.path.join(" › ") + " · " + input.qualification;
      row.append(label, entry, state, ground);
      rows.append(row);
    }
    if (query === "" && select.value.startsWith("Hair · ")) {
      const applyGroup = dom.createElement("button");
      applyGroup.type = "button";
      applyGroup.textContent = "Apply entered group values together";
      applyGroup.onclick = async () => {
        const ticket = props.reserve();
        try {
          let next = props.current();
          let entered = 0;
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
      const help = dom.createElement("small");
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

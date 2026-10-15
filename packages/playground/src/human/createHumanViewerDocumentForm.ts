/**
 * Build an editing form for one JSON document from its current value.
 *
 * Every object becomes a fieldset and every leaf an input chosen by its value and the spec: a number becomes a number input, a path listed in `choices` a select of exactly those values, a path in `colors` a colour picker, a path in `nullable` a number input whose empty value means `null`, and a path in `styles` one select whose options each set several leaves together, standing for the paths in its `covers`. The value's own shape decides the fields, so a document that gains a measurement gains an input without changing the page, and the spec stays limited to what JSON cannot say: closed sets, colours and nullability.
 *
 * A change produces a fresh copy of the document with that leaf replaced and passes it to `onChange`; the form never admits it. The caller admits the candidate and either rebuilds the form from the accepted document or keeps this form, which still shows the refused input next to the caller's error. Choices come from the caller, which writes them against the package's types so the compiler checks each value.
 *
 * @param props Document, spec and change callback
 * @returns A detached element holding the form
 *
 * @evidence contracts/common.md#principled-implementation A recursive walk over the JSON value with path-keyed overrides: structure comes from the document itself, and only facts JSON cannot carry come from the spec.
 * @evidence contracts/common.md#clear-and-simple-design The form edits and reports candidates; admission, persistence and rendering stay with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is hard-coded; a refused candidate is not repaired or clamped here, so the caller's admission error names the actual input.
 * @evidence contracts/common.md#meaningful-documentation Documents leaf-to-input mapping, every spec member, copy-on-change and the admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the document's leaves; each change copies the document once with structuredClone, linear in its size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each form is built from one document; a rebuild after acceptance replaces it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs and their listeners belong to the returned element and are released with it when the caller replaces the form.
 */
export function createHumanViewerDocumentForm<T extends object>(props: {
  document: T;
  spec: createHumanViewerDocumentForm.ISpec<T>;
  onChange: (candidate: T) => void;
}): HTMLElement {
  const root: HTMLDivElement = document.createElement("div");
  root.className = "doc-form";
  const covered: Set<string> = new Set(
    Object.values(props.spec.styles ?? {}).flatMap(
      (style: createHumanViewerDocumentForm.IStyle<T>): string[] =>
        style.covers,
    ),
  );
  const change: (path: string[], value: unknown) => void = (
    path: string[],
    value: unknown,
  ): void => {
    const candidate: T = structuredClone(props.document);
    let cursor: Record<string, unknown> = candidate as Record<string, unknown>;
    for (const key of path.slice(0, -1))
      cursor = cursor[key] as Record<string, unknown>;
    cursor[path[path.length - 1]!] = value;
    props.onChange(candidate);
  };
  const visit: (
    value: Record<string, unknown>,
    path: string[],
    host: HTMLElement,
  ) => void = (
    value: Record<string, unknown>,
    path: string[],
    host: HTMLElement,
  ): void => {
    for (const [key, child] of Object.entries(value)) {
      const at: string[] = [...path, key];
      const id: string = at.join(".");
      const style: createHumanViewerDocumentForm.IStyle<T> | undefined =
        props.spec.styles?.[id];
      if (style !== undefined) {
        host.appendChild(styleField(style, props));
        continue;
      }
      if (covered.has(id) || (props.spec.hidden ?? []).includes(id)) continue;
      if (
        child !== null &&
        typeof child === "object" &&
        !Array.isArray(child)
      ) {
        const set: HTMLFieldSetElement = document.createElement("fieldset");
        const legend: HTMLLegendElement = document.createElement("legend");
        legend.textContent = humanize(key);
        set.appendChild(legend);
        visit(child as Record<string, unknown>, at, set);
        host.appendChild(set);
        continue;
      }
      host.appendChild(leafField(id, key, child, props.spec, at, change));
    }
  };
  visit(props.document as Record<string, unknown>, [], root);
  return root;
}
/**
 * Types of the document form's spec.
 *
 * @evidence contracts/common.md#principled-implementation The spec carries only what a JSON value cannot state: closed sets, colours, nullability, hidden leaves and multi-leaf styles.
 * @evidence contracts/common.md#clear-and-simple-design The namespace groups the spec types beside the one function that reads them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document-specific field names live here; callers name paths.
 * @evidence contracts/common.md#meaningful-documentation Each member documents its path keying and effect on the form.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Type declarations perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Type declarations coordinate no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Type declarations own no resource.
 */
export namespace createHumanViewerDocumentForm {
  /** What JSON cannot say about a document's leaves, keyed by dotted path. */
  export interface ISpec<T> {
    /** Closed sets: the select offers exactly these values, in this order. */
    choices?: Record<string, readonly string[]>;

    /** Leaves holding an sRGB `#RRGGBB` colour. */
    colors?: readonly string[];

    /** Number leaves that may be `null`; an empty input means `null`. */
    nullable?: readonly string[];

    /** Leaves not shown, such as a document's version tag. */
    hidden?: readonly string[];

    /** One select standing for several leaves, keyed by the first leaf's path. */
    styles?: Record<string, IStyle<T>>;
  }

  /** A select whose options each set several leaves together. */
  export interface IStyle<T> {
    /** Field label. */
    label: string;

    /** Dotted paths of every leaf the style sets; none of them gets its own input. */
    covers: string[];

    /** The options, each recognizing and producing its own leaf values. */
    options: IStyleOption<T>[];
  }

  /** One option of a style select. */
  export interface IStyleOption<T> {
    /** Option label. */
    label: string;

    /** Whether the document currently holds this option's values. */
    matches: (document: T) => boolean;

    /** Copy of the document with this option's values. */
    apply: (document: T) => T;
  }
}

/** Input for one leaf, by its value and the spec. */
function leafField<T>(
  id: string,
  key: string,
  value: unknown,
  spec: createHumanViewerDocumentForm.ISpec<T>,
  path: string[],
  change: (path: string[], value: unknown) => void,
): HTMLElement {
  const label: HTMLLabelElement = document.createElement("label");
  label.className = "field";
  const name: HTMLSpanElement = document.createElement("span");
  name.textContent = humanize(key);
  name.title = id;
  label.appendChild(name);
  const choices: readonly string[] | undefined = spec.choices?.[id];
  if (choices !== undefined) {
    const select: HTMLSelectElement = document.createElement("select");
    for (const choice of choices) select.add(new Option(choice, choice));
    select.value = String(value);
    select.addEventListener("change", (): void => change(path, select.value));
    label.appendChild(select);
    return label;
  }
  const input: HTMLInputElement = document.createElement("input");
  if ((spec.colors ?? []).includes(id)) {
    input.type = "color";
    input.value = String(value);
    input.addEventListener("change", (): void => change(path, input.value));
  } else if (typeof value === "number" || (spec.nullable ?? []).includes(id)) {
    input.type = "number";
    input.step = "any";
    input.value = value === null ? "" : String(value);
    if ((spec.nullable ?? []).includes(id)) input.placeholder = "default";
    input.addEventListener("change", (): void =>
      change(
        path,
        input.value.trim() === "" && (spec.nullable ?? []).includes(id)
          ? null
          : Number(input.value),
      ),
    );
  } else {
    input.type = "text";
    input.value = String(value);
    input.addEventListener("change", (): void => change(path, input.value));
  }
  label.appendChild(input);
  return label;
}

/** Select for a style that sets several leaves together. */
function styleField<T extends object>(
  style: createHumanViewerDocumentForm.IStyle<T>,
  props: { document: T; onChange: (candidate: T) => void },
): HTMLElement {
  const label: HTMLLabelElement = document.createElement("label");
  label.className = "field";
  const name: HTMLSpanElement = document.createElement("span");
  name.textContent = style.label;
  name.title = style.covers.join(", ");
  label.appendChild(name);
  const select: HTMLSelectElement = document.createElement("select");
  // A document holding values no option offers shows them as such rather
  // than as the first option, which it does not hold.
  if (
    !style.options.some(
      (o: createHumanViewerDocumentForm.IStyleOption<T>): boolean =>
        o.matches(props.document),
    )
  ) {
    const other: HTMLOptionElement = new Option("(not offered)", "");
    other.disabled = true;
    select.add(other);
    select.value = "";
  }
  style.options.forEach(
    (
      option: createHumanViewerDocumentForm.IStyleOption<T>,
      index: number,
    ): void => {
      select.add(new Option(option.label, String(index)));
      if (option.matches(props.document)) select.value = String(index);
    },
  );
  select.addEventListener("change", (): void =>
    props.onChange(
      style.options[Number(select.value)]!.apply(
        structuredClone(props.document),
      ),
    ),
  );
  label.appendChild(select);
  return label;
}

/** `upperArmLength` to `upper arm length`. */
function humanize(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

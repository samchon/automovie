import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";

/**
 * Bind one existing editor's displayed document and validated loader to source
 * transfer. A displayed document may be an accepted result or a retained
 * construction draft. JSON comparison ignores object-key order but preserves
 * every value; this adapter compares the document, not its qualification facts.
 * The editor supplies its own parser and transaction; failed restore refuses
 * candidate publication. Current widgets merely reflect restored actual view.
 * Load or equality failure may leave the candidate changed; transaction rollback
 * remains with the editor rather than this adapter.
 *
 * @evidence contracts/common.md#principled-implementation Transfers the displayed editor document, including a retained construction draft, and verifies the validated load produced the same values.
 * @evidence contracts/common.md#clear-and-simple-design One binding reuses application parsing/transactions without creating another document evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no simulated input event, inferred parameter or expected-model substitution.
 * @evidence contracts/common.md#meaningful-documentation Defines equality, empty editors and view reflection boundaries.
 */
export function registerPlaygroundEditor(props: {
  /** Completion of this editor's initial transaction; rejection refuses the candidate. */
  ready: Promise<void>;

  /** Currently displayed editor document, including a retained construction draft; undefined means no document. */
  document: () => object | undefined;

  /** Actual displayed qualification and admission facts captured beside the document; they are not compared by this adapter. */
  facts?: () => object;

  /** Restore serialized document values through the original editor transaction, or reject. */
  load: (text: string) => Promise<void>;

  /** Permit an undefined document for an intentionally empty editor; omission requires a document. */
  empty?: boolean;

  /** The editor-owned DOM root whose existing clay and shadows checkboxes reflect restored display state. */
  controls: ParentNode;
}) {
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0).map((key) =>
      JSON.stringify(key) + ":" + canonical(Reflect.get(value, key)),
    ).join(",") + "}";
    return JSON.stringify(value) ?? "undefined";
  };
  registerPlaygroundViewerApplication({
    ready: props.ready,
    empty: props.empty,
    capture: () => {
      const document = props.document();
      return document === undefined ? undefined : { document, facts: props.facts?.() };
    },
    restore: async (state) => {
      if (state === undefined && props.empty) return;
      if (state === null || typeof state !== "object") throw new Error("Editor transfer has no committed document.");
      const document: unknown = Reflect.get(state, "document");
      if (document === null || typeof document !== "object") throw new Error("Editor transfer has no document object.");
      await props.load(JSON.stringify(document));
      if (canonical(props.document()) !== canonical(document)) throw new Error("The candidate did not commit the transferred document.");
    },
    reflectView: (state) => {
      if (state === null || typeof state !== "object") return;
      for (const name of ["clay", "shadows"] as const) {
        const value: unknown = Reflect.get(state, name);
        if (typeof value !== "boolean") continue;
        const control = props.controls.querySelector<HTMLInputElement>("#" + name);
        if (control !== null) control.checked = value;
      }
    },
  });
}

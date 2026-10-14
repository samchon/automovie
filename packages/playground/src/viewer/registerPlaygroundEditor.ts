import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";

/**
 * Transfer an existing editor's displayed document through its original loader. Displayed input may be accepted history or a labelled construction draft. Comparison sorts object keys and preserves array order for supported acyclic JSON document values; it is not general object equality and compares no captured qualification facts.
 *
 * Loader/equality failure refuses the candidate but can leave it changed; rollback belongs to the original transaction. Optional view reflection updates existing clay/shadow checkbox state without firing edits. Intentionally empty editors can omit a document explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Original loading parses/adopts document text, then canonical JSON-compatible value comparison checks actual displayed input independent of object-key insertion order; qualified facts remain separately captured rather than silently treated as equal.
 * @evidence contracts/common.md#clear-and-simple-design One application registration borrows document/load/readiness and widget roots, keeping transaction rollback, hardware frame completion and source replacement outside this adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A retained draft is not accepted history, captured qualification facts are not checked by document equality, and cyclic/non-JSON inputs fall outside the actual document premise rather than receiving guessed equality.
 * @evidence contracts/common.md#meaningful-documentation The comment states JSON comparison scope, ordering, qualification omission, mutation failure and event-free checkbox reflection.
 * @evidence contracts/performance.md#efficient-algorithms Capture borrows displayed data; restore serializes/loads the full document and recursively canonicalizes both documents, sorting each object's keys. For n values with local object sizes k, work includes O(n + sum(k log k)) plus loader/build cost and nested string allocation, with recursion depth equal to document nesting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each restoration is an effect through the editor's transaction; canonical strings are rebuilt from actual current values rather than cached across mutable documents or qualification changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registered callbacks borrow the editor and controls until bridge/page teardown, with no adapter-local close or restoration cap. Temporary canonical strings expire after comparison; actual candidate tasks, DOM, workers and GPU frames remain application/bridge-owned.
 *
 * @author Samchon
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
}): void {
  const canonical: (value: unknown) => string = (value: unknown): string => {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value !== null && typeof value === "object")
      return (
        "{" +
        Object.keys(value)
          .sort((left: string, right: string): number =>
            left < right ? -1 : left > right ? 1 : 0,
          )
          .map(
            (key: string): string =>
              JSON.stringify(key) + ":" + canonical(Reflect.get(value, key)),
          )
          .join(",") +
        "}"
      );
    return JSON.stringify(value) ?? "undefined";
  };
  registerPlaygroundViewerApplication({
    ready: props.ready,
    empty: props.empty,
    capture: ():
      | { document: object; facts: object | undefined }
      | undefined => {
      const document: object | undefined = props.document();
      return document === undefined
        ? undefined
        : { document, facts: props.facts?.() };
    },
    restore: async (state: unknown): Promise<void> => {
      if (state === undefined && props.empty) return;
      if (state === null || typeof state !== "object")
        throw new Error("Editor transfer has no committed document.");
      const document: unknown = Reflect.get(state, "document");
      if (document === null || typeof document !== "object")
        throw new Error("Editor transfer has no document object.");
      await props.load(JSON.stringify(document));
      if (canonical(props.document()) !== canonical(document))
        throw new Error(
          "The candidate did not commit the transferred document.",
        );
    },
    reflectView: (state: unknown): void => {
      if (state === null || typeof state !== "object") return;
      for (const name of ["clay", "shadows"] as const) {
        const value: unknown = Reflect.get(state, name);
        if (typeof value !== "boolean") continue;
        const control: HTMLInputElement | null =
          props.controls.querySelector<HTMLInputElement>("#" + name);
        if (control !== null) control.checked = value;
      }
    },
  });
}

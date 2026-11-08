/** Pure display selection shared by the viewer and Node source inspection. */
export namespace HumanInspectionSelection {
  /** Existing source display admission; retained ids are not sampled again. */
  export interface ISelection {
    /** Requested producer-id globs. */
    curves: readonly string[];
    /** Hidden producer-id globs applied after the requested globs. */
    curveHide: readonly string[];
    /** Visible source projection families. */
    views: readonly ("front" | "side" | "top")[];
    /** Whether to materialize the actual source axis. */
    axis: boolean;
    /** Visible construction-line kinds. */
    kinds: readonly ("section" | "axis" | "guide" | "path")[];
    /** Actual ids already retained by the caller. */
    known: readonly string[];
  }

  /** Classifies the existing producer suffix without importing UI state. */
  export function kind(id: string): "section" | "axis" | "guide" | "path" {
    const tail: string = id.slice(id.lastIndexOf("/") + 1);
    return tail === "axis" ? "axis" : /^g\d+$/.test(tail) ? "guide" : /^\d+$/.test(tail) ? "section" : "path";
  }

  /** Parses the existing comma-separated source globs; none requests an empty selection. */
  export function globs(text: string): { value: string[] } | string {
    const items: string[] = text.split(",").map((item: string): string => item.trim()).filter((item: string): boolean => item !== "");
    if (items.length === 1 && items[0] === "none") return { value: [] };
    return items.every((item: string): boolean => /^[A-Za-z0-9_.*/-]+$/.test(item)) ? { value: items } : "comma list of globs over letters, digits and _ . - / *, or none";
  }
}

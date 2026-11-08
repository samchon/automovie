/**
 * Expands one capture request (part globs and scopes) into every selection a
 * question about those parts needs: each original curve alone, each part
 * alone, the part with its neighbours, and the whole figure. Neighbours are
 * the part's parent, children and port or contour sharers, as its provider or
 * the existing inventory declares them. A requested or related name without a
 * drawable part becomes an explicit unavailable entry with its cause, never a
 * silently dropped one.
 */
export namespace CaptureSelection {
  /** Request scopes. `individual` covers each curve alone and each part alone. */
  export type Scope = "individual" | "neighbours" | "whole";

  /** The five stages: original 2D curves over the reference, loft curves, loft curves over clay, clay, and the registered reference mesh as clay under the clay stage's cameras. */
  export type Stage = "original" | "loft" | "loft-clay" | "clay" | "reference";

  /** All scopes in capture order. */
  export const SCOPES: readonly Scope[] = ["individual", "neighbours", "whole"];

  /** All stages in capture order. */
  export const STAGES: readonly Stage[] = ["original", "loft", "loft-clay", "clay", "reference"];

  /** What the expansion needs to know about one figure part. */
  export interface IPartInfo {
    /** Part name. */
    name: string;

    /** Null when drawable; otherwise why not. */
    unavailable: string | null;

    /** Host part. */
    parent: string | null;

    /** Child parts. */
    children: readonly string[];

    /** Parts sharing a port or contour. */
    shares: readonly string[];

    /** Original curve ids, empty for an unavailable part. */
    curves: readonly string[];
  }

  /** One selection: what is drawn together in one row of cells. */
  export interface ISelection {
    /** Stable id, such as `arm.left/curve/arm.lateral.humerus`, `arm.left/part`, `arm.left/neighbours` or `whole`. */
    id: string;

    /** Request scope it answers. */
    scope: Scope;

    /** `curve` (one original curve), `part`, `neighbours` or `whole`. */
    kind: "curve" | "part" | "neighbours" | "whole";

    /** Selected part the row belongs to; null for the whole figure. */
    owner: string | null;

    /** Drawable parts drawn in the row. */
    parts: string[];

    /** The one curve drawn by a curve row; null draws every curve of `parts`. */
    curve: string | null;

    /** Stages the row is drawn at: a curve row has only `original`, whose loft belongs to its part row. */
    stages: Stage[];

    /** Related or requested names the row could not draw, with causes. */
    unavailable: { name: string; cause: string }[];
  }

  /** The expanded request. */
  export interface IOutput {
    /** Drawable parts matched by the globs. */
    matched: string[];

    /** Matched names that are not drawable, and globs that matched nothing, with causes. */
    unavailable: { name: string; cause: string }[];

    /** Every selection in capture order. */
    selections: ISelection[];
  }

  /**
   * Glob of part names: `*` matches any run of characters (dots included),
   * `?` one character; every other character is literal. A pattern without
   * wildcards matches only its exact name.
   */
  export function glob(pattern: string): RegExp {
    const body: string = pattern
      .split("")
      .map((c: string): string => (c === "*" ? ".*" : c === "?" ? "." : c.replace(/[\\^$.|+()[\]{}]/g, "\\$&")))
      .join("");
    return new RegExp(`^${body}$`);
  }

  /**
   * Expand globs and scopes over the figure's parts.
   *
   * @param parts Every part the figure has, drawable or not.
   * @param patterns Part globs; at least one.
   * @param scopes Requested scopes; at least one.
   * @param stages Requested stages; at least one. A row keeps only the requested stages it can be drawn at.
   */
  export function expand(parts: readonly IPartInfo[], patterns: readonly string[], scopes: readonly Scope[], stages: readonly Stage[] = STAGES): IOutput {
    if (patterns.length === 0) throw new Error("No part pattern requested");
    if (scopes.length === 0) throw new Error("No scope requested");
    if (stages.length === 0) throw new Error("No stage requested");
    const byName: Map<string, IPartInfo> = new Map(parts.map((p: IPartInfo): [string, IPartInfo] => [p.name, p]));
    const unavailable: { name: string; cause: string }[] = [];
    const matched: string[] = [];
    for (const pattern of patterns) {
      const re: RegExp = glob(pattern);
      const hits: IPartInfo[] = parts.filter((p: IPartInfo): boolean => re.test(p.name));
      if (hits.length === 0) unavailable.push({ name: pattern, cause: "no figure part matches this pattern" });
      for (const hit of hits) {
        if (hit.unavailable !== null) {
          if (!unavailable.some((u: { name: string }): boolean => u.name === hit.name)) unavailable.push({ name: hit.name, cause: hit.unavailable });
        } else if (!matched.includes(hit.name)) matched.push(hit.name);
      }
    }
    const keep: (wanted: readonly Stage[]) => Stage[] = (wanted: readonly Stage[]): Stage[] => STAGES.filter((s: Stage): boolean => wanted.includes(s) && stages.includes(s));
    const selections: ISelection[] = [];
    for (const name of matched) {
      const part: IPartInfo = byName.get(name)!;
      if (scopes.includes("individual")) {
        if (keep(["original"]).length !== 0)
          for (const curve of part.curves)
            selections.push({ id: `${name}/curve/${curve}`, scope: "individual", kind: "curve", owner: name, parts: [name], curve, stages: keep(["original"]), unavailable: [] });
        selections.push({ id: `${name}/part`, scope: "individual", kind: "part", owner: name, parts: [name], curve: null, stages: keep(STAGES), unavailable: [] });
      }
      if (scopes.includes("neighbours")) {
        const related: string[] = neighbours(part, parts);
        const drawn: string[] = [name];
        const missing: { name: string; cause: string }[] = [];
        for (const other of related) {
          const info: IPartInfo | undefined = byName.get(other);
          if (info === undefined) missing.push({ name: other, cause: "named as a neighbour but absent from the figure inventory" });
          else if (info.unavailable !== null) missing.push({ name: other, cause: info.unavailable });
          else drawn.push(other);
        }
        selections.push({ id: `${name}/neighbours`, scope: "neighbours", kind: "neighbours", owner: name, parts: drawn, curve: null, stages: keep(STAGES), unavailable: missing });
      }
    }
    if (scopes.includes("whole") && matched.length !== 0)
      selections.push({
        id: "whole",
        scope: "whole",
        kind: "whole",
        owner: null,
        parts: parts.filter((p: IPartInfo): boolean => p.unavailable === null).map((p: IPartInfo): string => p.name),
        curve: null,
        stages: keep(STAGES),
        unavailable: parts.filter((p: IPartInfo): boolean => p.unavailable !== null).map((p: IPartInfo): { name: string; cause: string } => ({ name: p.name, cause: p.unavailable! })),
      });
    return { matched, unavailable, selections: selections.filter((s: ISelection): boolean => s.stages.length !== 0) };
  }

  /**
   * The neighbour names of a part, in order parent, children, sharers, then
   * every other part that names this part as its parent, child or sharer;
   * the relation is symmetric whichever side declared it. No duplicates and
   * never the part itself.
   */
  export function neighbours(part: IPartInfo, parts: readonly IPartInfo[]): string[] {
    const out: string[] = [];
    const add: (name: string | null) => void = (name: string | null): void => {
      if (name !== null && name !== part.name && !out.includes(name)) out.push(name);
    };
    add(part.parent);
    part.children.forEach(add);
    part.shares.forEach(add);
    for (const other of parts)
      if (other.parent === part.name || other.children.includes(part.name) || other.shares.includes(part.name)) add(other.name);
    return out;
  }
}

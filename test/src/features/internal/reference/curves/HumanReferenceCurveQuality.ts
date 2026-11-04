import type { HumanReferenceCurveGeometry } from "./HumanReferenceCurveGeometry";

/**
 * The reference curve pack's per-curve quality audit: its record types and
 * the filter every reader applies. A curve is `ok` when no detector fired,
 * `suspect` when a detector fired that may be a source or labelling artefact,
 * and `broken` when the curve visibly departs from the mesh section it was
 * fitted to. Readers return only `ok` curves unless asked; the rules and
 * limits are in each pack README and in `IAudit.method`.
 */
export namespace HumanReferenceCurveQuality {
  /** A curve's audit status: `broken` and `suspect` curves are left out by default. */
  export type Status = "ok" | "suspect" | "broken";

  /** Which audit statuses a reader keeps: `ok` alone when absent, `all` for every curve. */
  export type Filter = "all" | Status | readonly Status[];

  /** A place on a curve or on the mesh section it follows. */
  export interface IPlace {
    /** Span ordinal; absent for a mesh-section place. */
    span?: number;

    /** Local parameter on the span; absent for a mesh-section place. */
    t?: number;

    /** The point, mm. */
    pointMm: HumanReferenceCurveGeometry.V3;
  }

  /** One reason a curve is not ok. */
  export interface IReason {
    /**
     * Detector: `deviation`, `uncovered-cut`, `gap`, `tangent-jump`,
     * `self-crossing`, `dangling-end`, `comb-spike`, `zigzag`,
     * `recovery-tolerance`, `recovery-unresolved` or `open-arc` (the pack
     * README and `IAudit.method` state each rule and limit).
     */
    code: string;

    /** Severity of this reason. */
    severity: "suspect" | "broken";

    /** Measured value. */
    value: number;

    /** Unit of the value. */
    unit: string;

    /** Up to three places where the detector fired; empty for a flag from Recovery's own report. */
    places: IPlace[];
  }

  /** A curve's audit: its worst severity and the reasons. */
  export interface IQuality {
    /** `ok` when no reason applies. */
    status: Status;

    /** Reasons, broken first. */
    reasons: IReason[];
  }

  /** The audit's method, limits and per-region totals. */
  export interface IAudit {
    /** One sentence per rule. */
    method: string[];

    /** The limits applied. */
    limits: Record<string, number>;

    /** Path of the red/green proof record, relative to the index. */
    proof: string;

    /** Per region (or bone): counts by status and by `code:severity`. */
    byRegion: Record<string, Record<string, number>>;
  }

  /**
   * A predicate that keeps the curves whose audit status the filter names:
   * every curve for `all`, otherwise the named statuses, and `ok` alone when
   * the filter is absent. A curve without an audit record matches none.
   */
  export function accepts(filter: Filter | undefined): (audited: { quality?: IQuality }) => boolean {
    if (filter === "all") return (): boolean => true;

    const kept: Set<string> = new Set(filter === undefined ? ["ok"] : typeof filter === "string" ? [filter] : filter);

    return (audited: { quality?: IQuality }): boolean => kept.has(audited.quality?.status ?? "unaudited");
  }
}

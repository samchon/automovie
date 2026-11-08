import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";

/** Private executable inventory facts shared by its existing serial source and pair consumers. */
export namespace NodeCanvasInventoryTypes {
  /** Completion of the requested observations, distinct from geometry or appearance acceptance. */
  export interface IOutcome {
    /** Partial and failed requests require a nonzero caller exit while retaining completed PNGs. */
    status: "complete" | "partial" | "failed";
    /** Independent count domains; diagnostic, source, raw and frame counts must not be added together. */
    counts: Record<string, number>;
    /** Which actual requests and failures the counts describe. */
    accounting: string;
  }

  /** Production raw buffers adapted to display metres without changing the source or indices. */
  export interface Raw {
    /** Individual unchanged raw operand identities. */
    meshes: N.Mesh[];
    /** Actual generated section and guide centrelines. */
    curves: N.Curve[];
    /** Producer facts and join stages that were not run. */
    provenance: Record<string, unknown>;
    /** Unavailable, nonfinite and orphan facts remain failures beside any surviving buffers. */
    issues: string[];
  }

  /** A validated receipt determines demand before any original or raw producer runs. */
  export interface Pair {
    /** Stable comparison row identity. */
    id: string;
    /** Only this actual requested stage may activate its producer. */
    stage: "original" | "raw-clay";
    /** Exact producer names in this row. */
    names: string[];
    /** Actual saved camera, projection and canvas size. */
    camera: N.Camera;
    /** Exact shown source-curve or raw-operand identities. */
    ids: string[];
    /** Actual shown reference mesh IDs, independent of the selected source IDs. */
    referenceIds: string[];
    /** Actual crop selectors; legacy receipts explicitly fall back to their selected source names. */
    referencePatterns: string[];
    /** Requested non-axis depth policy; actual axes remain always-through. */
    lineMode: "xray" | "depth";
    /** Unsupported or unrecorded presentation demands prevent a complete-scene success claim. */
    differences: string[];
    /** Receipt, PNG and source identities retained for independent comparison. */
    evidence: Record<string, unknown>;
  }

  /** Invalid rows remain failures without activating unrelated or replacement producers. */
  export interface PairSet {
    /** Valid rows that may request production work. */
    rows: Pair[];
    /** Durable outcomes, including input failures and each attempted row. */
    results: Record<string, unknown>[];
    /** Actual input array length, zero when it could not be read. */
    requested: number;
    /** File/schema errors are distinct from refused rows. */
    inputFailures: number;
  }
}

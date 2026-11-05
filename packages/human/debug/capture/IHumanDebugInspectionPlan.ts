import type { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";

/** Data-only inspection request. Source and renderer remain owned by the existing viewer. */
export interface IHumanDebugInspectionPlan {
  /** Plan format. */
  version: 1;
  /** Unique artifact directory name, not a person or geometry selector. */
  id: string;
  /** This campaign's explicitly authorized person. */
  person: "f1";
  /** Selected original parts; missing names remain unavailable. */
  parts: IHumanDebugInspectionPlan.Part[];
  /** Enumerate every actual tree part; explicit parts supply camera overrides or unavailable requests. */
  allParts?: boolean;
  /** Explicit connection neighbours, without inferring dependency closure. */
  groups: IHumanDebugInspectionPlan.Group[];
  /** Named overview directions; default front, left, top and back. */
  cameras?: IHumanDebugInspectionPlan.Camera[];
  /** Reference-only directions; default the eight distinct named directions. */
  referenceCameras?: IHumanDebugInspectionPlan.Camera[];
  /** Opt-in ordinary preparation after the original/raw blocks. */
  final?: boolean;
  /** Drawing-buffer side, pixels; default 1200. */
  size?: number;
}

/** Packet records, all in local evidence files rather than retained geometry caches. */
export namespace IHumanDebugInspectionPlan {
  /** Existing camera vocabulary; angle overrides are deliberately absent. */
  export type Camera = keyof typeof HUMAN_DEBUG_CAMERAS;
  /** Original scalar-outline or axis identity. */
  export type Edge = "front.pos" | "front.neg" | "side.pos" | "side.neg" | "axis";
  /** A requested source part and informative named observation directions. */
  export interface Part {
    /** Exact production source name. */
    name: string;
    /** Optional per-outline camera; otherwise choose the widest measured world-box projection. */
    outlineCameras?: Partial<Record<Edge, Camera>>;
    /** One informative camera per available raw fullness ring. */
    topCamera?: Camera;
  }
  /** An explicitly selected connected group. */
  export interface Group {
    /** Safe output scope name. */
    id: string;
    /** Actual part names sharing the inspected connection. */
    parts: string[];
  }
  /** Capture completion, separate from anatomical acceptance. */
  export type Status = "pending" | "done" | "failed" | "unavailable";
  /** Producer and display pass. Probes are retained, never called comparison evidence. */
  export type Stage = "inventory" | "framing" | "reference" | "original" | "original-sections" | "raw-curves" | "raw-overlay" | "raw-clay" | "final-clay";
  /** Bounds and placement from existing visible-source framing, in metres. */
  export interface Frame {
    /** Current source-curve or reference union box. */
    min: number[];
    /** Current source-curve or reference union box. */
    max: number[];
  }
  /** One planned frame and its persistent result. */
  export interface Row {
    /** Stable packet-local identity. */
    id: string;
    /** Intended producer/display stage. */
    stage: Stage;
    /** Whole, selected part, connection group or individual curve. */
    scope: string;
    /** Named intended direction, checked against the snapshot. */
    camera: Camera;
    /** Select a named direction from this curve's measured bounds when no override was supplied. */
    automaticCamera: boolean;
    /** Scope whose measured frame this row consumes. */
    frameKey: string;
    /** Exact source part names, not unconnected studies. */
    names: string[];
    /** Exact original IDs, or null for the complete selected raw chains. */
    curveIds: string[] | null;
    /** Durable capture status. */
    status: Status;
    /** Original failure or unavailability cause. */
    error: string | null;
    /** Producer invocation failures block that producer; capture validation failures do not. */
    failureKind: "producer" | "capture" | null;
    /** Saved files and observed metadata after success. */
    artifact: Artifact | null;
    /** UTC client request admission. */
    startedUtc: string | null;
    /** UTC client completion. */
    endedUtc: string | null;
    /** Row wall time: request, evidence reads, validation and failure recording; not generation time. */
    elapsedMilliseconds: number | null;
  }
  /** One full batch receipt, unchanged from the existing producer. */
  export interface Receipt {
    /** Disk inventory hash checked around page load. */
    source: string;
    /** Exact PNG digest. */
    pngSha256: string;
    /** Actual draw time. */
    capturedUtc: string;
    /** PNG reuse state, independent of subject reuse. */
    cache: string;
    /** Existing session's module/source attempts. */
    attempts: number;
    /** Canonical applied query. */
    query: string;
    /** Full untruncated page observation. */
    snapshot: IHumanDebugSnapshot;
  }
  /** Packet-owned links and checks; no duplicate geometry. */
  export interface Artifact {
    /** Original batch PNG. */
    png: string;
    /** Original complete batch JSON. */
    receipt: string;
    /** Original complete HTTP response, including failed items. */
    response: string;
    /** Requested HTTP URL. */
    url: string;
    /** Observed receipt facts. */
    frame: Omit<Receipt, "snapshot">;
    /** Actual camera; the complete snapshot remains in its adjacent file. */
    camera: Record<string, unknown> | null;
    /** Null means this apply reused the current subject, not a zero-cost new preparation. */
    loadMilliseconds: number | null;
    /** Observed selected sizes. */
    shown: { parts: number; curves: number };
    /** Explicit successful protocol checks, never shape judgments. */
    checks: string[];
  }
  /** Durable packet and checkpoint. */
  export interface Manifest {
    /** Manifest format. */
    version: 1;
    /** Immutable requested data. */
    plan: IHumanDebugInspectionPlan;
    /** Exact normalized plan digest. */
    planSha256: string;
    /** Absolute ignored artifact directory. */
    out: string;
    /** First creation time. */
    createdUtc: string;
    /** Last checkpoint time. */
    updatedUtc: string;
    /** First terminal packet completion; a read-only resume does not rewrite this time. */
    completedUtc: string | null;
    /** First accepted page source; all subsequent rows must match. */
    source: string | null;
    /** Disk inventory observed before admission; resume requires this same current inventory. */
    diskSource: { sourceSha256: string; observedUtc: string };
    /** Exact digest of this eight-file controller, independently checked on resume. */
    controllerSha256: string;
    /** Fixed alias/file identity; resolved runtime values are not exposed. */
    input: { alias: "f1"; file: string; sha256: string; resolvedValues: null; resolvedDigest: null; diagnostic: string };
    /** Native bytes and a conservative local section-pack file digest. */
    reference: { nativeFile: string; nativeSha256: string | null; packSha256: string | null };
    /** Measured source boxes, reused across matching passes. */
    frames: Record<string, Frame>;
    /** Whole actual production tree, without studies or definition-only additions. */
    treeParts: string[];
    /** Original display inventory, including explicit unavailability diagnostics in the first receipt. */
    originalIds: string[];
    /** Every requested frame and its completion state. */
    rows: Row[];
    /** Subject-load events only; repeated provenance timings are not summed per image. */
    preparations: { row: string; subject: string; loadMilliseconds: number; milliseconds: unknown }[];
    /** Persistent exceptional events and source/cache limitations. */
    notes: string[];
  }
  /** Small atomic row journal; full summaries are written only at block checkpoints. */
  export interface Progress {
    /** Complete result of one stable row. */
    row: Row;
    /** First accepted page epoch, if one was accepted. */
    source: string | null;
    /** Measured bounds produced by this row, without copying other frames. */
    frame: Frame | null;
    /** Subject-load event belonging to this row, never repeated provenance sums. */
    preparation: Manifest["preparations"][number] | null;
  }
}

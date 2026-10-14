import type { IHumanViewerHealthSources } from "./IHumanViewerHealthSources.js";
import type { humanViewerProtocol } from "./humanViewerProtocol.js";

/**
 * One health answer assembled from the server's current owner readings. Values are a request-time snapshot, not an atomic measurement of every owner. Retained-array bytes, V8 heaps and renderer identity describe different facts; none certifies physical GPU allocation.
 *
 * @evidence contracts/common.md#principled-implementation The answer exposes source, readiness, queue, capture and numerical owner readings separately so a last-good display and failed current source remain distinguishable.
 * @evidence contracts/common.md#clear-and-simple-design Readings reuse their owning service return types, while the health envelope defines only server identity and cross-owner summary fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness and stale status remain observations of the actual resident; the snapshot neither invents job ETA nor equates tracked array bytes with GPU memory.
 * @evidence contracts/common.md#meaningful-documentation Member comments explain process ownership, source/current authority, nullable failure/readings, units and the non-atomic snapshot limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This health representation performs no polling, aggregation scan or runtime validation itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request-time observations do not define cache equivalence; each producer remains responsible for its own current status and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Status data owns no browser, worker, socket or GPU handle; its response lifetime is distinct from the owners it describes.
 *
 * @author Samchon
 */
export type IHumanViewerHealth = ReturnType<
  IHumanViewerHealthSources["capture"]["status"]
> & {
  /** Protocol service discriminator recognized by viewer clients. */
  service: "automovie-human-viewer";

  /** Version of the viewer control and health protocol. */
  protocol: typeof humanViewerProtocol;

  /** Launcher pid when present, otherwise the directly started server pid. */
  pid: number;

  /** Pid of the HTTP server producing this answer. */
  serverPid: number;

  /** Public port owned by this viewer session. */
  port: number;

  /** Resolved mutable storage location for this viewer process. */
  storage: string;

  /** Source revision the current catalogue requests. */
  revision: string;

  /** Page-reported unmasked renderer text or generic fallback, empty before observation; not independent hardware/device proof. */
  renderer: string;

  /** Nonempty reported page authority and renderer text are available; this proves neither actual drawing nor newest-source success or physical hardware. */
  ready: boolean;

  /** Last reported ready-page authority compared with current catalogue authority. */
  serving: {
    /** Reported ready-page authority, empty before a readiness report. */
    revision: string;

    /** Current desired catalogue revision. */
    current: string;

    /** True when ready page and desired catalogue authorities differ. */
    stale: boolean;

    /** Time of the last successful source compilation, or null before one. */
    goodAt: ReturnType<IHumanViewerHealthSources["sourceStatus"]>["goodAt"];
  };

  /** Current compile cause, otherwise the latest retained error, or null. */
  sourceError: string | null;

  /** Source compilation owner's complete status reading. */
  compilation: ReturnType<IHumanViewerHealthSources["sourceStatus"]>;

  /** Recent source/page error messages, retained by residency. */
  errors: string[];

  /** Whether source-edit computation or publication is pending. */
  sourceUpdating: boolean;

  /** Latest decoded page progress, or null before a progress record. */
  work: ReturnType<IHumanViewerHealthSources["work"]>;

  /** Resident-page heap sampler state; Node numerical heaps are separate. */
  heap: ReturnType<IHumanViewerHealthSources["heap"]["status"]>;

  /** Last completed source-domain digests. */
  revisions: ReturnType<IHumanViewerHealthSources["revisions"]["current"]>;

  /** GPU queue counters and its running capture's current stage. */
  queue: ReturnType<IHumanViewerHealthSources["queue"]["status"]> & {
    /** Maximum waiting requests admitted per lane; three lanes can each reach this limit beside the one running request. */
    limit: number;

    /** Current running capture stage, or null between captures. */
    stage: ReturnType<IHumanViewerHealthSources["stage"]>;
  };

  /** Latest source edit that reached a build, or null before one. */
  lastEdit: ReturnType<IHumanViewerHealthSources["lastEdit"]>;

  /** Background thumbnail pass's current counters and retained latest failure. */
  warm: IHumanViewerHealthSources["warming"];

  /** Current startup phase and its entry time. */
  startup: IHumanViewerHealthSources["startup"];

  /** Current document admission counts and waiting identities. */
  admission: ReturnType<IHumanViewerHealthSources["admission"]>;

  /** Page replacement attempts initiated after failed-page close since server start; an increment does not prove successful reopening. */
  relaunches: number;

  /** Latest heap-driven resident trim decision, or null before one. */
  trim: ReturnType<IHumanViewerHealthSources["trim"]>;

  /** Open candidate windows currently holding compile withdrawal. */
  holding: number;

  /** Server process uptime rounded to milliseconds. */
  uptimeMs: number;
};

import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerAdmissionStatus } from "./IHumanViewerAdmissionStatus.js";
import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerEdit } from "./IHumanViewerEdit.js";
import type { IHumanViewerResidentTrimReading } from "./IHumanViewerResidentTrimReading.js";
import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";
import type { createHumanViewerCapture } from "./createHumanViewerCapture.js";
import type { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import type { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus.js";

/**
 * The server state `/health` reports, read through accessors at answer time. Accessors contribute their owners' local identities, counts, status, resources and causes. This snapshot does not calculate whole-job ETA, classify credentials or implement a causal event ledger.
 *
 * @evidence contracts/common.md#principled-implementation Answer-time accessors project actual source/page/queue/heap/admission/capture owner observations without performing numerical or GPU work.
 * @evidence contracts/common.md#clear-and-simple-design Keeps desired source, serving generation, renderer text and causes separate, with process/port/storage identity supplied by the server.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ready is nonempty drawable authority plus renderer text, not current-source success or independent hardware/display proof; old last-good state remains labeled stale.
 * @evidence contracts/common.md#meaningful-documentation Documents nullable observations and owner services, separating local counts/times from job ETA, credentials or a complete causal event ledger.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings perform no assembly; assembleHumanViewerHealth invokes each accessor once and serializes producer-sized metadata.
 * @evidence contracts/performance.md#reuse-equivalent-work One health request reads fresh mutable owner state; equal source revision does not make a previous queue/error/heap snapshot current.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The server borrows source and browser service references; response serialization owns transient metadata while each producer retains its own handles/tasks.
 *
 * @author Samchon
 */
export interface IHumanViewerHealthSources {
  /** Resolved mutable storage served by this process. */
  storage: string;

  /** Port the server listens on. */
  port: number;

  /**
   * The launcher that owns the port and record, or null for a server started directly.
   */
  owner: number | null;

  /**
   * The current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Reads current desired source/catalogue revision for the health comparison against ready serving code.
   * @evidence contracts/common.md#clear-and-simple-design Keeps document inventory authority in the catalogue controller while health adds only the cross-owner stale summary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A current inventory revision does not prove the page loaded it; serving readiness is reported independently.
   * @evidence contracts/common.md#meaningful-documentation The accessor supplies the complete current inventory, though the assembler only reads its revision and performs no document inspection.
   * @evidence contracts/performance.md#efficient-algorithms The assembler reads once and compares revision text; any catalogue refresh work belongs to its publication owner.
   * @evidence contracts/performance.md#reuse-equivalent-work Published inventory can be reused until replacement, but each health request rereads its current reference.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns document arrays and replacement; the health response adds no numerical resident or retained inventory cache.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Renderer string of the GPU page, empty before it is known.
   *
   * @evidence contracts/common.md#principled-implementation Reads the currently reported page WebGL renderer string for status and nonempty ready calculation.
   * @evidence contracts/common.md#clear-and-simple-design Keeps device reporting with the page observation owner instead of creating a graphics context in health assembly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonempty text is not a separate hardware classifier or image inspection, and fallback renderer strings may omit unmasked details.
   * @evidence contracts/common.md#meaningful-documentation Empty means no renderer description is available; its report remains independent of loaded-code currentness.
   * @evidence contracts/performance.md#efficient-algorithms One string read and nonempty comparison add fixed bookkeeping to response serialization.
   * @evidence contracts/performance.md#reuse-equivalent-work The page owner retains its observed string while each request refreshes the reported value after recovery.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only text is returned; native context/browser resources remain with the residency owner.
   */
  renderer: () => string;

  /**
   * The generation the page can draw, empty while none can.
   *
   * @evidence contracts/common.md#principled-implementation Reads the generation authority the page reports drawable, including stale or explicit unproven labels.
   * @evidence contracts/common.md#clear-and-simple-design Separates serving code from inventory's desired source so health can disclose last-good fallback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonempty authority contributes ready but cannot certify current code, displayed model acceptance or controls.
   * @evidence contracts/common.md#meaningful-documentation Empty marks no drawable generation; stale is computed by comparison with current inventory rather than by compile completion time.
   * @evidence contracts/performance.md#efficient-algorithms One text read/comparison adds no compile or catalogue traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The browser owner retains its latest readiness, but each health request reads it again because reload/recovery can withdraw authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The token retains no page handle; source windows and browser owners manage their independent resources.
   */
  readyRevision: () => string;

  /**
   * What the compile process last reported.
   *
   * @evidence contracts/common.md#principled-implementation Reads the newest compile failure and last actual successful Human compile completion from its existing status reader.
   * @evidence contracts/common.md#clear-and-simple-design Keeps compile-attempt facts separate from page serving source and numerical model cache state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A last-good timestamp cannot replace latest failure or prove current readiness; original compile cause takes precedence in sourceError.
   * @evidence contracts/common.md#meaningful-documentation The assembler reads error/goodAt once and reports the same compilation state without manufacturing a retry policy.
   * @evidence contracts/performance.md#efficient-algorithms Status read cost belongs to the supplied owner; health performs fixed field projection rather than transforming sources.
   * @evidence contracts/performance.md#reuse-equivalent-work Completed status facts can be retained by the reader, while request-time access avoids an installation-time snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record owns no compiler process; compilation scheduling and output map lifetime stay with their producers.
   */
  sourceStatus: () => ReturnType<typeof readHumanViewerCompilationStatus>;

  /**
   * Recent page and source errors.
   *
   * @evidence contracts/common.md#principled-implementation Reads current page/source/display error strings, whose latest entry is used only when the compile owner reports no error.
   * @evidence contracts/common.md#clear-and-simple-design Keeps error production with original owners and projects both the list and cross-owner sourceError summary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is not a complete causal journal or redacted diagnostic contract; no successful frame is inferred from an empty list.
   * @evidence contracts/common.md#meaningful-documentation The callback returns current reported causes without discarding the compile owner's higher-priority latest error.
   * @evidence contracts/performance.md#efficient-algorithms Access is one callback and last-index lookup; serialization scales with retained error count and message bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work Previously reported causes remain owner state, but each request refreshes the list after readiness/recovery changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Error arrays/messages have no independent cap in residency; health borrows them and retains no extra history or native task.
   */
  errors: () => string[];

  /**
   * Whether a source edit is being applied.
   *
   * @evidence contracts/common.md#principled-implementation Reads whether an edit batch is still being applied by the source owner.
   * @evidence contracts/common.md#clear-and-simple-design Separates source-update activity from current/serving revision identity and compile failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts False alone does not certify current page code or complete document admission; it is a local status observation.
   * @evidence contracts/common.md#meaningful-documentation The boolean describes request-time source batching, without a timer-derived completion percentage.
   * @evidence contracts/performance.md#efficient-algorithms One boolean read adds fixed bookkeeping; actual digest/watcher work remains with the source service.
   * @evidence contracts/performance.md#reuse-equivalent-work Each health request refreshes this transient value rather than caching it under a source digest.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The accessor returns no batch task handle; outstanding source work remains owned until its actual settlement.
   */
  sourceUpdating: () => boolean;

  /**
   * The page's latest progress record.
   *
   * @evidence contracts/common.md#principled-implementation Reads the resident page's latest parsed numerical work record or null when no recognized observation is available.
   * @evidence contracts/common.md#clear-and-simple-design Keeps numerical phase/detail observation distinct from capture queue stages and heap sample provenance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record provides actual milestones without a planned denominator or ETA; a phase alone does not prove construction/display completion.
   * @evidence contracts/common.md#meaningful-documentation Null is absent work evidence and optional completed details retain their numerical protocol meaning.
   * @evidence contracts/performance.md#efficient-algorithms One record read adds fixed assembly work; event parsing and numerical progress generation remain their owners' cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Latest work is retained for status, while the request rereads it instead of treating an old source-matching phase as current progress.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The browser owner retains one latest work record; health borrows it without owning numerical requests or worker lifetime.
   */
  work: () => HumanViewerWork | null;

  /** Heap readings of the resident page. */
  heap: ReturnType<typeof createHumanViewerHeapGauge>;

  /** Revisions of the source files. */
  revisions: ReturnType<typeof createHumanViewerSource>["revisions"];

  /** The GPU queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Requests allowed to wait behind the running one. */
  queueLimit: number;

  /**
   * The last edit that reached a build.
   *
   * @evidence contracts/common.md#principled-implementation Reads the latest published source batch's paths, publication time and actually moved digest domains.
   * @evidence contracts/common.md#clear-and-simple-design Keeps edit context separate from first-current-frame capture latency and compile status.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts One batch is not a full event ledger; moved-domain labels cannot certify a completed matching render.
   * @evidence contracts/common.md#meaningful-documentation Null means no published edit batch; the supplied record preserves repository-relative paths and wall-clock observation meaning.
   * @evidence contracts/performance.md#efficient-algorithms One optional record read adds fixed bookkeeping; response bytes scale with that latest batch's path population.
   * @evidence contracts/performance.md#reuse-equivalent-work The source owner reuses its latest edit record until replacement, but health refreshes the reference every request.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one latest batch is retained by its owner, with no added history/map or watcher acquisition in health.
   */
  lastEdit: () => IHumanViewerEdit | null;

  /** Capture state and telemetry. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /** Progress of the background warm pass. */
  warming: IHumanViewerWarming;

  /** What the server is doing while it starts. */
  startup: IHumanViewerStartup;

  /**
   * Admissions in flight and documents waiting for a viewer frame.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual in-flight and waiting admission populations and distinct pending causes from the admission owner.
   * @evidence contracts/common.md#clear-and-simple-design Keeps local transport observation separate from numerical verdict records and display readiness.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts do not express a work denominator or promise automatic recovery; pending transport remains distinct from owner refusal.
   * @evidence contracts/common.md#meaningful-documentation The returned status names asking/waiting/reasons with original cause semantics rather than a global progress estimate.
   * @evidence contracts/performance.md#efficient-algorithms The owner scans waiting reasons once for status; health adds one callback and response serialization over those reasons.
   * @evidence contracts/performance.md#reuse-equivalent-work Current keyed verdicts remain reusable in admission, while a health status snapshot itself is refreshed rather than cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Settled tasks leave admission request maps; encountered waiting/verdict ids lack removed-id pruning, and health borrows the resulting snapshot.
   */
  admission: () => IHumanViewerAdmissionStatus;

  /**
   * Page-replacement attempts initiated after renderer failure since server start; an increment does not guarantee successful reopening.
   *
   * @evidence contracts/common.md#principled-implementation Reads the number of residency replacement attempts initiated after renderer failure since this server started.
   * @evidence contracts/common.md#clear-and-simple-design Reports browser recovery activity separately from source generation retries and numerical transport replacement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A count increment occurs before reopening and therefore is not proof every replacement completed successfully.
   * @evidence contracts/common.md#meaningful-documentation The value is a server-lifetime observation of page reopenings, with final failure reported through independent causes.
   * @evidence contracts/performance.md#efficient-algorithms One scalar read adds fixed status work; actual browser/page launch costs remain with residency.
   * @evidence contracts/performance.md#reuse-equivalent-work The counter accumulates owner events, while each response reads the current value rather than deriving it from source revision.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one number without per-attempt history; browser handles and in-progress recovery belong to their owner.
   */
  relaunches: () => number;

  /**
   * The last resident trim decision.
   *
   * @evidence contracts/common.md#principled-implementation Reads the last completed resident-trim decision with measured page/worker usage, evictions and current domain room estimates.
   * @evidence contracts/common.md#clear-and-simple-design Keeps measured heap policy telemetry separate from capture output and numerical admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A recorded fit is best effort, not complete process memory, physical release or a guaranteed future allocation.
   * @evidence contracts/common.md#meaningful-documentation Null means no trim decision yet; byte values and eviction counts retain the heap owner's observation semantics.
   * @evidence contracts/performance.md#efficient-algorithms One optional record read adds fixed work, while measuring/evicting costs belong to createHumanViewerResidentTrim.
   * @evidence contracts/performance.md#reuse-equivalent-work The last decision is reused for reporting only; future trim/capture decisions reread heap pressure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The trim owner retains one decision and three domain estimates; health owns no evicted resident or worker resource.
   */
  trim: () => IHumanViewerResidentTrimReading | null;

  /**
   * Candidate loading windows open now, each holding compile withdrawal.
   *
   * @evidence contracts/common.md#principled-implementation Reads the number of currently open candidate windows holding compile withdrawal.
   * @evidence contracts/common.md#clear-and-simple-design Separates active source-load holds from closed-token history and pending numerical jobs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A hold count is not compiler completion, reader progress or a fixed capacity policy; active windows have no numeric cap here.
   * @evidence contracts/common.md#meaningful-documentation The scalar reflects currently open window tokens whose close/closeAll paths must release their gate holds.
   * @evidence contracts/performance.md#efficient-algorithms Map size provides fixed work without traversing candidate code or numerical geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work The windows owner maintains its active map; each health request reads current size after open/close transitions.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each active hold lives until its window closes; closed labels are independently bounded to 64 by the owner.
   */
  holding: () => number;

  /**
   * The running capture's stage, or null between captures.
   *
   * @evidence contracts/common.md#principled-implementation Reads the currently observed capture room/page/trim stage, or null between matching actual operations.
   * @evidence contracts/common.md#clear-and-simple-design Keeps capture activity observation apart from numerical work and queue cancellation authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stage age and progress timestamps never authorize early GPU-slot release or an ETA.
   * @evidence contracts/common.md#meaningful-documentation Null is no current stage; document/name/start/progress fields retain local wall-clock observation meaning.
   * @evidence contracts/performance.md#efficient-algorithms One reference read adds fixed status work; numerical/GPU/heap stage cost remains with the actual operation.
   * @evidence contracts/performance.md#reuse-equivalent-work The watcher exposes the same current record until matching settlement, without reusing prior stage progress for new operations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One stage record remains until settlement and no observer timer/history is retained; capture lifetime owns actual dispatch retirement.
   */
  stage: () => IHumanViewerCaptureStage | null;
}

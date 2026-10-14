import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Browser display and observation protocol, shared by the page host and server. Numerical document editing is absent; show, eviction, construction export and deferred cache persistence retain their owning effects.
 *
 * A PNG may contain a composed local photograph. Reference composition and paths stay outside the numerical cache envelope; its shallow guard does not certify arbitrary nested model members.
 *
 * @evidence contracts/common.md#principled-implementation The page exposes its real viewport observations and numerical result receipts; show/evict/export are generation-bound operations, while admission remains the Human numerical owner's report.
 * @evidence contracts/common.md#clear-and-simple-design One handle is forwarded by host/generation adapters without rebuilding geometry or silently rebinding old observations to a new iframe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Renderer text, progress counters and PNG encoding prove only their stated observations, not hardware suitability, physiological admission or current-source equivalence by themselves.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish borrowed readings, completed selection, optional construction data, deferred persistence and asynchronous failure effects; the handle edits display state rather than numerical documents.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no work; traversal, frame drawing, encoding and worker requests remain the actual page/viewport operations described on each member.
 * @evidence contracts/performance.md#reuse-equivalent-work A handle stays bound to one generation. Resident reuse requires document/basis/source/operation identities in the page's cache key, while distinct display and export effects are not merged by this protocol.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Host/page owners retain and retire iframe, worker, renderer and resident resources; this type supplies no pending-operation cap or physical release implementation.
 *
 *
 * @author Samchon
 */
export interface HumanViewerHandle {
  /**
   * Serialize display selection and finish its GPU frame. Keep the supplied
   * address unchanged until settlement. A cleanup failure can reject after a
   * new frame committed, so rejection alone does not imply selection rollback.
   *
   * @evidence contracts/common.md#principled-implementation page.ts chains show operations, obtains current catalogue authority and commits the completed resident/address only after drawing; its catch restores the prior display when no new selection committed.
   * @evidence contracts/common.md#clear-and-simple-design Delegates preparation, numerical building, framing and drawing to their owners while the page queue orders display effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The request keeps its supplied address until camera-readback publication rather than pretending it was snapshotted at admission; post-commit cleanup refusal does not invent rollback.
   * @evidence contracts/common.md#meaningful-documentation States input borrowing, frame completion, operation serialization and the difference between preparation failure and cleanup failure after commit.
   * @evidence contracts/performance.md#efficient-algorithms Each show refreshes/selects catalogue data and traverses/draws its selected viewport; cold builds retain their numerical cost while a resident hit still frames and renders.
   * @evidence contracts/performance.md#reuse-equivalent-work The page reuses residents by document key, AO and preview/construction mode; catalogue refresh prevents same-source document edits from reusing an older key, and requested display effects still execute.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The page promise chain has no independent pending-show cap; host queue admission and generation retirement are separate owners, and the committed resident may remain after a later cleanup refusal.
   */
  show(address: HumanViewerAddress): Promise<void>;

  /**
   * Subject-root mesh names in traversal order, including hidden parts; empty
   * before display. Distinct meshes may carry the same name.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to active.observe.parts, whose root traversals exclude auxiliary observation meshes and deduplicate mesh objects, not their names.
   * @evidence contracts/common.md#clear-and-simple-design Uses the product observation hook instead of a second part catalogue or guessed region-to-mesh mapping.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Visibility does not filter membership, and repeated names are not silently converted into unique part identities.
   * @evidence contracts/common.md#meaningful-documentation States root membership, traversal order, hidden-part inclusion, repeated-name possibility and the empty pre-display result.
   * @evidence contracts/performance.md#efficient-algorithms Visits each supplied root's descendants and builds an object-identity Set plus M returned names; work is proportional to those traversals, including repeated overlapping roots.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads the current roots on each call so newly published groups are represented without a stale name-list cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Traversal storage and the returned name array acquire no mesh ownership; the viewport retains and retires geometry separately.
   */
  parts(): string[];

  /**
   * WebGL renderer text, unmasked when the debug-renderer extension is available
   * and the standard renderer string otherwise; this is no hardware pass.
   *
   * @evidence contracts/common.md#principled-implementation The page reads UNMASKED_RENDERER_WEBGL only when its extension exists, otherwise gl.RENDERER, and converts that actual query result to text.
   * @evidence contracts/common.md#clear-and-simple-design Reports the current WebGL context directly rather than deriving a device identity from browser name or cached health.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing debug access does not fabricate an unmasked device, and a renderer string alone does not prove a completed hardware display.
   * @evidence contracts/common.md#meaningful-documentation Specifies the extension-dependent fallback and distinguishes device reporting from visual/hardware verification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Two fixed WebGL queries and text conversion choose no scene traversal or discovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads the live context per observation rather than reusing a previous renderer receipt after context replacement.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrows the page's context and returns a string, acquiring no context, extension lifetime or driver handle.
   */
  renderer(): string;

  /**
   * The page catalogue's source revision, available before display; it alone
   * proves neither a rendered mesh nor that a particular document is unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Returns catalogue.revision; page startup independently compares browser compile stamps and the checked Node realm against that source authority.
   * @evidence contracts/common.md#clear-and-simple-design Exposes source identity separately from address selection and per-document cache keys.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not hash a displayed mesh or treat matching source strings as document/basis equality or successful rendering.
   * @evidence contracts/common.md#meaningful-documentation States the catalogue origin, pre-display availability and limits of the revision observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Reads one stored string; source hashing and witness checking remain catalogue and loader operations.
   * @evidence contracts/performance.md#reuse-equivalent-work Source identity is shared across same-source documents, whose separate keys can change on edits; resident reuse still checks those document dependencies.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns an immutable string value without owning a source watcher, loader realm or resident lifetime.
   */
  revision(): string;

  /**
   * Successful correlated numerical result replies since this page loaded,
   * excluding disk/GPU hits and failed replies; not every attempted computation.
   *
   * @evidence contracts/common.md#principled-implementation createHumanViewerNumericalPort increments its counter only for a matched successful reply with a result; separate admission replies and persistence/progress records take different branches.
   * @evidence contracts/common.md#clear-and-simple-design Forwards the numerical port's counter rather than inferring build work from rendered frames or cache lookups.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The successful-result count is not presented as all attempts, unique documents or a geometry-verification tally.
   * @evidence contracts/common.md#meaningful-documentation States page lifetime, matched successful replies and excluded cache/failure paths.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One scalar read performs no result scan; incrementing and reply correlation belong to the numerical port.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Disk and resident hits reuse admitted results without incrementing this Node reply counter; the getter itself reuses no earlier observation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds no reply payload or worker handle; the port owns the page-lifetime counter and worker disposal.
   */
  builds(): number;

  /**
   * Worker-reported milliseconds on the latest successful result reply, or zero
   * before one arrives or when that reply omitted a duration.
   *
   * @evidence contracts/common.md#principled-implementation The numerical port stores data.buildMs ?? 0 on the same successful correlated branch that increments builds.
   * @evidence contracts/common.md#clear-and-simple-design Keeps worker duration separate from page stage spans and total show time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent measurement remains zero instead of being inferred from browser elapsed time; failed replies do not overwrite the latest successful reading.
   * @evidence contracts/common.md#meaningful-documentation Specifies milliseconds, successful-reply ownership and both meanings of zero.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar getter chooses no timing or aggregation algorithm; the worker measures its own operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated reads expose the latest received value rather than performing or caching another build.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one number and retains no request, timer or worker result through the handle.
   */
  buildMs(): number;

  /**
   * Copied page milliseconds by stage since the latest show reset. A resident
   * hit still records loading/drawing; worker durations use a separate clock.
   *
   * @evidence contracts/common.md#principled-implementation spans.snapshot copies createHumanViewerSpans totals; measured tasks use finally and work-reporter transitions close unmeasured loading/prepare/draw intervals.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the existing stage accumulator without adding worker clock readings into page intervals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache reuse does not imply zero display work, and a phase without a following report has no fabricated completion duration.
   * @evidence contracts/common.md#meaningful-documentation States reset scope, copied output, cache-hit drawing and the distinct page/worker time origins.
   * @evidence contracts/performance.md#efficient-algorithms Snapshot copies S named totals in O(S) time and output storage; individual accumulation stays with the span owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh copy observes current accumulated transitions, with no earlier snapshot replayed as a new elapsed-time reading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the copied record; the page accumulator retains supplied stage names until reset and has no independent name-count cap.
   */
  spans(): Record<string, number>;

  /**
   * Borrowed last committed display selection; keep it unchanged. Refuses
   * before display, and observes camera readback rather than only the request.
   *
   * @evidence contracts/common.md#principled-implementation Returns page.ts current, assigned from readHumanViewerCameraAddress only after a completed frame; absent current throws.
   * @evidence contracts/common.md#clear-and-simple-design Uses the same committed address that bookmarks and generation restoration retain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The getter does not substitute an outstanding request or pretend to defensively clone the shared current object.
   * @evidence contracts/common.md#meaningful-documentation States borrowed ownership, caller immutability, pre-display refusal and actual camera-readback publication.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One existence check and reference return choose no camera or catalogue algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads the committed page address; a pending show does not replace it before its own frame commits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The page owns the address and its tuple fields until replacement; borrowing it creates no camera listener or new resident ownership.
   */
  address(): HumanViewerAddress;

  /**
   * Borrowed construction admission for the shown resident, including refusal;
   * null when that resident has no construction report.
   *
   * @evidence contracts/common.md#principled-implementation Looks up the shown resident and returns its numerical admission or null, preserving accepted:false and the actual failure list.
   * @evidence contracts/common.md#clear-and-simple-design Keeps numerical construction admission separate from successful drawing and preview state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A drawn construction is not silently marked physiologically accepted, and absence is not converted to a fabricated successful report.
   * @evidence contracts/common.md#meaningful-documentation States shown-resident authority, refusal preservation, null meaning and borrowed ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One resident lookup returns an existing report; construction checks execute only in the numerical owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The resident retains its own report under the exact construction cache identity; this getter performs no second admission.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resident owns the report/failure arrays; returning that reference adds no worker, document editor or retained validation task.
   */
  admission(): IAutoMovieHumanConstructionAdmission | null;

  /**
   * Borrowed placement readings from the shown construction resident; undefined
   * for a preview/face or an implementation without this optional member.
   *
   * @evidence contracts/common.md#principled-implementation Reads rigReading from residents.get(shownKey), pairing it with the exact displayed construction instead of recomputing from unrelated document parameters.
   * @evidence contracts/common.md#clear-and-simple-design The optional method preserves older/unsupported handles while a missing resident field remains undefined.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No guessed placement or neutral rig is supplied when the construction owner produced no reading.
   * @evidence contracts/common.md#meaningful-documentation States same-resident provenance, borrowed output and both method/reading absence cases.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One cache lookup/reference read chooses no FK or rig reconstruction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuses the numerical placement report already paired with the construction resident, not a reading from a different model/source key.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resident owns placement data until retirement; this getter holds no extra rig buffer or observer subscription.
   */
  rigReading?(): IConnectedBodyRigReading | undefined;

  /**
   * Encode the displayed paired Person construction, preserving rejected
   * admission. Refuses before display or for a non-Person/preview selection.
   *
   * @evidence contracts/common.md#principled-implementation The page checks current selection domain/operation and resident export availability before delegating to its construction encoder; rejected numerical admission is preserved in the export result.
   * @evidence contracts/common.md#clear-and-simple-design Uses the construction resident's existing export seam instead of rebuilding an unrelated model in the handle adapter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A preview or standalone face/body does not acquire paired Person export merely because it draws, and encoder failures propagate through the generation-owned wait.
   * @evidence contracts/common.md#meaningful-documentation States supported selection, pre-display/unsupported refusal and admission preservation in the asynchronous result.
   * @evidence contracts/performance.md#efficient-algorithms Static encoding follows the resident's actual geometry/output size; this signature does not remove numerical or serialization work from that owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested export retains its generation and effect authority; the handle does not share completed byte output solely by matching document names.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned export bytes; generation retirement rejects wrapped waits but does not itself interrupt the underlying encoder or physically close its worker.
   */
  exportConstruction(): Promise<IConnectedBodyConstructionExportResult>;

  /**
   * Owner mapping readings from the constructed face; absence reports no reading.
   * Returned arrays are borrowed from the shown resident and must stay unchanged.
   *
   * @evidence contracts/common.md#principled-implementation The page returns the shown resident's periocularMappings as produced by its construction owner, with undefined preserved when absent.
   * @evidence contracts/common.md#clear-and-simple-design An optional observation exposes owner reports without coupling the handle to another face solver or index reconstruction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing mappings are not filled from guessed landmarks, and these reports alone are not rendered face correspondence proof.
   * @evidence contracts/common.md#meaningful-documentation Identifies constructed-face provenance, optional absence and borrowed array ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Returns the existing array; all mapping calculation belongs to the face construction owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The report stays paired with the shown resident/source identity rather than a caller-supplied unrelated face document.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resident owns the mapping population; the getter allocates no duplicate report, observer or native resource.
   */
  periocularMappings?():
    | IAutoMovieHumanFacePeriocularMappingReport[]
    | undefined;

  /**
   * Finished PNG; refuses before display, and includes a shown local reference photograph.
   * Successful capture can trigger deferred numerical cache persistence.
   *
   * @evidence contracts/common.md#principled-implementation readHumanViewerPng checks context loss, finishes the product stage and checks WebGL error before canvas encoding; a displayed DOM reference is composited by captureHumanViewerReference.
   * @evidence contracts/common.md#clear-and-simple-design Captures the existing renderer/stage and optional photograph composition rather than drawing a separate inspection model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts PNG encoding is an observed frame artifact, not an automatic beauty or anatomy pass; photographs stay display-only and the page separately flushes optional numerical persistence.
   * @evidence contracts/common.md#meaningful-documentation States completed-display requirement, local reference inclusion, graphics refusal and deferred persistence side effect.
   * @evidence contracts/performance.md#efficient-algorithms Finishing uses the actual viewport draw cost; PNG encoding and optional 2D composition scale with output pixels, including their browser-owned intermediate storage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Captures the current completed display and composition anew rather than reusing an earlier PNG after camera/pass/reference changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned encoded text; the shared renderer remains page-owned and temporary composition canvas/storage follow browser lifetime, while numerical persistence belongs to its worker/cache owner.
   */
  png(): string;

  /**
   * Withdraw the least recently used resident other than the one shown and
   * await its owned retirement. False means no selectable resident remains;
   * failed retirement rejects instead of claiming physical release.
   *
   * @evidence contracts/common.md#principled-implementation The page serializes eviction with shows, asks its resident cache to remove the oldest key except shownKey and awaits settleRetirements before answering.
   * @evidence contracts/common.md#clear-and-simple-design Selection stays in the resident cache and completion in its retirement owner; the handle merely exposes their ordered operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shown resident is protected, and a disposer failure cannot be reported as successful release or ignored because lookup identity was removed.
   * @evidence contracts/common.md#meaningful-documentation States protected display, least-recently-used selection, no-selection false result and retirement rejection semantics.
   * @evidence contracts/performance.md#efficient-algorithms Map insertion order identifies the oldest selectable key after at most the one protected shownKey; settlement then visits all pending retirement completions and preserves failures, whose disposal costs remain with their owners.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Concurrent display/eviction effects remain ordered requests; a prior successful eviction is not a reusable result for a changed resident population.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Cache/viewport owners release selected residents; generation retirement cancels only wrapped waits, and physically unsettled disposal stays owned until actual completion or recorded failure.
   */
  evict(): Promise<boolean>;
}

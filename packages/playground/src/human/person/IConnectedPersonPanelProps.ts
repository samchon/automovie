import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodySimpleShape,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonChannelAlias,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanPersonBodyReach } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyReach";
import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

import type { IConnectedBodyMeasurement } from "../body/IConnectedBodyMeasurement";
import type { BodyPosePreset } from "../body/BodyPosePreset";
import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";
import type { IConnectedPersonFaceSolution } from "./IConnectedPersonFaceSolution";
import type { IConnectedPersonHeadSolution } from "./IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "./IConnectedPersonMeasuredSolution";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Source authority and numerical operations used by the connected person panel.
 *
 * Head/body partition views, paired reach and presets supply the generation's controls. Numerical hooks construct and measure candidates off the page, while the panel owns current intent, accepted history and labelled construction-draft display. Section assembly gates admitted-only reads; these signatures do not enforce that gate themselves.
 *
 * The shape-only body inverse returns a pre-admission reading, while person/head/face operations retain complete context and final rest-state provenance. Their declared units and qualifications remain distinct from clinical or population validity.
 *
 * The viewport factory returns the concrete canvas/resource owner, and the page closes its numerical transports separately. Download hands a requested file to the browser without acknowledging physical save completion.
 *
 * @evidence contracts/common.md#principled-implementation Paired generation views, explicit reach and operation-specific numerical hooks preserve body shape versus complete-person context while one panel owns current intent, accepted history and construction-draft display.
 * @evidence contracts/common.md#clear-and-simple-design The composition borrows source metadata and numerical transports, creates a viewport through its factory and delegates browser file handoff instead of evaluating geometry in UI code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body solver readings do not become independently measured final-person anatomy, draft visibility is not accepted history and file handoff is not certified disk-save completion.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes paired views/reach, body-only and complete numerical context, final rest-state provenance, draft-read gating and browser download limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This composition interface selects no numerical solver, geometry renderer or document transaction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source and numerical hooks declare no panel-owned cached result equivalence across documents, measurements or view state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no worker or GPU allocation; concrete viewport/transport lifetimes are owned by the implementing panel/page assembly.
 *
 * @author Samchon
 */
export interface IConnectedPersonPanelProps<
  Model extends IConnectedPersonModel,
> {
  /** The head partition view (a face basis with driver channels). */
  face: IAutoMovieHumanFaceBasis;

  /** Face channels the generation defines once through a body channel. */
  aliases: IAutoMovieHumanPersonChannelAlias[];

  /** Registered independent head differences from the same head view; absent on older unsupported generations. */
  headShapeSource?: IAutoMovieHumanPersonHeadShapeSource;

  /** The body partition view. */
  body: IAutoMovieHumanBodyBasis;

  /** The paired generation's solve support and named limits, without rewriting the body view. */
  bodyReach: IAutoMovieHumanPersonBodyReach;

  /** The document the page opens with and Reset returns to. */
  initial: IAutoMovieHumanPersonDocument;

  /**
   * Project effective body shape into simple values using this complete person's rest-skin stature/volume and canonical body anatomy.
   *
   * @evidence contracts/common.md#principled-implementation Complete person context supplies rest-skin stature and volume while body anatomy resolves the effective weights passed to deterministic simple projection.
   * @evidence contracts/common.md#clear-and-simple-design Returning authored simple values keeps worker numerical projection separate from UI drafts and person admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Body-only stature/volume do not replace this person's own head contribution, and posed/closure stages are not represented as rest measurements.
   * @evidence contracts/common.md#meaningful-documentation The method specifies effective anatomy-resolved shape, complete-person rest skin and the projected simple result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature implements no anatomy resolution, numerical skin read or projection algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Projection declares no shared result across different full-person context or effective weights.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resident evaluation and pending request lifetime belong to the supplied numerical transport.
   */
  projectSimple(
    person: IAutoMovieHumanPersonDocument,
  ): Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Expand authored simple values over effective current body weights using paired support and this person's complete rest-skin readings.
   *
   * @evidence contracts/common.md#principled-implementation Simple inversion preserves current body context while paired evaluable reach and complete-person stature/volume govern trial values.
   * @evidence contracts/common.md#clear-and-simple-design The worker returns body weights and the panel separately composes and admits a complete person candidate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reach failures remain named rather than extrapolated, and returned weights alone do not establish accepted geometry or history.
   * @evidence contracts/common.md#meaningful-documentation The method identifies authored simple input, effective shape, paired support, rest-person readback and separate admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback type selects no simple inverse iteration or rest-skin evaluation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct complete-person and simple inputs declare no cached inverse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numerical worker retention and pending expansion requests remain transport-owned.
   */
  expandSimple(
    person: IAutoMovieHumanPersonDocument,
    simple: IAutoMovieHumanBodySimpleShape,
  ): Promise<Record<string, number>>;

  /** Body pose presets. */
  poses: BodyPosePreset[];

  /** Face expression presets. */
  expressions: IConnectedFaceExpressionPreset[];

  /**
   * Create the panel's numerical/GPU viewport on its canvas; the returned owner must close its actual acquired resources.
   *
   * @evidence contracts/common.md#principled-implementation The factory binds preparation/publication/retirement to the actual panel canvas while complete-document intent admission stays in the panel.
   * @evidence contracts/common.md#clear-and-simple-design One viewport adapter separates browser renderer ownership and resident numerical operations from DOM control logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Canvas presence or prepared frame completion is not a verified visual or admission result, and cancellation alone does not certify teardown.
   * @evidence contracts/common.md#meaningful-documentation The member identifies canvas binding, returned lifetime ownership and separate panel admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The factory signature chooses no worker connection, scene upload or render-loop algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each returned viewport is an owned lifetime rather than a cached rendering result for equal canvases.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Acquired renderer, observers and numerical connections belong to the returned concrete viewport and enclosing page, not this declaration.
   */
  viewport(canvas: HTMLCanvasElement): IConnectedPersonViewport<Model>;

  /**
   * Solve one body-view measurement in metres from authored shape weights off the page; the achieved reading precedes full-document anatomy reapplication.
   *
   * @evidence contracts/common.md#principled-implementation The bounded own-channel inverse uses paired evaluable body reach and holds the supplied other weights fixed.
   * @evidence contracts/common.md#clear-and-simple-design Returning shape and achieved reading keeps numerical inversion separate from person candidate composition and admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source reach is not extrapolated and the shape-only result does not claim independent final-person readback.
   * @evidence contracts/common.md#meaningful-documentation The callback specifies metre units, off-page work, shape-only input and pre-admission reading provenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The solver implementation owns geometry evaluation and bracket cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature declares no cached inverse result across different shape or target inputs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Request and worker lifetime belong to the supplied numerical transport.
   */
  solveMeasurement(
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ): Promise<IConnectedBodyMeasurement>;

  /**
   * Read one registered complete-person measurement on final skin at rest in metres; actual section assembly blocks construction-draft access.
   *
   * @evidence contracts/common.md#principled-implementation Registered channel identity selects the whole-person instrument on final rest skin rather than a body-only proxy.
   * @evidence contracts/common.md#clear-and-simple-design The callback returns one metre reading while section formatting and admitted-state access stay with their owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable or draft construction receives refusal rather than a fabricated accepted-person measurement.
   * @evidence contracts/common.md#meaningful-documentation The member identifies registered channel, complete-person rest provenance, metre units and the actual draft-read gate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The read type selects no instrument or rest-construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no cached reading equivalence across document or channel changes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending request and compiled evaluator lifetime belong to the supplied numerical runtime.
   */
  readPersonMeasurement(
    document: IAutoMovieHumanPersonDocument,
    channel: string,
  ): Promise<number>;

  /**
   * Solve one registered measurement target in metres along its paired body channel, preserving other authored fields and returning final Float32 rest-skin readback.
   *
   * @evidence contracts/common.md#principled-implementation Each trial builds the complete person within paired channel support, with one-channel inversion and a final rest-skin reading on the returned candidate.
   * @evidence contracts/common.md#clear-and-simple-design Numerical candidate production and requested-target sample metadata remain separate from current-ticket panel admission and history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing head endpoint drivers refuse by name, other channels do not hide a target miss and source-sample bounds are not personal feasibility clamps.
   * @evidence contracts/common.md#meaningful-documentation The callback explains metre target units, paired support, preserved authored fields, final Float32 readback and separate admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The solve type selects no bracket iteration, construction or readback algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct document/channel/target inputs declare no cached inverse equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Solver requests and numerical generation retention remain worker-owned until their transport settles or closes.
   */
  solvePersonMeasurement(
    document: IAutoMovieHumanPersonDocument,
    channel: string,
    targetMetres: number,
  ): Promise<IConnectedPersonMeasuredSolution>;

  /**
   * Read registered head measurements on a complete person's final rest skin in metres by name; the actual section owner blocks reads on construction drafts.
   *
   * @evidence contracts/common.md#principled-implementation Numerical readings use complete person context and registered head rules on final skin at rest, with admitted-state access enforced by section assembly.
   * @evidence contracts/common.md#clear-and-simple-design The callback returns named metre readings while section formatting and panel draft authority remain their own consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A draft or unreadable rest skin receives refusal rather than fabricated current measurement values.
   * @evidence contracts/common.md#meaningful-documentation The member specifies final rest-skin provenance, registered names, metre units and the actual draft-read gate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The read signature selects no generation compilation, construction or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Named readback declares no shared result across distinct person documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending reads and resident generation retention belong to the numerical transport and worker.
   */
  readPersonHead(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Record<string, number>>;

  /**
   * Solve registered primary and optional secondary head targets in metres, returning the candidate, rest-skin readings and independent-channel departure objective.
   *
   * @evidence contracts/common.md#principled-implementation The numerical owner solves registered channels within source envelopes, rejects unmet required targets and pursues optional secondary targets within remaining freedom.
   * @evidence contracts/common.md#clear-and-simple-design Candidate production and numerical reporting remain separate from the panel's current-intent admission and history publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Secondary miss is not hidden as guaranteed success and the departure proxy is not composed-skin readback or clinical validity.
   * @evidence contracts/common.md#meaningful-documentation The callback distinguishes primary/secondary targets, metre units, final readback and the candidate's separate admission boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback type implements no bounded iteration, endpoint displacement or rest-skin evaluation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct complete-document and target inputs declare no cached solve result equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numerical request settlement and compiled evaluator lifetime belong to the resident transport and worker.
   */
  solvePersonHead(
    document: IAutoMovieHumanPersonDocument,
    targets: Record<string, number>,
  ): Promise<IConnectedPersonHeadSolution>;

  /**
   * Read registered face measurements on the complete person's final construction, including qualified and named unavailable outcomes.
   *
   * @evidence contracts/common.md#principled-implementation Readings bind the supplied complete person context to registered measurement rules and their original units and qualifications.
   * @evidence contracts/common.md#clear-and-simple-design One numerical hook returns records while section formatting and panel admission remain outside it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing landmarks or acquisition rules return unavailable readings rather than inferred measurements from names.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies final complete-person provenance and preserves qualified or unavailable outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no generation compilation, construction or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no equivalence or reuse of readings across person documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending reads and resident evaluator retention belong to the supplied transport and worker.
   */
  readFaceMeasurements(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<AutoMovieHumanFaceMeasurementReading[]>;

  /**
   * Solve one registered target in its declared unit, returning a complete candidate with the solved channel, recorded target and final-person readings.
   *
   * @evidence contracts/common.md#principled-implementation The inverse varies registry-listed channels against complete person evaluations and records the requested target in its returned document.
   * @evidence contracts/common.md#clear-and-simple-design Numerical candidate production remains separate from current-ticket person transaction and history publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown measurements and unsupported reads are refused without guessing channels, units or accepted editor state.
   * @evidence contracts/common.md#meaningful-documentation The member identifies registry units, solved channel, target record, candidate context and returned reading provenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no bracketing, numerical read or construction strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A target solve declares no cached inverse across distinct full documents and target values.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resident evaluator ownership and pending solver settlement belong to the supplied numerical runtime.
   */
  solveFaceMeasurement(
    document: IAutoMovieHumanPersonDocument,
    measurement: string,
    target: number,
  ): Promise<IConnectedPersonFaceSolution>;

  /**
   * Hand requested bytes and media type to the browser download sink under the supplied filename; completion does not acknowledge a saved disk file.
   *
   * @evidence contracts/common.md#principled-implementation Explicit user file delivery carries the encoder's bytes, name and media type through the existing browser sink.
   * @evidence contracts/common.md#clear-and-simple-design Download ownership stays separate from document/GLB encoding and numerical admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Browser click handoff is not certified physical saving and the payload is not rewritten into an expected artifact.
   * @evidence contracts/common.md#meaningful-documentation The member specifies filename/media delivery and the lack of disk-save acknowledgment.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type selects no Blob construction, encoding or file delivery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested download is an explicit effect rather than shared numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary browser object URLs and their release belong to the supplied sink, not this signature.
   */
  download(filename: string, bytes: BlobPart, mime: string): void;
}

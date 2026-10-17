import type { AutoMovieHuman, IAutoMovieHumanTraits } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieExpression,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import type { AutoMovieTextureCache } from "@automovie/viewer";
import type * as THREE from "three";

import type { HumanViewerPage } from "./HumanViewerPage";
import type { IHumanViewerSession } from "./IHumanViewerSession";
import type { IHumanViewerTextureState } from "./IHumanViewerTextureState";
import type { admitHumanViewerCaptureView } from "./admitHumanViewerCaptureView";
import type { frameHumanViewerCamera } from "./frameHumanViewerCamera";

/** Framing union of the actual page, not a second camera policy. */
type Scale = HumanViewerPage.Scale;
/** Admitted record produced by the actual session installer. */
type IAccepted = HumanViewerPageOperations.IAccepted;
/** Ordinary display composition union of the actual page. */
type DisplayMode = HumanViewerPage.DisplayMode;

/** Type the operations installed on one actual Human page before any boot consumer runs.
 *
 * @evidence contracts/common.md#principled-implementation Describes the existing installer-assigned page properties with their actual implementation signatures.
 * @evidence contracts/common.md#clear-and-simple-design One base class owns the installed-operation slots; HumanViewerPage keeps scene state and terminal lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual page inherits these slots; no second page or test-only implementation is created.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify actual callers, failure behavior, units and resource ownership.
 * @evidence contracts/performance.md#efficient-algorithms Allocates only the fixed installed-operation slots; actual model, DOM and capture algorithms stay in their installers.
 * @evidence contracts/performance.md#reuse-equivalent-work The same page inherits these slots and installs them once before boot; each member documents its implementation cache policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The slots retain only their installed functions for the page lifetime; concrete installers and the page own scene and browser resources.
 *
 * @author Samchon
 */
export abstract class HumanViewerPageOperations {
  /** Convert traits into fresh public skin documents, preserving only an optional pose and expression.
   *
   * @evidence contracts/common.md#principled-implementation Calls AutoMovieHuman.fromTraits and the shared converter; a saved identity is not inferred from editing history.
   * @evidence contracts/common.md#clear-and-simple-design The session installer owns conversion, while the trait editor and loadTraits API call this slot.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts MODEL_ID is the declared viewer model id; no identity-specific geometry or measurement exception is introduced.
   * @evidence contracts/common.md#meaningful-documentation States which documents are regenerated and which optional documents are copied.
   * @evidence contracts/performance.md#efficient-algorithms Cost follows Human trait conversion and cloning the supplied traits, pose and expression.
   * @evidence contracts/performance.md#reuse-equivalent-work The page converter is shared, but each requested conversion produces a new session rather than reusing an unrelated identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns plain documents to the caller and retains no model object or asynchronous handle.
   */
  public sessionFromTraits!: (
    traits: IAutoMovieHumanTraits,
    keep?: Pick<IHumanViewerSession, "pose" | "expression">,
  ) => IHumanViewerSession;

  /** Admit a session and obtain its model without replacing the displayed specimen on document refusal.
   *
   * @evidence contracts/common.md#principled-implementation Checks session/inspection structure and public appearance/identity admission, then admits pose and expression before getModel.
   * @evidence contracts/common.md#clear-and-simple-design The session installer returns one IAccepted record for display; it does not draw or persist documents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Human reuse requires both the admitted identity key and hand generator; curve-design availability is separate from identity validity.
   * @evidence contracts/common.md#meaningful-documentation Documents refusal, shared Human reuse and the model, skeleton, pose and expression returned together.
   * @evidence contracts/performance.md#efficient-algorithms Validation and cloning scale with document size; Human owns model generation and its feature caches.
   * @evidence contracts/performance.md#reuse-equivalent-work Only an equal identity key and generator reuse the current Human; appearance and assembly still reach getModel.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record holds one Human/model generation; admission itself acquires no renderer or DOM listener.
   */
  public admit!: (session: IHumanViewerSession) => IAccepted;

  /** Apply a candidate through admission and display, reporting a refusal as false.
   *
   * @evidence contracts/common.md#principled-implementation Refuses a closed page, admits documents, then calls show; caught errors reach the ordinary error output.
   * @evidence contracts/common.md#clear-and-simple-design Visible editors, session loads and the published API share this boolean action boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry or alternate model repairs an invalid candidate; it reports the original caught cause.
   * @evidence contracts/common.md#meaningful-documentation States the boolean result; admission refusal preserves the prior specimen, while later display failures are not transactional rollback.
   * @evidence contracts/performance.md#efficient-algorithms Delegates validation, generation and panel rebuild rather than repeating their scans at this boundary.
   * @evidence contracts/performance.md#reuse-equivalent-work Delegated admit owns Human equivalence; accept does not cache a previous success for another edit.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Display owns replacement resources; this synchronous coordinator retains neither the candidate nor the error after reporting.
   */
  public accept!: (candidate: IHumanViewerSession, note: string) => boolean;

  /** Persist the current session and download its JSON, then report the skin-document digest.
   *
   * @evidence contracts/common.md#principled-implementation Serializes the actual current session to localStorage and a JSON Blob, including its separate inspection selection.
   * @evidence contracts/common.md#clear-and-simple-design The session module owns both browser persistence outputs and their status message.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The skin-document hash keeps its four-document meaning; it is not a digest of separate curve geometry.
   * @evidence contracts/common.md#meaningful-documentation Explains the two persistence destinations and the narrower digest used in the completion message.
   * @evidence contracts/performance.md#efficient-algorithms JSON serialization and digest traverse document size; a single Blob and URL serve this save action.
   * @evidence contracts/performance.md#reuse-equivalent-work Every explicit save writes current state; only the hash helper canonicalizes equal skin documents.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Revokes the object URL after the download click; the hash promise lasts until status publication.
   */
  public save!: () => void;

  /** Show an accepted model immediately, reconcile inspection controls, and start texture completion.
   *
   * @evidence contracts/common.md#principled-implementation Calls display before texture priming, so the same accepted model first has flat materials and then resolved textures.
   * @evidence contracts/common.md#clear-and-simple-design The display installer coordinates model display, the mounted inspection editor and document panel refresh.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Texture completion is guarded by accepted-record identity rather than substituting a newer model into an older request.
   * @evidence contracts/common.md#meaningful-documentation Names the immediate display and deferred texture stages and the old cache release.
   * @evidence contracts/performance.md#efficient-algorithms One model build and panel refresh precede texture priming; costs follow the accepted model and documents.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted Human; stale asynchronous results cannot become the current display.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Releases the previous texture cache, stores the latest completion promise, and reports asynchronous errors.
   */
  public show!: (accepted: IAccepted) => void;

  /** Prime texture bindings for one accepted model, discarding stale or closed-page completion.
   *
   * @evidence contracts/common.md#principled-implementation Primes actual material bindings against the accepted model images and rebuilds that model with the cache resolver.
   * @evidence contracts/common.md#clear-and-simple-design The texture cache owns decoded images; the display module decides whether its accepted record is still current.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing page texture assets reject explicitly; no foreign asset or fallback texture is fetched.
   * @evidence contracts/common.md#meaningful-documentation States current-record identity, the closed-page check and disposal on rejection or staleness.
   * @evidence contracts/performance.md#efficient-algorithms Scans material bindings once and delegates image decoding and deduplication to AutoMovieTextureCache.
   * @evidence contracts/performance.md#reuse-equivalent-work Only the exact accepted record may install its cache; equality of image names alone does not admit an old completion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Disposes failed or stale caches and the previous installed cache; page disposal owns the last installed cache.
   */
  public texture!: (accepted: IAccepted) => Promise<void>;

  /** Read this accepted person's current configured material slots and relief-owner state.
   *
   * @evidence contracts/common.md#principled-implementation Calls the actual material observer on the current displayed object after texture readiness, preserving accepted-generation correlation.
   * @evidence contracts/common.md#clear-and-simple-design The display installer owns the observation and supplies it to the ordinary API and capture metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not resolve textures again, construct a second model, replace methods or infer GPU residency.
   * @evidence contracts/common.md#meaningful-documentation Separates configured material/shader state from completed visible appearance and records pending/failed/closed readiness.
   * @evidence contracts/performance.md#efficient-algorithms Reads only current built part/material slots; decoded pixel buffers are not scanned or copied.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads mutable configured state fresh while reusing the actual original resolver associations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied scalar/document facts; weak associations retain no historical texture wrapper.
   */
  public observeTextures!: () => IHumanViewerTextureState;

  /** Toggle relief on actual saved surface materials, including while another display material is substituted.
   *
   * @evidence contracts/common.md#principled-implementation Traverses current meshes and resolves userData.surfaceMaterial before updating a standard material with a normal map.
   * @evidence contracts/common.md#clear-and-simple-design Relief stays in the display owner and delegates the existing map/scale toggling to setHumanViewerRelief.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual material objects; it does not infer relief from construction lines or replace a material method.
   * @evidence contracts/common.md#meaningful-documentation Explains saved-surface lookup and that materials without a normal map are left unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Visits the current model nodes and their materials once; no geometry or image is regenerated.
   * @evidence contracts/performance.md#reuse-equivalent-work The original material maps and scales are retained by the existing relief helper rather than decoded again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no new GPU resource; the model disposer and texture cache retain their separate ownership.
   */
  public applyRelief!: () => void;

  /** Rebuild selected construction and choose actual surface, ghost or hidden surface materials.
   *
   * @evidence contracts/common.md#principled-implementation Uses current selected nets or current Human skin inspection, filters hidden construction ids, and draws their actual points.
   * @evidence contracts/common.md#clear-and-simple-design The display module owns scene replacement; the inspection controller supplies source and independent-surface qualification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Separate design does not generate skin, and actual surface materials are saved before temporary page materials replace them.
   * @evidence contracts/common.md#meaningful-documentation States source selection, material substitution, depth mode and construction isolation.
   * @evidence contracts/performance.md#efficient-algorithms Scans model meshes and selected net points; rebuilding is necessary when the displayed mode or hidden groups change.
   * @evidence contracts/performance.md#reuse-equivalent-work Caches skin nets until model replacement and uses the already generated selected design nets.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Disposes the previous construction group, retains the two page materials, and transfers new group resources to page lifetime.
   */
  public applyDisplayMode!: () => void;

  /** Replace the visible model with one accepted generation and apply its pose and expression.
   *
   * @evidence contracts/common.md#principled-implementation Builds accepted.model with the supplied texture resolver and applies its admitted pose and expression on the same object.
   * @evidence contracts/common.md#clear-and-simple-design The display owner attaches the model and optional skeleton helper, then reapplies visibility, construction and relief.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate skin or construction result replaces accepted.model; rendering failure is not claimed as an atomic rollback.
   * @evidence contracts/common.md#meaningful-documentation Names the replaced resources and the same-model pose/expression and display steps.
   * @evidence contracts/performance.md#efficient-algorithms Model construction dominates; visibility and material updates traverse the current model after replacement.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing accepted Human and resets the skin-net cache for this displayed model generation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Releases removed model resources and the prior skeleton helper; page teardown owns their final replacements.
   */
  public display!: (
    accepted: IAccepted,
    resolveTexture: AutoMovieTextureCache["resolve"] | undefined,
  ) => void;

  /** Apply actual skin-part hiding and stick visibility, then refresh construction isolation.
   *
   * @evidence contracts/common.md#principled-implementation Uses current model part ids and material roles to set existing part visibility; construction ids are filtered in applyDisplayMode.
   * @evidence contracts/common.md#clear-and-simple-design One display action serves checkbox controls and the published setHidden/setStick operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin and construction group ids remain distinct; a construction group is not treated as an invented skin mesh.
   * @evidence contracts/common.md#meaningful-documentation Documents hidden ids, the skin/stick rule and selected construction refresh.
   * @evidence contracts/performance.md#efficient-algorithms Scans model parts once for stick ids and once to set visibility; existing construction refresh scales with selected nets.
   * @evidence contracts/performance.md#reuse-equivalent-work Mutates the current model objects without generating a second Human or model for isolation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The local stick-id Set is temporary; construction replacement releases its previous geometry and materials.
   */
  public applyVisibility!: () => void;

  /** Measure a world-space box over visible meshes below a requested object.
   *
   * @evidence contracts/common.md#principled-implementation Uses Three traverseVisible and expandByObject on mesh nodes; construction lines and points are added separately by frame.
   * @evidence contracts/common.md#clear-and-simple-design This camera helper measures skin bounds and leaves focus selection and construction bounds to its caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The box comes from actual objects rather than metadata, and this helper alone does not claim construction coverage.
   * @evidence contracts/common.md#meaningful-documentation States world coordinates and the mesh-only scope used by the framing owner.
   * @evidence contracts/performance.md#efficient-algorithms Visits the visible subtree; Three computes the included object bounds with its existing geometry cache.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns a fresh box for the current visibility and transforms instead of reusing stale framed bounds.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no scene object; the caller owns the returned Box3 value.
   */
  public visibleBox!: (root: THREE.Object3D) => THREE.Box3;

  /** Resolve a focus point along a bone in world metres, or return undefined for a missing bone.
   *
   * @evidence contracts/common.md#principled-implementation Starts at the actual bone world joint and interpolates toward its first bone child by point.along.
   * @evidence contracts/common.md#clear-and-simple-design The camera module owns focus-point interpretation; the capture-view admission owns allowed input values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A terminal bone uses its joint instead of an invented continuation or a reference landmark.
   * @evidence contracts/common.md#meaningful-documentation States the first-child rule, world-space units and missing-bone result.
   * @evidence contracts/performance.md#efficient-algorithms Looks up one bone and scans its immediate children; interpolation allocates only the needed vectors.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads current world transforms on each framing action so changed poses do not reuse an old point.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a detached Vector3 and keeps no bone or listener reference.
   */
  public pointOf!: (
    point: admitHumanViewerCaptureView.IPoint,
  ) => THREE.Vector3 | undefined;

  /** Frame current skin and construction or a declared close focus, then update the shared light.
   *
   * @evidence contracts/common.md#principled-implementation Combines visible mesh or focus-joint bounds with whole-view construction object bounds and calls the existing perspective framing helper.
   * @evidence contracts/common.md#clear-and-simple-design The camera module owns target and margin selection; lightHumanViewer owns key-light placement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual Line/Points control bounds for whole design views; no mesh-only framing claim covers the design.
   * @evidence contracts/common.md#meaningful-documentation Documents metres, whole/close margins and false when closed, missing or empty focus prevents framing.
   * @evidence contracts/performance.md#efficient-algorithms Bounds work scales with the focused subtree and whole construction; camera and light updates are fixed afterward.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the mounted camera and OrbitControls rather than allocating a capture-specific scene.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local boxes and vectors expire after framing; the page continues owning the existing camera, controls and lights.
   */
  public frame!: () => boolean;

  /** Read the current drawn canvas as PNG, adding the selected construction legend when needed.
   *
   * @evidence contracts/common.md#principled-implementation Reads the actual drawing buffer; non-surface or curve-design output is copied to a 2D canvas before the ordinary legend is drawn.
   * @evidence contracts/common.md#clear-and-simple-design The camera/capture owner performs pixel export, while the construction drawer owns the legend text and colors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No model is redrawn or geometry altered to decorate the capture; a source-selected design gets its proper legend.
   * @evidence contracts/common.md#meaningful-documentation States the base64 return and the condition under which a temporary legend canvas is used.
   * @evidence contracts/performance.md#efficient-algorithms PNG encoding and optional pixel copy scale with canvas pixel count; the surface-only path avoids the extra canvas.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the already rendered canvas immediately rather than scheduling another render or caching old pixels.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary 2D canvas and encoded text are local to this call; renderer lifetime remains with the page.
   */
  public keyed!: (mode: DisplayMode) => string;

  /** Return a preset name or azimuth/elevation file tag for an admitted view.
   *
   * @evidence contracts/common.md#principled-implementation Preserves preset strings and formats numeric angles from the already admitted view.
   * @evidence contracts/common.md#clear-and-simple-design This capture naming helper is separate from camera placement and view admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity-specific filename or coordinate correction changes the rendered view.
   * @evidence contracts/common.md#meaningful-documentation Documents that the return is a filename component rather than a camera transform.
   * @evidence contracts/performance.md#efficient-algorithms Formats one preset or two numeric angles without scanning model data.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes the requested tag directly; no retained result needs invalidation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string and owns no file handle or scene resource.
   */
  public viewTag!: (
    v: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle,
  ) => string;

  /** Append focus-point and light settings to a capture filename when explicitly present.
   *
   * @evidence contracts/common.md#principled-implementation Formats the point bone, along ratio, radius and supplied light fields from the same view record used for framing.
   * @evidence contracts/common.md#clear-and-simple-design Optional filename detail remains in the camera/capture module rather than changing the session documents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent fields produce no invented tag or hidden default pose adjustment.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes explicit optional tags from the main preset or angle tag.
   * @evidence contracts/performance.md#efficient-algorithms Formats a fixed number of optional fields; cost does not depend on geometry size.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the current view record instead of retaining a previous capture suffix.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Produces only a string and acquires no resource.
   */
  public extraTag!: (v: HumanViewerPage["view"]) => string;

  /** Capture admitted view plans using the ordinary renderer and the same selected construction state.
   *
   * @evidence contracts/common.md#principled-implementation Waits for current textures, checks accepted-record/session stability around the digest, renders each plan step and immediately reads its pixels.
   * @evidence contracts/common.md#clear-and-simple-design The camera module owns planning and restoration; the existing capture endpoint receives actual shots and source-qualified metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No hidden renderer or fitted curve replaces the visible page; completion is published after each actual ordinary draw.
   * @evidence contracts/common.md#meaningful-documentation States view defaults, document/source metadata and finally restoration; successful HTTP output is separate from visual acceptance.
   * @evidence contracts/performance.md#efficient-algorithms Each planned mode/view renders and encodes once; work scales with view count, scene draw cost and output pixels.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same accepted Human, mounted scene and selected nets; changed documents before drawing reject instead of borrowing stale readiness.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts mode, relief and view restoration in order; a throwing restore can interrupt later steps. PNG/request data live through the endpoint response.
   */
  public capture!: (props: {
    name: string;
    views?: unknown[];
    scales?: Scale[];
    focus?: AutoMovieHumanoidBone;
    modes?: DisplayMode[];
    relief?: boolean;
  }) => Promise<{
    files: string[];
    metadata: string;
  }>;

  /** Create one ordinary button and attach its supplied click action.
   *
   * @evidence contracts/common.md#principled-implementation Sets HTML button type, visible label and a native click listener.
   * @evidence contracts/common.md#clear-and-simple-design The panel installer owns this small DOM construction helper for visible controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invokes the supplied ordinary page action rather than replacing a browser or viewer method.
   * @evidence contracts/common.md#meaningful-documentation States returned element ownership and the attached click callback.
   * @evidence contracts/performance.md#efficient-algorithms Creates one element and one listener; no model or document traversal occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Each panel rebuild gets a fresh button so old callback state is not reused across replaced controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The containing panel owns the returned element and listener until DOM replacement or page disposal.
   */
  public button!: (label: string, onClick: () => void) => HTMLButtonElement;

  /** Replace one known page panel with the supplied control elements.
   *
   * @evidence contracts/common.md#principled-implementation Uses the page selector and native replaceChildren to install the current controls.
   * @evidence contracts/common.md#clear-and-simple-design Panel content replacement is separate from constructing controls or admitting edited documents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Targets the declared human.html panels; no alternate hidden page is mounted for capture.
   * @evidence contracts/common.md#meaningful-documentation Documents that the host element must exist and that old children are replaced.
   * @evidence contracts/performance.md#efficient-algorithms DOM work follows the removed and inserted child counts; the helper performs no geometry scan.
   * @evidence contracts/performance.md#reuse-equivalent-work Replaces stale controls rather than sharing listeners whose captured documents belong to another panel generation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Detached control trees become collectable; mounted curve-editor listeners have their separate explicit disposer.
   */
  public mount!: (selector: string, ...children: HTMLElement[]) => void;

  /** Submit one typed public skin document while preserving the current session fields.
   *
   * @evidence contracts/common.md#principled-implementation Copies the current session with the selected identity, pose, expression or appearance document and calls accept.
   * @evidence contracts/common.md#clear-and-simple-design Document editors use this single submission path; the session module still owns validation and failure reporting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The generic key/value relationship preserves the public document type without bypassing admission.
   * @evidence contracts/common.md#meaningful-documentation Names the supported document keys and the unchanged companion session state.
   * @evidence contracts/performance.md#efficient-algorithms Creates one shallow session record, then delegates validation, cloning and rendering costs to accept.
   * @evidence contracts/performance.md#reuse-equivalent-work Human reuse is decided by admit after the changed document reaches it; no editor-local equivalence cache is assumed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no extra session copy after the action; display owns the accepted replacement.
   */
  public withDocument!: <
    K extends "identity" | "pose" | "expression" | "appearance",
  >(
    key: K,
    value: IHumanViewerSession[K],
  ) => void;

  /** Rebuild ordinary camera, assembly, display and capture controls from current page state.
   *
   * @evidence contracts/common.md#principled-implementation Creates selectors and buttons bound to the actual page camera, Human assembly, hand choice and capture action.
   * @evidence contracts/common.md#clear-and-simple-design View controls stay with the panel module while their callbacks delegate framing, display or session admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same visible capture action uses the published ordinary capture path; no verification-only controls are introduced.
   * @evidence contracts/common.md#meaningful-documentation Documents the supported view/display/assembly choices and shared callbacks.
   * @evidence contracts/performance.md#efficient-algorithms Builds fixed controls plus one focus option per skeleton bone; it does not generate another model during panel creation.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads current state on rebuild; actual render and Human reuse remain with their owning operations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The views panel owns its DOM/listeners; replacement detaches them, and the capture button reenables in finally.
   */
  public renderViews!: () => void;

  /** Rebuild skin and independent construction isolation controls with filter and all/none actions.
   *
   * @evidence contracts/common.md#principled-implementation Uses humanViewerPartIds from the current model and selected nets; checkbox state follows the actual hidden-id Set.
   * @evidence contracts/common.md#clear-and-simple-design The panel owns filtering and callbacks; the display module owns visibility and construction replacement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction ids stay distinct from skin ids instead of pretending that a design net is a skin part.
   * @evidence contracts/common.md#meaningful-documentation Explains filter matching, all/none behavior and the ownership of the hidden-id state.
   * @evidence contracts/performance.md#efficient-algorithms Enumerates current ids and creates one row per match; each bulk action scans the current id list.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the current model/net list after each accepted edit rather than retaining another identity's part catalogue.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Replaced rows release their listeners with the detached DOM; only hidden string ids remain page-owned.
   */
  public renderParts!: () => void;

  /** Rebuild trait, skin-document and JSON editors from the accepted session.
   *
   * @evidence contracts/common.md#principled-implementation Uses public document forms plus existing pose/expression editors and routes edits through withDocument or trait conversion.
   * @evidence contracts/common.md#clear-and-simple-design The panel module assembles controls; conversion, admission and drawing retain their existing owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Traits remain editing history; applying JSON still uses session admission rather than importing a mesh or control catalogue.
   * @evidence contracts/common.md#meaningful-documentation Names canonical document editors and the separate converter action that creates new identity/appearance.
   * @evidence contracts/performance.md#efficient-algorithms Work scales with document fields, bones, model ids and serialized session text because those visible editors are rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the same current accepted session; it does not cache a second model or execute curve generation itself.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Panel hosts replace their old child trees; the separate mounted curve editor retains its explicit lifecycle.
   */
  public renderPanels!: () => void;
}

/** Expose the admitted record used by actual session and display operations.
 *
 */
export namespace HumanViewerPageOperations {
  /** Carry admitted documents and their matching Human/model generation into display.
   *
   * @evidence contracts/common.md#principled-implementation Groups the actual Human, model, skeleton, pose, expression and cloned session returned by admit.
   * @evidence contracts/common.md#clear-and-simple-design One accepted record is the handoff between session admission, display and asynchronous texture identity checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type stores generated output separately from public inputs; it does not imply anatomical or visual acceptance.
   * @evidence contracts/common.md#meaningful-documentation Members name generator/identity reuse keys and the ownership/meaning of each admitted or generated value.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record type performs no validation, generation or drawing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record type itself owns no cache; admit and texture use its explicit keys and record identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handles; the page, Human, display objects and texture cache retain their concrete owners.
   *
   * @author Samchon
   */
  export interface IAccepted {
    /** Generator choice is part of Human instance reuse identity. */
    generatorChoice: "profile" | "paddle";

    /** Stable admitted identity serialization used by the existing reuse key. */
    identityKey: string;

    /** Public skin documents plus optional separate inspection selection. */
    session: IHumanViewerSession;

    /** Actual shared Human that owns model and curve-design generation. */
    human: AutoMovieHuman;

    /** Current appearance and assembly output from that Human. */
    model: IAutoMovieModel;

    /** Skeleton used to place the same model and frame its focus bones. */
    skeleton: IAutoMovieSkeleton;

    /** Admitted viewer pose generated from the public Human pose document. */
    pose: IAutoMoviePose;

    /** Admitted expression applied to this current model. */
    expression: IAutoMovieExpression;
  }
}

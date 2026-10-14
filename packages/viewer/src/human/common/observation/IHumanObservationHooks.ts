import type { HumanObservationPass } from "./HumanObservationPass.js";
import type { HumanObservationView } from "./HumanObservationView.js";

/**
 * Display-only observation hooks of one viewport, borrowing the current subject roots, camera and orbit. Numerical documents, geometry buffers and exports retain their original owners.
 *
 * @evidence contracts/common.md#principled-implementation Hooks inspect current root meshes, place the metre-scale camera or request visibility/material passes without changing numerical documents; valid camera/framing inputs remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One existing observation owner implements these hooks and its viewport owns actual rendering, completion and resource lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown part names refuse before selection changes; structural passes are inspection observations rather than material/lighting appearance judgments.
 * @evidence contracts/common.md#meaningful-documentation Members state units, deferred apply/finish effects, snapshot meaning and borrowed numerical/display ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no work; its owner traverses current meshes and posed vertices where framing requires actual bounds.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses current displayed geometry and canonical view placement; changed roots/transforms are reread rather than cached under a view name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The observation owner retains requested selection/pass and owned materials until close, while the viewport retains its borrowed scene/camera/geometry.
 *
 * @author Samchon
 */
export interface IHumanObservationHooks {
  /**
   * Copied current camera position/target in metres and perspective angles in degrees.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual camera/orbit values and returns copied tuples rather than reconstructing placement from a named view.
   * @evidence contracts/common.md#clear-and-simple-design One snapshot joins camera and orbit target without owning another camera.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading certifies neither renderer hardware nor displayed appearance, and no anatomy measurement is inferred.
   * @evidence contracts/common.md#meaningful-documentation Defines metre and degree units with current near/far/aspect rather than a future requested placement.
   * @evidence contracts/performance.md#efficient-algorithms Fixed scalar reads and two tuple copies are independent of mesh size.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current mutable camera state is reread for each snapshot without a result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only copied values escape; camera/orbit handles remain borrowed.
   */
  camera: () => {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    near: number;
    far: number;
    aspect: number;
  };

  /**
   * Place the borrowed camera exactly, lifting orbit damping/distance limits; the viewport finishes the requested frame separately.
   *
   * @evidence contracts/common.md#principled-implementation Copies supplied position/target, synchronizes native orbit and restores exact Cartesian values before lookAt/matrix refresh.
   * @evidence contracts/common.md#clear-and-simple-design One placement owner serves explicit look, named view and region framing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native orbit rounding cannot replace the requested exact tuples; finite valid perspective inputs remain caller premises rather than new anatomy values.
   * @evidence contracts/common.md#meaningful-documentation Position/target use metres and fov degrees; closed owners refuse and requested display completion belongs to the viewport.
   * @evidence contracts/performance.md#efficient-algorithms Fixed camera/matrix/orbit updates add no root or vertex traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested placement is an effect and is not skipped by matching a prior view name.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Camera/orbit remain borrowed and display invalidation creates no owned image or worker.
   */
  look: (view: {
    position: readonly [number, number, number];
    target: readonly [number, number, number];
    fov: number;
  }) => void;

  /**
   * Frame current roots from a canonical direction; optional distance is metres and fov/pitch are degrees.
   *
   * @evidence contracts/common.md#principled-implementation Uses current posed root bounds, the narrower perspective half-angle and shared named spherical placement, with disclosed 1.1 fit margin and empty-subject fallback.
   * @evidence contracts/common.md#clear-and-simple-design Delegates view conventions to placeHumanObservationCamera and camera mutation to look.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Companions/auxiliary/hull meshes are excluded from root framing; named views do not infer physiological pose or certify visual acceptance.
   * @evidence contracts/common.md#meaningful-documentation Defines override units, current subject scope and the viewport's separate finish responsibility.
   * @evidence contracts/performance.md#efficient-algorithms Root mesh traversal and current vertex bounds dominate even when options supply explicit distance; spherical placement is fixed work.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares canonical view/fit logic but refreshes current subject bounds because geometry/transforms can change.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary bounds/tuples survive only placement and acquire no geometry or GPU handles.
   */
  view: (
    name: HumanObservationView,
    options?: { distance?: number; fov?: number; pitch?: number },
  ) => void;

  /**
   * Frame a caller-supplied displayed-world sphere in metres; front is the default direction and fov/pitch use degrees.
   *
   * @evidence contracts/common.md#principled-implementation Fits the supplied sphere using current aspect and selected fov before canonical spherical placement; finite positive radius/perspective inputs remain caller premises.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the same fit/placement operations as whole-subject view without measuring another numerical model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The sphere is a display region rather than an inferred anatomical measurement or a raster crop proof.
   * @evidence contracts/common.md#meaningful-documentation Documents centre/radius metres, defaults and angles, with rendering/optional PNG cropping left to the viewport.
   * @evidence contracts/performance.md#efficient-algorithms Fixed trigonometric fit and camera placement avoid root/vertex traversal for explicit regions.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each region request uses its current caller values and camera aspect rather than a previous named-view result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrows region input and retains only mutated camera state, acquiring no native resource.
   */
  frame: (region: {
    center: readonly [number, number, number];
    radius: number;
    view?: HumanObservationView;
    fov?: number;
    pitch?: number;
  }) => void;

  /**
   * Select root mesh names to show, or null to remove isolation; unknown names leave the prior selection unchanged and are returned.
   *
   * @evidence contracts/common.md#principled-implementation Checks requested names against current non-auxiliary root meshes before setting isolated state; apply later combines isolation and hiding.
   * @evidence contracts/common.md#clear-and-simple-design One nullable Set expresses no isolation versus selected names without altering the numerical document.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Misspellings refuse before engagement/selection mutation; duplicate names can select multiple distinct meshes rather than inventing identity uniqueness.
   * @evidence contracts/common.md#meaningful-documentation States null/reset, returned unknown names and deferred apply/finish visibility effects.
   * @evidence contracts/performance.md#efficient-algorithms Traverses root meshes once to build name membership, then checks k requested ids and builds their Set on success.
   * @evidence contracts/performance.md#reuse-equivalent-work Current mesh names are reread so replaced roots cannot reuse a stale admission population.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Requested name count is uncapped and lives until replacement/close; meshes and geometry remain borrowed.
   */
  isolate: (ids: readonly string[] | null) => string[];

  /**
   * Replace hidden root mesh names, or clear hiding with null; unknown names preserve the previous selection.
   *
   * @evidence contracts/common.md#principled-implementation Current name admission precedes hidden-set clearing and apply changes only visibility previously owned by this observation.
   * @evidence contracts/common.md#clear-and-simple-design A distinct hidden Set combines with nullable isolation, keeping the two requested channels independently observable.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused name cannot clear prior hiding and meshes hidden by another owner are not forcibly revealed.
   * @evidence contracts/common.md#meaningful-documentation Documents replacement/null reset, refusal and deferred display application without numerical geometry mutation.
   * @evidence contracts/performance.md#efficient-algorithms Root traversal/name indexing plus requested-id processing scale with current meshes and requested names.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads current root names before each request while retaining only the last admitted requested hiding state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The uncapped name Set is cleared on replacement, while hiddenByUs tracks actually altered borrowed meshes until restoration/close.
   */
  hide: (ids: readonly string[] | null) => string[];

  /**
   * Choose the inspection pass; beauty restores ordinary product material selection and the viewport renders after applying it.
   *
   * @evidence contracts/common.md#principled-implementation Admits the named pass through its canonical definition and tracks requested state for override/apply.
   * @evidence contracts/common.md#clear-and-simple-design One pass discriminator chooses existing owned materials/albedo/outline paths rather than another renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural passes document quantities only and cannot establish beauty material/lighting validity; unknown pass names refuse before state change.
   * @evidence contracts/common.md#meaningful-documentation States beauty meaning, deferred frame completion and changed-pass shadow invalidation.
   * @evidence contracts/performance.md#efficient-algorithms Selection is fixed work; subsequent apply scans meshes and creates/removes per-mesh outline replacements where required.
   * @evidence contracts/performance.md#reuse-equivalent-work Owned pass materials are reused across frames while replaced roots restore borrowed state and actual albedo owner admits current materials.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed pass materials and input-sized hull/material maps stay with observation until restoration/close; source textures/geometry remain borrowed.
   */
  pass: (next: HumanObservationPass) => void;

  /**
   * Read current non-auxiliary root mesh names in traversal order, including hidden meshes and potentially duplicate names.
   *
   * @evidence contracts/common.md#principled-implementation Traverses current roots and deduplicates actual Mesh identity while excluding observation hull and auxiliary populations.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the observation's mesh population definition for names and selection admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Mesh names are addresses, not globally unique identities or proof the named surface is visibly rendered.
   * @evidence contracts/common.md#meaningful-documentation Documents traversal ordering, hidden inclusion and duplicate-name possibility.
   * @evidence contracts/performance.md#efficient-algorithms Scene-node traversal plus one mesh-name mapping costs linear work in reached nodes and selected meshes.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current roots are reread for each snapshot rather than caching names after replacement.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a name array without retaining meshes or acquiring native resources.
   */
  parts: () => string[];

  /**
   * Copy requested pass/isolation/hiding state; the snapshot is independent of whether apply/finish has completed that display.
   *
   * @evidence contracts/common.md#principled-implementation Copies name Sets to arrays and preserves null isolation while exposing the requested pass discriminator.
   * @evidence contracts/common.md#clear-and-simple-design One snapshot observes the existing state channels without adding completion or renderer authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested state is not a completed image or numerical admission, and returned arrays cannot mutate retained Sets.
   * @evidence contracts/common.md#meaningful-documentation Documents copied arrays, null no-isolation and requested versus applied display semantics.
   * @evidence contracts/performance.md#efficient-algorithms Copies retained isolated/hidden names once in linear work and fixed pass access.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every snapshot copies current mutable selections; an earlier returned array is not current state.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns copied arrays while observation retains its Sets until replacement/close.
   */
  state: () => {
    pass: HumanObservationPass;
    isolated: string[] | null;
    hidden: string[];
  };
}

import {
  AutoMovieBodyRegion,
  AutoMovieGestureKind,
  IAutoMovieActionCall,
} from "@automovie/interface";



/** The body region a verb drives by default, when an action sets none. */
const REGION_BY_VERB: Partial<
  Record<IAutoMovieActionCall["verb"], AutoMovieBodyRegion>
> = {
  locomote: "fullBody",
  gesture: "upperBody",
  reach: "upperBody",
  lookAt: "head",
  emote: "face",
};


/**
 * Per-kind gesture defaults, matching what {@link gestureMotion} actually
 * authors: `nod`/`shake` drive only head joints, and the whole-body kinds
 * (trunk+legs, or the jump's ballistic root) span regions, so the generic
 * `upperBody` verb default would silently strip their content in
 * `maskMotionToRegion`. Kinds absent here (the arm gestures: wave, celebrate,
 * throw, point, strike, whose spine/arm joints all live in `upperBody`) fall
 * through to the verb default.
 */
const REGION_BY_GESTURE: Partial<
  Record<AutoMovieGestureKind, AutoMovieBodyRegion>
> = {
  nod: "head",
  shake: "head",
  bow: "fullBody",
  crouch: "fullBody",
  kick: "fullBody",
  stagger: "fullBody",
  jump: "fullBody",
  draw: "fullBody",
};

/**
 * Resolve an action's explicit body region, else its gesture-kind default, verb default, or fullBody. Head-only and whole-body gesture defaults match the actual reference gesture channels; explicit overrides remain authoritative.
 *
 * @evidence contracts/common.md#principled-implementation Finite lookup tables encode the current supported verbs and gesture shapes, with nullish precedence preserving an authored region before inferred defaults.
 * @evidence contracts/common.md#clear-and-simple-design The single owner serves compilePerformance masking so gesture-content policy is not repeated in each caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Known gesture differences follow the bones/root authored by gestureMotion, not actor ids or test fixtures; unsupported kinds use the existing verb/full-body policy.
 * @evidence contracts/common.md#meaningful-documentation Documents explicit-region precedence and the difference between gesture and verb defaults.
 * @evidence contracts/performance.md#efficient-algorithms Constant table lookups and no per-call collection construction; cost does not depend on scene or rig size.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable-by-contract module tables are reused across calls, and all per-call decisions depend only on the supplied action.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed module tables persist; the caller receives a union value with no allocated resource or retained action reference.
 */
export const actionRegion: (action: IAutoMovieActionCall) => AutoMovieBodyRegion = (
  action: IAutoMovieActionCall,
): AutoMovieBodyRegion =>
  action.region ??
  (action.verb === "gesture" ? REGION_BY_GESTURE[action.kind] : undefined) ??
  REGION_BY_VERB[action.verb] ??
  "fullBody";

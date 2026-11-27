import {
  AutoMovieBodyRegion,
  AutoMovieGestureKind,
  IAutoMovieActionCall,
} from "@automovie/interface";

/*
 * Resolve an action's explicit body region, else its gesture-kind default, verb
 * default, or fullBody. Head-only and whole-body gesture defaults match the
 * actual reference gesture channels; explicit overrides remain authoritative.
 */
export function actionRegion(
  action: IAutoMovieActionCall,
): AutoMovieBodyRegion {
  return (
    action.region ??
    (action.verb === "gesture" ? REGION_BY_GESTURE[action.kind] : undefined) ??
    REGION_BY_VERB[action.verb] ??
    "fullBody"
  );
}

/*
 * The body region a verb drives by default, when an action sets none.
 */
const REGION_BY_VERB: Partial<
  Record<IAutoMovieActionCall["verb"], AutoMovieBodyRegion>
> = {
  locomote: "fullBody",
  gesture: "upperBody",
  reach: "upperBody",
  lookAt: "head",
  emote: "face",
};

/*
 * Per-kind gesture defaults, matching what gestureMotion actually
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

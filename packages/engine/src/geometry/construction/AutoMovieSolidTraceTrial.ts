import { AutoMovieSolidTraceObservation as Observation } from "./AutoMovieSolidTraceObservation";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** One actual face chart and its admitted physical2, never an exterior extension. */
interface Trial {
  /** Actual atlas face used by this query. */
  face: number;

  /** Admitted first chart coordinate. */
  u: number;

  /** Admitted second chart coordinate. */
  v: number;

  /** Whether the atlas supplied a boundary-foot initialization in another chart. */
  crossed: boolean;

  /** Actual map derivatives at that admitted chart point. */
  jet: IAutoMovieSolidSurface.IJet;
}

/**
 * Read a feasible Newton host trial, using declared atlas adjacency at a closed chart boundary.
 *
 * The atlas maps an exterior proposal to the nearest shared boundary's foot
 * in its neighbour. That is only a numerical initialization: the meeting
 * solver must evaluate its actual residual there and accept descent before
 * changing faces. No exterior source value or imagined continuation is read.
 * An optional internal observation records only the guard already executed;
 * it cannot change a trial, crossing budget or query sequence.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Piecewise chart Newton uses the atlas's explicit boundary correspondence when a proposed host chart is outside its owned domain; the neighbour's actual finite physical2 supplies the trial.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader returns the mapped coordinates together with their actual face/jet, keeping residuals and Jacobians on the same map.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An open boundary, unavailable jet or exhausted crossing budget returns null. A mapped foot is not a solved meeting; no extrapolation, point clamp, replacement curve or callback catch is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation Coordinates use each face's own units; crossed labels one caller-budgeted transition and all callbacks/getters retain their exception identity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant domain tests and at most one atlas boundary query precede one actual jet; atlas segment lookup and source costs remain their owners' costs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned jet/coordinates supply both the actual residual and an accepted next iteration without reevaluation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the caller owns the small result and its producer's vectors; no atlas, cache or process handle is retained globally.
 */
export function AutoMovieSolidTraceTrial(
  host: IAutoMovieSolidAtlas,
  face: number,
  u: number,
  v: number,
  canCross: boolean,
  observation?: Observation.IState,
): Trial | null {
  if (observation !== undefined) observation.trial = null;
  const current: IAutoMovieSolidSurface | undefined = host.faces[face];
  if (current === undefined || !Number.isFinite(u) || !Number.isFinite(v))
    return Observation.reject(observation, "invalid-host-chart", [u, v], face);
  if (AutoMovieSolidDomain.contains(current, u, v)) {
    const jet: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      current,
      u,
      v,
    );
    return jet === null ? Observation.reject(observation, "host-jet-unavailable", [u, v], face)
      : { face, u, v, crossed: false, jet };
  }
  if (!canCross) return Observation.reject(observation, "host-crossing-budget", [u, v], face);
  const next: ReturnType<IAutoMovieSolidAtlas["across"]> = host.across(
    face,
    u,
    v,
  );
  if (next === null) return Observation.reject(observation, "host-open-boundary", [u, v], face);
  const surface: IAutoMovieSolidSurface | undefined = host.faces[next.face];
  if (surface === undefined) return Observation.reject(observation, "host-receiver-unavailable", [next.u, next.v], next.face);
  const jet: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
    surface,
    next.u,
    next.v,
  );
  return jet === null ? Observation.reject(observation, "host-jet-unavailable", [next.u, next.v], next.face)
    : { ...next, crossed: true, jet };
}

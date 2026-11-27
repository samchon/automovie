import type {
  IAutoMovieSolidAtlas,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceTrialTrial,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "../../AutoMovieSolidDomain";
import { AutoMovieSolidTraceObservation as Observation } from "../AutoMovieSolidTraceObservation";

/**
 * Read a feasible Newton host trial, using declared atlas adjacency at a closed
 * chart boundary.
 *
 * The atlas maps an exterior proposal to the nearest shared boundary's foot in
 * its neighbour. That is only a numerical initialization: the meeting solver
 * must evaluate its actual residual there and accept descent before changing
 * faces. No exterior source value or imagined continuation is read. An optional
 * internal observation records only the guard already executed; it cannot
 * change a trial, crossing budget or query sequence.
 */
export function AutoMovieSolidTraceTrial(
  host: IAutoMovieSolidAtlas,
  face: number,
  u: number,
  v: number,
  canCross: boolean,
  observation?: Observation.IState,
): IAutoMovieSolidTraceTrialTrial | null {
  if (observation !== undefined) observation.trial = null;
  const current: IAutoMovieSolidSurface | undefined = host.faces[face];
  if (current === undefined)
    return Observation.reject(observation, "invalid-host-chart", [u, v], face);
  if (AutoMovieSolidDomain.contains(current, u)) {
    const jet: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      current,
      u,
      v,
    );
    return jet === null
      ? Observation.reject(observation, "host-jet-unavailable", [u, v], face)
      : { face, u, v, crossed: false, jet };
  }
  if (!canCross)
    return Observation.reject(
      observation,
      "host-crossing-budget",
      [u, v],
      face,
    );
  const next: ReturnType<IAutoMovieSolidAtlas["across"]> = host.across(
    face,
    u,
    v,
  );
  if (next === null)
    return Observation.reject(observation, "host-open-boundary", [u, v], face);
  const surface: IAutoMovieSolidSurface | undefined = host.faces[next.face];
  if (surface === undefined)
    return Observation.reject(
      observation,
      "host-receiver-unavailable",
      [next.u, next.v],
      next.face,
    );
  const jet: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
    surface,
    next.u,
    next.v,
  );
  return jet === null
    ? Observation.reject(
        observation,
        "host-jet-unavailable",
        [next.u, next.v],
        next.face,
      )
    : { ...next, crossed: true, jet };
}

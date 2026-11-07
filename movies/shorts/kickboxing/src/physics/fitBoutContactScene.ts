import {
  planPhysicalContactTargets,
  type preparePhysicalGeometry as Geometry,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { BoutTargetSource } from "./BoutTargetSource";
import { boutContactGroups } from "./boutContactGroups";
import { boutContactTargetInput } from "./boutContactTargetInput";

/** Actual generic fit input for one current actor. */
type Input = Parameters<typeof planPhysicalContactTargets>[0];

/** Existing generic result, without a movie-local solver. */
type Result = ReturnType<typeof planPhysicalContactTargets>;

/** Share finalized receiver coordinates with dependent source fits. A true cycle retains the existing simultaneous snapshot; it is never resolved by extra scene passes or actor-order feedback. */
export function fitBoutContactScene(
  source: BoutTargetSource,
  samples: Record<FilmPlan.ActorId, BoutTargetSource.ISample>,
  seconds: number,
  geometry: Geometry.IQueries,
): void {
  const ids: readonly FilmPlan.ActorId[] = ["a", "b", "referee"];
  const actual: Record<string, Readonly<Record<string, P.ITransform>>> =
    Object.fromEntries(
      ids.map(
        (id: FilmPlan.ActorId): [string, Readonly<Record<string, P.ITransform>>] =>
          [id, samples[id].segments],
      ),
    );
  const inputs: Record<FilmPlan.ActorId, Input> = Object.fromEntries(
    ids.map((id: FilmPlan.ActorId): [FilmPlan.ActorId, Input] => [
      id,
      boutContactTargetInput(
        source,
        id,
        seconds,
        samples[id].segments,
        actual,
        geometry,
        samples[id].frame,
        samples[id].supportGoals,
      ),
    ]),
  ) as Record<FilmPlan.ActorId, Input>;
  for (const group of boutContactGroups(inputs)) {
    const snapshot: typeof actual = { ...actual };
    const fitted: [FilmPlan.ActorId, Result][] = group.map(
      (id: FilmPlan.ActorId): [FilmPlan.ActorId, Result] => [
        id,
        planPhysicalContactTargets({ ...inputs[id], actual: snapshot }),
      ],
    );
    for (const [id, result] of fitted) {
      actual[id] = result.targets;
      samples[id].segments = result.targets;
      samples[id].residuals = result.residuals;
    }
  }
}

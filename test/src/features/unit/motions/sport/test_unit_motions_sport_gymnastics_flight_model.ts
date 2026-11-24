import type { IAutoMovieResolveCenterOfMass } from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** One mass segment of a body, at rest on its bone. */
const segment = (
  bone: IAutoMovieResolveCenterOfMass.ISegment["bone"],
  mass: number,
): IAutoMovieResolveCenterOfMass.ISegment => ({
  bone,
  mass,
  point: { x: 0, y: 0, z: 0 },
  inertia: { x: 0.1, y: 0.1, z: 0.1 },
  axes: { x: 0, y: 0, z: 0, w: 1 },
});

/**
 * `GymnasticsFlight.model` is the body's own canonical mass model, prepared
 * when the body is made, not a model built afresh.
 *
 * Scenarios:
 *
 * 1. A body carrying a two-segment model gives that very model back.
 */
export function test_unit_motions_sport_gymnastics_flight_model(): void {
  const massModel: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 50,
    segments: [segment("hips", 30), segment("head", 20)],
  };
  TestValidator.predicate(
    "the body's own model",
    GymnasticsFlight.model({ massModel }) === massModel,
  );
}

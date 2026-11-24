import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieResolveCenterOfMass,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.model` is the body's own canonical mass model, prepared
 * when the body is made.
 *
 * Scenarios:
 *
 * 1. It is the body's model, and its segments sum to the body's mass.
 */
export async function test_unit_motions_sport_gymnastics_flight_model(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    GymnasticsFlight.model(body);
  TestValidator.predicate(
    "the body's own model",
    model === body.massModel &&
      nclose(
        model.segments.reduce(
          (sum: number, s: IAutoMovieResolveCenterOfMass.ISegment): number =>
            sum + s.mass,
          0,
        ),
        model.mass,
        1e-9,
      ),
  );
}

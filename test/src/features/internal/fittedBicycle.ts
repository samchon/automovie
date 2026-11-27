import { AutoMovieArchetypeBicycle } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The seeded bicycle scaled to its rider: its saddle height and reach in
 * proportion to the rider's hip height and arm against the average man's, whom
 * the seeded bicycle fits. The average man rides the seeded bicycle unchanged;
 * a rider whose fit lies outside the archetype's bands is refused by the
 * bicycle, never clamped into them.
 *
 * @param body The rider.
 * @param seed The bicycle's seed.
 * @returns The bicycle.
 * @throws {AutoMovieArchetypeRefusal} When the rider's saddle height or reach
 *   lies outside its band.
 */
export function fittedBicycle(
  body: IAutoMovieMotionHumanBody,
  seed: number,
): ReturnType<typeof AutoMovieArchetypeBicycle.create> {
  const seeded: ReturnType<typeof AutoMovieArchetypeBicycle.create> =
    AutoMovieArchetypeBicycle.create({}, seed);
  const average: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const arm = (b: IAutoMovieMotionHumanBody): number =>
    b.measure.upperArm + b.measure.forearm;
  return AutoMovieArchetypeBicycle.create(
    {
      saddleHeight:
        seeded.dimensions.saddleHeight! *
        (body.measure.hipHeight / average.measure.hipHeight),
      reach: seeded.dimensions.reach! * (arm(body) / arm(average)),
    },
    seed,
  );
}

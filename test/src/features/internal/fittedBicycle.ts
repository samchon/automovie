import { createBicycle } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The seeded bicycle scaled to its rider: its saddle height and reach in
 * proportion to the rider's hip height and arm against the average man's,
 * whom the seeded bicycle fits, kept inside the archetype's bands. The
 * average man rides the seeded bicycle unchanged.
 *
 * @param body The rider.
 * @param seed The bicycle's seed.
 * @returns The bicycle.
 */
export function fittedBicycle(
  body: IAutoMovieMotionHumanBody,
  seed: number,
): ReturnType<typeof createBicycle> {
  const seeded: ReturnType<typeof createBicycle> = createBicycle({}, seed);
  const average: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const arm = (b: IAutoMovieMotionHumanBody): number =>
    b.measure.upperArm + b.measure.forearm;
  const within = (
    band: (typeof createBicycle.BANDS)["saddleHeight"],
    value: number,
  ): number => Math.min(band.maximum, Math.max(band.minimum, value));
  return createBicycle(
    {
      saddleHeight: within(
        createBicycle.BANDS.saddleHeight,
        seeded.dimensions.saddleHeight! *
          (body.measure.hipHeight / average.measure.hipHeight),
      ),
      reach: within(
        createBicycle.BANDS.reach,
        seeded.dimensions.reach! * (arm(body) / arm(average)),
      ),
    },
    seed,
  );
}

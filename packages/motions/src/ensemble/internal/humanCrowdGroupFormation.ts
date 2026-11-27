import type { IAutoMovieMotionHumanFormation } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFormation } from "../HumanFormation";

/**
 * Compose density-sensitive walking slots around the centre of a pedestrian
 * group's course. For the two- to four-person groups measured by Moussaïd et
 * al. (2010, https://doi.org/10.1371/journal.pone.0010047, Table 1 and Fig. 4),
 * sparse groups walk abreast and higher-density groups bend their outer members
 * forward. The low-density bearings are set to 90 degrees because the study
 * found no significant departure from abreast there. Interpolation between the
 * two populations is an authored approximation. Densities outside the
 * observations use the nearer endpoint.
 *
 * Give each member's walking action its slot in the returned formation. Plan
 * the supplied frame from the group's centroid and check that the placed slots
 * clear obstacles along the course, including while turning. A
 * summed-shoulder-breadth disc can miss an outer slot. The result describes
 * relative slots only.
 *
 * @param frame The group centre and facing over film time.
 * @param halfBreadths Positive shoulder half breadths in metres, in
 *   left-to-right member order.
 * @param density Authored pedestrian density in people per square metre, finite
 *   and nonnegative.
 * @returns Formation blocks in member order for station keeping.
 * @throws {HumanRefusal} When the member count, half breadths or density are
 *   invalid.
 */
export function humanCrowdGroupFormation(
  frame: IAutoMovieMotionHumanFormation.Frame,
  halfBreadths: readonly number[],
  density: number,
): IAutoMovieMotionHumanFormation {
  const pairs: readonly Observation[] | undefined =
    OBSERVATIONS[halfBreadths.length - 2];
  if (pairs === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "group.size",
      value: halfBreadths.length,
      reason: "walking group measurements cover two through four members",
      fix: "give a group of two through four members",
    });
  if (!(density >= 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "group.density",
      value: density,
      reason: "pedestrian density must be finite and nonnegative",
      fix: "give a density in pedestrians per square metre",
    });
  for (const halfBreadth of halfBreadths)
    if (!(halfBreadth > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "group.halfBreadths",
        value: halfBreadth,
        reason: "each member must have a finite positive shoulder half breadth",
        fix: "give each member's shoulder half breadth in metres",
      });

  const population: number = Math.min(
    1,
    Math.max(0, (density - LOW_DENSITY) / (MODERATE_DENSITY - LOW_DENSITY)),
  );
  const offsets: NonNullable<
    IAutoMovieMotionHumanFormation.IBlock["offset"]
  >[] = [{ lateral: 0, depth: 0 }];
  let lateral: number = 0;
  let depth: number = 0;
  let sumLateral: number = 0;
  let sumDepth: number = 0;
  for (let i: number = 0; i < pairs.length; ++i) {
    const [lowDistance, moderateDistance, moderateBearing]: Observation =
      pairs[i]!;
    const distance: number =
      lowDistance + population * (moderateDistance - lowDistance);
    const bend: number = (population * (moderateBearing - 90) * Math.PI) / 180;

    // The formation's depth grows to the rear. Widen along the same bearing
    // when the members' lateral shoulder extents need more space.
    const run: number = Math.max(
      distance * Math.cos(bend),
      halfBreadths[i]! + halfBreadths[i + 1]!,
    );
    lateral += run;
    depth += run * Math.tan(bend);
    offsets.push({ lateral, depth });
    sumLateral += lateral;
    sumDepth += depth;
  }

  const centreLateral: number = sumLateral / offsets.length;
  const centreDepth: number = sumDepth / offsets.length;
  const blocks: IAutoMovieMotionHumanFormation.IBlock[] = offsets.map(
    (
      offset: NonNullable<IAutoMovieMotionHumanFormation.IBlock["offset"]>,
      i: number,
    ): IAutoMovieMotionHumanFormation.IBlock => ({
      count: 1,
      layout: {
        kind: "line",
        ranks: 1,
        files: 1,
        spacing: {
          lateral: 2 * halfBreadths[i]!,
          depth: 2 * halfBreadths[i]!,
        },
      },
      offset: {
        lateral: offset.lateral - centreLateral,
        depth: offset.depth - centreDepth,
      },
    }),
  );
  return HumanFormation({ frame, blocks });
}

/** The observed street density of population A, pedestrians per square metre. */
const LOW_DENSITY: number = 0.03;

/** The observed street density of population B, pedestrians per square metre. */
const MODERATE_DENSITY: number = 0.25;

/**
 * The adjacent-member distances in metres and moderate-density bearings in
 * degrees clockwise from travel, from Moussaïd et al. (2010), Table 1. Both
 * populations' pairs are abreast, so their bearing is 90 degrees.
 */
const OBSERVATIONS: readonly (readonly Observation[])[] = [
  [[0.78, 0.54, 90]],
  [
    [0.79, 0.55, 107.9],
    [0.81, 0.62, 70.6],
  ],
  [
    [0.87, 0.67, 102.3],
    [0.93, 0.66, 86],
    [0.8, 0.64, 76.6],
  ],
];

/** One observed adjacent pair, with distances in metres and bearing in degrees. */
type Observation = readonly [
  lowDistance: number,
  moderateDistance: number,
  moderateBearing: number,
];

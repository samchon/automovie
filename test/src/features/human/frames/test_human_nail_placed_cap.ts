import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanF1Nails, AutoMovieHumanNail, AutoMovieHumanSegmentFrame } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftViewFullSource,
} from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * The ordinary digit's fitted cap and bed in the distal segment frame.
 *
 * Scenarios:
 * 1. The moved frame reads a 20 mm pole and installs its bed on the same cap.
 * 2. A stale frame places the pole behind the joint and refuses the proximal fold.
 * 3. On that same round source, a valid distal quarter turn carries the active off-axis relief and its region. The admitted unturned frame is the stale orientation.
 *
 * The actual named F1 digit's pose transport reads whole F1 declarations, which is production source preparation; it is recorded before
 * admission by the figure check (`FamilyConicNailSourcePose`, `figure.json` `sourcePose`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the legacy all and bedded adapter, then uses the same original with the production createFrom and addReliefs. This unit does not build a person, realize a figure or bind vertices to a render skeleton.
 * @evidence contracts/development/testing.md#independent-expectations The two known axes project the same endpoint to 20 and -40 mm. An exact world-Z quarter turn maps (x,y,z) to (-y,x,z) and carries the nonzero relief witness on the circular chart.
 * @evidence contracts/development/testing.md#distinguishing-cases The old frame must refuse a bad origin. The separate quarter-turn control uses the same accepted source and origin and distinguishes orientation on an active plate point.
 * @evidence contracts/development/testing.md#execution-ownership One analytic fitted digit with the prior and quarter-turned frames. Only the analytic digit is fitted. No full mesh or renderer is invoked.
 * @evidence contracts/development/common.md#meaningful-documentation Names the known pole, direct source and nonzero relief witness.
 */
export function test_human_nail_placed_cap(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const { family, posed }: ReturnType<typeof HumanNailFixture.circularDigit> = HumanNailFixture.circularDigit();
  // The cap ends at world [-40,0,20]. The moved frame reads 20 mm along
  // +Z; a stale origin and +X read -40 mm, independent of the skin fit.
  const stale: IAutoMovieHumanSegmentFrame = { origin: [0, 0, 0], axes: [[0, -1, 0], [-1, 0, 0], [0, 0, -1]] };
  const [placed] = AutoMovieHumanF1Nails.all([family], new Map([["index.distal", posed]]));
  if (placed === undefined) failures.push("the moved digit has no fitted nail");
  else {
    near("moved digit's placed pole", placed.nail.readings.tip, 20, 1e-10);
    const withBed: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Nails.bedded(family, placed);
    if (withBed.reliefs?.length !== 1 || withBed.reliefs[0] !== placed.nail.bed || withBed.tips?.[1]?.tip !== 26)
      failures.push("the fitted bed does not belong to its placed cap");
    readQuarterTurn(family, posed, placed, failures);
  }
  try {
    AutoMovieHumanF1Nails.all([family], new Map([["index.distal", stale]]));
    failures.push("a stale distal frame was accepted");
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("proximal fold") && error.message.includes("behind it")))
      failures.push("the stale frame did not report its independently expected proximal refusal");
  }
  finish();
}

// Keep the source and the distal origin identical while changing only its dorsal direction.
function readQuarterTurn(
  family: IAutoMovieHumanConicLoft.IFamily,
  posed: IAutoMovieHumanSegmentFrame,
  stale: IAutoMovieHumanF1Nails.IMade,
  failures: string[],
): void {
  const quarter = ([x, y, z]: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [-y, x, z];
  const frame: IAutoMovieHumanSegmentFrame = { origin: posed.origin, axes: [quarter(posed.axes[0]), quarter(posed.axes[1]), quarter(posed.axes[2])] };
  const actual: IAutoMovieHumanF1Nails.IMade = AutoMovieHumanF1Nails.createFrom(
    { family }, new Map([[stale.row.segment, frame]]), stale.original,
  );
  const { sub, add, dot }: typeof AutoMovieHumanSegmentFrame = AutoMovieHumanSegmentFrame;
  const wantAxis: AutoMovieVector3Tuple = quarter(stale.nail.bed.axis);
  const staleAxisGap: number = Math.hypot(...sub(wantAxis, stale.nail.bed.axis));
  if (!(staleAxisGap > 0 && 2 * Math.hypot(...sub(actual.nail.bed.axis, wantAxis)) < staleAxisGap))
    failures.push("the held source did not carry the bed direction with its quarter-turned distal frame");

  const original: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(stale.original);
  const before: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(
    AutoMovieHumanF1Nails.addReliefs(stale.original, family, [stale.nail.bed]),
  );
  const after: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(
    AutoMovieHumanF1Nails.addReliefs(actual.original, family, [actual.nail.bed]),
  );
  const [first, last] = stale.nail.bed.stations;
  const [open, close] = stale.nail.bed.phases;
  let witness: { station: number; phase: number; point: AutoMovieVector3Tuple; lift: AutoMovieVector3Tuple } | null = null;
  for (const along of [1 / 4, 1 / 2, 3 / 4])
    for (const around of [1 / 4, 1 / 2, 3 / 4]) {
      const station: number = first + (last - first) * along;
      const phase: number = open + (close - open) * around;
      const point: AutoMovieVector3Tuple = before.point(station, phase);
      const lift: AutoMovieVector3Tuple = sub(point, original.point(station, phase));
      if (Math.hypot(...lift) > (witness === null ? 0 : Math.hypot(...witness.lift)) &&
          AutoMovieHumanNail.owns(stale.nail, point))
        witness = { station, phase, point, lift };
    }
  if (witness === null) {
    failures.push("the circular digit has no nonzero plate relief witness");
    return;
  }
  const { station, phase, point, lift } = witness;
  const { u, v } = stale.original.axis.at(station);
  const turnedPhase: number = phase + Math.sign(dot(quarter(u), v)) * Math.PI / 2;
  const wanted: AutoMovieVector3Tuple = quarter(lift);
  const moved: AutoMovieVector3Tuple = sub(after.point(station, turnedPhase), original.point(station, turnedPhase));
  const carried: AutoMovieVector3Tuple = add(posed.origin, quarter(sub(point, posed.origin)));
  if (!(Math.hypot(...moved) > 0 && 2 * Math.hypot(...sub(moved, wanted)) < Math.hypot(...sub(lift, wanted))) ||
      !AutoMovieHumanNail.owns(actual.nail, carried))
    failures.push("the off-axis relieved point and plate region did not follow the distal quarter turn");
}

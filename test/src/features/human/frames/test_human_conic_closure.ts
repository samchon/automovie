import { FamilyConicClosure as K } from "../../../reference-conics/FamilyConicClosure";

/**
 * A section's closure across an opening is an admissible wall: its far point stands where both of its arcs meet their tangent lines at
 * least the margin of their chords from both ends, and nearer the course only where that already holds.
 *
 * Scenarios, millimetres in a section's chart about the course point at the origin:
 * 1. A wedge cut square: the kept skin leaves at (-10, -10) heading straight down and comes back at (10, -10) heading straight up, as
 *    a ray's skin does where a parting plane cuts it square, and its mean radius is 10.5. The opening's middle direction is straight
 *    down. At the starting share 1 the far point (0, -10.5) lies half a millimetre past the chord: each arc's corner is 0.5 mm from
 *    the skin's end, 0.5 / hypot(10, 0.5) = 0.0499 of its chord. Admitted as soon as the tangents meet ahead (margin 0, the rule
 *    before this one), that is the closure. Held to the margin 0.1, the far point is carried to share 1.05, where the corner stands
 *    1.025 mm from the end and both meetings are 1.025 / hypot(10, 1.025) = 0.10196.
 * 2. A round section cut by a chord: ends at 9.5 mm below the centre of a circle of radius 10, leaving and arriving along the circle.
 *    The far point at share 1 is the circle's own bottom, both margins hold at once, and the two meetings are equal.
 * 3. Skin that turns back before the opening, leaving at (-10, -10) heading up and inward: no far point down to twice the mean radius
 *    has both corners ahead, and the closure is refused.
 *
 * The rule was written into the fit tool before this case; scenario 1 at margin 0 is the former acceptance and shows the corner it
 * admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicClosure.far`, the function the fit tool closes every opening round a course with, and reads its share, far point and meetings. It catches a far point accepted under the margin, one carried farther than needed, and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations Each corner is found here by hand: a vertical through the skin's end meets a horizontal through the far point, so its distances are the depth and the half chord.
 * @evidence contracts/development/testing.md#distinguishing-cases A square cut that needs the far point carried out, a round one that does not, and one with no admissible closure; the square cut under both margins.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_conic_closure`; made numbers only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three numbered scenarios with their inputs and closed forms.
 */
export function test_human_conic_closure(): void {
  const failures: string[] = [];
  const near = (label: string, value: number, expected: number, limit: number): void => {
    if (!(Math.abs(value - expected) <= limit)) failures.push(`${label}: ${value}, expected ${expected} within ${limit}`);
  };

  // 1. The square cut, under the former acceptance and under the margin.
  const former: K.IFar | null = K.far([-10, -10], [0, -1], [10, -10], [0, 1], 10.5, 1, 2, 0);
  if (former === null) failures.push("square cut, margin 0: refused");
  else {
    near("square cut, margin 0: share", former.share, 1, 1e-12);
    near("square cut, margin 0: first meeting", former.meetings[0], 0.5 / Math.hypot(10, 0.5), 1e-12);
    near("square cut, margin 0: second meeting", former.meetings[1], 0.5 / Math.hypot(10, 0.5), 1e-12);
  }
  const held: K.IFar | null = K.far([-10, -10], [0, -1], [10, -10], [0, 1], 10.5, 1, 2, 0.1);
  if (held === null) failures.push("square cut, margin 0.1: refused");
  else {
    near("square cut: share", held.share, 1.05, 1e-12);
    near("square cut: far point u", held.point[0], 0, 1e-12);
    near("square cut: far point v", held.point[1], -11.025, 1e-12);
    near("square cut: first corner u", held.first[0], -10, 1e-12);
    near("square cut: first corner v", held.first[1], -11.025, 1e-12);
    near("square cut: first meeting", held.meetings[0], 1.025 / Math.hypot(10, 1.025), 1e-12);
    near("square cut: second meeting", held.meetings[1], 1.025 / Math.hypot(10, 1.025), 1e-12);
  }

  // 2. The round cut: the circle's own bottom at once.
  const half: number = Math.sqrt(100 - 9.5 * 9.5);
  const along = (x: number, y: number): K.P => [-y / 10, x / 10];
  const round: K.IFar | null = K.far([-half, -9.5], along(-half, -9.5), [half, -9.5], along(half, -9.5), 10, 1, 2, 0.1);
  if (round === null) failures.push("round cut: refused");
  else {
    near("round cut: share", round.share, 1, 1e-12);
    near("round cut: far point v", round.point[1], -10, 1e-12);
    near("round cut: equal meetings", round.meetings[0], round.meetings[1], 1e-12);
    if (!(round.meetings[0] >= 0.1)) failures.push(`round cut: meeting ${round.meetings[0]} under the margin`);
  }

  // 3. Skin that turns back before the opening.
  const back: K.IFar | null = K.far([-10, -10], [Math.SQRT1_2, Math.SQRT1_2], [10, -10], [0, 1], 10.5, 1, 2, 0.1);
  if (back !== null) failures.push(`turned-back skin: not refused (share ${back.share})`);

  if (failures.length > 0) throw new Error(`section closure: ${failures.length} finding(s):\n${failures.join("\n")}`);
}

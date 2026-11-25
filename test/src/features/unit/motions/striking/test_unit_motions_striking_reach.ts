import type { IAutoMovieMotionHumanStrikingReach } from "@automovie/interface";
import { StrikingReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * An arm of 0.3 m and 0.25 m from the origin, bending up, its contact at the
 * hand.
 */
const ARM: IAutoMovieMotionHumanStrikingReach.IChain = {
  root: { x: 0, y: 0, z: 0 },
  point: { x: 0.5, y: 0, z: 0 },
  upper: 0.3,
  lower: 0.25,
  along: 0.25,
  bend: { x: 0, y: 1, z: 0 },
  flexion: [0, 150],
  slide: false,
};

/**
 * A striking limb's reach (`StrikingReach`): `reach` is the law of cosines over
 * the two segments at a flexion; `chain` lays the limb to a point within its
 * flexion band, short beyond its longest reach, jammed within its shortest,
 * either holding the jam flexion or sliding the contact up the distal segment;
 * `hint` steps a distance from the middle joint across the reach toward the
 * bend; `advance` closes the distance beyond the comfortable within a limit.
 *
 * Scenarios:
 *
 * 1. 0.3 m and 0.25 m reach 0.55 m straight, sqrt 0.1525 square and 0.05 m folded.
 * 2. To 0.5 m the limb reaches: the elbow at (0.2775, 0.114, 0), the hand on the
 *    point, flexed `acos 0.65`.
 * 3. To 0.8 m it is short by 0.25 m, laid straight to 0.55 m.
 * 4. To 0.1 m it is jammed: holding 140 degrees it backs away by the shortfall;
 *    sliding, the contact moves to `0.3 cos 30` along the distal segment.
 * 5. A point at the root or a bend along the reach is refused.
 * 6. The hint steps 0.1 m up from the elbow; the advance closes 0.2 m within 0.1
 *    m, and backs off 0.05 m.
 */
export function test_unit_motions_striking_reach(): void {
  TestValidator.predicate(
    "the law of cosines",
    nclose(StrikingReach.reach(0.3, 0.25, 0), 0.55, 1e-12) &&
      nclose(StrikingReach.reach(0.3, 0.25, 90), Math.sqrt(0.1525), 1e-12) &&
      nclose(StrikingReach.reach(0.3, 0.25, 180), 0.05, 1e-12),
  );
  const reached = StrikingReach.chain(ARM);
  TestValidator.predicate(
    "reached",
    reached.status === "reached" &&
      reached.gap === 0 &&
      vclose(
        reached.middle,
        { x: 0.2775, y: 0.3 * Math.sqrt(1 - 0.925 ** 2), z: 0 },
        1e-12,
      ) &&
      vclose(reached.end, ARM.point, 1e-12) &&
      nclose(reached.flexion, (Math.acos(0.65) * 180) / Math.PI, 1e-9),
  );
  const short = StrikingReach.chain({ ...ARM, point: { x: 0.8, y: 0, z: 0 } });
  TestValidator.predicate(
    "short",
    short.status === "short" &&
      nclose(short.gap, 0.25, 1e-12) &&
      vclose(short.point, { x: 0.55, y: 0, z: 0 }, 1e-12) &&
      nclose(short.flexion, 0, 1e-6),
  );
  const held = StrikingReach.chain({ ...ARM, point: { x: 0.1, y: 0, z: 0 } });
  const slid = StrikingReach.chain({
    ...ARM,
    point: { x: 0.1, y: 0, z: 0 },
    slide: true,
  });
  TestValidator.predicate(
    "jammed",
    held.status === "jammed" &&
      nclose(
        held.gap,
        0.1 - StrikingReach.reach(0.3, 0.25, StrikingReach.JAM_FLEXION),
        1e-12,
      ) &&
      slid.status === "jammed" &&
      nclose(slid.along, 0.3 * Math.cos(Math.PI / 6), 1e-12) &&
      nclose(slid.gap, 0, 1e-12),
  );
  TestValidator.predicate(
    "refused",
    throwsError(() => StrikingReach.chain({ ...ARM, point: ARM.root })) &&
      throwsError(() =>
        StrikingReach.chain({ ...ARM, bend: { x: 1, y: 0, z: 0 } }),
      ),
  );
  TestValidator.predicate(
    "the hint and the advance",
    vclose(
      StrikingReach.hint(ARM.root, reached, ARM.bend, 0.1),
      { ...reached.middle, y: reached.middle.y + 0.1 },
      1e-12,
    ) &&
      nclose(StrikingReach.advance(0.5, 0.3, 0.1), 0.1, 1e-12) &&
      nclose(StrikingReach.advance(0.25, 0.3, 0.1), -0.05, 1e-12) &&
      nclose(StrikingReach.advance(0, 0.3, 0.1), -0.1, 1e-12),
  );
}

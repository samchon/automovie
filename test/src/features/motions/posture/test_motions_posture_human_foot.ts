import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Rounding of a rotation and an inverse trigonometric reading, degrees or
 * metres.
 */
const ROUNDING: number = 1e-9;

/**
 * `HumanFoot` is the rigid rocker a planted foot turns as (Perry and
 * Burnfield): a rotation from a heading, a toes-up pitch and a roll, read back
 * by `heading`, `pitch` (past vertical too) and `roll`; `pivot` places the foot
 * so a sole point, or a point in its rest frame, stays where it is put, and
 * `point` reads a sole point back; `turned` turns a placement about its ankle's
 * vertical; `edge` is the lower forefoot end carried across by half the
 * breadth; `heelOff` keeps a contact where the goal put it when the foot
 * reaches another rotation, the toes taking back the pitch it lost; `sole` is
 * the heel, ball and toe and then the outline's corners, `lowest` their least
 * height; `base` is a standing body's sole points within `BEARING` of the
 * lowest, left foot first.
 *
 * The body is built whole (`humanFixtureBody`) for its feet's sockets.
 *
 * Scenarios, the average man's left foot:
 *
 * 1. Heading 30, pitch 20, roll 0 and heading 30, pitch 120 read back; roll 15
 *    reads 15.
 * 2. Pivoted about its ball at (0.1, 0, 0.3), pitch −30: the ball is there; about
 *    a rest-frame point the ankle is the point less its turned offset.
 * 3. Turned 0 the placement itself; turned 90 the heading adds 90, the ankle
 *    stays.
 * 4. The edges lie ±half the breadth across from the lower forefoot end.
 * 5. Asked flat, reached 20 degrees heel up: the toes take back 20 and the contact
 *    stays at its anchor; reached toes up, they take back none.
 * 6. `sole` starts with the heel, ball and toe `point`s and `lowest` is its least
 *    height; the prepared readers agree with the direct ones.
 * 7. Standing, every base point is within `BEARING` of the lowest, and the left
 *    foot's base alone is the leading part of both feet's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rig foot rotations, sole anchors and bearing geometry, including prepared placement reads.
 * @evidence contracts/development/testing.md#behavioral-verification Tests heading, pitch, roll, ball pivot, edge, heel-off and bearing points on a posed rig with authored sockets.
 * @evidence contracts/development/testing.md#independent-expectations Known requested angles round-trip, ball stays at its anchor and each edge is half-breadth from its reference. A missing 20° pitch is compensated at the toes.
 */
export async function test_motions_posture_human_foot(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");

  // 1. Rotations read back.
  const read = (q: ReturnType<typeof HumanFoot.rotation>): number[] => [
    HumanFoot.heading(q),
    HumanFoot.pitch(q),
    HumanFoot.roll(q),
  ];
  const close = (a: number[], b: number[]): boolean =>
    a.every((v: number, i: number): boolean => nclose(v, b[i]!, 1e-7));
  TestValidator.predicate(
    "heading, pitch and roll read back",
    close(read(HumanFoot.rotation(30, 20)), [30, 20, 0]) &&
      close(read(HumanFoot.rotation(30, 120)).slice(0, 2), [30, 120]) &&
      nclose(HumanFoot.roll(HumanFoot.rotation(0, 0, 15)), 15, 1e-7) &&
      close(
        Object.values(HumanFoot.headingPitch(HumanFoot.rotation(30, 20))),
        [30, 20],
      ),
  );

  // 2. Pivots.
  const at: IAutoMovieVector3 = { x: 0.1, y: 0, z: 0.3 };
  const rocked: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    at,
    0,
    -30,
  );
  const local: IAutoMovieVector3 = { x: 0.02, y: -0.07, z: 0.1 };
  const about: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    local,
    at,
    10,
    5,
  );
  TestValidator.predicate(
    "the pivot stays put",
    vclose(HumanFoot.point(body, "left", "ball", rocked), at, ROUNDING) &&
      vclose(
        about.ankle,
        AutoMovieEngineVector3.subtract(at, AutoMovieEngineQuaternion.rotateVector(about.rotation, local)),
        ROUNDING,
      ),
  );

  // 3. Turned.
  const turned: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.turned(
    rocked,
    90,
  );
  TestValidator.predicate(
    "turned about the ankle's vertical",
    HumanFoot.turned(rocked, 0) === rocked &&
      turned.ankle === rocked.ankle &&
      nclose(HumanFoot.heading(turned.rotation), 90, 1e-7) &&
      nclose(HumanFoot.pitch(turned.rotation), -30, 1e-7),
  );

  // 4. Edges.
  const ball: IAutoMovieVector3 = HumanFoot.offset(body, "left", "ball", 0);
  const toe: IAutoMovieVector3 = HumanFoot.offset(body, "left", "toe", 0);
  const low: IAutoMovieVector3 = toe.y < ball.y ? toe : ball;
  TestValidator.predicate(
    "the forefoot's edges",
    vclose(
      HumanFoot.edge(body, "left", 1),
      { ...low, x: low.x + body.measure.footBreadth / 2 },
      0,
    ) &&
      vclose(
        HumanFoot.edge(body, "left", -3, 0.02),
        { ...low, x: low.x - 0.02 },
        0,
      ),
  );

  // 5. Heel-off.
  const asked: ReturnType<typeof HumanFoot.rotation> = HumanFoot.rotation(0, 0);
  const reached: ReturnType<typeof HumanFoot.rotation> = HumanFoot.rotation(
    0,
    -20,
  );
  const off: IAutoMovieMotionHumanFoot.IHeelOffResult = HumanFoot.heelOff(
    asked,
    reached,
    at,
    ball,
  );
  TestValidator.predicate(
    "the contact stays, the toes take back the pitch",
    nclose(off.toes, 20, 1e-7) &&
      vclose(
        AutoMovieEngineVector3.add(off.ankle, AutoMovieEngineQuaternion.rotateVector(reached, ball)),
        at,
        ROUNDING,
      ) &&
      HumanFoot.heelOff(asked, HumanFoot.rotation(0, 10), at, ball).toes === 0,
  );

  // 6. The sole.
  const sole: IAutoMovieVector3[] = HumanFoot.sole(body, "left", rocked);
  TestValidator.predicate(
    "the sole's points, its lowest, and the prepared readers",
    HumanFoot.SOCKETS.every(
      (s: "heel" | "ball" | "toe", i: number): boolean =>
        vclose(sole[i]!, HumanFoot.point(body, "left", s, rocked), ROUNDING) &&
        vclose(
          HumanFoot.preparePoint(body, "left", s, 0)(rocked),
          sole[i]!,
          ROUNDING,
        ),
    ) &&
      HumanFoot.lowest(body, "left", rocked) ===
        Math.min(...sole.map((p: IAutoMovieVector3): number => p.y)) &&
      HumanFoot.prepareSole(
        body,
        "left",
      )(rocked).every((p: IAutoMovieVector3, i: number): boolean =>
        vclose(p, sole[i]!, ROUNDING),
      ),
  );

  // 7. The base of support.
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, {
      root: { x: 0, y: body.measure.hipHeight, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  );
  const both: IAutoMovieVector3[] = HumanFoot.base(body, bones);
  const left: IAutoMovieVector3[] = HumanFoot.base(body, bones, ["left"]);
  const floor: number = Math.min(
    ...both.map((p: IAutoMovieVector3): number => p.y),
  );
  TestValidator.predicate(
    "the bearing points, left first",
    both.length > left.length &&
      left.length > 0 &&
      left.every((p: IAutoMovieVector3, i: number): boolean =>
        vclose(p, both[i]!, 0),
      ) &&
      left.every((p: IAutoMovieVector3): boolean => p.x > 0) &&
      both.every(
        (p: IAutoMovieVector3): boolean =>
          p.y - floor <= HumanFoot.BEARING + ROUNDING,
      ),
  );
}

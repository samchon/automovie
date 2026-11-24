import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRange,
  HumanFoot,
  HumanFrame,
  hipJoints,
  kneelKeys,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The bisection's floor on a leg's length, metres. */
const BISECTED: number = 1e-9;

/** Rounding of a few products of unit vectors. */
const ROUNDING: number = 1e-12;

/**
 * `kneelKeys` solves a kneel's key states from the leg's two lengths and the
 * knee's radius over the floor.
 *
 * - `still` keeps a foot whose toe joint moves no more than 0.1 mm.
 * - `prepareTurn` carries the root on the circle about the pivot from one place
 *   to the other.
 * - `tucked` stands a kneeling foot on its toes straight behind its knee, its
 *   ankle a shank from the knee.
 * - `lean` is the smooth maximum `(x + sqrt(x^2 + 2^2)) / 2` of how far the
 *   thigh's line reaches behind the hip's extension range less 5 degrees.
 * - `solve` stands, steps back and kneels on one knee, then on both and sits back
 *   as asked: on one knee the kneeling hip stands a thigh above a knee a shank
 *   radius over the floor; sitting back the hip is a thigh from that knee,
 *   turned back about it.
 *
 * The body is built whole (`humanFixtureBody`): the feet and hips read the
 * rig's offsets.
 *
 * Scenarios, the average man standing at the origin facing +Z, kneeling on the
 * left:
 *
 * 1. A foot moved 0.05 mm is still, one moved 0.2 mm is not.
 * 2. A quarter turn about the origin from +X to +Y passes (√½, √½, 0) halfway; a
 *    turn between one place stays there.
 * 3. A left foot tucked behind a knee at (0.1, 0.06, 0.2) has its ankle a shank
 *    from the knee and its toe joint on the line behind it.
 * 4. With each ankle a whole leg straight under its hip the lean is `(x + sqrt(x^2
 *    + 4)) / 2` for `x = 5 - range`; an ankle stepped back leans more.
 * 5. One knee gives three keys, both four and sitting back five; the kneeling hip
 *    and the sat-back hip stand as above, and the pivot is the knee less the
 *    hip's rest offset.
 */
export async function test_unit_motions_everyday_kneel_keys(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const foot = (x: number): kneelKeys.IFoot => ({
    at: { x, y: 0, z: 0 },
    heading: 0,
    pitch: 0,
    toes: 0,
    planted: true,
  });
  TestValidator.predicate(
    "still",
    kneelKeys.still(foot(0), foot(5e-5)) &&
      !kneelKeys.still(foot(0), foot(2e-4)),
  );
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const turn: (u: number) => IAutoMovieVector3 = kneelKeys.prepareTurn(
    zero,
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "a turn about the pivot",
    vclose(turn(0.5), { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 }, ROUNDING) &&
      vclose(turn(1), { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(
        kneelKeys.prepareTurn(
          zero,
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
        )(0.5),
        { x: 1, y: 0, z: 0 },
        ROUNDING,
      ),
  );
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const knee: IAutoMovieVector3 = { x: 0.1, y: 0.06, z: 0.2 };
  const tucked: kneelKeys.IFoot = kneelKeys.tucked(body, "left", knee, 0, 0.03);
  const ankle: IAutoMovieVector3 = HumanFoot.pivot(
    body,
    "left",
    "mtp",
    tucked.at,
    tucked.heading,
    tucked.pitch,
  ).ankle;
  TestValidator.predicate(
    "a tucked foot",
    nclose(Vector3.length(Vector3.subtract(ankle, knee)), m.shank, BISECTED) &&
      nclose(tucked.at.x, knee.x, ROUNDING) &&
      tucked.at.z < knee.z &&
      tucked.pitch < 0 &&
      tucked.planted,
  );
  const leg: number = m.thigh + m.shank;
  const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    { x: 0, y: 1, z: 0 },
    HumanFrame.turn(0),
  );
  const under = (
    back: number,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> => ({
    left: { ...hips.left, y: hips.left.y - leg },
    right: {
      ...hips.right,
      y: hips.right.y - Math.sqrt(leg * leg - back * back),
      z: hips.right.z - back,
    },
  });
  const range: number = -AutoMovieMotionHumanRange.limit(
    "leftUpperLeg",
    "extension",
  )!;
  const x: number = 5 - range;
  const upright: number = kneelKeys.lean(body, hips, under(0), {
    x: 0,
    y: 0,
    z: 1,
  });
  TestValidator.predicate(
    "the lean",
    nclose(upright, (x + Math.sqrt(x * x + 4)) / 2, 1e-6) &&
      kneelKeys.lean(body, hips, under(0.5), { x: 0, y: 0, z: 1 }) > upright,
  );
  const standing: IAutoMovieMotionHumanPosture = stand.posture(body, zero, 0);
  const rest: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    zero,
    HumanFrame.turn(0),
  );
  const sat: kneelKeys.IKeys = kneelKeys.solve(
    body,
    standing,
    "sitBack",
    "left",
  );
  const hip = (key: kneelKeys.IKey): IAutoMovieVector3 =>
    Vector3.add(key.root, rest.left);
  const kneeK: IAutoMovieVector3 = Vector3.subtract(hip(sat.keys[2]!), {
    x: 0,
    y: m.thigh,
    z: 0,
  });
  TestValidator.predicate(
    "the keys",
    kneelKeys.solve(body, standing, "one", "left").keys.length === 3 &&
      kneelKeys.solve(body, standing, "both", "left").keys.length === 4 &&
      sat.keys.length === 5 &&
      nclose(hip(sat.keys[2]!).y, m.shankRadius + m.thigh, ROUNDING) &&
      nclose(
        Vector3.length(Vector3.subtract(hip(sat.keys[4]!), kneeK)),
        m.thigh,
        ROUNDING,
      ) &&
      hip(sat.keys[4]!).y < hip(sat.keys[2]!).y &&
      vclose(sat.pivot, Vector3.subtract(kneeK, rest.left), ROUNDING),
  );
}

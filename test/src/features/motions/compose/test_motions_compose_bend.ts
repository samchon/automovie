import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * How near a solved elbow keeps the arm's segment lengths, metres: the swivel
 * circle is exact, so only the sweep's refinement and its rounding remain.
 */
const LENGTH: number = 1e-6;

/**
 * `AutoMovieMotionHumanBend.solve` places an elbow on the circle a wrist's
 * place leaves it about the shoulder-to-wrist line, the allowed place of least
 * strain; `strain` scores a place, `turn` moves one about the line.
 *
 * The average man stands with his arms down; the left wrist is asked 0.15 m up
 * and 0.2 m forward of where it hangs.
 *
 * Scenarios:
 *
 * 1. The solved elbow keeps the upper arm's and the forearm's lengths.
 * 2. It is the least strained: a place turned 30 degrees either way about the line
 *    strains no less.
 * 3. A turned place stays as far from the shoulder.
 * 4. A wrist beyond reach is refused, and with a fallback gives a hint.
 *
 * The body is built whole (`humanFixtureBody`): the solve reads the body's pose
 * rig, topology, rest and hanging arms, and the shoulder it is checked against
 * is read by forward kinematics on the whole body, records only
 * `AutoMovieMotionHumanBody.create` derives from the stored rig and profile.
 */
export async function test_motions_compose_bend(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, posture),
  );
  const shoulder: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
  const resting: IAutoMovieVector3 = bones.get("leftLowerArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const upper: number = distance(shoulder, resting);
  const forearm: number = distance(resting, wrist);
  const request: IAutoMovieMotionHumanBend.ISolve = {
    body,
    posture,
    side: "left",
    point: { x: wrist.x, y: wrist.y + 0.15, z: wrist.z + 0.2 },
  };

  // 1. The segment lengths.
  const elbow: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve(request);
  TestValidator.predicate(
    "the elbow keeps both segments' lengths",
    nclose(distance(shoulder, elbow), upper, LENGTH) &&
      nclose(distance(elbow, request.point), forearm, LENGTH),
  );

  // 2. Least strain.
  const least: number = AutoMovieMotionHumanBend.strain(request, elbow);
  TestValidator.predicate(
    "a turned place strains no less",
    [30, -30].every(
      (degrees: number): boolean =>
        AutoMovieMotionHumanBend.strain(
          request,
          AutoMovieMotionHumanBend.turn(request, elbow, degrees),
        ) >=
        least - 1e-9,
    ),
  );

  // 3. A turn stays on the circle.
  TestValidator.predicate(
    "a turned place stays as far from the shoulder",
    nclose(
      distance(shoulder, AutoMovieMotionHumanBend.turn(request, elbow, 45)),
      upper,
      LENGTH,
    ),
  );

  // 4. Beyond reach.
  const far: IAutoMovieMotionHumanBend.ISolve = {
    ...request,
    point: { x: wrist.x, y: wrist.y, z: wrist.z + 2 },
  };
  TestValidator.predicate(
    "beyond reach refused, with a fallback a hint",
    throwsError((): IAutoMovieVector3 => AutoMovieMotionHumanBend.solve(far)) &&
      distance(
        shoulder,
        AutoMovieMotionHumanBend.solve({
          ...far,
          fallback: { out: 0, up: -1, forward: 0 },
        }),
      ) < 1,
  );
}

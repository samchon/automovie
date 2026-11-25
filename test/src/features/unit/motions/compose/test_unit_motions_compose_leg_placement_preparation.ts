import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanLeg } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/**
 * A fixed-foot placement reader prepares the leg's knee and toe geometry.
 *
 * Scenarios:
 *
 * 1. Identity foot and body rotations leave the hint one metre forward of the
 *    placed rest knee. The first bearing sample uses the prepared ankle to toes
 *    subtraction despite subsequent edits to the rest observations.
 * 2. A free read omits its contact and a later bearing read owns a new vector.
 * 3. A current foot rotation of 90 degrees about Y reads a metre along X under the
 *    direct changing-rotation branch. The normalized turn permits 32 ulps in
 *    metres for unit-scale calculations.
 */
export async function test_unit_motions_compose_leg_placement_preparation(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const knee: IAutoMovieVector3 = body.rest.get("leftLowerLeg")!;
  const toes: IAutoMovieVector3 = body.rest.get("leftToes")!;
  const ankle: IAutoMovieVector3 = body.rest.get("leftFoot")!;
  const original: IAutoMovieVector3 = { ...knee };
  const offset: IAutoMovieVector3 = {
    x: toes.x - ankle.x,
    y: toes.y - ankle.y,
    z: toes.z - ankle.z,
  };
  const position: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
    root: { x: 1, y: 1, z: 1 },
    yaw: 0,
  };
  const read: ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement> =
    AutoMovieMotionHumanLeg.preparePlacement(body, "left", position.rotation);
  knee.x += 0.75;
  toes.z += 0.125;
  const first: IAutoMovieHumanLimbGoal = read(posture, position, true);
  const expected: IAutoMovieVector3 = {
    x: 1 + original.x,
    y: 1 + original.y,
    z: 1 + original.z + 1,
  };
  const roundoff: number = 32 * Number.EPSILON;
  TestValidator.predicate(
    "first sample keeps the prepared knee, contact and borrowed ankle",
    first.point === position.ankle &&
      first.contact !== undefined &&
      vclose(first.contact, offset, roundoff) &&
      vclose(first.bend, expected, roundoff),
  );
  first.contact!.z = -1;
  TestValidator.predicate(
    "bearing edits stay in one returned goal",
    read(posture, position, false).contact === undefined &&
      read(posture, position, true).contact?.z === offset.z,
  );
  const turned: IAutoMovieHumanLimbGoal = read(
    posture,
    { ...position, rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 } },
    false,
  );
  TestValidator.predicate(
    "a changed rotation uses the actual body and foot heading",
    vclose(
      turned.bend,
      { x: 1 + knee.x + 1, y: 1 + knee.y, z: 1 + knee.z },
      roundoff,
    ),
  );
}

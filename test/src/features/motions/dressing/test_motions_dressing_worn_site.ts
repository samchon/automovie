import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk
} from "../../../../../packages/motions/src/everyday/internal/HumanTrunk";
import {
  HumanWorn
} from "../../../../../packages/motions/src/dressing/internal/HumanWorn";
import {
  dress
} from "../../../../../packages/motions/src/dressing/internal/dress";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { testAffordance } from "../../internal/fixtures/testAffordance";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding allowance for head-scale translations and unit rotations. */
const ROUNDING: number = 1e-12;

/**
 * Check the wearable socket against its receiving region in a displayed head
 * frame.
 *
 * Scenarios:
 *
 * 1. On each fixture, place the hat socket at the crown and the spectacles
 *    socket at the bridge. Their normals oppose the receiving normals and
 *    their chosen directions follow the corresponding tangents.
 * 2. Translate and quarter-turn each body. Read the moved, original and moved
 *    state again and obtain the corresponding item transforms on every read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the measured regions, material socket alignment and out-of-order reads.
 * @evidence contracts/development/testing.md#behavioral-verification The site reader receives resolved posed bones and is checked against the original item geometry in both body placements.
 * @evidence contracts/development/testing.md#independent-expectations The test applies the known socket offset and axis to each result and reconstructs the movement with the authored rigid transform.
 */
export async function test_motions_dressing_worn_site(): Promise<void> {
  const origin: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    limbs: {},
    joints: {},
  };
  const moved: IAutoMovieMotionHumanPosture = {
    ...origin,
    root: { x: 0.4, y: 0.2, z: -0.3 },
    yaw: 90,
  };
  const quarter = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const items: readonly {
    item: IAutoMovieMotionHumanDress.Item;
    region: AutoMovieHumanoidRegion;
    socket: IAutoMovieAffordance;
    heading: IAutoMovieVector3;
  }[] = [
    {
      item: "hat",
      region: "crown",
      heading: { x: 0, y: 0, z: 1 },
      socket: testAffordance(
        "wear",
        "socket",
        { x: 0, y: 0.11, z: 0 },
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180),
      ),
    },
    {
      item: "glasses",
      region: "noseBridge",
      heading: { x: 0, y: 1, z: 0 },
      socket: testAffordance(
        "wear",
        "socket",
        { x: 0, y: 0.016, z: -0.002 },
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
      ),
    },
  ];

  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    for (const { item, region, socket, heading } of items) {
      const prop: IAutoMovieMotionHumanProp = {
        subject: item,
        points: {},
        frame: { position: origin.root, rotation: AutoMovieEngineQuaternion.identity() },
        affordances: [socket],
      };
      const at = HumanTrunk.region(body, origin, region);
      const site = HumanWorn.prepareSite(body, origin, prop, region);
      const worn: IAutoMovieRigidTransform = site.frame(0);
      const socketPoint: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        worn.position,
        AutoMovieEngineQuaternion.rotateVector(worn.rotation, socket.frame.translation),
      );
      const socketAxis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.multiply(worn.rotation, socket.frame.rotation),
        { x: 0, y: 1, z: 0 },
      );
      const tangent: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.subtract(
          heading,
          AutoMovieEngineVector3.scale(at.normal, AutoMovieEngineVector3.dot(at.normal, heading)),
        ),
      );
      TestValidator.predicate(
        `${name} ${item} socket on its region`,
        dress.WORN[item] === region &&
          vclose(socketPoint, at.point, ROUNDING) &&
          vclose(socketAxis, AutoMovieEngineVector3.scale(at.normal, -1), ROUNDING) &&
          vclose(
            AutoMovieEngineQuaternion.rotateVector(worn.rotation, heading),
            tangent,
            ROUNDING,
          ),
      );

      const read = HumanWorn.prepareMoving(body, prop, region);
      const after: IAutoMovieRigidTransform = read(moved, 0);
      const before: IAutoMovieRigidTransform = read(origin, 0);
      const again: IAutoMovieRigidTransform = read(moved, 0);
      const expected: IAutoMovieVector3 = {
        x: moved.root.x + worn.position.z,
        y: moved.root.y + worn.position.y,
        z: moved.root.z - worn.position.x,
      };
      TestValidator.predicate(
        `${name} ${item} follows the turned head`,
        vclose(after.position, expected, ROUNDING) &&
          qclose(
            after.rotation,
            AutoMovieEngineQuaternion.multiply(quarter, worn.rotation),
            ROUNDING,
          ) &&
          vclose(before.position, worn.position, ROUNDING) &&
          qclose(before.rotation, worn.rotation, ROUNDING) &&
          vclose(again.position, after.position, ROUNDING) &&
          qclose(again.rotation, after.rotation, ROUNDING),
      );
    }
  }
}

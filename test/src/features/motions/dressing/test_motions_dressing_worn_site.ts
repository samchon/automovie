import { Quaternion, Vector3 } from "@automovie/engine";
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
import { HumanTrunk, HumanWorn, dress } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { testAffordance } from "../../internal/fixtures/testAffordance";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding allowance for head-scale translations and unit rotations. */
const ROUNDING: number = 1e-12;

/**
 * A wearable's socket lies on its receiving head region and faces inwards as
 * the body moves. Stock hat and spectacles both have a nonzero socket offset,
 * with the hat's socket pointing down and the spectacles' pointing rearwards.
 *
 * Scenarios:
 *
 * 1. On each stored body the hat sits on the crown and the spectacles on the
 *    bridge. The socket translation must be applied in the item's frame, and
 *    its normal must oppose the receiving region's normal. The hat's front
 *    and the spectacles' up direction align along the region's tangent plane.
 * 2. Move the body by a translation and a quarter turn. Read the moved site
 *    first, the resting site second and the moved site again. Both the item
 *    position and its rotation follow the body in any read order.
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
  const quarter = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
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
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180),
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
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
      ),
    },
  ];

  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    for (const { item, region, socket, heading } of items) {
      const prop: IAutoMovieMotionHumanProp = {
        subject: item,
        points: {},
        frame: { position: origin.root, rotation: Quaternion.identity() },
        affordances: [socket],
      };
      const at = HumanTrunk.region(body, origin, region);
      const site = HumanWorn.prepareSite(body, origin, prop, region);
      const worn: IAutoMovieRigidTransform = site.frame(0);
      const socketPoint: IAutoMovieVector3 = Vector3.add(
        worn.position,
        Quaternion.rotateVector(worn.rotation, socket.frame.translation),
      );
      const socketAxis: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.multiply(worn.rotation, socket.frame.rotation),
        { x: 0, y: 1, z: 0 },
      );
      const tangent: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          heading,
          Vector3.scale(at.normal, Vector3.dot(at.normal, heading)),
        ),
      );
      TestValidator.predicate(
        `${name} ${item} socket on its region`,
        dress.WORN[item] === region &&
          vclose(socketPoint, at.point, ROUNDING) &&
          vclose(socketAxis, Vector3.scale(at.normal, -1), ROUNDING) &&
          vclose(
            Quaternion.rotateVector(worn.rotation, heading),
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
            Quaternion.multiply(quarter, worn.rotation),
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

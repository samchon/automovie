import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Prepare a one-axis authored shoulder motion on a canonical polygon pose.
 * The left arm's transforms rotate together about its shoulder in world
 * coordinates. Other transforms are borrowed for each new target. Angles are
 * degrees about the positive world Z-axis, as in Quaternion.fromAxisAngle.
 *
 * @param profile Canonical profile whose connected joint tree names the arm.
 * @param neutral Complete scene pose, including any placement translation.
 * @returns A reader producing whole poses from the requested angle.
 */
export function preparePhysicalHumanArmSwing(
  profile: IAutoMoviePhysicalProfile,
  neutral: Record<string, IAutoMovieRigidTransform>,
): (angle: number) => Record<string, IAutoMovieRigidTransform> {
  const shoulder: string = "leftUpperArm";
  const children: Map<string, string[]> = new Map();
  for (const joint of profile.joints) {
    const siblings: string[] | undefined = children.get(joint.parent);
    if (siblings) siblings.push(joint.child);
    else children.set(joint.parent, [joint.child]);
  }

  const arm: string[] = [shoulder];
  for (const bone of arm) arm.push(...(children.get(bone) ?? []));
  const pivot: IAutoMovieVector3 = neutral[shoulder]!.position;
  const sources: {
    bone: string;
    offset: IAutoMovieVector3;
    rotation: IAutoMovieRigidTransform["rotation"];
  }[] = arm.map((bone: string) => ({
    bone,
    offset: AutoMovieEngineVector3.subtract(neutral[bone]!.position, pivot),
    rotation: neutral[bone]!.rotation,
  }));

  return (angle: number): Record<string, IAutoMovieRigidTransform> => {
    const rotation: IAutoMovieRigidTransform["rotation"] =
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, angle);
    const pose: Record<string, IAutoMovieRigidTransform> = { ...neutral };
    for (const source of sources)
      pose[source.bone] = {
        position: AutoMovieEngineVector3.add(pivot, AutoMovieEngineQuaternion.rotateVector(rotation, source.offset)),
        rotation: AutoMovieEngineQuaternion.multiply(rotation, source.rotation),
      };
    return pose;
  };
}

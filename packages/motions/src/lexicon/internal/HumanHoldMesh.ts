import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHoldMesh,
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanInteractionMesh } from "../../posture/internal/HumanInteractionMesh";

/*
 * A two-person hold's key pose adapted to any pair of bodies: the joints of
 * both bodies at the key pose, the target bodies' bone lengths and the hold's
 * contacts go through the interaction mesh (`HumanInteractionMesh`, Ho, Komura
 * and Tai 2010), and each body's adapted joints become its limb goals (each
 * wrist and ankle on its adapted joint, bent toward its adapted elbow or knee)
 * and its root's shift, which the existing limb fits (`resolveHumanPosture`)
 * resolve.
 *
 * The key pose is a coupled solve of the hold on two reference bodies, never
 * authored per hold; a contact keeps the offset between its two joints that the
 * key pose has, so a hand on a back stays a hand's thickness off the spine
 * joint.
 *
 * First pass: a contact's offset is kept as the key pose has it, not scaled to
 * the target bodies' surfaces; the trunk's joint angles are not refitted to the
 * adapted spine, only shifted with the hips.
 */
export namespace HumanHoldMesh {
  /*
   * Adapt a hold's key pose to a pair of bodies.
   * Parameter key: The two key bodies.
   * Parameter to: The two target bodies, in the same order.
   * Parameter contacts: The hold's contacts.
   * Returns: Each target body's adapted pose.
   * When a contact or a bone names a joint the key pose lacks.
   */
  export function adapt(
    key: readonly [
      IAutoMovieMotionHumanHoldMesh.IKey,
      IAutoMovieMotionHumanHoldMesh.IKey,
    ],
    to: readonly [IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBody],
    contacts: readonly IAutoMovieMotionHumanHoldMesh.IContact[],
  ): [
    IAutoMovieMotionHumanHoldMesh.IAdapted,
    IAutoMovieMotionHumanHoldMesh.IAdapted,
  ] {
    const points: IAutoMovieVector3[] = [];
    const index: Map<string, number> = new Map();
    key.forEach((k: IAutoMovieMotionHumanHoldMesh.IKey, side: number): void => {
      for (const [bone, resolved] of k.bones) {
        index.set(`${side}:${bone}`, points.length);
        points.push(resolved.worldPosition);
      }
    });
    const at = (side: number, bone: AutoMovieHumanoidBone): number => {
      const i: number | undefined = index.get(`${side}:${bone}`);
      if (i === undefined)
        throw new Error(`The key pose's body ${side} has no joint ${bone}`);
      return i;
    };
    const bones: IAutoMovieMotionHumanInteractionMesh.IBone[] = [];
    to.forEach((body: IAutoMovieMotionHumanBody, side: number): void => {
      for (const bone of body.skeleton.bones)
        if (
          bone.parent !== null &&
          index.has(`${side}:${bone.bone}`) &&
          index.has(`${side}:${bone.parent}`)
        )
          bones.push({
            from: at(side, bone.bone),
            to: at(side, bone.parent),
            length: Vector3.length(
              Vector3.subtract(
                body.rest.get(bone.bone)!,
                body.rest.get(bone.parent)!,
              ),
            ),
          });
    });
    const result: IAutoMovieMotionHumanInteractionMesh.IResult =
      HumanInteractionMesh.adapt({
        reference: points,
        bones,
        contacts: contacts.map(
          (
            c: IAutoMovieMotionHumanHoldMesh.IContact,
          ): IAutoMovieMotionHumanInteractionMesh.IContact => ({
            a: at(0, c.a),
            b: at(1, c.b),
            offset: Vector3.subtract(points[at(0, c.a)]!, points[at(1, c.b)]!),
          }),
        ),
      });
    const adapted = (
      side: AdaptAdaptedSide,
    ): IAutoMovieMotionHumanHoldMesh.IAdapted => {
      const joints: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
      for (const bone of key[side].bones.keys())
        joints.set(bone, result.points[at(side, bone)]!);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const [limb, end, middle] of [
        ["leftArm", "leftHand", "leftLowerArm"],
        ["rightArm", "rightHand", "rightLowerArm"],
        ["leftLeg", "leftFoot", "leftLowerLeg"],
        ["rightLeg", "rightFoot", "rightLowerLeg"],
      ] as const) {
        const point: IAutoMovieVector3 | undefined = joints.get(end);
        const bend: IAutoMovieVector3 | undefined = joints.get(middle);
        if (point !== undefined && bend !== undefined)
          limbs[limb] = { point, bend };
      }
      return {
        joints,
        shift: Vector3.subtract(
          joints.get("hips") ?? { x: 0, y: 0, z: 0 },
          key[side].bones.get("hips")?.worldPosition ?? { x: 0, y: 0, z: 0 },
        ),
        limbs,
      };
    };
    return [adapted(0), adapted(1)];
  }
}

/*
 * The alternatives of `AdaptAdaptedSide`'s site.
 */
type AdaptAdaptedSide = 0 | 1;

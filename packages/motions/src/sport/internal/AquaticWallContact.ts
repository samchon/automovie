import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportStepPlants } from "../../carrier/internal/HumanSupportStepPlants";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanHand } from "../../posture/internal/HumanHand";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AquaticPosture } from "./AquaticPosture";

/*
 * The two contacts are fitted and checked independently in the wall frame.
 */
export namespace AquaticWallContact {
  /*
   * The wall face with +Y into the pool and local X and Z along its edges.
   */
  export type Face = HumanSupportStepPlants.ISurface;

  /*
   * Bind each of the two wall effector anchors and its actual posed footprint.
   */
  export function prepare(
    context: AquaticPosture.Context,
    kind: "Hand" | "Foot",
    posture: IAutoMovieMotionHumanPosture,
    face: Face,
    centre: IAutoMovieVector3,
  ): IContactPair {
    const { body, params }: AquaticPosture.Context = context;
    const arm: boolean = kind === "Hand";
    const read: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, [
        `left${kind}`,
        `right${kind}`,
        arm ? "leftLowerArm" : "leftLowerLeg",
        arm ? "rightLowerArm" : "rightLowerLeg",
      ]);
    const posed: ReturnType<typeof read> = read(posture);
    const basis: IAutoMovieQuaternion = Quaternion.inverse(face.rotation);
    const pairs: IEffector[] = HumanHand.SIDES.map(
      (side: AutoMovieHumanSide): IEffector => {
        const bone: AutoMovieHumanoidBone = `${side}${kind}`;
        const before: IAutoMovieResolvedBone = posed.get(bone)!;
        const local = arm
          ? HumanHand.offset(body, side, "palm", "flat")
          : {
              point: HumanFoot.offset(body, side, "sole"),
              normal: { x: 0, y: -1, z: 0 },
              forward: { x: 0, y: 0, z: 1 },
            };
        const point: IAutoMovieVector3 = Vector3.add(
          before.worldPosition,
          Quaternion.rotateVector(before.worldRotation, local.point),
        );
        const relative: IAutoMovieQuaternion = Quaternion.multiply(
          basis,
          before.worldRotation,
        );
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          relative,
          local.forward,
        );
        const inWall: IAutoMovieQuaternion = HumanHand.align(local, {
          normal: { x: 0, y: -1, z: 0 },
          forward:
            Math.hypot(forward.x, forward.z) > 1e-6
              ? forward
              : { x: 0, y: 0, z: -1 },
        });
        const outline: readonly IAutoMovieVector3[] = arm
          ? [
              local.point,
              ...(
                ["thumbPad", "indexPad", "middlePad", "littlePad"] as const
              ).map(
                (site): IAutoMovieVector3 =>
                  HumanHand.offset(body, side, site, "flat").point,
              ),
            ]
          : HumanFoot.prepareSole(
              body,
              side,
            )({
              ankle: Vector3.create(0, 0, 0),
              rotation: Quaternion.identity(),
            });
        const bend: IAutoMovieVector3 = posed.get(
          arm ? `${side}LowerArm` : `${side}LowerLeg`,
        )!.worldPosition;
        return {
          side,
          bone,
          offset: local.point,
          point,
          outline,
          rotation: inWall,
          bend: Quaternion.rotateVector(
            basis,
            Vector3.subtract(bend, face.origin),
          ),
        };
      },
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(
      pairs[0]!.point,
      pairs[1]!.point,
      0.5,
    );
    const delta: IAutoMovieVector3 = Vector3.subtract(centre, middle);
    const anchor: IAutoMovieVector3[] = pairs.map(
      (effector: IEffector): IAutoMovieVector3 => {
        const aimed: IAutoMovieVector3 = HumanSupportStepPlants.local(
          face,
          Vector3.add(effector.point, delta),
        );
        const projected: IAutoMovieVector3 = { ...aimed, y: 0 };
        const wrist: IAutoMovieVector3 = Vector3.subtract(
          projected,
          Quaternion.rotateVector(effector.rotation, effector.offset),
        );
        const footprint: IAutoMovieVector3[] = effector.outline.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(
              wrist,
              Quaternion.rotateVector(effector.rotation, point),
            ),
        );
        const shift: IAutoMovieVector3 | null = HumanSupportStepPlants.fit(
          {
            origin: Vector3.create(0, 0, 0),
            rotation: Quaternion.identity(),
            width: face.width,
            depth: face.depth,
          },
          footprint,
        );
        if (shift === null) throw refusal(params.support, effector.bone);
        return Vector3.add(projected, shift);
      },
    );
    const place = (wall: Face, point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(wall.origin, Quaternion.rotateVector(wall.rotation, point));
    const wrists: IAutoMovieVector3[] = pairs.map(
      (effector: IEffector, index: number): IAutoMovieVector3 =>
        Vector3.subtract(
          anchor[index]!,
          Quaternion.rotateVector(effector.rotation, effector.offset),
        ),
    );
    const shift: IAutoMovieVector3 = Quaternion.rotateVector(basis, delta);
    const bends: IAutoMovieVector3[] = pairs.map(
      (effector: IEffector): IAutoMovieVector3 =>
        Vector3.add(effector.bend, shift),
    );
    const make = (
      at: IAutoMovieMotionHumanPosture,
      wall: Face,
    ): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...at.limbs };
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...at.joints };
      pairs.forEach((effector: IEffector, index: number): void => {
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(
          wall.rotation,
          effector.rotation,
        );
        const point: IAutoMovieVector3 = place(wall, wrists[index]!);
        const limb: AutoMovieHumanLimb = `${effector.side}${arm ? "Arm" : "Leg"}`;
        const goal: IAutoMovieHumanLimbGoal = {
          point,
          rotation,
          contact: effector.offset,
          bend: place(wall, bends[index]!),
        };
        limbs[limb] = goal;
        if (arm) Object.assign(joints, HumanHand.shape(effector.side, "flat"));
      });
      return { ...at, limbs, joints };
    };
    const verify = (at: IAutoMovieMotionHumanPosture, wall: Face): number[] => {
      const shown: ReturnType<typeof read> = read(at);
      return pairs.map((effector: IEffector, index: number): number => {
        const bone: IAutoMovieResolvedBone = shown.get(effector.bone)!;
        const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
          HumanSupportStepPlants.local(
            wall,
            Vector3.add(
              bone.worldPosition,
              Quaternion.rotateVector(bone.worldRotation, point),
            ),
          );
        const point: IAutoMovieVector3 = local(effector.offset);
        const miss: number = Vector3.distance(point, anchor[index]!);
        if (
          miss > HumanFoot.BEARING ||
          effector.outline.some((point: IAutoMovieVector3): boolean => {
            const p: IAutoMovieVector3 = local(point);
            return (
              Math.abs(p.x) > wall.width / 2 + 1e-9 ||
              Math.abs(p.z) > wall.depth / 2 + 1e-9
            );
          })
        )
          throw refusal(params.support, effector.bone, miss);
        return point.y;
      });
    };
    const center = (
      at: IAutoMovieMotionHumanPosture,
      wall: Face,
      posed: ReturnType<typeof read> = read(at),
    ): IAutoMovieMotionHumanPosture => {
      // A new sole or palm rotation changes its lever from the joint to
      // the wall. Centre the body between the newly fitted joints, while
      // the two limbs independently take the difference to their anchors.
      const shifts: IAutoMovieVector3[] = pairs.map(
        (effector: IEffector, index: number): IAutoMovieVector3 => {
          const bone: IAutoMovieResolvedBone = posed.get(effector.bone)!;
          return Vector3.subtract(
            place(wall, wrists[index]!),
            bone.worldPosition,
          );
        },
      );
      return AquaticPosture.translate(
        at,
        Vector3.add(at.root, Vector3.lerp(shifts[0]!, shifts[1]!, 0.5)),
      );
    };
    return {
      start: center(posture, face, posed),
      center,
      make,
      verify,
      anchor,
    };
  }

  /*
   * Use the displayed joints at an outgoing wall boundary to start the blend.
   */
  export function key(
    context: AquaticPosture.Context,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const shown: IAutoMoviePose = resolveHumanPosture(context.body, posture);
    return {
      ...posture,
      joints: Object.fromEntries(
        shown.joints.map((joint) => [
          joint.bone,
          [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
        ]),
      ),
      limbs: {},
    };
  }

  /*
   * Prepared anchors and exact posing from the current material frame.
   */
  export interface IContactPair {
    /*
     * Initial keyed body positioned around the pair's midpoint.
     */
    start: IAutoMovieMotionHumanPosture;
    /*
     * Put another phase key at the same authored wall depth before planting.
     */
    center(
      posture: IAutoMovieMotionHumanPosture,
      wall: Face,
    ): IAutoMovieMotionHumanPosture;
    /*
     * Hand or foot material anchors, left then right.
     */
    anchor: readonly IAutoMovieVector3[];
    /*
     * Both effectors on the wall at the current phase pose.
     */
    make(
      posture: IAutoMovieMotionHumanPosture,
      wall: Face,
    ): IAutoMovieMotionHumanPosture;
    /*
     * Check each displayed socket and the extent of its footprint.
     */
    verify(posture: IAutoMovieMotionHumanPosture, wall: Face): number[];
  }
}

/*
 * One displayed effect's fixed wall orientation and actual local footprint.
 */
interface IEffector {
  side: AutoMovieHumanSide;
  bone: AutoMovieHumanoidBone;
  offset: IAutoMovieVector3;
  point: IAutoMovieVector3;
  outline: readonly IAutoMovieVector3[];
  rotation: IAutoMovieQuaternion;
  bend: IAutoMovieVector3;
}

/*
 * Identify the specific body part that cannot make its declared contact.
 */
function refusal(
  support: string | undefined,
  part: AutoMovieHumanoidBone,
  miss?: number,
): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: "support",
    value: support,
    reason: `the displayed ${part} cannot hold its full contact on the pool wall${miss === undefined ? "" : ` (socket error ${(1000 * miss).toFixed(1)} mm)`}`,
    fix: "use a deeper or wider wall or adjust the swimmer's lane",
  });
}

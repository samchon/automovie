import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanGrasp } from "./HumanGrasp";

/*
 * Prepare one prop's handle as a grasp target at changing world frames of the
 * prop: its grip point alone, its hand frame (point, inward approach, wrapped
 * axis and width), or the complete target with the prop's colliders and grip
 * kind.
 * Parameter prop: The prop, unchanged through the plan.
 * Parameter id: The handle affordance.
 * Returns: Point, frame and complete target readers of a world prop frame.
 * An `affordance` refusal when the prop declares no such
 * handle, listing its affordances, or no colliders.
 */
export function HumanGraspTarget(
  prop: IAutoMovieMotionHumanProp,
  id: string,
): IHumanGraspTargetResult {
  const subject: string = prop.subject;
  const affordance: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (value: IAutoMovieAffordance): boolean => value.id === id,
  );
  if (affordance === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "handle",
      value: id,
      feasible: {
        kind: "alternatives",
        values: (prop.affordances ?? []).map(
          (value: IAutoMovieAffordance): string => value.id,
        ),
      },
      reason: `Prop ${subject} has no affordance ${id}; it has ${(prop.affordances ?? []).map((value: IAutoMovieAffordance): string => value.id).join(", ") || "none"}`,
      fix: "name one of the prop's affordances, or declare this one on the prop",
    });
  const shapes: readonly IAutoMoviePhysicalShape[] = prop.shapes ?? [];
  if (shapes.length === 0)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      reason: `Prop ${subject} declares no colliders; a grasp closes the fingers on them`,
      fix: "give the prop the shapes the fingers close on",
    });
  const pointAt: (frame: IAutoMovieRigidTransform) => IAutoMovieVector3 = (
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieVector3 =>
    Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    );

  // The handle's width is the prop's own: the authored aperture, or the
  // span along the approach of the collider whose centre lies nearest the
  // grip point. Both are distances in the rigid prop's own frame, which no
  // placement of the prop changes, so the width is read once there.
  const width: number =
    affordance.aperture ??
    ((): number => {
      let nearest: IAutoMoviePhysicalShape = shapes[0]!;
      let nearestDistance: number = Vector3.length(
        Vector3.subtract(
          nearest.transform.position,
          affordance.frame.translation,
        ),
      );
      for (let index: number = 1; index < shapes.length; ++index) {
        const shape: IAutoMoviePhysicalShape = shapes[index]!;
        const candidate: number = Vector3.length(
          Vector3.subtract(
            shape.transform.position,
            affordance.frame.translation,
          ),
        );
        if (candidate < nearestDistance) {
          nearest = shape;
          nearestDistance = candidate;
        }
      }
      const [low, high]: readonly [number, number] = AutoMovieEnginePhysics.physicalShapeSpan(
        {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        nearest,
        Quaternion.rotateVector(affordance.frame.rotation, {
          x: 0,
          y: -1,
          z: 0,
        }),
      );
      return high - low;
    })();
  const read: (frame: IAutoMovieRigidTransform) => HumanGrasp.IFrame = (
    frame: IAutoMovieRigidTransform,
  ): HumanGrasp.IFrame => {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      affordance.frame.rotation,
    );
    return {
      point: pointAt(frame),
      approach: Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 }),
      axis: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
      width,
    };
  };
  return {
    point: pointAt,
    frame: read,
    at: (
      frame: IAutoMovieRigidTransform,
    ): IAutoMovieMotionHumanGrasp.ITarget => ({
      ...read(frame),
      grip: affordance.grip ?? "power",
      colliders: shapes.map(
        (
          shape: IAutoMoviePhysicalShape,
        ): IAutoMovieCurlChainUntilContact.ICollider => ({ shape, frame }),
      ),
    }),
  };
}

/*
 * The record of `IHumanGraspTargetResult`'s site.
 */
type IHumanGraspTargetResult = {
  /*
   * The handle's world grip point.
   */
  point: (frame: IAutoMovieRigidTransform) => IAutoMovieVector3;

  /*
   * The handle's grip point, approach, wrapped axis and width.
   */
  frame: (frame: IAutoMovieRigidTransform) => HumanGrasp.IFrame;

  /*
   * The hand frame with the prop's colliders and the handle's grip kind
   * (`power` when it names none).
   */
  at: (frame: IAutoMovieRigidTransform) => IAutoMovieMotionHumanGrasp.ITarget;
};

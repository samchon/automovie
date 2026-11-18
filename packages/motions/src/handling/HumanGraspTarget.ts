import {
  Quaternion,
  Vector3,
  physicalShapeSpan,
} from "@automovie/engine";
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

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Prepare one prop's handle as a grasp target at changing world frames of
 * the prop: its grip point alone, its hand frame (point, inward approach,
 * wrapped axis and width), or the complete target with the prop's colliders
 * and grip kind.
 *
 * @param prop The prop, unchanged through the plan.
 * @param id The handle affordance.
 * @returns Point, frame and complete target readers of a world prop frame.
 * @throws {HumanRefusal} An `affordance` refusal when the prop declares no such handle, listing its affordances, or no colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the prop and handle scope, the world-frame input, the three outputs and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The affordance frame composed with the prop's places the grip point, the approach along its -Y and the wrapped axis along its +X (`AutoMovieAffordanceKind`); the width is the authored aperture or else the span along the approach of the collider whose centre lies nearest the grip point (`physicalShapeSpan`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One handle lookup, one point transform, the frame on it and the complete target on the frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing handle or collider list is refused; the frame reader never fabricates a collider list.
 * @evidence contracts/development/implementation.md#efficient-algorithms The handle is found and its width read once (S - 1 centre comparisons and one span without an authored aperture); each frame read is O(1); a complete target wraps S colliders.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The handle, the shapes and the width are read once for the plan, the width being a distance in the rigid prop's own frame that no placement changes; each frame computes its own point, approach and axis.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readers hold the affordance and the shape list until the plan is released.
 */
export function HumanGraspTarget(prop: IAutoMovieMotionHumanProp, id: string): {
  /** The handle's world grip point. */
  point: (frame: IAutoMovieRigidTransform) => IAutoMovieVector3;

  /** The handle's grip point, approach, wrapped axis and width. */
  frame: (frame: IAutoMovieRigidTransform) => HumanGrasp.IFrame;

  /** The hand frame with the prop's colliders and the handle's grip kind (`power` when it names none). */
  at: (frame: IAutoMovieRigidTransform) => IAutoMovieMotionHumanGrasp.ITarget;
} {
  const subject: string = prop.subject;
  const affordance: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (value: IAutoMovieAffordance): boolean => value.id === id,
  );
  if (affordance === undefined)
    throw new HumanRefusal({
      kind: "affordance", axis: "handle", value: id,
      feasible: { kind: "alternatives", values: (prop.affordances ?? []).map(
        (value: IAutoMovieAffordance): string => value.id,
      ) },
      reason: `Prop ${subject} has no affordance ${id}; it has ${(prop.affordances ?? []).map((value: IAutoMovieAffordance): string => value.id).join(", ") || "none"}`,
      fix: "name one of the prop's affordances, or declare this one on the prop",
    });
  const shapes: readonly IAutoMoviePhysicalShape[] = prop.shapes ?? [];
  if (shapes.length === 0)
    throw new HumanRefusal({
      kind: "affordance", axis: "prop", value: subject,
      reason: `Prop ${subject} declares no colliders; a grasp closes the fingers on them`,
      fix: "give the prop the shapes the fingers close on",
    });
  const pointAt: (frame: IAutoMovieRigidTransform) => IAutoMovieVector3 = (frame: IAutoMovieRigidTransform): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, affordance.frame.translation));

  // The handle's width is the prop's own: the authored aperture, or the
  // span along the approach of the collider whose centre lies nearest the
  // grip point. Both are distances in the rigid prop's own frame, which no
  // placement of the prop changes, so the width is read once there.
  const width: number = affordance.aperture ?? ((): number => {
    let nearest: IAutoMoviePhysicalShape = shapes[0]!;
    let nearestDistance: number = Vector3.length(
      Vector3.subtract(nearest.transform.position, affordance.frame.translation),
    );
    for (let index: number = 1; index < shapes.length; ++index) {
      const shape: IAutoMoviePhysicalShape = shapes[index]!;
      const candidate: number = Vector3.length(
        Vector3.subtract(shape.transform.position, affordance.frame.translation),
      );
      if (candidate < nearestDistance) {
        nearest = shape;
        nearestDistance = candidate;
      }
    }
    const [low, high]: readonly [number, number] = physicalShapeSpan(
      { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      nearest,
      Quaternion.rotateVector(affordance.frame.rotation, { x: 0, y: -1, z: 0 }),
    );
    return high - low;
  })();
  const read: (frame: IAutoMovieRigidTransform) => HumanGrasp.IFrame = (frame: IAutoMovieRigidTransform): HumanGrasp.IFrame => {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(frame.rotation, affordance.frame.rotation);
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
    at: (frame: IAutoMovieRigidTransform): IAutoMovieMotionHumanGrasp.ITarget => ({
      ...read(frame),
      grip: affordance.grip ?? "power",
      colliders: shapes.map((shape: IAutoMoviePhysicalShape): IAutoMovieCurlChainUntilContact.ICollider => ({ shape, frame })),
    }),
  };
}

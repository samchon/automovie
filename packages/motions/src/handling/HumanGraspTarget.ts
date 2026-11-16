import { Quaternion, Vector3, physicalShapeSpan, type curlChainUntilContact } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMoviePhysicalProfile, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanProp } from "../perform/IHumanProp";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Prepare one prop/handle for actual points, hand frames or complete grasp targets.
 *
 * @param prop The unchanged prop and its fixed affordances/collider geometry.
 * @param id The handle affordance.
 * @returns Point-only, hand-frame and complete target readers of actual world prop frames.
 * @throws {HumanRefusal} For the same absent handle or collider list as HumanGrasp.at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States immutable prop/handle scope, actual world-frame inputs, point/frame/complete outputs and original handle/empty-shape refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The original prop/affordance rigid composition places the grip point, inward approach and wrapped axis. An authored aperture needs no collider extent; otherwise the original nearest-centre rule and exact one-shape projected span determine width at each actual frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission/lookup precedes a shared point transform; frames add actual axes/width and the complete reader alone wraps the current world colliders required by digit closure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing handle/shapes keep their original refusals, nearest-centre strict ties and span arithmetic remain, and frame-only readers never fabricate a collider list or contact verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms Handle admission occurs once; point-only reads omit unused axes/width, authored-aperture frame reads are O(1) without collider scans, and inferred width retains exact S-1 comparisons while sharing its current winner's centre distance. Complete targets retain O(S) required collider wrappers. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller fixes the same prop, handle, affordances and shapes for its plan; every changed world frame computes its own actual target, with no target-result or time cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder borrows one unchanged affordance and shape list until its plan is released; each complete call returns fresh collider wrappers and no FK reader, prior frame or query result is retained.
 */
export function HumanGraspTarget(prop: IHumanProp, id: string): {
  /** The current world handle point alone, without unused axes or width. */
  point: (frame: IHumanProp.IFrame) => IAutoMovieVector3;
  /** The original current point, axes and exact grasp width. */
  frame: (frame: IHumanProp.IFrame) => HumanGrasp.IFrame;
  /** The original current frame with actual closure colliders and grip kind. */
  at: (frame: IHumanProp.IFrame) => HumanGrasp.ITarget;
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
  const shapes: readonly IAutoMoviePhysicalProfile.IShape[] = prop.shapes ?? [];
  if (shapes.length === 0)
    throw new HumanRefusal({
      kind: "affordance", axis: "prop", value: subject,
      reason: `Prop ${subject} declares no colliders; a grasp closes the fingers on them`,
      fix: "give the prop the shapes the fingers close on",
    });
  const pointAt: (frame: IHumanProp.IFrame) => IAutoMovieVector3 = (frame: IHumanProp.IFrame): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, affordance.frame.translation));
  const read: (frame: IHumanProp.IFrame) => HumanGrasp.IFrame = (frame: IHumanProp.IFrame): HumanGrasp.IFrame => {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(frame.rotation, affordance.frame.rotation);
    const approach: IAutoMovieVector3 = Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 });
    const point: IAutoMovieVector3 = pointAt(frame);
    let width: number | undefined = affordance.aperture;
    if (width === undefined) {
      const centre: (shape: IAutoMoviePhysicalProfile.IShape) => IAutoMovieVector3 = (shape: IAutoMoviePhysicalProfile.IShape): IAutoMovieVector3 =>
        Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, shape.transform.position));
      let nearest: IAutoMoviePhysicalProfile.IShape = shapes[0]!;
      let nearestDistance: number | undefined;
      for (let index: number = 1; index < shapes.length; ++index) {
        const shape: IAutoMoviePhysicalProfile.IShape = shapes[index]!;
        const candidate: number = Vector3.length(Vector3.subtract(centre(shape), point));
        nearestDistance ??= Vector3.length(Vector3.subtract(centre(nearest), point));
        if (candidate < nearestDistance) {
          nearest = shape;
          nearestDistance = candidate;
        }
      }
      const [low, high]: readonly [number, number] = physicalShapeSpan(frame, nearest, approach);
      width = high - low;
    }
    return { point, approach, axis: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }), width };
  };
  return {
    point: pointAt,
    frame: read,
    at: (frame: IHumanProp.IFrame): HumanGrasp.ITarget => ({
      ...read(frame),
      grip: affordance.grip ?? "power",
      colliders: shapes.map((shape: IAutoMoviePhysicalProfile.IShape): curlChainUntilContact.ICollider => ({ shape, frame })),
    }),
  };
}

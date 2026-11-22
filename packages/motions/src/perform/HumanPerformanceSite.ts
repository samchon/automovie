import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * A named point of a prop as a world frame at a film second: the prop's
 * displayed frame composed with the point's own frame on the posed prop,
 * where an act or a track has moved its parts (a pedal on a turning crank,
 * a step plate on a moving tread), its rest frame otherwise. A contact
 * planted on a moving part is held in this frame, so it rides the part, not
 * the whole prop. A point the prop names without a frame keeps the prop's
 * own rotation.
 *
 * @param self The performance.
 * @param subject The prop.
 * @param id The point's name.
 * @param seconds Film seconds.
 * @returns The point's world frame, metres.
 * @throws {HumanRefusal} When the prop or its point is unknown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame composed, when the posed part is read and the frameless case.
 * @evidence contracts/development/implementation.md#principled-implementation A part's world frame is the prop's world frame composed with the part's frame in the prop, posed at the travels the performance gives.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The prop's frame, the point's local frame, one composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown prop or point is refused, never read as the prop's origin.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One prop frame and at most one pose per read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the performance's prop frame and its posed-prop cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function HumanPerformanceSite(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
  id: string,
  seconds: number,
): IAutoMovieRigidTransform {
  const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
  if (prop === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "support",
      value: subject,
      reason: `no prop ${subject} is in the performance`,
      fix: "name a prop of the performance",
    });
  const posed: readonly IAutoMovieAffordance[] | undefined =
    prop.articulate !== undefined &&
    HumanPerformanceObject.writers(self, prop).length > 0
      ? HumanPerformanceObject.pose(self, prop, seconds).affordances
      : prop.affordances;
  const site: IAutoMovieAffordance | undefined = posed?.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  const translation: IAutoMovieVector3 | undefined =
    site?.frame.translation ?? prop.points[id]?.point;
  if (translation === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "point",
      value: id,
      reason: `the prop ${subject} names no point ${id}`,
      fix: "name one of the prop's own points",
    });
  const turn: IAutoMovieQuaternion = site?.frame.rotation ?? {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  const world: IAutoMovieRigidTransform = HumanPerformanceRead.prop(
    self,
    subject,
    seconds,
  );
  return {
    position: Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, translation),
    ),
    rotation: Quaternion.normalize(Quaternion.multiply(world.rotation, turn)),
  };
}

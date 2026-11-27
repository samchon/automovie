import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/*
 * A named point of a prop as a world frame at a film second: where the prop
 * itself places a part it moves (`IAutoMovieMotionHumanProp.point`, a pedal on
 * its crank, a stirrup on a trotting horse), its rotation the part's own or
 * else the prop's; otherwise the prop's displayed frame composed with the
 * point's own frame on the externally posed material, the driven articulation,
 * or the rest model. A contact planted on a moving part is held in that part's
 * frame. A point the prop names without a frame keeps the prop's own rotation.
 * Parameter self: The performance.
 * Parameter subject: The prop.
 * Parameter id: The point's name.
 * Parameter seconds: Film seconds.
 * Parameter frame: The action's displayed prop reader when it has a carrier view.
 * Returns: The point's world frame, metres.
 * When the prop or its point is unknown.
 */
export function HumanPerformanceSite(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
  id: string,
  seconds: number,
  frame?: (seconds: number) => IAutoMovieRigidTransform,
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
  const world: IAutoMovieRigidTransform =
    frame?.(seconds) ?? HumanPerformanceRead.prop(self, subject, seconds);
  // A part the prop itself moves (a pedal on its crank, a stirrup on a
  // trotting horse) is where the prop places it, in the world.
  const placed: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
    prop.point?.(id, seconds);
  if (placed !== undefined)
    return {
      position: placed.point,
      rotation: Quaternion.normalize(placed.rotation ?? world.rotation),
    };
  const external: IAutoMovieMotionHumanProp.IPosed | undefined =
    prop.poseAt?.(seconds);
  const posed: readonly IAutoMovieAffordance[] | undefined =
    external?.affordances ??
    (prop.articulate !== undefined &&
    HumanPerformanceObject.writers(self, prop).length > 0
      ? HumanPerformanceObject.pose(self, prop, seconds).affordances
      : prop.affordances);
  const site: IAutoMovieAffordance | undefined = posed?.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  const translation: IAutoMovieVector3 | undefined =
    site?.frame.translation ??
    (external === undefined ? prop.points[id]?.point : undefined);
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
  return {
    position: Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, translation),
    ),
    rotation: Quaternion.normalize(Quaternion.multiply(world.rotation, turn)),
  };
}

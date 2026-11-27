import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanCover,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { kick } from "../../striking/internal/kick";
import { coverWall } from "./coverWall";

/*
 * Breach a closed hinged door: a push kick with the ball of the foot at the
 * leaf's push-side handle, the latch side, and the leaf's hinge driven open
 * from the kick's impact on a minimum-jerk swing. A door archetype opens toward
 * `+Z`, the pull side, so the performer must stand on its `-Z` side; a door
 * that would open toward the performer is refused, and the kick refuses a
 * handle out of its reach.
 * Parameter context: The action's context.
 * Parameter p: The breach.
 * Returns: The kick with the hinge drive and a `doorOpen` event.
 * If the prop has no hinge or push handle, or the
 * performer stands on the side the leaf opens toward.
 */
export function coverBreach(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCover.IParams>,
  p: IAutoMovieMotionHumanCover.IBreach,
): IAutoMovieMotionHumanActionPlan {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.door);
  const find = (id: string): IAutoMovieAffordance | undefined =>
    reader.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === id,
    );
  if (reader.prop.hasArticulations !== true || find("push") === undefined)
    throw coverWall.refusal(
      "door",
      p.door,
      "the door has no hinged leaf with a push handle",
    );
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  const opens: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  if (
    Vector3.dot(
      Vector3.subtract(context.entry.posture.root, world.position),
      opens,
    ) >= 0
  )
    throw coverWall.refusal(
      "door",
      p.door,
      "the door opens toward the performer; breach it from its push side",
    );
  const params: IAutoMovieMotionHumanKick.IParams = {
    technique: "push",
    at: { kind: "prop", subject: p.door, point: "push" },
  };
  const struck: IAutoMovieMotionHumanKick.IPlan = kick.plan({
    ...context,
    params,
  });
  const impact: number =
    struck.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === "impact",
    )?.share ?? 0.5;
  const travel: number = OPEN;
  const at: number = impact * struck.duration;
  const drive: IAutoMovieMotionPropDrive = {
    prop: p.door,
    articulation: "hinge",
    from: impact,
    to: 1,
    travel: (seconds: number): number =>
      travel *
      AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(0, Math.min(1, (seconds - at) / SWING))),
  };
  return {
    ...struck,
    events: [
      ...struck.events,
      { name: "doorOpen", share: Math.min(1, (at + SWING) / struck.duration) },
    ],
    drives: [...(struck.drives ?? []), drive],
  };
}

/*
 * Seconds the leaf takes to swing open from the impact (provisional: a door
 * kicked off its latch).
 */
const SWING: number = 0.45;

/*
 * How far the leaf swings open, degrees (provisional: a door kicked wide).
 */
const OPEN: number = 90;

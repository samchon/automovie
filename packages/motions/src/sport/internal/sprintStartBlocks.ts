import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { SprintStartBlocksData } from "./SprintStartBlocksData";

/*
 * Fit the set's two foot placements to a starting block's plates.
 * Parameter context: The runner's body and entry, the action's film second and the
 * prop reader.
 * Parameter subject: The starting block's scene id.
 * Parameter preferred: The authored front foot, when named.
 * Returns: The runner's front side and both feet seated on their plates.
 * For a missing plate, a plate that does not face
 * forward and up the lane, plates not staggered across and along the lane, or
 * an authored front foot on the other side.
 */
export function sprintStartBlocks(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  subject: string,
  preferred: AutoMovieHumanSide | undefined,
): sprintStartBlocks.IPlaced {
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const placed: IAutoMovieRigidTransform = read.frame(context.start);
  const refuse = (reason: string): never => {
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "on",
      value: subject,
      reason,
      fix: "place a starting block with its front and rear pedals facing up the runner's lane",
    });
  };
  const ahead: IAutoMovieVector3 = HumanFrame.forward(
    context.entry.posture.yaw,
  );
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.cross({ x: 0, y: 1, z: 0 }, ahead);
  const plate = (id: OfPlateId): IPlate => {
    const affordance = read.prop.affordances?.find(
      (item): boolean => item.id === id,
    );
    if (affordance?.kind !== "pedal")
      return refuse(`the block needs a pedal affordance named ${id}`);
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      placed.rotation,
      affordance.frame.rotation,
    );
    const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });

    // The sole presses a face that leans back toward the runner: its
    // normal points up and forward, with little component across.
    const forward: number = AutoMovieEngineVector3.dot(up, ahead);
    if (
      !(
        up.y > 0 &&
        forward > 0 &&
        Math.abs(AutoMovieEngineVector3.dot(up, across)) < forward * SprintStartBlocksData.ACROSS
      )
    )
      return refuse(`the ${id} plate must face forward and upward in the lane`);
    // The face's lower edge: half its depth down the face from its
    // centre, along the frame's Z turned to point down the slope.
    const slope: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const down: IAutoMovieVector3 =
      slope.y < 0 ? slope : AutoMovieEngineVector3.scale(slope, -1);
    return {
      point: AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.add(
          placed.position,
          AutoMovieEngineQuaternion.rotateVector(
            placed.rotation,
            affordance.frame.translation,
          ),
        ),
        AutoMovieEngineVector3.scale(down, (affordance.depth ?? 0) / 2),
      ),
      yaw: (Math.atan2(up.x, up.z) * 180) / Math.PI,
      pitch: (-Math.atan2(Math.hypot(up.x, up.z), up.y) * 180) / Math.PI,
    };
  };
  const plates: Record<OfPlatesEntry, IPlate> = {
    front: plate("front"),
    rear: plate("rear"),
  };

  // The front plate sits ahead of the rear one and to one side of the
  // rail; that side is the front foot's.
  const between: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    plates.front.point,
    plates.rear.point,
  );
  const lateral: number = AutoMovieEngineVector3.dot(between, across);
  if (!(AutoMovieEngineVector3.dot(between, ahead) > 0 && Math.abs(lateral) > 1e-6))
    return refuse(
      "the front plate must sit ahead of the rear plate on the other side of the rail",
    );
  const front: AutoMovieHumanSide = lateral > 0 ? "left" : "right";
  if (preferred !== undefined && preferred !== front)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "front",
      value: preferred,
      reason: `the placed front plate is on the runner's ${front}`,
      feasible: { kind: "alternatives", values: [front] },
      fix: `set front to ${front} for this block placement`,
    });
  const foot = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const on: IPlate = side === front ? plates.front : plates.rear;
    return HumanFoot.pivot(
      context.body,
      side,
      "ball",
      on.point,
      on.yaw,
      on.pitch,
    );
  };
  return { front, feet: { left: foot("left"), right: foot("right") } };
}

/*
 * The sprint start's foot placements on its blocks: a placed starting block's
 * two plates, which the athletics law reads in place of the body-scaled setting
 * when the take names a block, and the body-scaled setting's own foot in its
 * block (`scaled`).
 */
export namespace sprintStartBlocks {
  /*
   * The runner's sides on a placed block.
   */
  export interface IPlaced {
    /*
     * The foot on the front plate, decided by which side of the lane the front
     * plate sits.
     */
    front: AutoMovieHumanSide;

    /*
     * Each foot's world placement: the ball at the middle of its plate's lower
     * edge and the sole on the face.
     */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;
  }

  /*
   * A foot in a body-scaled block: the ball on the floor `behind` metres behind
   * the start line (the entry's foot length ahead of its stand, where the hands
   * lie), the sole turned up onto a face `face` degrees from the floor.
   * Parameter body: The body.
   * Parameter entry: The standing posture, whose heading the foot takes.
   * Parameter frame: The set's frame (`sprintStartSetHands.frame`).
   * Parameter side: The foot.
   * Parameter behind: Metres behind the start line.
   * Parameter face: The block face's angle from the floor, degrees.
   * Returns: The foot's placement.
   */
  export function scaled(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    frame: IAutoMovieMotionHumanFrame,
    side: AutoMovieHumanSide,
    behind: number,
    face: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return HumanFoot.pivot(
      body,
      side,
      "ball",
      HumanFrame.point(frame, {
        x: body.rest.get(`${side}UpperLeg`)!.x,
        y: 0,
        z: body.measure.footLength - behind,
      }),
      entry.yaw,
      -face,
    );
  }
}

/*
 * The alternatives of `OfPlatesEntry`'s site.
 */
type OfPlatesEntry = "front" | "rear";

/*
 * The alternatives of `OfPlateId`'s site.
 */
type OfPlateId = "front" | "rear";

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry" | "prop" | "start";

/*
 * One plate face in world space.
 */
interface IPlate {
  /*
   * The middle of the face's lower edge, where the ball of the foot rests with
   * the toes on the track, world metres.
   */
  point: IAutoMovieVector3;

  /*
   * The heading of the face normal's horizontal part, degrees about +Y.
   */
  yaw: number;

  /*
   * The sole's pitch that lays it on the face, degrees, positive toes up: a
   * face leaning back gives a negative pitch, the heel higher than the toes.
   */
  pitch: number;
}

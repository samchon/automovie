import { Quaternion, Vector3 } from "@automovie/engine";
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

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The sprint start's foot placements on its blocks: a placed starting
 * block's two plates, which the athletics law reads in place of the
 * body-scaled setting when the take names a block, and the body-scaled
 * setting's own foot in its block (`scaled`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the module reads, which consumer takes its result and when.
 * @evidence contracts/development/design.md#principled-representation World metres and degrees in the runner's entry frame; a side and two rigid sole placements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The athletics plan reads the front side and both placements; sprintStartSet reads the body-scaled foot; the plate reading stays private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No block dimension is assumed: every point and angle comes from the placed prop's own affordances.
 */
export namespace sprintStartBlocks {
  /**
   * The runner's sides on a placed block.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members and their frame.
   * @evidence contracts/development/design.md#principled-representation A side and two world-frame foot placements whose soles lie on the plate faces.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values `athletics.plan` passes on to `sprintStartSet.of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both feet are always present; a block without both plates is refused before this record exists.
   */
  export interface IPlaced {
    /** The foot on the front plate, decided by which side of the lane the front plate sits. */
    front: AutoMovieHumanSide;

    /** Each foot's world placement: the ball at the middle of its plate's lower edge and the sole on the face. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;
  }

  /**
   * One plate face in world space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and frame.
   * @evidence contracts/development/design.md#principled-representation The face centre in world metres and the sole's heading and pitch in degrees, as HumanFoot.pivot takes them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values one sole placement reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No roll: a plate tilted across the lane is refused.
   */
  interface IPlate {
    /** The middle of the face's lower edge, where the ball of the foot rests with the toes on the track, world metres. */
    point: IAutoMovieVector3;

    /** The heading of the face normal's horizontal part, degrees about +Y. */
    yaw: number;

    /** The sole's pitch that lays it on the face, degrees, positive toes up: a face leaning back gives a negative pitch, the heel higher than the toes. */
    pitch: number;
  }

  /**
   * The largest share of a plate normal's forward component allowed across the lane: about 11 degrees of yaw, the lateral play an athlete accepts before the sole slides on the face (provisional).
   */
  const ACROSS: number = 0.2;

  /**
   * Fit the set's two foot placements to a starting block's plates.
   *
   * @param context The runner's body and entry, the action's film second and the prop reader.
   * @param subject The starting block's scene id.
   * @param preferred The authored front foot, when named.
   * @returns The runner's front side and both feet seated on their plates.
   * @throws {HumanRefusal} For a missing plate, a plate that does not face forward and up the lane, plates not staggered across and along the lane, or an authored front foot on the other side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the scene transform, optional side, returned contacts and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Composes each pedal's placed frame, takes its +Y as the face normal, and seats the ball of the foot at the middle of the face's lower edge, the sole on the face at the normal's heading and pitch, the toes on the track as a crouch start sets them. The front plate's side of the lane decides the front foot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read both plates, order them in the runner's frame, then place each sole.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing, sideways or reversed plates and a contrary front side are refused before the set fit; the set fit still owns reach and joint ranges.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two affordance lookups, two rigid transforms and two foot placements per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the prop's frame once and delegates each rigid sole placement to HumanFoot.pivot.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the two numeric placements it returns.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "body" | "entry" | "prop" | "start"
    >,
    subject: string,
    preferred: AutoMovieHumanSide | undefined,
  ): IPlaced {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const refuse = (reason: string): never => {
      throw new HumanRefusal({
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
    const across: IAutoMovieVector3 = Vector3.cross(
      { x: 0, y: 1, z: 0 },
      ahead,
    );
    const plate = (id: "front" | "rear"): IPlate => {
      const affordance = read.prop.affordances?.find(
        (item): boolean => item.id === id,
      );
      if (affordance?.kind !== "pedal")
        return refuse(`the block needs a pedal affordance named ${id}`);
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        placed.rotation,
        affordance.frame.rotation,
      );
      const up: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: 1,
        z: 0,
      });

      // The sole presses a face that leans back toward the runner: its
      // normal points up and forward, with little component across.
      const forward: number = Vector3.dot(up, ahead);
      if (
        !(
          up.y > 0 &&
          forward > 0 &&
          Math.abs(Vector3.dot(up, across)) < forward * ACROSS
        )
      )
        return refuse(
          `the ${id} plate must face forward and upward in the lane`,
        );
      // The face's lower edge: half its depth down the face from its
      // centre, along the frame's Z turned to point down the slope.
      const slope: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: 0,
        z: 1,
      });
      const down: IAutoMovieVector3 =
        slope.y < 0 ? slope : Vector3.scale(slope, -1);
      return {
        point: Vector3.add(
          Vector3.add(
            placed.position,
            Quaternion.rotateVector(
              placed.rotation,
              affordance.frame.translation,
            ),
          ),
          Vector3.scale(down, (affordance.depth ?? 0) / 2),
        ),
        yaw: (Math.atan2(up.x, up.z) * 180) / Math.PI,
        pitch: (-Math.atan2(Math.hypot(up.x, up.z), up.y) * 180) / Math.PI,
      };
    };
    const plates: Record<"front" | "rear", IPlate> = {
      front: plate("front"),
      rear: plate("rear"),
    };

    // The front plate sits ahead of the rear one and to one side of the
    // rail; that side is the front foot's.
    const between: IAutoMovieVector3 = Vector3.subtract(
      plates.front.point,
      plates.rear.point,
    );
    const lateral: number = Vector3.dot(between, across);
    if (!(Vector3.dot(between, ahead) > 0 && Math.abs(lateral) > 1e-6))
      return refuse(
        "the front plate must sit ahead of the rear plate on the other side of the rail",
      );
    const front: AutoMovieHumanSide = lateral > 0 ? "left" : "right";
    if (preferred !== undefined && preferred !== front)
      throw new HumanRefusal({
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

  /**
   * A foot in a body-scaled block: the ball on the floor `behind` metres behind the start line (the entry's foot length ahead of its stand, where the hands lie), the sole turned up onto a face `face` degrees from the floor.
   *
   * @param body The body.
   * @param entry The standing posture, whose heading the foot takes.
   * @param frame The set's frame (`sprintStartSetHands.frame`).
   * @param side The foot.
   * @param behind Metres behind the start line.
   * @param face The block face's angle from the floor, degrees.
   * @returns The foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the placement, its frame and units.
   * @evidence contracts/development/implementation.md#principled-implementation The ball pivot on the floor under the hip's lateral offset, pitched by the face angle (`HumanFoot.pivot`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame point and one pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each foot is placed once per set solve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh placement.
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

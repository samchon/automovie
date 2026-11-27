import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanAuditModel } from "../../posture/HumanAuditModel";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanHand } from "../../posture/HumanHand";
import { StrikingBody } from "../../striking/StrikingBody";
import { touchHoldRests } from "../../touch/internal/touchHoldRests";

/**
 * How far off the partner's skin the palm rests, metres (provisional: a skin
 * contact, as `lieTogether`'s `REST`).
 */
const REST: number = 0.005;

/**
 * The spooning body's free arm draped over its partner. The arm a spooning body
 * does not lie on otherwise hangs from its upper shoulder into the partner it
 * lies behind (its fingers met the partner's forearm 22 mm deep); here it is
 * laid, as an embrace's arms are (`embraceFromBehind`), as a declared rest: the
 * palm flat on the partner's upper arm on the side away from the floor, found
 * on the partner's own colliders by a ray in along the region's normal, the
 * fingers toward the partner's front, over the flank. The goal carries the
 * partner's every segment the audit reads (`HumanAuditModel.segments`), the
 * upper arm's segment and its reachable neighbours as the ones the palm lies on
 * (`touchHoldRests`), the rest as ones the arm keeps clear of, and the arm is
 * planned as one admitted course from its entry angles onto the rest
 * (`courseArmGoal`), never fitted afresh each second.
 */
export namespace lieTogetherDrape {
  /** The free arm's rest on the partner. */
  export interface IDrape {
    /** The draping arm. */
    side: AutoMovieHumanSide;

    /** The arm's limb. */
    limb: courseArmGoal.Limb;

    /** The arm's hand part, as a contact names it. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** The hand's palm region. */
    palm: AutoMovieHumanoidRegion;

    /** The partner's region the palm rests on. */
    region: AutoMovieHumanoidRegion;

    /**
     * The arm's goal at the plan's start, world metres, with its rests and
     * obstacles.
     */
    goal: IAutoMovieHumanLimbGoal;

    /** The flat hand's finger joints the palm is placed with, clinical degrees. */
    fingers: IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * A posture with the rest's goal and its hand flattened at a share: the
   * fingers laid flat as the arm reaches, so the hand lies on the partner as
   * the goal places it (a relaxed hand's curled fingers sank 24 mm into the
   * partner's arm).
   *
   * @param posture The lying posture.
   * @param drape The rest.
   * @param k The share of the settle.
   * @returns The posture with the goal and the blended fingers.
   */
  export function write(
    posture: IAutoMovieMotionHumanPosture,
    drape: IDrape,
    k: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const bone of Object.keys(drape.fingers) as AutoMovieHumanoidBone[]) {
      const from: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      const to: readonly [number, number, number] = drape.fingers[bone]!;
      joints[bone] = [
        from[0] + (to[0] - from[0]) * k,
        from[1] + (to[1] - from[1]) * k,
        from[2] + (to[2] - from[2]) * k,
      ];
    }
    return {
      ...posture,
      joints,
      limbs: { ...posture.limbs, [drape.limb]: drape.goal },
    };
  }

  /**
   * The free arm's rest on a partner lying on the same side.
   *
   * @param body The spooning body.
   * @param settled The body settled against the partner, its arm free.
   * @param side The free arm, the one away from the floor.
   * @param partner The partner's body.
   * @param bones The partner's bones at the plan's start.
   * @returns The rest.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    settled: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    partner: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IDrape {
    const region = (
      name: AutoMovieHumanoidRegion,
    ): IAutoMovieMotionHumanStrikingBody.IRegionResult =>
      StrikingBody.region(partner, bones, name);
    // The partner's upper arm away from the floor.
    const top: AutoMovieHumanoidRegion =
      region("upperArmLeft").point.y >= region("upperArmRight").point.y
        ? "upperArmLeft"
        : "upperArmRight";
    const on: IAutoMovieMotionHumanStrikingBody.IRegionResult = region(top);
    const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
      HumanColliders.cast(
        partner,
        bones,
        Vector3.addScaled(on.point, on.normal, partner.measure.chestDepth),
        Vector3.scale(on.normal, -1),
        2 * partner.measure.chestDepth,
      );
    const normal: IAutoMovieVector3 = hit?.normal ?? on.normal;
    // The fingers toward the partner's front, in the palm's plane.
    const front: IAutoMovieVector3 = region("sternum").normal;
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled(front, normal, -Vector3.dot(front, normal)),
    );
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.preparePlaced(
        partner,
        HumanAuditModel.segments(partner),
      )(bones);
    const lies: (segment: IAutoMovieMotionHumanColliders.IPlaced) => boolean =
      touchHoldRests(partner, top, body.measure.hand)(bones);
    const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArmTarget.goal(
      body,
      side,
      {
        surface: "palm",
        shape: "flat",
        point: Vector3.addScaled(hit?.point ?? on.point, normal, REST),
        rotation: HumanHand.align(
          HumanHand.offset(body, side, "palm", "flat"),
          {
            normal: Vector3.scale(normal, -1),
            forward,
          },
        ),
        bend: AutoMovieMotionHumanBend.hang(body, settled, side, 0.2),
      },
    );
    return {
      side,
      limb: `${side}Arm`,
      part: side === "left" ? "leftHand" : "rightHand",
      palm: side === "left" ? "palmLeft" : "palmRight",
      region: top,
      fingers: HumanHand.shape(side, "flat"),
      goal: {
        ...goal,
        clear: placed.filter(
          (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
            !lies(segment),
        ),
        rests: placed.filter(lies),
      },
    };
  }

  /** The course's members beside the plan. */
  export interface ICourse {
    /**
     * The spooning body and the pose it lies down from, whose arm the course
     * leaves from (courseArmGoal.IContext).
     */
    context: courseArmGoal.IContext;

    /** The lying plan, whose posture writes the rest's goal throughout. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The rest. */
    drape: IDrape;

    /** When the body has settled, seconds: the arm is on the partner by then. */
    settle: number;

    /** The partner's name. */
    partner: string;
  }

  /**
   * The lying plan with the free arm laid onto its rest as one course, the hand
   * bearing on the partner from the settle.
   *
   * @param props The plan, the rest and the course's span.
   * @returns The coursed plan.
   */
  export function course(props: ICourse): IAutoMovieMotionHumanActionPlan {
    const duration: number = props.plan.duration;
    const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
      context: props.context,
      plan: props.plan,
      side: props.drape.side,
      span: {
        start: 0,
        ready: props.settle,
        relax: duration,
        end: duration,
      },
    });
    return {
      ...coursed,
      contacts: [
        ...coursed.contacts,
        {
          part: props.drape.part,
          kind: "bear",
          region: props.drape.palm,
          from: props.settle / duration,
          to: 1,
          support: {
            kind: "person",
            subject: props.partner,
            region: props.drape.region,
          },
        },
      ],
    };
  }
}

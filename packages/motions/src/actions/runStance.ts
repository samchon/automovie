import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import { walkStepFoot } from "./walkStepFoot";

/**
 * The stance of a gait with a flight, as the spring-mass model of running
 * has it (Blickhan 1989, J Biomech 22:1217; McMahon and Cheng 1990, J
 * Biomech 23 Suppl 1:65): the leg lands nearly straight, compresses to
 * mid-stance, where the centre of mass is lowest, and extends again to
 * leave as it landed, the leg's length from the hip to the contact the same
 * at both ends. The knee is flexed about 20 degrees at contact and at
 * toe-off and about 45 at mid-stance (Novacheck 1998, Gait Posture 7:77;
 * the values provisional inside the reported curves).
 *
 * In a cruising step the pelvis then stands, at contact, at the height where
 * the hip reaches the foot with the contact knee, the foot struck on its heel
 * or, with its heel held up, on its ball, and at mid-stance at the height
 * where it stands over the middle of the contact with the mid-stance knee,
 * the heel risen as far as the ankle's dorsal room asks (`walkLeg.heelRise`);
 * the pelvis's oscillation, lowest at mid-stance and one period long, runs
 * through both. The foot leaves at the pitch about its ball that sets the
 * ankle at the contact knee's reach from the hip at that height, no steeper
 * than a walk's push and no shallower than its held heel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the model, its sources and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The oscillation and the push as the stepping plan reads them, derived from the leg's lengths, the foot's points and the cruising step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance's plan, read by the stepping plan, and a foot's claim in flight, read by the walk's settling, both for a gait with a flight only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every height follows from the body's legs and feet; no height is typed.
 */
export namespace runStance {
  /** The knee's flexion at contact and at toe-off, degrees (provisional, Novacheck 1998). */
  export const CONTACT: number = 20;

  /** The knee's flexion at mid-stance, degrees (provisional, Novacheck 1998: about 40 to 45). */
  export const MIDDLE: number = 45;

  /** A cruising stance's oscillation and push. */
  export interface IStance {
    /** The pelvis's oscillation about standing, hip heights: its mean and its amplitude, lowest at mid-stance. */
    bob: { mean: number; amplitude: number };

    /** The toe-off pitch, degrees toes-down. */
    push: number;
  }

  /**
   * A cruising stance of a gait with a flight.
   *
   * @param body The body.
   * @param props The cruising step in metres, the swing in step periods,
   *   how far ahead of the pelvis the landing ankle lies in steps, how far
   *   ahead of the ankle the middle of the contact lies in metres, and how
   *   far the heel is held up through stance, degrees (0 for a heel strike).
   * @returns The oscillation and the push.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The leg's length at a knee flexion is the law of cosines over the thigh and the shank; the heights are that length over the horizontal reach; the push is found by bisection on the ankle's distance from the hip, which falls as the heel rises about the ball.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two heights, one cosine fit and two bisections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stance whose landing would leave the hip no higher than at mid-stance is given no oscillation rather than one rising at mid-stance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twice forty halvings, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the foot's points from `HumanFoot.offset`, the strike pitch from `walkFoot.STRIKE` and the heel's rise from `walkLeg.heelRise`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function plan(
    body: IHumanBody,
    props: {
      stride: number;
      share: number;
      front: number;
      lead: number;
      heels: number;
    },
  ): IStance {
    const hip: IAutoMovieVector3 = body.rest.get("leftUpperLeg")!;
    const knee: IAutoMovieVector3 = body.rest.get("leftLowerLeg")!;
    const ankle: IAutoMovieVector3 = body.rest.get("leftFoot")!;
    const thigh: number = distance(hip, knee);
    const shank: number = distance(knee, ankle);
    const leg = (flexion: number): number =>
      Math.sqrt(
        thigh * thigh +
          shank * shank +
          2 * thigh * shank * Math.cos((flexion * Math.PI) / 180),
      );
    const heel: IAutoMovieVector3 = HumanFoot.offset(body, "left", "heel");
    const mtp: IAutoMovieVector3 = HumanFoot.offset(body, "left", "mtp");

    // The ankle about a point fixed on the floor, the foot pitched toes-up by
    // `degrees`: its height over the floor and how far ahead of the point.
    const about = (
      point: IAutoMovieVector3,
      degrees: number,
    ): { z: number; y: number } => {
      const r: number = (degrees * Math.PI) / 180;
      const z: number = -point.z;
      const y: number = -point.y;
      return {
        z: z * Math.cos(r) - y * Math.sin(r),
        y: point.y - heel.y + (z * Math.sin(r) + y * Math.cos(r)),
      };
    };
    const above: number = -heel.y;

    // Contact: the ankle `front` steps ahead of the pelvis when flat, struck
    // on the heel, or on the ball with the heel held up `heels` degrees.
    const struck: { z: number; y: number } =
      props.heels > 0 ? about(mtp, -props.heels) : about(heel, walkFoot.STRIKE);
    const ahead: number =
      props.front * props.stride +
      (props.heels > 0 ? mtp.z : heel.z) +
      struck.z;
    const contact: number = leg(CONTACT);
    const landing: number =
      struck.y + Math.sqrt(Math.max(0, contact * contact - ahead * ahead));
    // Mid-stance: the hip over the middle of the contact, the foot on its
    // footprint with its heel risen as far as the ankle's dorsal room asks
    // (`walkLeg.heelRise`), at the height that bends the knee `MIDDLE`.
    const bent = (height: number): number => {
      const at: IAutoMovieVector3 = { x: hip.x, y: height, z: ankle.z };
      const flat: IAutoMovieVector3 = {
        x: ankle.x,
        y: above,
        z: ankle.z - props.lead,
      };
      const ball: IAutoMovieVector3 = Vector3.add(flat, mtp);
      const pitch: number = walkLeg.heelRise(
        body,
        "left",
        at,
        ball,
        0,
        -props.heels,
        walkLeg.ROCKER,
      );
      const d: number = distance(
        at,
        HumanFoot.pivot(body, "left", "mtp", ball, 0, pitch).ankle,
      );
      return (
        (Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              (d * d - thigh * thigh - shank * shank) / (2 * thigh * shank),
            ),
          ),
        ) *
          180) /
        Math.PI
      );
    };
    let deep: number = above + leg(120);
    let tall: number = above + thigh + shank;
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (deep + tall) / 2;
      if (bent(mid) > MIDDLE) deep = mid;
      else tall = mid;
    }
    const middle: number = (deep + tall) / 2;

    // A cosine lowest at mid-stance, one period long: the stance's ends lie
    // `1 - share / 2` periods either side of its middle.
    const end: number = -Math.cos(Math.PI * props.share);
    const amplitude: number = Math.max(0, (landing - middle) / (1 + end));
    const mean: number = middle + amplitude - hip.y;

    // Toe-off: the pelvis as high as at the landing, the ankle trailing by the
    // stance after the pelvis passed it, the heel raised about the ball.
    const trail: number = (2 - props.share - props.front) * props.stride;
    const reach = (push: number): number => {
      const at: { z: number; y: number } = about(mtp, -push);
      const z: number = -trail + mtp.z + at.z;
      const y: number = landing - at.y;
      return Math.hypot(z, y);
    };
    let low: number = props.heels;
    let high: number = Math.max(props.heels, walkStepFoot.PUSH);
    if (reach(high) >= contact) low = high;
    else if (reach(low) > contact)
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (low + high) / 2;
        if (reach(mid) > contact) low = mid;
        else high = mid;
      }
    const l: number = body.measure.hipHeight;
    return {
      bob: { mean: mean / l, amplitude: amplitude / l },
      push: low,
    };
  }

  /**
   * What a foot in flight claims of the pelvis: it bears nothing, so it asks
   * no lowering of its own, only what its stance claimed as it left and what
   * its next stance claims as it lands, passed from one to the other on a
   * minimum-jerk weight (Flash and Hogan 1985), so the pelvis is continuous
   * with its rate through both contact events.
   *
   * @param ends The lowering the leg claims at its toe-off and at its heel strike, metres.
   * @param u The share of the swing.
   * @returns The claim, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why a foot in the air claims only its ends and how they join.
   * @evidence contracts/development/implementation.md#principled-implementation A swinging foot's own reach is held by the swing's clamp; the pelvis answers only to the stances.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One blend.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is skipped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function airborne(ends: readonly [number, number], u: number): number {
    const s: number = minimumJerk(Math.min(1, Math.max(0, u))).s;
    return ends[0] + (ends[1] - ends[0]) * s;
  }

  /** The distance between two points, metres. */
  function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}

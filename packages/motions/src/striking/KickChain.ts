import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickCarriage } from "./KickCarriage";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingReach } from "./StrikingReach";

/**
 * The kicking leg at contact: the two-segment solve ({@link StrikingReach})
 * that puts the round kick's lower shin or the push kick's ball of the foot
 * on the planned point from the hip the carriage leaves it, and the engine's
 * limb fit of that solve, read back from the fitted bones. What the leg
 * reaches is the fit's answer, so the planner and the displayed figure
 * cannot disagree: a point the hip's range of motion cannot bring the weapon
 * to is measured as a miss here, where the kick can still choose another
 * carriage.
 *
 * The solve places the knee freely, and the hip's range of motion may not
 * hold it there: the fit then puts the knee where the hip allows and the
 * weapon lands off the planned point. So the fit is repeated from its own
 * answer ({@link fit}) until the weapon of the fitted leg is on the point.
 */
export namespace KickChain {
  /**
   * How many times a fit is repeated from its own answer. Each round moves
   * the ankle's goal by the weapon's remaining error, which shrinks
   * geometrically when the leg can reach the point; provisional, chosen so a
   * first error of a tenth of a metre halving each round ends under the
   * contact tolerance ({@link KickForm.TOLERANCE}).
   */
  const REFITS: number = 8;

  /** What a contact solve reads. */
  export interface IProps {
    /** The kicking body. */
    body: IHumanBody;

    /** The kicking side. */
    side: "left" | "right";

    /** The technique. */
    technique: "round" | "push";

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** The weapon's unit travel at contact. */
    direction: IAutoMovieVector3;

    /** The planned contact point on the target's surface, world metres. */
    planned: IAutoMovieVector3;
  }

  /** The fitted leg at contact. */
  export interface IFit {
    /** The whole fitted pose. */
    pose: IAutoMoviePose;

    /** The fitted knee joint, world metres. */
    knee: IAutoMovieVector3;

    /** The fitted ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The fitted foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** The fitted knee's flexion, degrees. */
    flexion: number;

    /** Where the weapon's surface is on the fitted leg, world metres. */
    reached: IAutoMovieVector3;

    /** How far the support foot's ball is from its plant, metres. */
    slip: number;

    /** How far the reached weapon is from the planned point, metres. */
    residual: number;

    /**
     * Whether the fitted leg's weapon is on the planned point: `short` when
     * it is not, `jammed` when it is with the knee folded past the
     * technique's most flexion, `reached` otherwise.
     */
    status: StrikingReach.ISolution["status"];
  }

  /**
   * The push kick's foot rotation: the sole facing the target with the toes
   * up.
   *
   * @param line The horizontal unit line toward the target.
   * @returns The foot's world rotation from its rest.
   */
  export function sole(line: IAutoMovieVector3): IAutoMovieQuaternion {
    return StrikingBody.foot({ x: 0, y: 1, z: 0 }, Vector3.scale(line, -1));
  }

  /**
   * Solve the leg at contact from the hip a carriage leaves it.
   *
   * @param props The kick's body, side, technique, line, travel and planned point.
   * @param base The body's posture at contact.
   * @returns The solve: the knee, the ankle, the knee's flexion and whether the point is reached, jammed or short.
   */
  export function solve(
    props: IProps,
    base: IHumanPosture,
  ): StrikingReach.ISolution {
    const m: IHumanBody["measure"] = props.body.measure;
    const round: boolean = props.technique === "round";

    // The round kick lands the shin's surface, so its axis point lies one
    // shank radius behind the planned point; the push kick lands the ball of
    // the foot, so its ankle lies behind the planned point by the ball's
    // offset under the sole-forward rotation.
    const point: IAutoMovieVector3 = round
      ? Vector3.subtract(
          props.planned,
          Vector3.scale(props.direction, m.shankRadius),
        )
      : Vector3.subtract(props.planned, ball(props));
    return StrikingReach.chain({
      root: KickCarriage.hip(props.body, base, props.side),
      point,
      upper: m.thigh,
      along: round ? KickForm.SHIN_SHARE * m.shank : m.shank,
      lower: m.shank,
      bend: bend(props),
      flexion: KickForm.FLEXION[props.technique],
      slide: round,
    });
  }

  /**
   * Fit a solve with the engine's limb fit and read the leg back, repeating
   * the fit from its own answer.
   *
   * The first fit asks for the solve's ankle with the solve's knee as the
   * bend hint. Each later fit moves the ankle's goal by how far the fitted
   * leg's weapon is from the planned point, hints the knee where the last
   * fit put it, and (for the round kick) points the foot along the last
   * fitted shank, so the asked leg is one the hip already held. The fit
   * whose weapon comes nearest is the answer.
   *
   * @param props The kick's body, side, technique, line, travel and planned point.
   * @param base The body's posture at contact, its support leg planted.
   * @param solved The solve.
   * @returns The fitted leg, with how far it is from the support plant and from the planned point.
   */
  export function fit(
    props: IProps,
    base: IHumanPosture,
    solved: StrikingReach.ISolution,
  ): IFit {
    const { body, side } = props;
    const round: boolean = props.technique === "round";

    // A round kick's foot is pointed along the shank with the instep facing
    // the travel, so the instep and the lower shin present one surface.
    const pointed = (
      knee: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ): IAutoMovieQuaternion =>
      round
        ? StrikingBody.foot(
            Vector3.normalize(Vector3.subtract(ankle, knee)),
            props.direction,
          )
        : sole(props.line);
    let goal: IAutoMovieVector3 = solved.end;
    let hint: IAutoMovieVector3 = StrikingReach.hint(
      KickCarriage.hip(body, base, side),
      solved,
      bend(props),
      KickForm.HINT_SHARE * body.measure.thigh,
    );
    let asked: IAutoMovieQuaternion = pointed(solved.middle, solved.end);
    let best: IFit = read(props, base, solved, { goal, hint, asked });
    let last: IFit = best;
    for (let i: number = 1; i < REFITS && last.residual > 1e-6; i++) {
      goal = Vector3.add(goal, Vector3.subtract(props.planned, last.reached));
      hint = last.knee;
      asked = pointed(last.knee, last.ankle);
      last = read(props, base, solved, { goal, hint, asked });
      if (last.residual < best.residual) best = last;
    }
    return best;
  }

  /** What one fit asks the leg for. */
  interface IAsked {
    /** The ankle's goal, world metres. */
    goal: IAutoMovieVector3;

    /** The knee's bend hint, world metres. */
    hint: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    asked: IAutoMovieQuaternion;
  }

  /** Fit the leg once and read the fitted bones back. */
  function read(
    props: IProps,
    base: IHumanPosture,
    solved: StrikingReach.ISolution,
    ask: IAsked,
  ): IFit {
    const { body, side } = props;
    const m: IHumanBody["measure"] = body.measure;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...base,
      limbs: {
        ...base.limbs,
        [`${side}Leg`]: {
          point: ask.goal,
          bend: ask.hint,
          rotation: ask.asked,
        },
      },
    });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, pose);
    const knee: IAutoMovieVector3 = bones.get(
      `${side}LowerLeg` as AutoMovieHumanoidBone,
    )!.worldPosition;
    const foot: IAutoMovieResolvedBone = bones.get(
      `${side}Foot` as AutoMovieHumanoidBone,
    )!;
    const reached: IAutoMovieVector3 =
      props.technique === "round"
        ? Vector3.add(
            Vector3.lerp(knee, foot.worldPosition, solved.along / m.shank),
            Vector3.scale(props.direction, m.shankRadius),
          )
        : Vector3.add(
            foot.worldPosition,
            StrikingBody.socket(
              body,
              side === "left" ? "ballLeft" : "ballRight",
              foot.worldRotation,
            ),
          );
    const residual: number = Vector3.length(
      Vector3.subtract(reached, props.planned),
    );
    return {
      pose,
      knee,
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
      flexion:
        pose.joints.find((j): boolean => j.bone === `${side}LowerLeg`)
          ?.flexion ?? 0,
      reached,
      slip: slip(body, support, base, bones),
      residual,
      status:
        residual > KickForm.RESIDUAL
          ? "short"
          : solved.status === "jammed"
            ? "jammed"
            : "reached",
    };
  }

  /** The knee's bend direction: ahead of the travel and above it for the round kick, up and forward for the push kick. */
  function bend(props: IProps): IAutoMovieVector3 {
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    return props.technique === "round"
      ? Vector3.add(props.direction, Vector3.scale(up, KickForm.BEND_RISE))
      : Vector3.add(up, props.line);
  }

  /** The ball of the kicking foot from its ankle under the push kick's rotation, world metres. */
  function ball(props: IProps): IAutoMovieVector3 {
    return StrikingBody.socket(
      props.body,
      props.side === "left" ? "ballLeft" : "ballRight",
      sole(props.line),
    );
  }

  /** How far the fitted support foot's ball is from where its planted goal puts it, metres. */
  function slip(
    body: IHumanBody,
    support: "left" | "right",
    base: IHumanPosture,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    const goal: IHumanPosture.IGoal | undefined = base.limbs[`${support}Leg`];
    if (goal === undefined || goal.rotation === undefined) return 0;
    const offset: IAutoMovieVector3 = HumanFoot.offset(body, support, "ball");
    const foot: IAutoMovieResolvedBone = bones.get(
      `${support}Foot` as AutoMovieHumanoidBone,
    )!;
    return Vector3.length(
      Vector3.subtract(
        Vector3.add(
          foot.worldPosition,
          Quaternion.rotateVector(foot.worldRotation, offset),
        ),
        Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, offset)),
      ),
    );
  }
}

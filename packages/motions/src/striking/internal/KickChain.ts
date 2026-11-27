import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingReach } from "./StrikingReach";
import { StrikingWeapon } from "./StrikingWeapon";
import { kickChainRead } from "./kickChainRead";

/** The alternatives of `PropsTechnique`'s site. */
type PropsTechnique = "round" | "push";

/**
 * The kicking leg at contact: the two-segment solve ({@link StrikingReach}) that
 * puts the round kick's lower shin or the push kick's ball of the foot on the
 * planned point from the hip the carriage leaves it, and the engine's limb fit
 * of that solve, read back from the fitted bones. What the leg reaches is the
 * fit's answer, so the planner and the displayed figure cannot disagree: a
 * point the hip's range of motion cannot bring the weapon to is measured as a
 * miss here, where the kick can still choose another carriage.
 *
 * The solve places the knee freely, and the hip's range of motion may not hold
 * it there: the fit then puts the knee where the hip allows and the weapon
 * lands off the planned point. So the fit is repeated from its own answer
 * ({@link fit}) until the weapon of the fitted leg is on the point.
 */
export namespace KickChain {
  /** What one fit asks the leg for. */
  export interface IAsked {
    /** The ankle's goal, world metres. */
    goal: IAutoMovieVector3;

    /** The knee's bend hint, world metres. */
    hint: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    asked: IAutoMovieQuaternion;
  }

  /**
   * How many times a fit is repeated from its own answer. Each round moves the
   * ankle's goal by the weapon's remaining error, which shrinks geometrically
   * when the leg can reach the point; provisional, chosen so a first error of a
   * tenth of a metre halving each round ends under the contact tolerance
   * ({@link KickForm.TOLERANCE}).
   */
  const REFITS: number = 8;

  /**
   * How far short of a weightless ankle's dorsiflexion
   * (`ANKLE_DORSIFLEXION.unloaded`) the push foot is asked to stay, degrees:
   * the fitted foot turns a little from the asked one (provisional, as
   * `unloadedFoot`'s margin).
   */
  export const DORSAL_MARGIN: number = 3;

  /** What a contact solve reads; a prepared fit keeps these values unchanged. */
  export interface IProps {
    /** The kicking body. */
    body: IAutoMovieMotionHumanBody;

    /** The kicking side. */
    side: AutoMovieHumanSide;

    /** The technique. */
    technique: PropsTechnique;

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** The weapon's unit travel at contact. */
    direction: IAutoMovieVector3;

    /** The planned contact point on the target's surface, world metres. */
    planned: IAutoMovieVector3;
  }

  /** The fitted leg at contact, including its original complete fitted pose. */
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
     * Whether the fitted leg's weapon is on the planned point: `short` when it
     * is not, `jammed` when it is with the knee folded past the technique's
     * most flexion, `reached` otherwise.
     */
    status: IAutoMovieMotionHumanStrikingReach.ISolution["status"];
  }

  /**
   * The push kick's foot rotation: the sole facing the target with the toes up.
   *
   * @param line The horizontal unit line toward the target.
   * @returns The foot's world rotation from its rest.
   */
  export function sole(line: IAutoMovieVector3): IAutoMovieQuaternion {
    return StrikingBody.foot({ x: 0, y: 1, z: 0 }, Vector3.scale(line, -1));
  }

  /**
   * A kicking foot off the floor on its shank: the asked foot as far as an
   * ankle bearing no weight dorsiflexes, its toes turned forward, away from the
   * knee, by what the asked foot would pull them past
   * (`ANKLE_DORSIFLEXION.unloaded` less `DORSAL_MARGIN`). The ankle's
   * dorsiflexion is how far the toes stand nearer the knee than square to the
   * shank. A push at a target below the hip points the shank down, and an
   * upright sole (`sole`) on it, the ankle's give added in the chamber
   * (`KickThrust.footed`), bent the ankle to its loaded limit while the foot
   * bore nothing (the cover breach's door kick: 39 degrees from the lift to the
   * replant).
   *
   * @param flat The asked foot's world rotation.
   * @param knee The knee, world metres.
   * @param ankle The ankle, world metres.
   * @returns The foot's world rotation from its rest.
   */
  export function unloaded(
    flat: IAutoMovieQuaternion,
    knee: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(knee, ankle),
    );
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(flat, {
      x: 0,
      y: 0,
      z: 1,
    });
    const bent: number =
      90 -
      Math.acos(Math.min(1, Math.max(-1, Vector3.dot(toes, up)))) /
        Quaternion.DEG2RAD;
    const excess: number = bent - (ANKLE_DORSIFLEXION.unloaded - DORSAL_MARGIN);
    const axis: IAutoMovieVector3 = Vector3.cross(up, toes);
    if (excess <= 0 || Vector3.length(axis) < 1e-9) return flat;
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(Vector3.normalize(axis), excess),
        flat,
      ),
    );
  }

  /**
   * Solve the leg at contact from the hip a carriage leaves it.
   *
   * @param props The kick's body, side, technique, line, travel and planned
   *   point.
   * @param base The body's posture at contact.
   * @param origin The kicking hip already read from this exact base, when
   *   supplied.
   * @returns The solve: the knee, the ankle, the knee's flexion and whether the
   *   point is reached, jammed or short.
   */
  export function solve(
    props: IProps,
    base: IAutoMovieMotionHumanPosture,
    origin?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStrikingReach.ISolution {
    const m: IAutoMovieMotionHumanBody["measure"] = props.body.measure;
    const round: boolean = props.technique === "round";

    // The round kick lands the shin's surface, so its axis point lies the
    // tapered shin's radius there behind the planned point; the push kick
    // lands the ball of the foot, so its ankle lies behind the planned point
    // by the ball's offset under the sole-forward rotation and by the foot
    // capsule's radius about the ball, the surface that arrives first
    // (`StrikingWeapon.legRadii`). Planned with the ball's own point on the
    // target, the capsule met the trunk a radius early: measured on the
    // staged push kick, the knee still folded 51.1 degrees at impact.
    const point: IAutoMovieVector3 = round
      ? Vector3.subtract(
          props.planned,
          Vector3.scale(
            props.direction,
            StrikingWeapon.girth(
              StrikingWeapon.legRadii(props.body)[1],
              KickForm.SHIN_SHARE,
            ),
          ),
        )
      : Vector3.subtract(
          Vector3.subtract(props.planned, ball(props)),
          Vector3.scale(
            props.direction,
            StrikingWeapon.legRadii(props.body)[2][0],
          ),
        );
    return StrikingReach.chain({
      root: origin ?? KickCarriage.hip(props.body, base, props.side),
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
   * Fit a solve with the engine's limb fit and read the leg back, repeating the
   * fit from its own answer.
   *
   * The first fit asks for the solve's ankle with the solve's knee as the bend
   * hint. Each later fit moves the ankle's goal by how far the fitted leg's
   * weapon is from the planned point, hints the knee where the last fit put it,
   * and (for the round kick) points the foot along the last fitted shank, so
   * the asked leg is one the hip already held. A moved goal never leaves the
   * leg's length at the technique's least flexion, so the knee stays inside its
   * band. The fit whose weapon comes nearest is the answer.
   *
   * @param props The kick's body, side, technique, line, travel and planned
   *   point.
   * @param base The body's posture at contact, its support leg planted.
   * @param solved The solve.
   * @param origin The kicking hip already read from this exact base, when
   *   supplied.
   * @param borrowed Optional synchronous exact FK supplier, never retained by
   *   the fitted result.
   * @param projection Optional genuine same-body ROM metadata loan; unknown
   *   loans use ordinary projection.
   * @returns The fitted leg, with how far it is from the support plant and from
   *   the planned point.
   */
  export function fit(
    props: IProps,
    base: IAutoMovieMotionHumanPosture,
    solved: IAutoMovieMotionHumanStrikingReach.ISolution,
    origin?: IAutoMovieVector3,
    borrowed?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IFit {
    return prepareFit(props, projection)(base, solved, origin, borrowed);
  }

  /**
   * Prepare the unchanged chain geometry for one synchronous carriage search.
   *
   * @param props The unchanged body, side, technique, line, travel and target.
   * @param projection Optional genuine same-body ROM metadata loan.
   * @returns A full refit reader for each actual candidate base and reach,
   *   optionally borrowing that candidate's exact hip and synchronous FK
   *   supplier.
   */
  export function prepareFit(
    props: IProps,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): (
    base: IAutoMovieMotionHumanPosture,
    solved: IAutoMovieMotionHumanStrikingReach.ISolution,
    origin?: IAutoMovieVector3,
    borrowed?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IFit {
    const { body, side }: IProps = props;
    const round: boolean = props.technique === "round";
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      CONTACT_BONES[side],
    );
    const opening: IAutoMovieVector3 = bend(props);
    const flat: IAutoMovieQuaternion | undefined = round
      ? undefined
      : sole(props.line);
    const longest: number = StrikingReach.reach(
      body.measure.thigh,
      body.measure.shank,
      KickForm.FLEXION[props.technique][0],
    );
    const pointed: (
      knee: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ) => IAutoMovieQuaternion = (
      knee: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ): IAutoMovieQuaternion =>
      round
        ? StrikingBody.foot(
            Vector3.normalize(Vector3.subtract(ankle, knee)),
            props.direction,
          )
        : unloaded(flat!, knee, ankle);
    return (
      base: IAutoMovieMotionHumanPosture,
      solved: IAutoMovieMotionHumanStrikingReach.ISolution,
      origin?: IAutoMovieVector3,
      borrowed?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IFit => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(borrowed);
      const hip: IAutoMovieVector3 =
        origin ?? KickCarriage.hip(body, base, side, resolution, project);
      let goal: IAutoMovieVector3 = solved.end;
      let hint: IAutoMovieVector3 = StrikingReach.hint(
        hip,
        solved,
        opening,
        KickForm.HINT_SHARE * body.measure.thigh,
      );
      let asked: IAutoMovieQuaternion = pointed(solved.middle, solved.end);
      let best: IFit = kickChainRead(
        props,
        base,
        solved,
        { goal, hint, asked },
        resolution,
        project,
        frames,
      );
      let last: IFit = best;

      // A moved goal stays inside the hip's sphere of the leg's length at the
      // technique's least flexion, so no refit opens the knee past the band:
      // what the weapon then still lacks is the kick's honest shortfall, which
      // the carriage answers with a step, not the knee with a lock.
      const within: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 => {
        const from: IAutoMovieVector3 = Vector3.subtract(point, hip);
        const distance: number = Vector3.length(from);
        return distance <= longest
          ? point
          : Vector3.add(hip, Vector3.scale(from, longest / distance));
      };
      for (let i: number = 1; i < REFITS && last.residual > 1e-6; i++) {
        goal = within(
          Vector3.add(goal, Vector3.subtract(props.planned, last.reached)),
        );
        hint = last.knee;
        asked = pointed(last.knee, last.ankle);
        last = kickChainRead(
          props,
          base,
          solved,
          { goal, hint, asked },
          resolution,
          project,
          frames,
        );
        if (last.residual < best.residual) best = last;
      }
      return best;
    };
  }

  /**
   * A kick's knee hint direction: a round kick's knee across the strike and a
   * little up (`KickForm.BEND_RISE`), a push kick's up and along the line.
   *
   * @param props The kick's technique, direction and line.
   * @returns The hint direction.
   */
  export function bend(
    props: Pick<IProps, "technique" | "direction" | "line">,
  ): IAutoMovieVector3 {
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    return props.technique === "round"
      ? Vector3.add(props.direction, Vector3.scale(up, KickForm.BEND_RISE))
      : Vector3.add(up, props.line);
  }

  /**
   * The ball of the kicking foot from its ankle under the push kick's rotation,
   * world metres.
   */
  function ball(props: IProps): IAutoMovieVector3 {
    return StrikingBody.socket(
      props.body,
      props.side === "left" ? "ballLeft" : "ballRight",
      sole(props.line),
    );
  }
}

/** Read-back needs the kicking knee/foot and the planted support foot only. */
const CONTACT_BONES: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>([
    "leftLowerLeg",
    "leftFoot",
    "rightFoot",
  ]),
  right: new Set<AutoMovieHumanoidBone>([
    "rightLowerLeg",
    "rightFoot",
    "leftFoot",
  ]),
};

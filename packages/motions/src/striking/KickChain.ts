import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickCarriage } from "./KickCarriage";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingReach } from "./StrikingReach";
import { StrikingWeapon } from "./StrikingWeapon";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines anatomical weapon geometry, full physical refits, measured misses and fixed-chain preparation versus changing candidate observations.
 * @evidence contracts/development/design.md#principled-representation Uses canonical body/posture/reach/pose types and exposes the original full fitted pose plus physical support/contact measurements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sole frame, analytic reach, one-shot fit and fixed-chain fit producer are the actual kick contact planner's required operations; rig FK and physical fitting keep their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every candidate remains a real complete posture fit under the original limits and best-residual decision; no resolved flag, proxy target, pose sample or changed success condition is introduced.
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

  /**
   * What a contact solve reads; a prepared fit keeps these values unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member identifies canonical body/side, technique and world-space line/travel/target; prepareFit requires them unchanged for its synchronous search.
   * @evidence contracts/development/design.md#principled-representation Existing canonical body, side/technique unions and world vector types encode the physical chain without alternate solver state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These six actual inputs determine analytic reach and refit geometry; changing candidate bases and reach solutions remain separate arguments.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs contain actual physical intent, never cached poses, warm solutions, source indices or pre-certified outcomes.
   */
  export interface IProps {
    /** The kicking body. */
    body: IAutoMovieMotionHumanBody;

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

  /**
   * The fitted leg at contact, including its original complete fitted pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state world-metre positions/residuals, foot rotation, clinical knee angle, full pose and the original reached/jammed/short meanings.
   * @evidence contracts/development/design.md#principled-representation Combines the existing canonical whole pose and reach status with the actual geometric measurements needed to choose a carriage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every field is read by kick composition or the contact planner; no factory, FK workspace, metadata token or numerical history escapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pose remains complete with original arm/rival clearance and all physical fits, while misses and support slip remain observable rather than being clamped away.
   */
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
    status: IAutoMovieMotionHumanStrikingReach.ISolution["status"];
  }

  /**
   * The push kick's foot rotation: the sole facing the target with the toes
   * up.
   *
   * @param line The horizontal unit line toward the target.
   * @returns The foot's world rotation from its rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the horizontal unit travel line and the push foot's world rotation from rest.
   * @evidence contracts/development/implementation.md#principled-implementation The existing foot alignment maps the rest toe axis upward and its instep opposite the supplied line, preserving the original push-contact orientation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One line reversal and one shared StrikingBody.foot alignment own the rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original up axis, negative line and alignment owner without a baked angle or repaired direction; callers retain the valid unit-line premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed vector/alignment work is constant; prepareFit can evaluate this once for a synchronous unchanged push chain instead of per refit, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The exact fixed line and push technique determine this rotation; round-kick shank-dependent rotations are still evaluated from each actual knee/ankle pair.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This function retains nothing and returns a new rotation. A prepared fit may borrow it internally until that synchronous search ends; fitted output poses and foot observations retain their original ownership.
   */
  export function sole(line: IAutoMovieVector3): IAutoMovieQuaternion {
    return StrikingBody.foot({ x: 0, y: 1, z: 0 }, Vector3.scale(line, -1));
  }

  /**
   * Solve the leg at contact from the hip a carriage leaves it.
   *
   * @param props The kick's body, side, technique, line, travel and planned point.
   * @param base The body's posture at contact.
   * @param origin The kicking hip already read from this exact base, when supplied.
   * @returns The solve: the knee, the ankle, the knee's flexion and whether the point is reached, jammed or short.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States technique, world target, same-base optional hip and the unchanged two-segment reach result.
   * @evidence contracts/development/implementation.md#principled-implementation Places the shin axis behind its measured tapered radius or the ankle behind the rotated foot ball, then solves the original two-segment chain within the technique's flexion band.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The technique selects the physical contact offset before one shared reach solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains actual measured segment lengths, target, shin share, bend and flexion band; a supplied hip must be the exact same body's base hip.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant contact arithmetic plus the shared closed-form reach; only an omitted hip needs its trunk FK ancestry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller may share an already-read hip across this candidate's solve and fit; no posed result or time history is retained.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only the reach result and retains no state.
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
          Vector3.scale(props.direction, StrikingWeapon.legRadii(props.body)[2]),
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
   * Fit a solve with the engine's limb fit and read the leg back, repeating
   * the fit from its own answer.
   *
   * The first fit asks for the solve's ankle with the solve's knee as the
   * bend hint. Each later fit moves the ankle's goal by how far the fitted
   * leg's weapon is from the planned point, hints the knee where the last
   * fit put it, and (for the round kick) points the foot along the last
   * fitted shank, so the asked leg is one the hip already held. A moved goal
   * never leaves the leg's length at the technique's least flexion, so the
   * knee stays inside its band. The fit whose weapon comes nearest is the
   * answer.
   *
   * @param props The kick's body, side, technique, line, travel and planned point.
   * @param base The body's posture at contact, its support leg planted.
   * @param solved The solve.
   * @param origin The kicking hip already read from this exact base, when supplied.
   * @param borrowed Optional synchronous exact FK supplier, never retained by the fitted result.
   * @param projection Optional genuine same-body ROM metadata loan; unknown loans use ordinary projection.
   * @returns The fitted leg, with how far it is from the support plant and from the planned point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed base, contact target, iterative weapon correction and optional same-base hip.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps every original bounded weapon refit and its best-residual decision; only the unchanged base hip and exact FK prerequisites are shared within this synchronous fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixed hip and lazy resolution reader belong to the refit loop that consumes them, while read owns each actual whole-posture solve and weapon measurement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains all REFITS, residual thresholds, support plants, target corrections and cold limb searches; no posture or fit answer is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most eight complete posture refits retain every physical fit and admission. One genuine ROM projector and one prepared fixed endpoint demand remove repeated rig/name preparation; each changed pose still computes its actual endpoint FK. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller-supplied hip must belong to the exact body/base. A local resolution reader shares only equal scalar FK inputs across the synchronous refits and their displayed-bone reads; each changed goal is solved normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader, ROM loan, fixed endpoint producer and hip belong only to this synchronous fit or its enclosing candidate search. IFit retains its original whole fitted pose and measurements, never a reader, projector, closure or new body memory.
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
   * optionally borrowing that candidate's exact hip and synchronous FK supplier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed canonical chain/target geometry from changing candidate base/reach, exact optional hip and borrowed FK supplier.
   * @evidence contracts/development/implementation.md#principled-implementation Every actual candidate runs the original whole-posture refit loop, target correction, knee hint, support-plant measurement, ROM admission and strict best-residual selection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed bend, extension bound, push-foot rotation, genuine ROM metadata and endpoint demand are prepared before the returned candidate reader; read remains the actual full-fit/measurement owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all eight allowed refits and original early stop, flexion bands, goals, rotations, support plants, complete fitted pose and arm/rival clearance. No posture, warm fit or numerical answer is retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms One unchanged-chain search prepares fixed rig/name/geometry once instead of once per lean/step candidate. Each candidate still pays all admitted physical refits and current endpoint FK; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller fixes body/rig/side/technique/line/travel/target for the entire synchronous search. Only those metadata and exact constant push rotation are shared; every base, reach and current round-kick shank orientation is evaluated anew.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns one fixed-demand producer, ROM projector and bounded geometry until return or throw. Each candidate owns its fresh pose/FK workspace and only original IFit values escape; the producer retains no candidate, operation reader, history or external handle.
   */
  export function prepareFit(
    props: IProps,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): (base: IAutoMovieMotionHumanPosture, solved: IAutoMovieMotionHumanStrikingReach.ISolution, origin?: IAutoMovieVector3, borrowed?: Parameters<typeof prepareHumanPoseResolution>[0]) => IFit {
    const { body, side }: IProps = props;
    const round: boolean = props.technique === "round";
    const project: ReturnType<typeof prepareHumanPostureProjection> = projection ?? prepareHumanPostureProjection(body);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, CONTACT_BONES[side]);
    const opening: IAutoMovieVector3 = bend(props);
    const flat: IAutoMovieQuaternion | undefined = round ? undefined : sole(props.line);
    const longest: number = StrikingReach.reach(
      body.measure.thigh,
      body.measure.shank,
      KickForm.FLEXION[props.technique][0],
    );
    const pointed: (knee: IAutoMovieVector3, ankle: IAutoMovieVector3) => IAutoMovieQuaternion = (
      knee: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ): IAutoMovieQuaternion =>
      round
        ? StrikingBody.foot(Vector3.normalize(Vector3.subtract(ankle, knee)), props.direction)
        : flat!;
    return (
      base: IAutoMovieMotionHumanPosture,
      solved: IAutoMovieMotionHumanStrikingReach.ISolution,
      origin?: IAutoMovieVector3,
      borrowed?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IFit => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(borrowed);
      const hip: IAutoMovieVector3 = origin ?? KickCarriage.hip(body, base, side, resolution, project);
      let goal: IAutoMovieVector3 = solved.end;
      let hint: IAutoMovieVector3 = StrikingReach.hint(
        hip,
        solved,
        opening,
        KickForm.HINT_SHARE * body.measure.thigh,
      );
      let asked: IAutoMovieQuaternion = pointed(solved.middle, solved.end);
      let best: IFit = read(props, base, solved, { goal, hint, asked }, resolution, project, frames);
      let last: IFit = best;

      // A moved goal stays inside the hip's sphere of the leg's length at the
      // technique's least flexion, so no refit opens the knee past the band:
      // what the weapon then still lacks is the kick's honest shortfall, which
      // the carriage answers with a step, not the knee with a lock.
      const within: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
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
        last = read(props, base, solved, { goal, hint, asked }, resolution, project, frames);
        if (last.residual < best.residual) best = last;
      }
      return best;
    };
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
    base: IAutoMovieMotionHumanPosture,
    solved: IAutoMovieMotionHumanStrikingReach.ISolution,
    ask: IAsked,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
    frames: ReturnType<typeof poseBones.prepare>,
  ): IFit {
    const { body, side }: IProps = props;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(body, {
      ...base,
      limbs: {
        ...base.limbs,
        [`${side}Leg`]: {
          point: ask.goal,
          bend: ask.hint,
          rotation: ask.asked,
        },
      },
    }, undefined, {}, resolution, undefined, projection).pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = frames(pose, resolution());
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
            Vector3.scale(
              props.direction,
              StrikingWeapon.girth(
                StrikingWeapon.legRadii(body)[1],
                solved.along / m.shank,
              ),
            ),
          )
        : Vector3.add(
            Vector3.add(
              foot.worldPosition,
              StrikingBody.socket(
                body,
                side === "left" ? "ballLeft" : "ballRight",
                foot.worldRotation,
              ),
            ),
            Vector3.scale(props.direction, StrikingWeapon.legRadii(body)[2]),
          );
    const residual: number = Vector3.distance(reached, props.planned);
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
    body: IAutoMovieMotionHumanBody,
    support: "left" | "right",
    base: IAutoMovieMotionHumanPosture,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    const goal: IAutoMovieHumanLimbGoal | undefined = base.limbs[`${support}Leg`];
    if (goal === undefined || goal.rotation === undefined) return 0;
    const offset: IAutoMovieVector3 = HumanFoot.offset(body, support, "ball");
    const foot: IAutoMovieResolvedBone = bones.get(
      `${support}Foot` as AutoMovieHumanoidBone,
    )!;
    return Vector3.distance(
        Vector3.add(
          foot.worldPosition,
          Quaternion.rotateVector(foot.worldRotation, offset),
        ),
        Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, offset)),
      );
  }
}

/** Read-back needs the kicking knee/foot and the planted support foot only. */
const CONTACT_BONES: Readonly<Record<"left" | "right", ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "leftFoot", "rightFoot"]),
  right: new Set<AutoMovieHumanoidBone>(["rightLowerLeg", "rightFoot", "leftFoot"]),
};

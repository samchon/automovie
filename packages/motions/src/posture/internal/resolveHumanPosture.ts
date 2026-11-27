import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { HumanLimbFit } from "../HumanLimbFit";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { refitHumanPosture } from "./refitHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";

/**
 * Resolve a posture into a canonical pose: the root from the posture's position
 * and heading, every directly set joint clamped to the rig's range of motion,
 * then each limb goal by the engine's two-bone fit with its bend hint, legs
 * before arms and each limb after a limb its goal rides (`orderHumanLimbs`),
 * last, so nothing moves a solved goal afterwards.
 *
 * Bones a posture neither sets nor solves stand at clinical zero, so every pose
 * this returns lists every rig bone and reads the same on any renderer. The
 * limb fit is `fitChainToTarget`, which clamps its candidates to the rig's
 * range of motion and searches bend planes when the hinted one misses; the set
 * joints are clamped by `clampPose` before it, so no returned angle exceeds the
 * rig's declared range and the clamp never moves a plant. Two arms with goals,
 * neither riding the other, are one coupled problem (`HumanLimbPair`): fitted
 * each on its own, and solved together only where the two fits meet, so a
 * mirrored posture resolves to the mirror of the original's bones. Digit goals
 * are fitted after every limb, each digit reaching from the hand its arm placed
 * (`HumanDigitFit`).
 *
 * The seeded companion may restrict an explicit observation to requested bone
 * frames. Unsupported dependencies keep ordinary complete fitting. A posture
 * placed from a preparation carries its own solve
 * (`HumanPosturePreparation.IPlaced`) for its reader to take instead of
 * resolving it here.
 *
 * @param body The performer's body.
 * @param posture The posture.
 * @param base A pose whose joints replace clinical zero for unset bones, such
 *   as a transition's displayed pose; its root is ignored.
 * @returns The canonical pose.
 */
export function resolveHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  base?: IAutoMoviePose,
  near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(body, posture, base, near).pose;
}

/** Companion helpers of {@link resolveHumanPosture}. */
export namespace resolveHumanPosture {
  /**
   * {@link resolveHumanPosture} with each limb's fit continued from a nearby one
   * where `near` names it (`IAutoMovieSwivelNear`), reporting the seed each
   * limb's fit was chosen at: the same pose, solved the same way, with what a
   * fit of the same limb a moment away continues from.
   *
   * @param body The performer's body.
   * @param posture The posture.
   * @param base A pose whose joints replace clinical zero for unset bones.
   * @param near Each limb's nearby fit to continue; a limb not named is solved
   *   cold.
   * @param resolution Optional exact reader or lazy supplier borrowed from this
   *   same synchronous person evaluation; never retained by the result.
   * @param requested Optional observational bone demand: only these frames
   *   equal full resolution; unneeded world limb goals may remain at clamped
   *   authored joints. Foot contacts retain re-aim/toe correction; continued,
   *   unsupported or arm-dependent context keeps full resolution.
   * @param projection Unread: assembly projects through the body's own
   *   projector (`IHumanBody.projection`), which every caller's projection is.
   * @returns The canonical pose and each actually fitted limb's seed; omission
   *   of requested preserves complete resolution.
   */
  export function seeded(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    base?: IAutoMoviePose,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    // The owned route assembles fresh records from the raw demands and fits
    // them in place; a reader lends only exact FK, so it can alias no record
    // of the result.
    return base === undefined
      ? resolveHumanPostureSource.owned(
          body,
          posture,
          near,
          resolution,
          requested,
          projection,
        )
      : resolveHumanPostureSource(
          body,
          posture,
          base,
          near,
          resolution,
          requested,
          projection,
        );
  }

  /**
   * Re-fit limb goals on an already displayed pose, after its parents, blending
   * or transition have been placed. World goals have already received the
   * posture's root turn; attached goals keep their `on` frame and are carried
   * into the world once, by the limb fit.
   *
   * @param body The performer's body.
   * @param pose The pose before these limb fits.
   * @param limbs The goals, world or attached to a posed bone.
   * @param near Each limb's nearby fit to continue, if any.
   * @param resolution Optional parent-owned exact reader or lazy supplier,
   *   borrowed for the call.
   * @returns The pose, seeds and values of the same limb solver `seeded` uses,
   *   a fresh copy; the input pose itself when no limb had a goal.
   */
  export function refit(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      refitHumanPosture(body, pose, limbs, near, resolution);
    if (fitted.pose === pose && Object.keys(fitted.seeds).length === 0)
      return fitted;

    // The fit shares with the input pose the records it leaves as they are,
    // so the result is issued as a structured copy, whatever a record
    // carries beside its angles. A record that cannot be copied structurally
    // (a proxy) is not a pose record, and the copy refuses it.
    return structuredClone(fitted);
  }

  /**
   * Re-solve one limb of a pose onto a goal, keeping everything else; an arm
   * keeps clear of the other arm where the pose already places it.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @param near A nearby fit of the limb to continue; omitted, it is solved
   *   cold.
   * @returns The pose with the limb fitted.
   */
  export function limb(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    near?: IAutoMovieSwivelNear,
  ): IAutoMoviePose {
    return limbSeeded(body, pose, limb, goal, near).pose;
  }

  /**
   * {@link limb} with the seed its fit was chosen at.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @param near A nearby fit of the limb to continue; omitted, it is solved
   *   cold.
   * @param resolution Optional exact reader or lazy supplier borrowed only from
   *   the same synchronous person evaluation.
   * @returns An independent complete copy of the fitted pose, seed and value,
   *   including unrelated nested metadata.
   */
  export function limbSeeded(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieSeededChainFit {
    return structuredClone(
      HumanLimbFit.fit(
        body,
        pose,
        limb,
        goal,
        ["left", "right"],
        undefined,
        near,
        resolution,
      ),
    );
  }
}

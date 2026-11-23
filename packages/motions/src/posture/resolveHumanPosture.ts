import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { deriveHumanPosture } from "./deriveHumanPosture";
import { humanPostureHeading } from "./humanPostureHeading";
import { lowerHumanPosture } from "./lowerHumanPosture";
import { orderHumanLimbs } from "./orderHumanLimbs";
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
 * frames. Unsupported dependencies keep ordinary complete fitting. prepare
 * records an actual cold source for checked raw translation, and
 * translated/rigid construct its original demands at a new placement. Raw
 * composition retains ordinary fitting; source identity alone cannot certify
 * its current demand graph.
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
   * The least knee flexion of a planted leg, degrees: the knee's greatest
   * extension in stance, about 5 degrees at initial contact and through
   * terminal stance (Perry and Burnfield 2010, Gait Analysis: Normal and
   * Pathological Function, ch. 7; provisional, read through secondary
   * summaries, the primary not read). Every planted leg's lowering (`lower`)
   * and every walking stance (`walkReach`) keeps it.
   */
  export const KNEE: number = 5;

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
    // A cold resolve with a native reader takes an issued preparation's
    // proven solve (`HumanPosturePreparation.read`) where the posture has one.
    const native: boolean =
      prepareHumanPoseResolution.isNativeSource(resolution);
    if (base === undefined && native && Object.keys(near).length === 0) {
      const prepared:
        | IAutoMovieMotionHumanResolveHumanPosture.ISeeded
        | undefined = HumanPosturePreparation.read(body, posture);
      if (prepared !== undefined) return prepared;
    }

    // The owned route assembles fresh records from the raw demands and fits
    // them in place; a reader lends only exact FK, so a native one (this
    // owner's factory or the engine's) can alias no record of the result.
    const owned: boolean =
      base === undefined && (resolution === undefined || native);
    return owned
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
   * One issued preparation's canonical pose
   * (`HumanPosturePreparation.IPrepared`); only `prepare` issues one, and a
   * copied wrapper certifies nothing.
   */
  export type IPrepared = HumanPosturePreparation.IPrepared;

  /**
   * Resolve a posture cold and issue its preparation
   * (`HumanPosturePreparation.prepare`): the authoring is a value the caller
   * does not change once prepared, so it is kept as given, and `translated`,
   * `rigid` and `tryRigid` construct its demands at a new placement whose
   * resolve takes this solve while the body's rig is unchanged.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPrepared {
    return HumanPosturePreparation.prepare(
      body,
      posture,
      resolution,
      projection,
    );
  }

  /**
   * Observe an issued source through fresh FK only; no private pose escapes or
   * unused public pose is copied.
   */
  export function preparedBones(
    ...args: Parameters<typeof HumanPosturePreparation.bones>
  ): ReturnType<typeof HumanPosturePreparation.bones> {
    return HumanPosturePreparation.bones(...args);
  }

  /**
   * A posture's direct part, assembled
   * (`resolveHumanPostureSource.IAssembled`): the authored posture, its root
   * and clamped direct joints as a pose before any limb fit, and its own goals
   * turned.
   */
  export type IAssembled = resolveHumanPostureSource.IAssembled;

  /**
   * The first half of a resolve, held as a value: the posture's root, heading
   * and direct joints clamped to the rig's range, before any limb is fitted; a
   * cold resolve of the posture is `fit` of it. The posture is kept by
   * reference for the goals' turning and the digits, so it stays unchanged
   * while the assembly is used.
   */
  export function assemble(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAssembled {
    return resolveHumanPostureSource.assemble(body, posture);
  }

  /**
   * The assembly of `posture` built from another posture's assembly of the same
   * body (`deriveHumanPosture`): value for value the pose `assemble` gives it,
   * sharing every record whose bone's angles are exactly the same and clamping
   * only the others again.
   */
  export function derive(
    body: IAutoMovieMotionHumanBody,
    assembled: IAssembled,
    posture: IAutoMovieMotionHumanPosture,
  ): IAssembled {
    return deriveHumanPosture(body, assembled, posture);
  }

  /**
   * The second half of a resolve on an assembly: limb goals fitted in the
   * resolver's order and the assembled posture's digits after them, so
   * `fit(body, assemble(body, posture))` is the cold resolve of the posture.
   *
   * @param body The performer's body.
   * @param assembled The assembly (`assemble`, `derive`), left unchanged.
   * @param limbs Goals to fit in place of the assembled posture's own, authored
   *   like them (world goals are turned here by the posture's whole-body
   *   rotation); absent, the posture's own.
   * @param near Each limb's nearby fit to continue; a limb not named is solved
   *   cold.
   * @param resolution Optional exact reader or lazy supplier borrowed from this
   *   same synchronous evaluation.
   * @param solved A completed cold fit of another assembly of this body: a cold
   *   fit of this assembly's own goals is taken from it when every limb's fit
   *   reads exactly what it read there (`deriveHumanPosture.inherited`), and
   *   solved as ever otherwise.
   * @returns The pose and each fitted limb's seed and value; untouched records
   *   are the assembly's own, which callers treat as immutable.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    assembled: IAssembled,
    limbs?: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    solved?: deriveHumanPosture.ISolved,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return resolveHumanPostureSource.fit(
      body,
      assembled,
      limbs,
      near,
      resolution,
      solved,
    );
  }

  /**
   * An issued preparation's original demands translated to a new world-metre
   * root (`HumanPosturePreparation.translated`): world goals move with the
   * root, attached ones keep their frame, and no achieved point replaces an
   * asked goal. A changed or copied result resolves normally.
   */
  export function translated(
    prepared: IPrepared,
    root: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    return HumanPosturePreparation.translated(prepared, root);
  }

  /**
   * An issued joint-only preparation placed at a world root and yaw/pitch/roll
   * in degrees (`HumanPosturePreparation.rigid`); throws for any other
   * preparation.
   */
  export function rigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IAutoMovieMotionHumanPosture {
    return HumanPosturePreparation.rigid(prepared, root, yaw, pitch, roll);
  }

  /**
   * Construct an owned joint-only placement when its private source supports
   * it, otherwise decline to the caller's original raw path.
   */
  export function tryRigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IAutoMovieMotionHumanPosture | undefined {
    return HumanPosturePreparation.tryRigid(prepared, root, yaw, pitch, roll);
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
    // carries beside its angles. A caller's record may be an object that
    // reads as a record and cannot be copied structurally (a proxy): such a
    // record is issued as the four values a joint record is.
    try {
      return structuredClone(fitted);
    } catch {
      const issued: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        structuredClone({ ...fitted, pose: { ...fitted.pose, joints: [] } });
      issued.pose.joints = fitted.pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          try {
            return structuredClone(joint);
          } catch {
            return {
              bone: joint.bone,
              flexion: joint.flexion,
              abduction: joint.abduction,
              twist: joint.twist,
            };
          }
        },
      );
      return issued;
    }
  }

  /**
   * A posture's root rotation: yaw about +Y, then pitch about the turned left
   * axis (+X, a forward tip), then roll about the turned forward axis (+Z, a
   * tip toward the right).
   *
   * @param posture The posture's heading.
   * @returns The rotation.
   */
  export function heading(
    posture: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
  ): IAutoMovieQuaternion {
    return humanPostureHeading(posture);
  }

  /**
   * The heading angles of a root rotation, the inverse of {@link heading}: with
   * `R = Ry(yaw) Rx(pitch) Rz(roll)`, the turned forward axis is `(sin yaw cos
   * pitch, -sin pitch, cos yaw cos pitch)` and the vertical components of the
   * turned left and up axes are `sin roll cos pitch` and `cos roll cos pitch`.
   * A rotation composed in the world (a pelvis tilted about a floor axis after
   * its turn) becomes a posture's heading through it. The original atan2
   * readings and clamped asin operate directly on those three turned axes,
   * including at a vertical forward axis.
   *
   * @param rotation The root's world rotation, unit.
   * @returns Yaw, pitch and roll, degrees.
   */
  export function angles(
    rotation: IAutoMovieQuaternion,
  ): Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> {
    return humanPostureHeading.angles(rotation);
  }

  /**
   * The posture's root lowered so every planted leg keeps at least knee degrees
   * of knee flexion, KNEE when absent; an optional same-operation FK supplier
   * is borrowed only by the actual hip reading, and the hip's largest vertical
   * step a frame (step, metres) eases the reach over its soft band
   * (lowerHumanPosture).
   */
  export function lower(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    knee: number = KNEE,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    step?: number,
  ): IAutoMovieMotionHumanPosture {
    return lowerHumanPosture(body, posture, knee, resolution, step);
  }

  /**
   * The lowering one leg asks of the root, metres; `-Infinity` beyond the leg's
   * reach ({@link lowerHumanPosture.short}).
   */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: number,
    step?: number,
  ): number {
    return lowerHumanPosture.short(body, hip, ankle, knee, step);
  }

  /**
   * Prepare fixed body/knee reach geometry; every hip/ankle query retains the
   * original lowering and refusal arithmetic.
   */
  export function prepareShort(
    body: IAutoMovieMotionHumanBody,
    knee: number,
    step?: number,
  ): ReturnType<typeof lowerHumanPosture.prepareShort> {
    return lowerHumanPosture.prepareShort(body, knee, step);
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

  /**
   * A limb's reference solution read off a pose: the clinical angles of its
   * upper and lower bones. A law solves the limb once at the instant its action
   * is about (the grasp, the clasp, the placement) and hands the result to
   * every goal of the stroke as `HumanPosture.IGoal.reference`.
   *
   * @param pose The pose the limb was solved in.
   * @param limb The limb.
   * @returns The reference.
   */
  export function reference(
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
  ): IAutoMovieHumanLimbReference {
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
    const read: (
      bone: AutoMovieHumanoidBone,
    ) => readonly [number, number, number] = (
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    return { upper: read(chain.upper), lower: read(chain.lower) };
  }

  /** The order to fit a posture's limbs in ({@link orderHumanLimbs}). */
  export function order(
    limbs: IAutoMovieMotionHumanPosture["limbs"],
  ): AutoMovieHumanLimb[] {
    return orderHumanLimbs(limbs);
  }

  /**
   * A limb goal in world terms: unchanged when it has no `on` bone, otherwise
   * its point and bend carried from the bone's posed frame to the world
   * (`p_world = P + R p`) and its rotation composed after the bone's (`R q`),
   * with the bone placed by the given pose. The attachment is refused for a
   * bone of the limb's own chain (its upper bone, its lower bone or its end),
   * because fitting the limb moves that bone and the goal would chase itself.
   *
   * @param body The performer's body.
   * @param pose The pose that places the attachment bone, before the limb is
   *   fitted.
   * @param limb The limb the goal is for.
   * @param goal The goal, attached or not.
   * @returns The goal with world point, bend and rotation and no `on`.
   * @throws {Error} When the goal is attached to a bone of its own limb's
   *   chain, or to a bone the rig lacks.
   */
  export function world(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    read?: Parameters<typeof HumanLimbFit.world>[4],
  ): IAutoMovieHumanLimbGoal {
    return HumanLimbFit.world(body, pose, limb, goal, read);
  }
}

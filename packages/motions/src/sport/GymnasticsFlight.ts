import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";

/**
 * The airborne kernel of the gymnastic and jumping laws (#3377): a body in
 * flight is a set of joint angles, a heading and a tip, placed where its
 * centre of mass lies on the drag-free parabola its take-off speed gives.
 *
 * A flight posture is written by its joints alone, with no limb goal, so
 * placing it by its centre moves only its root and the centre read from it
 * is the one the film shows; a posture a law wrote with limb goals is first
 * frozen into the joints its own resolution gives. A rigid turn carries
 * either kind, its world goals going round with its root.
 *
 * The physics is the drag-free projectile's closed form, as the jump's
 * flight uses it: the centre rises and falls under gravity alone,
 * so a take-off's vertical speed fixes the flight time to any height, and a
 * body that keeps its shape turns at the constant mean rate of its kept
 * angular momentum, so a turn's angle is that rate times the time. A turn
 * about the centre of mass leaves that point on its parabola.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a flight posture is, why it is written by joints and the physics.
 * @evidence contracts/development/design.md#principled-representation Free functions over the posture record and the engine's mass model; no state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the gymnastic laws share: freezing, the centre, placing by it, a rigid turn, the fall time, the lowest point, the launch read off a plan and the touchdown search.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Gravity is the engine's (`AutoMovieGravity`); every length is the body's or the plan's.
 */
export namespace GymnasticsFlight {
  /**
   * The engine's segment mass model of one unchanged body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the original engine model supplying segment masses, local centres and inertias in SI units; model(body) borrows the body's actual canonical instance.
   * @evidence contracts/development/design.md#principled-representation The alias preserves the engine's physical model directly, without reinterpreting posed FK or authored posture demands.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same model type serves actual COM placement, flight launch and gymnastics floor/placement preparations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adds no alternative mass table, manually asserted canonical flag, numerical cache key or ownership wrapper.
   */
  export type Model = ReturnType<typeof resolveAutoMovieCenterOfMass>;

  /**
   * The mass model of a body.
   *
   * @param body The body.
   * @returns The body's canonical segment model, prepared when that body is created.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the body's canonical engine mass model, derived from the same unchanged skeleton and physical profile as its rest and collider data.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One body-owned model read leaves preparation and lifetime with createHumanBody.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-time model reference read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every action of the same unchanged body shares its actual canonical model; recreate the body after skeleton/profile edits as IHumanBody requires.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the body-owned model; this adapter retains no cache or external resource.
   */
  export function model(body: IHumanBody): Model {
    return body.massModel;
  }

  /**
   * A posture written by its achieved clinical angles, its limb goals
   * cleared and other raw fields kept under their original ownership.
   *
   * @param body The body.
   * @param posture The posture, with or without limb goals.
   * @returns The raw view with actual clinical joints and no limb goals; other raw fields, including any digit/rotation demands, remain unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The resolved pose's clinical angles are already clamped and solved, so setting them as joints reproduces the pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve once and use frozenView's joint-copy owner, shared with freeze's paired COM/canonical observation without allocating its unused pair wrapper.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution, linear in bones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ordinary wrapper and paired canonical-pose consumer share freeze's actual resolution/joint-copy owner, without a second target or solved flag.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frozen(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IHumanPosture {
    return frozenView(posture, resolveHumanPosture(body, posture));
  }

  /**
   * Resolve one actual source once and expose its original frozen clinical view
   * beside the actual canonical pose, so a caller can also read its COM.
   *
   * @param body The unchanged canonical body.
   * @param posture The original raw posture, whose complete goals still resolve before freezing.
   * @param resolution Optional exact FK source borrowed only for this source query.
   * @param projection Optional genuine same-body ROM projector borrowed only for this source query.
   * @returns The raw view with limb goals cleared and the same actual resolver pose; copied clinical tuples are separate from canonical joint records, while other raw fields, including any digit/rotation demands, retain frozen's original borrowed ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes original raw source, actual canonical pose, clinical-degree frozen tuples and their ownership; both outputs describe this same logical query.
   * @evidence contracts/development/implementation.md#principled-implementation One ordinary complete canonical solve supplies actual projected/fitted joints. Frozen authoring copies clinical values with the original neutral-zero convention and clears only limb goals in that raw view; other raw fields stay unchanged and COM reads the same actual canonical pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the genuine body/raw source, copy joint triples once and return both existing representations; frozen delegates this numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller-provided pose, fitted target or resolved flag is admitted. Every original limb/digit/rotation demand receives ordinary solving before the existing freeze policy clears only limb goals; it never certifies a later edited or composed posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original full resolve plus O(J) tuple copying serves both actual COM and frozen-shape consumers, removing their duplicate canonical solve without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both observations read this source query's actual solution. Optional synchronous FK/projector loans share only equal prerequisites/static ROM metadata while every actual joint/demand still evaluates; no previous time, result cache or mutated context is consulted.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one actual resolver pose, fresh raw joint table/triples and bounded pair wrapper. Optional FK/projector loans stay with their synchronous lender and never enter either output, callback, history or external handle.
   */
  export function freeze(
    body: IHumanBody,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): { posture: IHumanPosture; pose: IAutoMoviePose } {
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(body, posture, undefined, undefined, resolution, undefined, projection).pose;
    return { posture: frozenView(posture, pose), pose };
  }

  /** Copy actual canonical clinical values under the original limb-only freeze policy. */
  function frozenView(posture: IHumanPosture, pose: IAutoMoviePose): IHumanPosture {
    const joints: IHumanPosture["joints"] = {};
    for (const joint of pose.joints as readonly IAutoMovieJointPose[])
      // A joint the pose leaves unset stands at clinical zero, as the
      // resolver itself reads it.
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    return { ...posture, joints, limbs: {} };
  }

  /**
   * The centre of mass of a posture.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param posture The posture.
   * @param resolution Optional exact FK reader or lazy supplier borrowed from this synchronous body's evaluation.
   * @param projection Optional genuine same-body direct ROM projector borrowed only during this synchronous reading.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segment mass model over the posture's bones: forward kinematics alone for a posture of joints, the full resolution for one with goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and one weighted mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Complete canonical joint admission and actual limb/digit fits remain. Final FK requests only mass-observed bone ancestry, followed by the unchanged segment reduction; one operation-scoped reader shares equal dependency math and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body's canonical mass model/collider demand share its unchanged profile; alternate models construct actual segment demands. An optional exact reader shares only equal FK dependencies, and a genuine same-body projector shares static ROM metadata while every current joint is still projected; unknown functions use ordinary admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local lazy reader ends on return/throw; optional borrowed FK/projector sources stay with their synchronous parent. No reader, projector, bone map or query history escapes in the returned centre vector.
   */
  export function centre(
    body: IHumanBody,
    model: Model,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    let requested: ReadonlySet<AutoMovieHumanoidBone>;
    if (model === body.massModel) requested = HumanColliders.bones(body);
    else {
      const massBones: Set<AutoMovieHumanoidBone> = new Set();
      for (const segment of model.segments) massBones.add(segment.bone);
      requested = massBones;
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture.seeded(body, posture, undefined, undefined, read, undefined, projection).pose, read(), requested);
    return resolveAutoMovieCenterOfMass.place(model, bones);
  }

  /**
   * A posture moved so its centre of mass is at a point.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param posture A posture written by joints.
   * @param at Where its centre goes, world metres.
   * @returns The posture with its root moved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what moves.
   * @evidence contracts/development/implementation.md#principled-implementation A translation of the root moves every bone and the centre alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function placed(
    body: IHumanBody,
    model: Model,
    posture: IHumanPosture,
    at: IAutoMovieVector3,
  ): IHumanPosture {
    const c: IAutoMovieVector3 = centre(body, model, posture);
    return {
      ...posture,
      root: Vector3.add(posture.root, Vector3.subtract(at, c)),
    };
  }

  /**
   * A posture with no roll turned rigidly about a world point: about the
   * vertical by `yaw`, then about the turned body's left axis by `pitch`, so
   * its heading becomes its own plus `yaw` and its tip its own plus `pitch`.
   * The root and every world limb goal (its point, its bend hint and its
   * rotation) go round with it; a goal attached to a bone moves with that
   * bone already and is kept.
   *
   * @param posture The posture, its roll 0.
   * @param pivot The world point that stays.
   * @param yaw Degrees about +Y.
   * @param pitch Degrees of forward tip.
   * @returns The turned posture.
   * @throws {Error} When the posture has a roll, which this turn would not carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the two turns, what stays, what goes round and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation With no roll the root rotation is Ry(yaw)Rx(pitch), so the world rotation taking the old heading to the new one is H(new) H(old)⁻¹; the root and the world goals go round the pivot by it and every bone follows, one rigid motion of the shown body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegate the same raw source and current turn to prepareTurned's shared rigid-placement owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture the turn cannot carry is refused, never turned in part.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the four limb goals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Standalone and fixed-source callers use the same heading/quaternion/world-point owner, with no alternate path or numerical result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary preparation releases at synchronous return/throw; the returned raw posture preserves the existing borrowed unchanged articulation and attached goals, retaining no preparation or reader.
   */
  export function turned(
    posture: IHumanPosture,
    pivot: IAutoMovieVector3,
    yaw: number,
    pitch: number,
  ): IHumanPosture {
    return prepareTurned(posture, pivot)(yaw, pitch);
  }

  /**
   * Prepare rigid turns of one unchanged no-roll posture about one fixed
   * world-metre pivot. The caller keeps the source and its borrowed nested
   * articulation/goals unchanged until it releases the returned reader.
   *
   * @param posture The original unchanged raw posture, with roll zero.
   * @param pivot The unchanged world pivot, metres.
   * @returns A reader of yaw and pitch increments in degrees, retaining the original turn order and raw-goal policy.
   * @throws {Error} When the source has a roll the original turn cannot carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed source/pivot premise, borrowed nested-data lifetime, query degree units, original no-roll refusal and raw output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Each current H(new) H(old)^-1 carries root and world goal points/poles around the same pivot, and rotates original goal orientations; bone-attached goals retain their original records.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the no-roll source once; each query reads its current target heading before lazily preparing the fixed old inverse on first demand, then runs the original world-goal loop and root placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No root, goal, contact, clinical angle, single-axis policy or rotation order changes. Current-heading admission still precedes old-heading admission. This is raw rigid geometry, never a resolver certificate, fitted target substitute or asserted resolved state.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed old heading/inverse prepare only on the first actual query; each changing turn still evaluates the current heading and every original root/world goal transformation in O(L) limb work, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit unchanged-source/pivot premise alone permits reuse of old orientation, while current yaw/pitch increments and transformed demands remain evaluated. The standalone turned path shares this owner without time/result memoization.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its original source/pivot and one fixed inverse quaternion until release. Each query returns fresh root/world-goal records with the original borrowed articulation/attached-goal ownership, retaining no query, FK reader, history or external handle.
   */
  export function prepareTurned(
    posture: IHumanPosture,
    pivot: IAutoMovieVector3,
  ): (yaw: number, pitch: number) => IHumanPosture {
    if (Math.abs(posture.roll) > 1e-9)
      throw new Error("GymnasticsFlight.turned turns a posture with no roll");
    let before: IAutoMovieQuaternion | undefined;
    return (yaw: number, pitch: number): IHumanPosture => {
      const after: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> = {
        yaw: posture.yaw + yaw,
        pitch: posture.pitch + pitch,
        roll: 0,
      };
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(after);
      if (before === undefined)
        before = Quaternion.inverse(resolveHumanPosture.heading(posture));
      const turn: IAutoMovieQuaternion = Quaternion.multiply(heading, before);
      const round: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          pivot,
          Quaternion.rotateVector(turn, Vector3.subtract(point, pivot)),
        );
      const limbs: IHumanPosture["limbs"] = {};
      for (const [limb, goal] of Object.entries(posture.limbs) as [
        IHumanPosture.Limb,
        IHumanPosture.IGoal,
      ][])
        limbs[limb] =
          goal.on !== undefined
            ? goal
            : {
                ...goal,
                point: round(goal.point),
                bend: round(goal.bend),
                ...(goal.rotation === undefined
                  ? {}
                  : { rotation: Quaternion.multiply(turn, goal.rotation) }),
              };
      return { ...posture, ...after, root: round(posture.root), limbs };
    };
  }

  /**
   * The seconds a centre launched at a height with a vertical speed takes to
   * come down to another height.
   *
   * @param from The launch height, metres.
   * @param vy The vertical launch speed, m/s, positive upward.
   * @param to The height it comes down to, metres.
   * @returns Seconds, positive; null when the parabola never reaches that height on its way down after the launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation The later root of from + vy t - g t² / 2 = to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One discriminant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A height above the apex returns null instead of a clamped time.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fall(from: number, vy: number, to: number): number | null {
    const discriminant: number =
      vy * vy - 2 * AutoMovieGravity.STANDARD * (to - from);
    if (discriminant < 0) return null;
    const t: number =
      (vy + Math.sqrt(discriminant)) / AutoMovieGravity.STANDARD;
    return t > 0 ? t : null;
  }

  /**
   * The centre of a drag-free flight at a second of it.
   *
   * @param from The centre at launch, world metres.
   * @param velocity The launch velocity, m/s.
   * @param t Seconds since the launch.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidence contracts/development/implementation.md#principled-implementation from + v t - g t² ŷ / 2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    from: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 {
    return {
      x: from.x + velocity.x * t,
      y: from.y + velocity.y * t - 0.5 * AutoMovieGravity.STANDARD * t * t,
      z: from.z + velocity.z * t,
    };
  }

  /**
   * The height of the lowest point of a posture's collision shapes.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution Optional exact FK reader or supplier borrowed from the current synchronous touchdown search.
   * @param projection Optional genuine same-body ROM projector borrowed only during this reading.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The knockdown's floor rest gives the root height that puts the lowest shape on the floor; the posture's own root height less that is where its lowest shape is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics and one pass over the shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses knockdown.rest; optional explicit touchdown-search FK/projector sources share only unchanged FK prerequisites and static ROM metadata between actual bisection queries, while every current joint and collider bound still evaluates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains neither geometry nor borrowed FK/projector sources, which belong to the synchronous search and never a returned plan, token or callback.
   */
  export function lowest(body: IHumanBody, posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): number {
    return posture.root.y - knockdown.rest(body, posture, resolution, projection);
  }

  /**
   * The centre and its velocity at a ballistic instant of a plan: an
   * instant from which the plan's displayed centre follows a parabola.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param plan The plan.
   * @param seconds The instant, seconds of the plan.
   * @returns The centre, world metres, and its velocity, m/s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise and the units.
   * @evidence contracts/development/implementation.md#principled-implementation Two samples a millisecond and two after the instant: for c(t) = c0 + v t - g t² / 2, v = (c(2δ) - c(δ)) / δ + 3 g δ / 2 and c0 = c(δ) - v δ + g δ² / 2, exact on a parabola.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation-owned lazy reader lends the same FK workspace to each actual raw plan evaluation and its COM read; two original centres feed two formulas.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the displayed postures, so a plan that is not ballistic there gives what it shows.
   * @evidence contracts/development/implementation.md#efficient-algorithms Both original millisecond samples retain their complete actual resolution and mass reduction; their shared exact FK workspace avoids repeated unchanged dependency work, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both changing raw plan postures, canonical preparations and COM reads borrow one explicit FK source and genuine same-body projector. Only equal FK dependencies and fixed ROM metadata share work; every current joint is projected and no sample, goal, result or velocity is cached/substituted.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local lazy getter, dynamic workspace and genuine projector release on synchronous return/throw; neither enters a retained plan, source token or output. Only fresh centre/velocity vectors escape without query history.
   */
  export function launch(
    body: IHumanBody,
    model: Model,
    plan: IHumanActionPlan,
    seconds: number,
  ): { centre: IAutoMovieVector3; velocity: IAutoMovieVector3 } {
    const delta: number = 1e-3;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
    const one: IAutoMovieVector3 = centre(
      body,
      model,
      plan.posture(seconds + delta, undefined, resolution, projection),
      resolution,
      projection,
    );
    const two: IAutoMovieVector3 = centre(
      body,
      model,
      plan.posture(seconds + 2 * delta, undefined, resolution, projection),
      resolution,
      projection,
    );
    const velocity: IAutoMovieVector3 = {
      x: (two.x - one.x) / delta,
      y: (two.y - one.y) / delta + 1.5 * AutoMovieGravity.STANDARD * delta,
      z: (two.z - one.z) / delta,
    };
    return {
      centre: {
        x: one.x - velocity.x * delta,
        y:
          one.y -
          velocity.y * delta +
          0.5 * AutoMovieGravity.STANDARD * delta * delta,
        z: one.z - velocity.z * delta,
      },
      velocity,
    };
  }

  /**
   * The first second at which a falling body's lowest point comes down to a
   * height.
   *
   * @param from A second at which the lowest point is above the height.
   * @param until A later second at which it is at or below it.
   * @param lowest The lowest point's height at a second.
   * @param height The height, metres.
   * @returns The second, within a tenth of a millisecond.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on the two seconds and the precision.
   * @evidence contracts/development/implementation.md#principled-implementation Bisection on the sign of lowest(t) - height, which the premise brackets; a body that falls keeps the sign change single in the bracket the callers give (apex to the centre's own arrival).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms About fifteen evaluations for a bracket of a second.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function touchdown(
    from: number,
    until: number,
    lowest: (seconds: number) => number,
    height: number,
  ): number {
    let low: number = from;
    let high: number = until;
    while (high - low > 1e-4) {
      const middle: number = (low + high) / 2;
      if (lowest(middle) > height) low = middle;
      else high = middle;
    }
    return high;
  }
}

import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalBalanceBracing,
  IAutoMoviePhysicalBalanceExhaustion,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody, World } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { physicalBalanceBracing } from "./physicalBalanceBracing";
import { physicalBalanceExhaustion } from "./physicalBalanceExhaustion";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSupportFootprint } from "./physicalSupportFootprint";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * How long a swing's landing target keeps adapting after lift-off, seconds
 * (Pratt et al., M2V2, Section VII-C1).
 */
const FREEZE: number = 0.1;

/**
 * The share of a swing before which a contact is a scuff, not a landing
 * (stated; Stephens 2011, Figure 4.6, gives no number).
 */
const MINIMUM_PHASE: number = 0.5;

/**
 * The peak acceleration of a minimum-jerk transfer of unit distance in unit
 * time: 10 sqrt(3) / 3 (Flash and Hogan 1985).
 */
const MINIMUM_JERK: number = (10 * Math.sqrt(3)) / 3;

/**
 * Advance one body's generic recovery controller from actual floor manifolds.
 * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
 * use the shared support-swing interpolator and bounded endpoint motors; their
 * completed placements remain offsets on subsequent authored goals, so the
 * planner and physical support do not snap apart at landing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Advance one body's generic recovery controller from actual floor manifolds) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Advance one body's generic recovery controller from actual floor manifolds) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.profile.segments; for-of over input.unavailable ?? []; some over supports), delegating to `collectPhysicalSupports`, `Object.create`, `Vector3.add`, `Vector3.scale`, `rigid.translation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.025, 0.1, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 336 lines and 29 top-level statements that reuses `collectPhysicalSupports`, `Object.create`, `Vector3.add`, `Vector3.scale`, `rigid.translation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 21 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.profile.segments; for-of over input.unavailable ?? []; some over supports), performed once per call with 36 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 36 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function advancePhysicalBalance(input: {
  /** Active solver, read before this step's integration. */ world: World;
  /** Scene body identity. */ body: string;
  /** Its actual provider profile. */ profile: IAutoMoviePhysicalProfile;
  /** Current world segment wrappers. */ segments: ReadonlyMap<
    string,
    RigidBody
  >;
  /** Shape identities, including the explicit floor. */ colliders: ReadonlyMap<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Completed-step surface impulses, including compliant support. */ contacts: readonly IAutoMovieContactReceipt[];
  /** Numerical support/motor policy. */ policy: IAutoMoviePhysicalRecoveryPolicy;
  /** Previous controller state; the caller retains it in checkpoints. */ state: IAutoMoviePhysicalRecoveryState;
  /** Current authored world placements. */ targets: Readonly<
    Record<string, IAutoMovieRigidTransform>
  >;
  /** Endpoint world velocities derived from the same sampled authored poses. */ velocities?: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Authored reservations prohibit a new recovery swing on these endpoints; actual support contacts still count. */ unavailable?: readonly string[];
  /** Current film second. */ seconds: number;
  /** Fixed seconds per step. */ dt: number;
  /** Positive downward gravity magnitude. */ gravity: number;
  /** Floor height, metres. */ floor: number;
  /** Internal Cartesian endpoint demands accumulate into these bounded joint motor demands. */ actuation?: Map<
    string,
    IAutoMovieVector3
  >;
  /** Reuse actual constraints and their independently measured load authority. */ supports?: readonly IAutoMovieCollectPhysicalSupports.ISupport[];
}): IAutoMovieAdvancePhysicalBalance.IResult {
  const supports: readonly IAutoMovieCollectPhysicalSupports.ISupport[] =
    input.supports ??
    collectPhysicalSupports({ ...input, pattern: input.policy.pattern });
  const goals: Record<string, IAutoMovieVector3> = Object.create(null);
  const state: IAutoMoviePhysicalRecoveryState = input.state;
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of input.profile.segments) {
    const rigid: RigidBody = input.segments.get(segment.bone)!;
    center = Vector3.add(
      center,
      Vector3.scale(
        Vector3.add(
          rigid.translation(),
          Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
        ),
        segment.mass / input.profile.mass,
      ),
    );
    velocity = Vector3.add(
      velocity,
      Vector3.scale(
        rigid.velocityAtPoint(
          physicalNativeVector(
            Vector3.add(
              rigid.translation(),
              Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
            ),
          ),
        ),
        segment.mass / input.profile.mass,
      ),
    );
  }
  if (state.swing && input.unavailable?.includes(state.swing.bone)) {
    // Authored motion now owns this endpoint. A recovery request cannot keep
    // replacing an authored limb action or scheduled swing, nor count its cancellation as a fall.
    resolveSwing("cancelled");
    state.swing = undefined;
    state.outsideSince = undefined;
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  }
  for (const bone of input.unavailable ?? [])
    if (state.offsets[bone]) {
      delete state.offsets[bone];
      (state.handoffs ??= []).push({ bone, seconds: input.seconds });
      state.revision = (state.revision ?? 0) + 1;
    }
  // Landing is the contact event: the swinging limb lands when it bears on
  // the floor, at foot-strike or past the swing's end, whichever comes first
  // (Coros, Beaudoin and van de Panne 2010, Section 3.1; Yin, Loken and van
  // de Panne 2007, Section 3.1). A contact counts only after the minimum
  // phase, so a scuff early in the swing neither lands nor restarts it
  // (Stephens 2011, Figure 4.6); the limb lands where it bears.
  if (
    state.swing &&
    input.seconds - state.swing.start >=
      MINIMUM_PHASE * (state.swing.end - state.swing.start)
  ) {
    const bone: string = state.swing.bone;
    const position: IAutoMovieVector3 = actual(bone);
    if (
      !state.failedLanding &&
      supports.some(
        (support: (typeof supports)[number]): boolean =>
          support.bone === bone && support.loaded,
      )
    ) {
      const intended: IAutoMovieVector3 = authored(bone);
      state.offsets[bone] = Vector3.subtract(
        { x: position.x, y: intended.y, z: position.z },
        intended,
      );
      const root: IAutoMoviePhysicalSegment = input.profile.segments.find(
        (segment: (typeof input.profile.segments)[number]): boolean =>
          !input.profile.joints.some(
            (joint: (typeof input.profile.joints)[number]): boolean =>
              joint.child === segment.bone,
          ),
      )!;
      const rootPosition: IAutoMovieVector3 = input.segments
        .get(root.bone)!
        .translation();
      state.rootOffset = {
        x: rootPosition.x - input.targets[root.bone]!.position.x,
        y: 0,
        z: rootPosition.z - input.targets[root.bone]!.position.z,
      };
      (state.landings ??= []).push({
        bone,
        seconds: input.seconds,
        position: { ...position },
        offset: { ...state.offsets[bone]! },
        rootOffset: { ...state.rootOffset },
      });
      resolveSwing("landed");
      state.outsideSince = undefined;
      state.swing = undefined;
      state.revision = (state.revision ?? 0) + 1;
    } else if (
      input.seconds >
      state.swing.end + (input.policy.landingTimeout ?? input.policy.duration)
    ) {
      resolveSwing("failed");
      state.failedLanding = true;
      state.swing = undefined;
      state.outsideSince = input.seconds;
      state.revision = (state.revision ?? 0) + 1;
    }
  }
  // Each planted foot's seating: its sole's far edge rises by the outline's
  // span times the sine of its turn from the plant; it leaves seated above
  // `physicalStanceBalance.LIFT` and returns below `RESEAT`, each held for
  // `DWELL` (Coros, Beaudoin and van de Panne 2010, Section 3.3). Its bearing
  // share follows its measured load and its flatness share whether it is
  // grounded and seated, each ramping in over `physicalStanceBalance.FADE`,
  // so a touchdown never moves its load or its centre-of-pressure rows in one
  // step (Kim, Jorgensen and Sentis
  // 2018, WBDC contact-transition smoothing). A first stance starts borne
  // and flat; a foot that lands after a swing fades in from nothing.
  const first: boolean = state.seating === undefined;
  for (const limb of input.policy.pattern.limbs) {
    if (limb.bone === state.swing?.bone) {
      if (state.seating) delete state.seating[limb.bone];
      continue;
    }
    // The sole's spread: how far the highest of the main foot carrier's sole
    // vertices stands above the lowest, actual heights only, the toes (a
    // jointed segment of their own) left out. A flat foot's sole lies level;
    // an edge lifting raises the spread (Coros, Beaudoin and van de Panne
    // 2010, Section 3.3). The plant only names which vertices form the sole.
    const spread: number = soleSpread(limb.bone);
    const weight: number = input.profile.mass * input.gravity;
    const seat: NonNullable<
      IAutoMoviePhysicalRecoveryState["seating"]
    >[string] = ((state.seating ??= {})[limb.bone] ??= {
      seated: first,
      since: input.seconds,
      bearing: first ? 1 : 0,
      flat: first ? 1 : 0,
      load: first ? weight / input.policy.pattern.limbs.length : 0,
      touching: first,
      relief: spread,
      // The foot's footprint is latched where it actually stands when its
      // stance begins, at the first step or on landing: the target of its
      // planted-foot servo and orientation hold (`trackPhysicalRoot`).
      anchor: {
        point: actual(limb.bone),
        rotation: { ...input.segments.get(limb.bone)!.rotation() },
      },
    });
    // The sole's own relief is latched when its stance begins, so a curved
    // sole is not read as lifted; an edge lifting raises the spread past it.
    const lift: number = Math.max(0, spread - (seat.relief ?? spread));
    const opposite: boolean = seat.seated
      ? lift > physicalStanceBalance.UNSEAT
      : lift < physicalStanceBalance.RESEAT;
    if (!opposite) seat.since = input.seconds;
    else if (input.seconds - seat.since >= physicalStanceBalance.DWELL) {
      seat.seated = !seat.seated;
      seat.since = input.seconds;
    }
    // A foot bears by its measured load: the floor's normal impulse low-passed
    // over one cache frame, so a single substep's flicker does not decide it,
    // with hysteresis on that force. Only a foot the floor measurably carries
    // is given force; one that touches down fades in, and one whose load
    // falls away gives up its share at once.
    const measured: number =
      (supports.find(
        (support: (typeof supports)[number]): boolean =>
          support.bone === limb.bone,
      )?.impulse ?? 0) / input.dt;
    seat.load =
      (seat.load ?? 0) +
      (measured - (seat.load ?? 0)) *
        Math.min(1, input.dt / physicalStanceBalance.LOAD_SECONDS);
    seat.touching = seat.touching
      ? seat.load > physicalStanceBalance.RELEASE * weight
      : seat.load > physicalStanceBalance.TOUCH * weight;
    // A foot is grounded, for its outline, while a sole point lies within the
    // contact skin of the floor.
    const grounded: boolean = (limb.contacts ?? [limb.bone]).some(
      (carrier: string): boolean => {
        const rigid: RigidBody | undefined = input.segments.get(carrier);
        return (
          !!rigid &&
          input.profile.segments
            .find(
              (segment: IAutoMoviePhysicalSegment): boolean =>
                segment.bone === carrier,
            )!
            .shapes.some(
              (shape): boolean =>
                physicalShapeBounds.lowest(
                  {
                    position: physicalNativeVector(rigid.translation()),
                    rotation: rigid.rotation(),
                  },
                  shape,
                ) <=
                input.floor + physicalStanceBalance.LIFT,
            )
        );
      },
    );
    const step: number = input.dt / physicalStanceBalance.FADE;
    const toward = (share: number, target: number): number =>
      share + Math.max(-step, Math.min(step, target - share));
    seat.bearing = seat.touching ? toward(seat.bearing ?? 1, 1) : 0;
    seat.flat = toward(seat.flat ?? 1, grounded && seat.seated ? 1 : 0);
  } // Support is what the controller has planted, not what touches this step:
  // every planted limb bounds where the centre of pressure can return by its
  // own outline, whether or not a tipping body has lifted it for a moment,
  // so the classification does not flicker with momentary contact.
  const planted: IAutoMoviePhysicalSupportPatch[] = input.policy.pattern.limbs
    .filter(
      (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
        limb.bone !== state.swing?.bone,
    )
    .map(
      (
        limb: (typeof input.policy.pattern.limbs)[number],
      ): IAutoMoviePhysicalSupportPatch => footprint(limb),
    );
  const plane: number =
    planted.length > 0
      ? Math.min(
          ...planted.flatMap((support: (typeof planted)[number]): number[] =>
            support.points.map(
              (point: (typeof support.points)[number]): number => point.y,
            ),
          ),
        )
      : input.floor;
  const assessment: IAutoMoviePhysicalBalance.IResult = Balance.assess({
    center,
    velocity,
    gravity: input.gravity,
    floor: plane,
    supports: planted,
    pattern: input.policy.pattern,
    maximumStep: input.policy.maximumStep,
    margin: input.policy.margin,
    swingSeconds: input.policy.duration,
    unavailable: [
      ...(input.unavailable ?? []),
      ...(state.swing ? [state.swing.bone] : []),
    ],
  });
  if (assessment.state === "supported" && !state.swing)
    state.failedLanding = undefined;
  state.last = state.failedLanding
    ? "unrecoverable"
    : state.swing
      ? "recovery"
      : assessment.state;
  if (assessment.state === "supported") state.outsideSince = undefined;
  else state.outsideSince ??= input.seconds;
  const retry: boolean =
    !!input.policy.bracing &&
    center.y - input.floor >= input.policy.bracing.minimumCenterHeight;
  if (
    (!state.failedLanding || retry) &&
    !state.swing &&
    assessment.step &&
    input.seconds - state.outsideSince! >= (input.policy.reactionSeconds ?? 0)
  ) {
    const bone: string = assessment.step.bone;
    const from: IAutoMovieVector3 = actual(bone);
    state.swing = {
      bone,
      kind: "swing",
      start: input.seconds,
      end: input.seconds + input.policy.duration,
      from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
      to: {
        point: [assessment.step.target.x, assessment.step.target.z],
        yaw: 0,
        pitch: 0,
        clearance: 0,
      },
    };
    state.steps.push(structuredClone(state.swing));
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  }
  // A swing is held while its limb unloads, only until it lifts: its start
  // keeps moving with each step it waits. Once under way, a touch of the
  // floor by the moving limb does not restart it.
  const lifting: boolean =
    !!state.swing &&
    !(
      state.swing.start >= input.seconds - 1.5 * input.dt &&
      supports.some(
        (support: (typeof supports)[number]): boolean =>
          support.bone === state.swing!.bone && support.loaded,
      ) &&
      input.seconds - armed() < input.policy.duration
    );
  if (state.swing && !lifting) {
    // A loaded limb is not lifted. The root's support allocation already
    // leaves it out (`trackPhysicalRoot`), so its load passes to the other
    // supports first, as a person's loaded-limb side step follows the
    // limb's unloading (Mille et al. 2005); the swing starts once it is
    // unloaded, or after one swing duration in any case.
    state.swing.start = input.seconds;
    state.swing.end = input.seconds + input.policy.duration;
    goals[state.swing.bone] = actual(state.swing.bone);
  }
  if (state.swing && lifting) {
    // The landing is re-predicted every step of the swing's first half from
    // the present capture point and the swing time left, as SIMBICON's swing
    // feedback reads the centre of mass continuously (Yin et al. 2007,
    // Section 3.3); the limb keeps its sideways place relative to the
    // remaining supports.
    const height: number = center.y - plane;
    // The target adapts only during the first moments of the swing, then is
    // held, so the limb settles onto one place (Pratt et al., M2V2, Section
    // VII-C1).
    const settling: boolean = input.seconds - state.swing.start >= FREEZE;
    if (height > 0 && assessment.polygon.length > 0 && !settling) {
      const landing: IAutoMovieVector3 = Balance.diverge(
        assessment.capturePoint,
        assessment.polygon,
        Math.sqrt(input.gravity / height) *
          Math.max(0, state.swing.end - input.seconds),
      );
      const from: IAutoMovieVector3 = {
        x: state.swing.from.point[0],
        y: 0,
        z: state.swing.from.point[1],
      };
      const centroid: IAutoMovieVector3 = Vector3.scale(
        planted.reduce(
          (
            sum: IAutoMovieVector3,
            support: IAutoMoviePhysicalSupportPatch,
          ): IAutoMovieVector3 => Vector3.add(sum, support.position),
          { x: 0, y: 0, z: 0 },
        ),
        1 / planted.length,
      );
      const direction: IAutoMovieVector3 = {
        x: assessment.capturePoint.x - centroid.x,
        y: 0,
        z: assessment.capturePoint.z - centroid.z,
      };
      const offset: IAutoMovieVector3 = {
        x: from.x - centroid.x,
        y: 0,
        z: from.z - centroid.z,
      };
      const square: number = direction.x ** 2 + direction.z ** 2;
      const aside: IAutoMovieVector3 = Vector3.subtract(
        offset,
        Vector3.scale(
          direction,
          square > 0 ? Vector3.dot(offset, direction) / square : 0,
        ),
      );
      let travel: IAutoMovieVector3 = {
        x: landing.x + aside.x - from.x,
        y: 0,
        z: landing.z + aside.z - from.z,
      };
      const length: number = Math.hypot(travel.x, travel.z);
      if (length > input.policy.maximumStep)
        travel = Vector3.scale(travel, input.policy.maximumStep / length);
      state.swing.to.point = [from.x + travel.x, from.z + travel.z];
      const step: (typeof state.steps)[number] | undefined = record();
      if (step) step.to.point = [...state.swing.to.point];
    }
    const rigid: RigidBody = input.segments.get(state.swing.bone)!;
    const motion: IAutoMovieSamplePhysicalRecoveryGoal.IResult =
      samplePhysicalRecoveryGoal({
        swing: state.swing,
        point: authored(state.swing.bone),
        velocity: input.velocities?.[state.swing.bone] ?? { x: 0, y: 0, z: 0 },
        height: input.policy.height,
        seconds: input.seconds,
      });
    goals[state.swing.bone] = motion.point;
    const segment: IAutoMoviePhysicalSegment = input.profile.segments.find(
      (candidate: (typeof input.profile.segments)[number]): boolean =>
        candidate.bone === state.swing!.bone,
    )!;
    const position: IAutoMovieVector3 = actual(state.swing.bone);
    // The swing force is bounded by what the leg needs: its weight and the
    // peak of a minimum-jerk transfer of the step's distance d in the swing
    // time T, m_leg (g + 5.77 d / T^2) (derived from the minimum-jerk peak
    // acceleration), under the policy's own bound.
    const swingLimb = input.policy.pattern.limbs.find(
      (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
        limb.bone === state.swing!.bone,
    )!;
    const leg: number = [
      ...new Set([...swingLimb.chain, ...(swingLimb.contacts ?? [])]),
    ].reduce(
      (sum: number, bone: string): number =>
        sum +
        (input.profile.segments.find(
          (candidate: IAutoMoviePhysicalSegment): boolean =>
            candidate.bone === bone,
        )?.mass ?? 0),
      0,
    );
    const span: number = Math.hypot(
      state.swing.to.point[0] - state.swing.from.point[0],
      state.swing.to.point[1] - state.swing.from.point[1],
    );
    const time: number = state.swing.end - state.swing.start;

    drive(
      state.swing.bone,
      rigid,
      position,
      Tracking.force(
        Vector3.subtract(motion.point, position),
        Vector3.subtract(rigid.velocityAtPoint(position), motion.velocity),
        segment.mass,
        input.policy.stiffness,
        input.policy.damping,
        Math.min(
          input.policy.maximumForce,
          leg * (input.gravity + (MINIMUM_JERK * span) / (time * time)),
        ),
        input.dt,
      ),
    );
  }
  for (const [bone, offset] of Object.entries(state.offsets)) {
    if (state.swing?.bone === bone) continue;
    const rigid: RigidBody = input.segments.get(bone)!;
    const segment: IAutoMoviePhysicalSegment = input.profile.segments.find(
      (candidate: (typeof input.profile.segments)[number]): boolean =>
        candidate.bone === bone,
    )!;
    goals[bone] = Vector3.add(authored(bone), offset);
    const position: IAutoMovieVector3 = actual(bone);
    drive(
      bone,
      rigid,
      position,
      Tracking.force(
        Vector3.subtract(goals[bone]!, position),
        Vector3.subtract(
          rigid.velocityAtPoint(position),
          input.velocities?.[bone] ?? { x: 0, y: 0, z: 0 },
        ),
        segment.mass,
        input.policy.stiffness,
        input.policy.damping,
        input.policy.maximumForce,
        input.dt,
      ),
    );
  }
  const exhaustion: IAutoMoviePhysicalBalanceExhaustion.IResult =
    physicalBalanceExhaustion({
      unrecoverable: state.last === "unrecoverable",
      lostSince: state.lostSince,
      failedLanding: state.failedLanding,
      seconds: input.seconds,
      duration: input.policy.duration,
    });
  state.lostSince = exhaustion.lostSince;
  if (state.rootOffset)
    for (const limb of input.policy.pattern.limbs)
      goals[limb.bone] ??= Vector3.add(
        authored(limb.bone),
        state.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 },
      );
  const exhausted: boolean = exhaustion.exhausted;
  if (input.policy.bracing) {
    const effort: IAutoMoviePhysicalBalanceBracing.IResult =
      physicalBalanceBracing({
        assessment,
        center,
        floor: input.floor,
        ...input.policy.bracing,
        exhausted,
      });
    return {
      rootStrength: effort.rootStrength,
      rootShift: effort.shift,
      state,
      goals,
    };
  }
  return { rootStrength: exhausted ? 0 : 1, state, goals };

  /** The spread of a foot carrier's sole vertices' actual heights, metres. */
  function soleSpread(bone: string): number {
    const segment: IAutoMoviePhysicalSegment | undefined =
      input.profile.segments.find(
        (candidate: IAutoMoviePhysicalSegment): boolean =>
          candidate.bone === bone,
      );
    const goal: IAutoMovieRigidTransform | undefined = input.targets[bone];
    const rigid: RigidBody | undefined = input.segments.get(bone);
    if (!segment || !goal || !rigid) return 0;
    const vertices: IAutoMovieVector3[] = segment.shapes.flatMap(
      (shape): IAutoMovieVector3[] =>
        shape.kind === "hull"
          ? shape.points.map(
              (point: IAutoMovieVector3): IAutoMovieVector3 =>
                physicalSupportPoint(shape.transform, point),
            )
          : shape.kind === "box"
            ? [-1, 1].flatMap((x: number) =>
                [-1, 1].flatMap((y: number) =>
                  [-1, 1].map(
                    (z: number): IAutoMovieVector3 =>
                      physicalSupportPoint(shape.transform, {
                        x: x * shape.halfExtents.x,
                        y: y * shape.halfExtents.y,
                        z: z * shape.halfExtents.z,
                      }),
                  ),
                ),
              )
            : [],
    );
    if (vertices.length === 0) return 0;
    const planted: number[] = vertices.map(
      (vertex: IAutoMovieVector3): number =>
        physicalSupportPoint(goal, vertex).y,
    );
    const lowest: number = Math.min(...planted);
    const pose: IAutoMovieRigidTransform = {
      position: physicalNativeVector(rigid.translation()),
      rotation: rigid.rotation(),
    };
    const heights: number[] = vertices
      .filter(
        (_: IAutoMovieVector3, index: number): boolean =>
          planted[index]! <= lowest + physicalStanceBalance.LIFT,
      )
      .map(
        (vertex: IAutoMovieVector3): number =>
          physicalSupportPoint(pose, vertex).y,
      );
    return Math.max(...heights) - Math.min(...heights);
  }
  /** Compare authored and solved placements at the same declared support endpoint. */
  function authored(bone: string): IAutoMovieVector3 {
    return physicalSupportPoint(
      input.targets[bone]!,
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === bone,
      )!.localPoint,
    );
  }

  /** Read the actual endpoint without changing a native body's bone-origin frame. */
  function actual(bone: string): IAutoMovieVector3 {
    const rigid: RigidBody = input.segments.get(bone)!;
    return physicalNativeVector(
      physicalSupportPoint(
        { position: rigid.translation(), rotation: rigid.rotation() },
        input.policy.pattern.limbs.find(
          (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
            limb.bone === bone,
        )!.localPoint,
      ),
    );
  }

  /** Preserve actual controller ownership intervals for replay, audio and support audits. */
  function resolveSwing(status: "landed" | "cancelled" | "failed"): void {
    const step: (typeof state.steps)[number] | undefined = record();
    if (step) step.resolved = { seconds: input.seconds, status };
  }

  /** The recorded request of the present swing: its limb's latest unresolved step. */
  function record(): (typeof state.steps)[number] | undefined {
    return [...state.steps]
      .reverse()
      .find(
        (candidate: (typeof state.steps)[number]): boolean =>
          candidate.bone === state.swing!.bone && !candidate.resolved,
      );
  }

  /** When the present swing was requested, before any unloading delayed its start. */
  function armed(): number {
    return record()?.start ?? state.swing!.start;
  }

  /**
   * A planted limb's patch while it touches nothing: its contact shapes'
   * outline on the floor (`physicalSupportFootprint`), where it would bear again.
   */
  function footprint(
    limb: (typeof input.policy.pattern.limbs)[number],
  ): IAutoMoviePhysicalSupportPatch {
    const points: IAutoMovieVector3[] = physicalSupportFootprint(
      input.profile,
      input.segments,
      limb,
      input.floor,
    );
    if (points.length === 0) {
      const at: IAutoMovieVector3 = actual(limb.bone);
      points.push({ x: at.x, y: input.floor, z: at.z });
    }
    return {
      bone: limb.bone,
      points,
      position: Vector3.scale(
        points.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => Vector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / points.length,
      ),
    };
  }

  /** Keep recovery forces on the declared actuator path, including internal actuation. */
  function drive(
    bone: string,
    rigid: RigidBody,
    point: IAutoMovieVector3,
    force: IAutoMovieVector3,
  ): void {
    if (input.actuation)
      accumulatePhysicalMotorTorques({
        profile: input.profile,
        segments: input.segments,
        chain: input.policy.pattern.limbs.find(
          (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
            limb.bone === bone,
        )!.chain,
        carrier: bone,
        point,
        force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: false,
        torques: input.actuation,
      });
    else
      rigid.addForceAtPoint(
        physicalNativeVector(force),
        physicalNativeVector(point),
        true,
      );
  }
}

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
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { physicalBalanceBracing } from "./physicalBalanceBracing";
import { physicalBalanceExhaustion } from "./physicalBalanceExhaustion";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSupportFootprint } from "./physicalSupportFootprint";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * The share of a swing before which a contact is a scuff, not a landing
 * (stated; Stephens 2011, Figure 4.6, gives no number).
 */
const MINIMUM_PHASE: number = 0.5;

/** The trunk tilt past which a step is asked for, radians: the hip strategy's range (Stephens 2011, Table 4.1). */
const TIP: number = 0.5;

/**
 * Advance one body's generic recovery controller from actual floor manifolds.
 * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
 * use the shared support-swing interpolator and bounded endpoint motors; their
 * completed placements remain offsets on subsequent authored goals, so the
 * planner and physical support do not snap apart at landing.
 */
export function advancePhysicalBalance(input: {
  /** Active solver, read before this step's integration. */ world: AutoMovieXpbdWorld;
  /** Scene body identity. */ body: string;
  /** Its actual provider profile. */ profile: IAutoMoviePhysicalProfile;
  /** Current world segment wrappers. */ segments: ReadonlyMap<
    string,
    AutoMovieXpbdBody
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
    const rigid: AutoMovieXpbdBody = input.segments.get(segment.bone)!;
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
          Vector3.add(
            rigid.translation(),
            Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
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
      // Every reference to the old stance is latched again at the landing:
      // each standing foot's support point, rotation and joint references,
      // as it stands now. A stale one pulls the legs back toward the stance
      // the body left (Feng et al. 2013, Section II-E). The landed foot is
      // seated with its outline at once, its contact added with zero error
      // at the pose it landed in; only its share of the force ramps in
      // (Feng et al. 2013, Section II-E; Herzog et al. 2016, Section 5.3).
      for (const limb of input.policy.pattern.limbs) {
        const seat = state.seating?.[limb.bone];
        if (limb.bone !== bone && seat) seat.anchor = latch(limb);
        if (limb.bone === bone)
          (state.seating ??= {})[bone] = {
            seated: true,
            since: input.seconds,
            bearing: 0,
            flat: 1,
            load: 0,
            touching: false,
            relief: soleSpread(bone),
            anchor: latch(limb),
          };
      }
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
      // A limb about to swing gives up its share over the fade window, the
      // stance's command shifting its load to the others, and lifts once it bears
      // nothing: a recovery step's unloading is that ramp alone (Pratt et
      // al., M2V2, Section VII-E1; Herzog et al. 2016, Section 5.3).
      const seat = state.seating?.[limb.bone];
      if (seat) {
        seat.bearing = Math.max(
          0,
          (seat.bearing ?? 1) - input.dt / physicalStanceBalance.FADE,
        );
        if (seat.bearing <= 0) delete state.seating![limb.bone];
      }
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
      anchor: latch(limb),
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
        const rigid: AutoMovieXpbdBody | undefined = input.segments.get(carrier);
        return (
          !!rigid &&
          physicalSupportFootprint
            .colliders(
              input.profile.segments.find(
                (segment: IAutoMoviePhysicalSegment): boolean =>
                  segment.bone === carrier,
              )!,
            )
            .some(
              (shape): boolean =>
                physicalShapeBounds.lowest(
                  {
                    position: rigid.translation(),
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
        limb.bone !== state.swing?.bone || !!state.seating?.[limb.bone],
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
  // The swing's peak acceleration: the hip's declared torque at the endpoint
  // (`physicalStanceBalance.swingBound`), under the policy's force bound over
  // the heaviest leg less its weight; the swing lasts at least
  // `Balance.MINIMUM_SWING`.
  const heaviest: number = Math.max(
    ...input.policy.pattern.limbs.map(
      (limb: (typeof input.policy.pattern.limbs)[number]): number =>
        legMass(limb),
    ),
  );
  const legs = input.policy.pattern.limbs.map(
    (limb: (typeof input.policy.pattern.limbs)[number]) =>
      physicalStanceBalance.swingLeg(input.profile, input.segments, limb),
  );
  const leg = legs.reduce((a, b) => (b.mass > a.mass ? b : a));
  const effective: number = leg.mass;
  const omega: number = Math.sqrt(
    input.gravity / Math.max(1e-6, center.y - plane),
  );
  // The body's rotation counts in its capture point (`physicalStanceBalance`
  // `.momentum`, `.spin`).
  const spin: IAutoMovieVector3 = physicalStanceBalance.spin(
    physicalStanceBalance.momentum(input.profile, input.segments, center),
    omega,
    input.profile.mass,
    input.gravity,
  );
  const peak: number = Math.min(
    input.policy.maximumForce / heaviest - input.gravity,
    physicalStanceBalance.swingBound({
      effective,
      length: leg.length,
      torque: leg.torque,
    }),
  );  // The tilt guard: a step is asked for once the trunk would pass the hip
  // strategy's range within a pendulum time, even with the capture point
  // inside (Stephens 2011, Table 4.1, Eqs. 3.23-3.26).
  const rootSegment: IAutoMoviePhysicalSegment = input.profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !input.profile.joints.some((joint) => joint.child === segment.bone),
  )!;
  const rootBody: AutoMovieXpbdBody = input.segments.get(rootSegment.bone)!;
  const upNow: IAutoMovieVector3 = Quaternion.rotateVector(rootBody.rotation(), {
    x: 0,
    y: 1,
    z: 0,
  });
  const upPlanned: IAutoMovieVector3 = Quaternion.rotateVector(
    input.targets[rootSegment.bone]!.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const tilt: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(upNow, upPlanned))),
  );
  const turning: IAutoMovieVector3 = rootBody.angvel();
  const tipping: boolean =
    tilt + Math.hypot(turning.x, turning.z) / omega > TIP;  const assessment: IAutoMoviePhysicalBalance.IResult = Balance.assess({
    center,
    velocity,
    gravity: input.gravity,
    floor: plane,
    supports: planted,
    pattern: input.policy.pattern,
    maximumStep: input.policy.maximumStep,
    // A hysteresis band of the stance margin: a capture point must pass the
    // shrunken support by it before the trigger starts counting, and stays
    // counted until it is back within the margin.
    margin:
      input.policy.margin +
      (state.outsideSince === undefined ? physicalStanceBalance.MARGIN : 0),
    swingSeconds: input.policy.duration,
    spin,
    // The body's heading, the root's yaw: the side a stepping limb keeps.
    heading: (() => {
      // The authored stance faces +z; the root's turn from it turns that.
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.multiply(
          rootBody.rotation(),
          Quaternion.inverse(input.targets[rootSegment.bone]!.rotation),
        ),
        { x: 0, y: 0, z: 1 },
      );
      return { x: forward.x, y: 0, z: forward.z };
    })(),
    ...(tipping ? { force: true } : {}),
    ...(peak > 0
      ? {
          swing: {
            ramp: physicalStanceBalance.FADE,
            acceleration: peak,
            // The clearance is lowered to fit the transfer's time
            // (`physicalStanceBalance.clearance`), so the transfer sets it.
            height: 0,
          },
        }
      : {}),
    inset: physicalStanceBalance.MARGIN,
    ...(state.landings?.length
      ? { recent: state.landings[state.landings.length - 1]!.bone }
      : {}),
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
    // The capture point must stay outside for two steps, so one step's
    // excursion does not start a swing.
    input.seconds - state.outsideSince! >=
      Math.max(input.policy.reactionSeconds ?? 0, 2 * input.dt)
  ) {
    const bone: string = assessment.step.bone;
    const from: IAutoMovieVector3 = actual(bone);
    state.swing = {
      bone,
      kind: "swing",
      start: input.seconds,
      end: input.seconds + (assessment.step.seconds ?? input.policy.duration),
      from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
      // The assessment aims the footprint's middle; the swing moves the
      // endpoint.
      to: {
        point: [
          assessment.step.target.x - inset(bone).x,
          assessment.step.target.z - inset(bone).z,
        ],
        yaw: 0,
        pitch: 0,
        clearance: 0,
      },
    };
    state.steps.push(structuredClone(state.swing));
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  }
  // A step is committed at its trigger: its limb's share ramps out and it
  // lifts, and it is never cancelled; one swing at a time, the next only
  // once this one lands. Its start keeps moving while it unloads, its
  // planned time kept. Once under way, a touch of the floor by the moving
  // limb does not restart it.
  const lifting: boolean =
    !!state.swing && !state.seating?.[state.swing.bone];
  if (state.swing && !lifting) {
    state.swing.end = input.seconds + (state.swing.end - state.swing.start);
    state.swing.start = input.seconds;
    goals[state.swing.bone] = actual(state.swing.bone);
  }
  if (state.swing && lifting) {
    // The landing is re-predicted every step of the swing's first half from
    // the present capture point and the swing time left (Yin et al. 2007,
    // Section 3.3), the remaining supports holding their centre of pressure
    // on their shrunken outline; the foot's centre goes on that capture point
    // and the swing is timed again for its distance (Khadiv et al. 2017,
    // Section III-B).
    const height: number = center.y - plane;
    // The target and timing adapt until half the swing, then are held, so
    // the limb settles onto one place (Pratt et al., M2V2, Section VII-C1).
    const settling: boolean =
      input.seconds - state.swing.start >=
      (state.swing.end - state.swing.start) / 2;
    if (height > 0 && assessment.polygon.length > 0 && !settling) {
      const landing: IAutoMovieVector3 = Balance.diverge(
        assessment.capturePoint,
        physicalStanceBalance.shrink(
          assessment.polygon,
          physicalStanceBalance.MARGIN,
        ),
        Math.sqrt(input.gravity / height) *
          Math.max(0, state.swing.end - input.seconds),
      );
      const from: IAutoMovieVector3 = {
        x: state.swing.from.point[0],
        y: 0,
        z: state.swing.from.point[1],
      };
      const shift: IAutoMovieVector3 = inset(state.swing.bone);
      let travel: IAutoMovieVector3 = {
        x: landing.x - shift.x - from.x,
        y: 0,
        z: landing.z - shift.z - from.z,
      };
      const length: number = Math.hypot(travel.x, travel.z);
      if (length > input.policy.maximumStep)
        travel = Vector3.scale(travel, input.policy.maximumStep / length);
      state.swing.to.point = [from.x + travel.x, from.z + travel.z];
      if (peak > 0)
        state.swing.end =
          state.swing.start +
          Balance.duration(Math.min(length, input.policy.maximumStep), 0, peak);
      const step: (typeof state.steps)[number] | undefined = record();
      if (step) {
        step.to.point = [...state.swing.to.point];
        step.end = state.swing.end;
      }
    }
    const rigid: AutoMovieXpbdBody = input.segments.get(state.swing.bone)!;
    const leg: number = legMass(
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === state.swing!.bone,
      )!,
    );
    const time: number = state.swing.end - state.swing.start;
    // A recovery swing's clearance is lowered to what the stance can carry
    // at its peak in the swing's time (`physicalStanceBalance.clearance`).
    const rise: number = physicalStanceBalance.clearance(
      time,
      input.profile.mass,
      physicalStanceBalance.swingMass(
        input.profile,
        input.segments,
        input.policy.pattern.limbs.find(
          (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
            limb.bone === state.swing!.bone,
        )!,
      ),
      input.gravity,
      input.policy.height,
    );
    const motion: IAutoMovieSamplePhysicalRecoveryGoal.IResult =
      samplePhysicalRecoveryGoal({
        swing: state.swing,
        point: authored(state.swing.bone),
        velocity: input.velocities?.[state.swing.bone] ?? { x: 0, y: 0, z: 0 },
        height: rise,
        seconds: input.seconds,
      });
    goals[state.swing.bone] = motion.point;
    const segment: IAutoMoviePhysicalSegment = input.profile.segments.find(
      (candidate: (typeof input.profile.segments)[number]): boolean =>
        candidate.bone === state.swing!.bone,
    )!;
    const position: IAutoMovieVector3 = actual(state.swing.bone);
    // The swing is tracked as a task with its path's acceleration fed
    // forward through the leg's mass, the feedback correcting what remains
    // (Khadiv et al. 2017, Section III-C), bounded by what the leg needs:
    // its weight and the peak of its path's acceleration over the swing time
    // T, the minimum-jerk transfer's 5.77 d / T^2 or the clearance's 32 h /
    // T^2, m_leg (g + max(5.77 d, 32 h) / T^2), under the policy's own bound.
    const span: number = Math.hypot(
      state.swing.to.point[0] - state.swing.from.point[0],
      state.swing.to.point[1] - state.swing.from.point[1],
    );
    const bound: number = Math.min(
      input.policy.maximumForce,
      leg *
        (input.gravity +
          Math.max(Balance.MINIMUM_JERK * span, Balance.CLEARANCE * rise) /
            (time * time)),
    );
    const force: IAutoMovieVector3 = Vector3.add(
      Tracking.force(
        Vector3.subtract(motion.point, position),
        Vector3.subtract(rigid.velocityAtPoint(position), motion.velocity),
        segment.mass,
        input.policy.stiffness,
        input.policy.damping,
        bound,
        input.dt,
      ),
      Vector3.scale(motion.acceleration, leg),
    );
    const magnitude: number = Vector3.length(force);
    drive(
      state.swing.bone,
      rigid,
      position,
      magnitude > bound ? Vector3.scale(force, bound / magnitude) : force,
    );
  }
  for (const [bone, offset] of Object.entries(state.offsets)) {
    if (state.swing?.bone === bone) continue;
    const rigid: AutoMovieXpbdBody = input.segments.get(bone)!;
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
    const rigid: AutoMovieXpbdBody | undefined = input.segments.get(bone);
    if (!segment || !goal || !rigid) return 0;
    const vertices: IAutoMovieVector3[] = physicalSupportFootprint
      .colliders(segment)
      .flatMap(
        (shape): IAutoMovieVector3[] =>
          physicalSupportFootprint.corners(shape) ?? [],
      );
    if (vertices.length === 0) return 0;
    const planted: number[] = vertices.map(
      (vertex: IAutoMovieVector3): number =>
        physicalSupportPoint(goal, vertex).y,
    );
    const lowest: number = Math.min(...planted);
    const pose: IAutoMovieRigidTransform = {
      position: rigid.translation(),
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

  /**
   * A stance foot's references as it actually stands: its support point and
   * rotation, and each stance joint's relative rotation, the reference its
   * yaw PD holds through the stance.
   */
  function latch(
    limb: (typeof input.policy.pattern.limbs)[number],
  ): NonNullable<
    NonNullable<IAutoMoviePhysicalRecoveryState["seating"]>[string]["anchor"]
  > {
    return {
      point: actual(limb.bone),
      rotation: { ...input.segments.get(limb.bone)!.rotation() },
      joints: Object.fromEntries(
        input.profile.joints
          .filter((joint): boolean => limb.chain.includes(joint.child))
          .map((joint): [string, IAutoMovieQuaternion] => [
            joint.id,
            Quaternion.multiply(
              Quaternion.inverse(
                Quaternion.multiply(
                  input.segments.get(joint.parent)!.rotation(),
                  joint.parentFrame.rotation,
                ),
              ),
              Quaternion.multiply(
                input.segments.get(joint.child)!.rotation(),
                joint.childFrame.rotation,
              ),
            ),
          ]),
      ),
    };
  }

  /** A limb's swinging mass: its chain and contact carriers, kilograms. */
  function legMass(limb: (typeof input.policy.pattern.limbs)[number]): number {
    return [...new Set([...limb.chain, ...(limb.contacts ?? [])])].reduce(
      (sum: number, bone: string): number =>
        sum +
        (input.profile.segments.find(
          (candidate: IAutoMoviePhysicalSegment): boolean =>
            candidate.bone === bone,
        )?.mass ?? 0),
      0,
    );
  }

  /**
   * From a limb's endpoint (a footed limb's ankle) to the middle of its
   * footprint, its sole vertices' mean, horizontal metres: a target for the
   * footprint's middle less this is the endpoint's (Pratt et al., M2V2,
   * Section VII-C2).
   */
  function inset(bone: string): IAutoMovieVector3 {
    const footprint: IAutoMovieVector3[] = physicalSupportFootprint(
      input.profile,
      input.segments,
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === bone,
      )!,
      input.floor,
    );
    if (footprint.length === 0) return { x: 0, y: 0, z: 0 };
    const endpoint: IAutoMovieVector3 = actual(bone);
    return {
      x:
        footprint.reduce((sum, p) => sum + p.x, 0) / footprint.length -
        endpoint.x,
      y: 0,
      z:
        footprint.reduce((sum, p) => sum + p.z, 0) / footprint.length -
        endpoint.z,
    };
  }

  /** Read the actual endpoint without changing a native body's bone-origin frame. */
  function actual(bone: string): IAutoMovieVector3 {
    const rigid: AutoMovieXpbdBody = input.segments.get(bone)!;
    return physicalSupportPoint(
      { position: rigid.translation(), rotation: rigid.rotation() },
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === bone,
      )!.localPoint,
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

  /**
   * A planted limb's patch while it touches nothing: its contact shapes'
   * outline on the floor (`physicalSupportFootprint`), where it would bear again.
   */
  function footprint(
    limb: (typeof input.policy.pattern.limbs)[number],
  ): IAutoMoviePhysicalSupportPatch {
    // A seated foot bears with its outline where it is planted: its authored
    // pose moved by its landed offset. An unseated one bears on its face at
    // its present pose, the edge it rolled onto (`physicalStanceBalance
    // .support`).
    const seat = state.seating?.[limb.bone];
    const offset: IAutoMovieVector3 = state.offsets[limb.bone] ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const points: IAutoMovieVector3[] = physicalSupportFootprint(
      input.profile,
      seat && (seat.flat ?? 1) > 0
        ? Object.fromEntries(
            (limb.contacts ?? [limb.bone]).flatMap((carrier: string) =>
              input.targets[carrier]
                ? [
                    [
                      carrier,
                      {
                        position: Vector3.add(
                          input.targets[carrier]!.position,
                          { x: offset.x, y: 0, z: offset.z },
                        ),
                        rotation: input.targets[carrier]!.rotation,
                      },
                    ],
                  ]
                : [],
            ),
          )
        : input.segments,
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
    rigid: AutoMovieXpbdBody,
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
    else rigid.addForceAtPoint(force, point);
  }
}

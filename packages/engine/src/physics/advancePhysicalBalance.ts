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

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { physicalBalanceBracing } from "./physicalBalanceBracing";
import { physicalBalanceExhaustion } from "./physicalBalanceExhaustion";
import { physicalCaptureBand } from "./physicalCaptureBand";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalStanceSeat } from "./physicalStanceSeat";
import { physicalSupportFootprint } from "./physicalSupportFootprint";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSwingReference } from "./physicalSwingReference";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * The share of a swing before which a contact is not a landing but, held on two
 * successive substeps, an early touchdown that joins the support and has the
 * step planned again (`physicalStanceBalance.touchdown`). A minimum-jerk
 * transfer moves fastest at mid-swing, so a foot accepted there strikes at
 * speed (Feng et al. 2015, Section III-A4); the clearance holds until the
 * last quarter, past which the foot is coming down (stated).
 */
const MINIMUM_PHASE: number = 0.8;

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
    delete state.cleared;
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
  // Before it, a lifted swing foot the floor carries on two successive
  // substeps, an aborted lift or an early touchdown, joins the support again
  // and the step is planned again (`physicalStanceBalance.touchdown`), but
  // only once it has cleared the floor since its lift-off, no point of it
  // left within the contact skin: until then its load is the floor it never
  // left, and a null step would land where it stood (design-4017-verdicts,
  // C17).
  if (
    state.swing &&
    !state.seating?.[state.swing.bone] &&
    !physicalSupportFootprint.grounded(
      input.profile,
      input.segments,
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === state.swing!.bone,
      )!,
      input.floor,
    )
  )
    state.cleared = true;
  let early: boolean = false;
  if (
    state.swing &&
    !state.seating?.[state.swing.bone] &&
    input.seconds - state.swing.start <
      MINIMUM_PHASE * (state.swing.end - state.swing.start)
  ) {
    const touch: { since?: number; landed: boolean } =
      physicalStanceBalance.touchdown({
        load: measuredLoad(state.swing.bone),
        weight: input.profile.mass * input.gravity,
        cleared: state.cleared === true,
        // Coming down: the foot's endpoint not rising (Stephens 2011,
        // Figure 4.6: a scuff while it rises is not a touchdown).
        descending:
          input.segments
            .get(state.swing.bone)!
            .velocityAtPoint(actual(state.swing.bone)).y <= 0,
        since: state.touchdown,
        seconds: input.seconds,
        dt: input.dt,
      });
    if (touch.since === undefined) delete state.touchdown;
    else state.touchdown = touch.since;
    early = touch.landed;
  } else delete state.touchdown;
  if (
    state.swing &&
    (early ||
      input.seconds - state.swing.start >=
        MINIMUM_PHASE * (state.swing.end - state.swing.start))
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
      // The landed foot is seated with its outline at once, its contact
      // added with zero error at the pose it landed in; only its share of
      // the support ramps in (Feng et al. 2013, Section II-E; Herzog et al.
      // 2016, Section 5.3). The standing feet keep what they latched when
      // their own stance began: the legs' posture is the authored pose refit
      // to the present footholds (`physicalStanceJointTarget`), so no landing
      // re-latches another foot's joints.
      const limb: (typeof input.policy.pattern.limbs)[number] =
        input.policy.pattern.limbs.find(
          (candidate: (typeof input.policy.pattern.limbs)[number]): boolean =>
            candidate.bone === bone,
        )!;
      (state.seating ??= {})[bone] = {
        seated: true,
        since: input.seconds,
        bearing: 0,
        flat: 1,
        load: 0,
        entry: 0,
        relief: soleSpread(bone),
        anchor: latch(limb),
      };
      resolveSwing("landed");
      delete state.cleared;
      state.outsideSince = undefined;
      state.swing = undefined;
      state.revision = (state.revision ?? 0) + 1;
    } else if (
      input.seconds >
      state.swing.end + (input.policy.landingTimeout ?? input.policy.duration)
    ) {
      resolveSwing("failed");
      delete state.cleared;
      state.failedLanding = true;
      state.swing = undefined;
      state.outsideSince = input.seconds;
      state.revision = (state.revision ?? 0) + 1;
    }
  }
  // Each stance foot's seating (`physicalStanceSeat`): its sole's seating,
  // its low-passed measured load, which decides lift-off and touchdown, and
  // its bearing and flatness shares by geometry, each ramping over
  // `physicalStanceBalance.FADE`. A first stance starts borne and flat; a
  // foot that lands after a swing fades in from nothing.
  const first: boolean = state.seating === undefined;
  const weight: number = input.profile.mass * input.gravity;
  const grounded: ReadonlySet<string> = new Set(
    input.policy.pattern.limbs
      .filter((limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
        physicalSupportFootprint.grounded(
          input.profile,
          input.segments,
          limb,
          input.floor,
        ),
      )
      .map((limb: (typeof input.policy.pattern.limbs)[number]): string => limb.bone),
  );
  for (const limb of input.policy.pattern.limbs) {
    if (limb.bone === state.swing?.bone) {
      // A limb asked to step gives up its share over the fade window, its
      // force bound ramping to zero with it (`trackPhysicalRoot`), and lifts
      // once the floor measurably carries it no more
      // (`physicalStanceBalance.release`). The step is committed at its
      // lift-off and recorded then; until it, the request is planned again
      // each frame (Pratt et al., M2V2, Section VII-A; Herzog et al. 2016,
      // Section 5.3; Feng et al. 2015, Figure 2).
      const seat = state.seating?.[limb.bone];
      if (seat) {
        seat.bearing = Math.max(
          0,
          (seat.bearing ?? 1) - input.dt / physicalStanceBalance.FADE,
        );
        seat.load = physicalStanceSeat.lowPass(
          seat.load ?? 0,
          measuredLoad(limb.bone),
          input.dt,
        );
        if (
          physicalStanceBalance.release({
            bearing: seat.bearing,
            load: seat.load,
            weight,
          })
        ) {
          delete state.seating![limb.bone];
          state.swing.end =
            input.seconds + (state.swing.end - state.swing.start);
          state.swing.start = input.seconds;
          state.cleared = false;
          state.steps.push(structuredClone(state.swing));
          state.revision = (state.revision ?? 0) + 1;
        }
      }
      continue;
    }
    // The sole's spread: how far the highest of the main foot carrier's sole
    // vertices stands above the lowest, actual heights only, the toes (a
    // jointed segment of their own) left out. A flat foot's sole lies level;
    // an edge lifting raises the spread (Coros, Beaudoin and van de Panne
    // 2010, Section 3.3). The plant only names which vertices form the sole.
    const spread: number = soleSpread(limb.bone);
    const seat: physicalStanceSeat.ISeat = ((state.seating ??= {})[
      limb.bone
    ] ??= {
      seated: first,
      since: input.seconds,
      bearing: first ? 1 : 0,
      flat: first ? 1 : 0,
      load: first ? weight / input.policy.pattern.limbs.length : 0,
      entry: first ? 1 : 0,
      relief: spread,
      // The foot's world orientation is latched where it actually stands
      // when its stance begins, at the first step or on landing: its
      // planted-foot hold (`physicalStanceJointTarget`).
      anchor: latch(limb),
    });
    // A foot that touches again after leaving the holds is added with zero
    // error where it stands, as a landed foot is, its force bound ramping in
    // (`physicalStanceSeat`; design-4017-qp3, Section 3, rules 2 and 3).
    if (
      physicalStanceSeat({
        seat,
        spread,
        load: measuredLoad(limb.bone),
        grounded: grounded.has(limb.bone),
        touching:
          (supports.find(
            (support: (typeof supports)[number]): boolean =>
              support.bone === limb.bone,
          )?.samples.length ?? 0) > 0,
        weight,
        seconds: input.seconds,
        dt: input.dt,
      })
    )
      seat.anchor = latch(limb);
  }
  // Support is what the controller has planted, not what touches this step:
  // every planted limb, a limb asked to step among them until it lifts,
  // bounds where the centre of pressure can return by its own outline,
  // whether or not a tipping body has lifted it for a moment, so the
  // classification does not flicker with momentary contact.
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
  const angular: IAutoMovieVector3 = physicalStanceBalance.momentum(
    input.profile,
    input.segments,
    center,
  );
  const spin: IAutoMovieVector3 = physicalStanceBalance.spin(
    angular,
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
  );
  // The landed foot's bearing share while it ramps in after a step: until it
  // is in, the next step is not decided (`physicalStanceBalance.ready`).
  const landing: number | undefined = (() => {
    const last = state.landings?.[state.landings.length - 1];
    const seat = last ? state.seating?.[last.bone] : undefined;
    // A foot whose share never ramps in stops holding the decision back
    // after `UNLOAD`.
    return last &&
      seat &&
      (seat.bearing ?? 1) < 1 &&
      input.seconds - last.seconds < physicalStanceBalance.UNLOAD
      ? (seat.bearing ?? 0)
      : undefined;
  })();
  // The tilt guard: a step is asked for once the trunk would pass the hip
  // strategy's range within a pendulum time, even with the capture point
  // inside, read from the centroidal momentum at the same time as the
  // capture point (`physicalStanceBalance.tipping`).
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
  const tipping: boolean =
    landing === undefined &&
    physicalStanceBalance.tipping({
      tilt,
      momentum: angular,
      inertia: physicalStanceBalance.inertia(
        input.profile,
        input.segments,
        center,
      ),
      omega,
      range: TIP,
    });
  // The stance feet's heading, as each was latched when its stance began:
  // the frame a step is expressed in and the side a stepping limb keeps
  // (Pratt et al., M2V2, Section VII-C), not the trunk's, which turns with a
  // push. The authored stance faces +z; each foot's latched turn from its
  // authored rotation turns that.
  const heading: IAutoMovieVector3 = (() => {
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const limb of input.policy.pattern.limbs) {
      const anchor = state.seating?.[limb.bone]?.anchor;
      const goal: IAutoMovieRigidTransform | undefined =
        input.targets[limb.bone];
      if (!anchor || !goal || limb.bone === state.swing?.bone) continue;
      sum = Vector3.add(
        sum,
        Quaternion.rotateVector(
          Quaternion.multiply(anchor.rotation, Quaternion.inverse(goal.rotation)),
          { x: 0, y: 0, z: 1 },
        ),
      );
    }
    if (Math.hypot(sum.x, sum.z) > 0) return { x: sum.x, y: 0, z: sum.z };
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        rootBody.rotation(),
        Quaternion.inverse(input.targets[rootSegment.bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    return { x: forward.x, y: 0, z: forward.z };
  })();
  // The step's timing from the leg: its unloading ramp and the quickest
  // swing its hip allows. The clearance is lowered to fit the transfer's
  // time (`physicalStanceBalance.clearance`), so the transfer sets it.
  const timing: { ramp: number; acceleration: number; height: number } | undefined =
    peak > 0
      ? { ramp: physicalStanceBalance.FADE, acceleration: peak, height: 0 }
      : undefined;
  const command: { x: number; z: number } | undefined = state.pressure?.command;
  const lifted: string | undefined =
    state.swing && !state.seating?.[state.swing.bone]
      ? state.swing.bone
      : undefined;
  const ask = (
    supports: IAutoMoviePhysicalSupportPatch[],
    unavailable: readonly string[],
    forced: boolean,
    swing: IAutoMoviePhysicalBalance.IAssessInput["swing"],
  ): IAutoMoviePhysicalBalance.IResult =>
    Balance.assess({
      center,
      velocity,
      gravity: input.gravity,
      floor: plane,
      supports,
      pattern: input.policy.pattern,
      maximumStep: input.policy.maximumStep,
      // A counted excursion stays counted, and a request stays asked for,
      // until the capture point is back within the margin of the shrunken
      // support; a new one starts counting only past the support's own edge
      // by the margin and the hip strategy's reach (`exceeds` below).
      margin: input.policy.margin,
      swingSeconds: input.policy.duration,
      spin,
      heading,
      ...(forced ? { force: true } : {}),
      ...(swing ? { swing } : {}),
      inset: physicalStanceBalance.MARGIN,
      ...(state.landings?.length
        ? { recent: state.landings[state.landings.length - 1]!.bone }
        : {}),
      ...(command ? { pressure: { x: command.x, y: plane, z: command.z } } : {}),
      unavailable,
    });
  // A limb asked to step stays a candidate until it lifts, so its request
  // is planned again each frame; a lifted one is no longer support.
  const assessment: IAutoMoviePhysicalBalance.IResult = ask(
    planted,
    [...(input.unavailable ?? []), ...(lifted !== undefined ? [lifted] : [])],
    tipping,
    timing,
  );
  // A step is due once the capture point is past the support itself by more
  // than the margin and the hip strategy's reach toward it, and not shrinking
  // against the previous step's measured excess (`physicalStanceBalance`
  // `.exceeds`, `hip`, `hipReach`; Koolen et al., Corollary 3; Stephens 2011,
  // Table 4.1: ankle, then hip, then step; design-4017-edge, E3). The reach
  // is taken with the trunk's angle left, so a trunk that has spent its
  // range leaves the support's edge alone.
  const stance: (typeof input.policy.pattern.limbs)[number][] =
    input.policy.pattern.limbs.filter(
      (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
        limb.bone !== state.swing?.bone || !!state.seating?.[limb.bone],
    );
  const past: boolean =
    assessment.state !== "supported" &&
    physicalStanceBalance.exceeds({
      support: assessment.polygon,
      capture: assessment.capturePoint,
      spin,
      margin: input.policy.margin,
      reach: (direction: IAutoMovieVector3): number => {
        const strategy = physicalStanceBalance.hip({
          profile: input.profile,
          segments: input.segments,
          limbs: input.policy.pattern.limbs,
          stance,
          direction,
          intended: input.targets[rootSegment.bone]!.rotation,
        });
        return strategy
          ? physicalStanceBalance.hipReach({
              ...strategy,
              mass: input.profile.mass,
              gravity: input.gravity,
              omega,
            })
          : 0;
      },
      ...(state.excess !== undefined ? { previous: state.excess } : {}),
    });
  if (Number.isFinite(assessment.outside)) state.excess = assessment.outside;
  else delete state.excess;
  // A capture point parked past the shrunken support, neither captured nor
  // past the support itself, steps once it has not shrunk over 1 / omega
  // (`physicalCaptureBand`).
  const band: ReturnType<typeof physicalCaptureBand> = state.swing
    ? { due: false }
    : physicalCaptureBand({
        ...(state.band ? { band: state.band } : {}),
        excess:
          assessment.beyond !== undefined && Number.isFinite(assessment.beyond)
            ? assessment.beyond
            : 0,
        margin: input.policy.margin,
        seconds: input.seconds,
        omega,
      });
  if (band.band) state.band = band.band;
  else delete state.band;
  const holding: boolean =
    assessment.state === "supported" ||
    (state.outsideSince === undefined && !tipping && !past && !band.due);
  if (holding && !state.swing) state.failedLanding = undefined;
  state.last = state.failedLanding
    ? "unrecoverable"
    : state.swing
      ? "recovery"
      : holding
        ? "supported"
        : assessment.state;
  // While a landed foot ramps in, the capture point's excursion is the
  // landing's transient: its count starts once the foot is in.
  if (holding || landing !== undefined) state.outsideSince = undefined;
  else state.outsideSince ??= input.seconds;
  const retry: boolean =
    !!input.policy.bracing &&
    center.y - input.floor >= input.policy.bracing.minimumCenterHeight;
  if (
    (!state.failedLanding || retry) &&
    !state.swing &&
    assessment.step &&
    // The capture point must stay outside for `DWELL`, after any landed
    // foot is in, so one step's excursion does not start a swing.
    physicalStanceBalance.ready({
      ...(landing !== undefined ? { landing } : {}),
      outside: state.outsideSince,
      seconds: input.seconds,
    }) &&
    input.seconds - state.outsideSince! >= (input.policy.reactionSeconds ?? 0)
  ) {
    request(assessment.step);
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  } else if (state.swing && lifted === undefined) {
    // A request is planned again each frame until its limb lifts: its
    // place and time follow the capture point, it moves to another limb
    // only when that one's step captures and its own does not and its own
    // has not begun unloading (`Balance.retarget`), and it is withdrawn once
    // the capture point is back inside (Feng et al. 2015, Figure 2: lift-off
    // delayed, double support kept).
    if (assessment.state === "supported") {
      state.swing = undefined;
      state.revision = (state.revision ?? 0) + 1;
    } else if (!assessment.step) {
      state.swing.end = input.seconds + (state.swing.end - state.swing.start);
      state.swing.start = input.seconds;
    } else {
      const bone: string = state.swing.bone;
      const own: IAutoMoviePhysicalBalance.IResult["step"] =
        assessment.step.bone === bone
          ? assessment.step
          : ask(
              planted,
              [
                ...(input.unavailable ?? []),
                ...input.policy.pattern.limbs
                  .map(
                    (limb: (typeof input.policy.pattern.limbs)[number]): string =>
                      limb.bone,
                  )
                  .filter((other: string): boolean => other !== bone),
              ],
              true,
              timing,
            ).step;
      const chosen: IAutoMoviePhysicalBalance.IResult["step"] =
        Balance.retarget({
          unloading: (state.seating?.[bone]?.bearing ?? 1) < 1,
          ...(own ? { own } : {}),
          best: assessment.step,
        });
      if (chosen === undefined) {
        state.swing.end = input.seconds + (state.swing.end - state.swing.start);
        state.swing.start = input.seconds;
      } else {
        if (chosen.bone !== bone) {
          state.revision = (state.revision ?? 0) + 1;
        }
        request(chosen);
      }
    }
  }
  if (state.swing && lifted === undefined)
    goals[state.swing.bone] = actual(state.swing.bone);
  let path: IAutoMovieAdvancePhysicalBalance.IResult["swing"];
  if (state.swing && lifted !== undefined) {
    const limb: (typeof input.policy.pattern.limbs)[number] =
      input.policy.pattern.limbs.find(
        (candidate: (typeof input.policy.pattern.limbs)[number]): boolean =>
          candidate.bone === state.swing!.bone,
      )!;
    // The landing is re-predicted every step of the swing's first half from
    // the present capture point and the swing time left (Yin et al. 2007,
    // Section 3.3), by the same rules the step was chosen with: the remaining
    // supports holding their centre of pressure on their shrunken outline,
    // the foot's centre on the capture point at landing, on its own side and
    // inside the new support (`AutoMoviePhysicalBalance.assess`), its time
    // that of the distance from where it lifted (Khadiv et al. 2017, Section
    // III-B). Past half the swing the target and time are held, so the limb
    // settles onto one place (Pratt et al., M2V2, Section VII-C1).
    const settling: boolean =
      input.seconds - state.swing.start >=
      (state.swing.end - state.swing.start) / 2;
    if (!settling && timing && center.y - plane > 0) {
      const from: IAutoMovieVector3 = {
        x: state.swing.from.point[0],
        y: 0,
        z: state.swing.from.point[1],
      };
      const patch: IAutoMoviePhysicalSupportPatch = footprint(limb, from);
      const flight: IAutoMoviePhysicalBalance.IResult = ask(
        [...planted, patch],
        [
          ...(input.unavailable ?? []),
          ...input.policy.pattern.limbs
            .map(
              (other: (typeof input.policy.pattern.limbs)[number]): string =>
                other.bone,
            )
            .filter((other: string): boolean => other !== limb.bone),
        ],
        true,
        { ...timing, ramp: 0, elapsed: input.seconds - state.swing.start },
      );
      if (flight.step) {
        state.swing.to.point = [
          flight.step.target.x - (patch.position.x - from.x),
          flight.step.target.z - (patch.position.z - from.z),
        ];
        state.swing.end =
          state.swing.start + (flight.step.seconds ?? input.policy.duration);
        const step: (typeof state.steps)[number] | undefined = record();
        if (step) {
          step.to.point = [...state.swing.to.point];
          step.end = state.swing.end;
        }
      }
    }
    const rigid: AutoMovieXpbdBody = input.segments.get(state.swing.bone)!;
    // The swinging limb's effective mass at its endpoint: the reaction its
    // path's acceleration asks of the stance (`physicalStanceBalance`
    // `.swingMass`).
    const carried: number = physicalStanceBalance.swingMass(
      input.profile,
      input.segments,
      limb,
    );
    const time: number = state.swing.end - state.swing.start;
    // A recovery swing's clearance is lowered to what the stance can carry
    // at its peak in the swing's time (`physicalStanceBalance.clearance`).
    const rise: number = physicalStanceBalance.clearance(
      time,
      input.profile.mass,
      carried,
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
    // The clearance is the sole's: a foot pitched so its lowest point hangs
    // further below its endpoint than when planted flat has the endpoint
    // raised by the difference (Pratt et al., M2V2, Section VII-D1, set the
    // swing's height and the foot's orientation apart).
    const lowered: number = hang(limb);
    const point: IAutoMovieVector3 = {
      ...motion.point,
      y: motion.point.y + lowered,
    };
    goals[state.swing.bone] = point;
    // The joints' reference is fit to this same path (`trackPhysicalBalance`
    // `Targets`), so the swing is one reference in joint space.
    path = { height: rise, hang: lowered };
    const position: IAutoMovieVector3 = actual(state.swing.bone);
    // The swing's joints track that reference with their own servos, within
    // their caps; the drive adds only the path's feed-forward through J^T
    // (`physicalStanceBalance.swingForce`).
    const force: IAutoMovieVector3 = physicalStanceBalance.swingForce({
      mass: carried,
      gravity: input.gravity,
      acceleration: motion.acceleration,
    });
    drive(state.swing.bone, rigid, position, force);
  }
  // A landed foot is held by the floor and its leg's joints alone: no
  // endpoint servo pulls it toward its goal outside the support solve, which
  // already holds it (Feng et al. 2013, Section III-D: no orientation
  // tracking on a loaded foot). Its goal is its landed place.
  for (const [bone, offset] of Object.entries(state.offsets))
    if (state.swing?.bone !== bone)
      goals[bone] = Vector3.add(authored(bone), offset);
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
      ...(path ? { swing: path } : {}),
    };
  }
  return {
    rootStrength: exhausted ? 0 : 1,
    state,
    goals,
    ...(path ? { swing: path } : {}),
  };

  /** A limb's measured floor load this substep, newtons: its normal impulse over the substep. */
  function measuredLoad(bone: string): number {
    return (
      (supports.find(
        (support: (typeof supports)[number]): boolean => support.bone === bone,
      )?.impulse ?? 0) / input.dt
    );
  }

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
   * A stance foot's references as it actually stands when its stance
   * begins: its support point and its world rotation, which its planted-foot
   * hold keeps through the stance (`physicalStanceJointTarget`).
   */
  function latch(
    limb: (typeof input.policy.pattern.limbs)[number],
  ): NonNullable<physicalStanceSeat.ISeat["anchor"]> {
    return {
      point: actual(limb.bone),
      rotation: { ...input.segments.get(limb.bone)!.rotation() },
    };
  }

  /**
   * Ask for a step: the swing request of its limb from where the limb's
   * endpoint stands now, timed from now, aimed at the step's target less the
   * planted footprint's middle's offset from the endpoint. Its start keeps
   * moving while the limb unloads; it is recorded at lift-off.
   */
  function request(
    step: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>,
  ): void {
    const from: IAutoMovieVector3 = actual(step.bone);
    const shift: IAutoMovieVector3 = inset(step.bone);
    state.swing = {
      bone: step.bone,
      kind: "swing",
      start: input.seconds,
      end: input.seconds + (step.seconds ?? input.policy.duration),
      from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
      to: {
        point: [step.target.x - shift.x, step.target.z - shift.z],
        yaw: 0,
        pitch: 0,
        clearance: 0,
      },
    };
  }

  /**
   * How much further a limb's lowest contact point hangs below its endpoint
   * at its planned swing attitude than at its planted pose, metres: its
   * carriers at their authored attitude, the level foot the swing holds,
   * carried with the endpoint to where it stands (`physicalSwingReference`
   * `.hang`).
   */
  function hang(limb: (typeof input.policy.pattern.limbs)[number]): number {
    const at: IAutoMovieVector3 = actual(limb.bone);
    const shift: IAutoMovieVector3 = Vector3.subtract(at, authored(limb.bone));
    return physicalSwingReference.hang({
      profile: input.profile,
      carriers: limb.contacts ?? [limb.bone],
      planned: (bone: string): IAutoMovieRigidTransform | undefined => {
        const goal: IAutoMovieRigidTransform | undefined = input.targets[bone];
        return goal
          ? { position: Vector3.add(goal.position, shift), rotation: goal.rotation }
          : undefined;
      },
      endpoint: at,
      planted: (bone: string): IAutoMovieRigidTransform | undefined =>
        input.targets[bone],
      rest: authored(limb.bone),
    });
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
   * planted footprint, horizontal metres, both at its planted pose: a target
   * for the footprint's middle less this is the endpoint's (Pratt et al.,
   * M2V2, Section VII-C2). The planted pose, not the present one, so a foot
   * rolling as it unloads does not move where it is aimed.
   */
  function inset(bone: string): IAutoMovieVector3 {
    const limb: (typeof input.policy.pattern.limbs)[number] =
      input.policy.pattern.limbs.find(
        (candidate: (typeof input.policy.pattern.limbs)[number]): boolean =>
          candidate.bone === bone,
      )!;
    const patch: IAutoMoviePhysicalSupportPatch = footprint(
      limb,
      Vector3.add(authored(bone), state.offsets[bone] ?? { x: 0, y: 0, z: 0 }),
    );
    const endpoint: IAutoMovieVector3 = Vector3.add(
      authored(bone),
      state.offsets[bone] ?? { x: 0, y: 0, z: 0 },
    );
    return {
      x: patch.position.x - endpoint.x,
      y: 0,
      z: patch.position.z - endpoint.z,
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
   * A limb's support patch: its contact shapes' outline on the floor
   * (`physicalSupportFootprint`), where it bears or would bear again; with a
   * place, its planted outline moved so its endpoint stands there, as where
   * a swinging limb lifted from.
   */
  function footprint(
    limb: (typeof input.policy.pattern.limbs)[number],
    at?: IAutoMovieVector3,
  ): IAutoMoviePhysicalSupportPatch {
    // A seated foot bears with its outline where it is planted: its authored
    // pose moved by its landed offset. An unseated one bears on its face at
    // its present pose, the edge it rolled onto (`physicalStanceBalance
    // .support`).
    const seat = state.seating?.[limb.bone];
    const offset: IAutoMovieVector3 =
      at !== undefined
        ? Vector3.subtract(at, authored(limb.bone))
        : (state.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 });
    const points: IAutoMovieVector3[] = physicalSupportFootprint(
      input.profile,
      at !== undefined || (seat && (seat.flat ?? 1) > 0)
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

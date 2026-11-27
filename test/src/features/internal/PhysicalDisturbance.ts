import { AutoMovieEnginePhysicalBalance, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysicalStanceBalance, AutoMovieEnginePhysicalStanceSupport, AutoMovieEnginePhysicalStanceSwing, AutoMovieEnginePhysics } from "@automovie/engine";
import { AutoMovieHumanPhysicalStandingPose } from "@automovie/human";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";

import { PhysicalSupportFixtures } from "./PhysicalSupportFixtures";

/** A judged record's step rate, per second (`createPhysicalBalanceInput`). */
const RATE: number = 120;

/** The steps over which a sustained push's capture point must come back. */
const CHECKPOINT: number = 6;

/**
 * The steps of quiet stance before the push in a judged record, a tenth of a
 * second: the records' convention, which the verdicts read the push's end
 * from.
 */
const PREFIX: number = 12;

/** The step at which the push starts, the first after the quiet prefix. */
const PUSH_STEP: number = PREFIX + 1;

/**
 * How long the push lasts, seconds: a rectangular force at the root through the
 * centre of mass (Yin, Loken and van de Panne 2007, Section 7; Stephens 2011,
 * Figure 4.5).
 */
const PUSH_SECONDS: number = 0.1;

/** The push's steps. */
const PUSH_STEPS: number = Math.round(PUSH_SECONDS * RATE);

/** The last step the push acts on. */
const PUSH_END: number = PUSH_STEP + PUSH_STEPS - 1;

/** The steps a subject's targets cover: one, as nothing here simulates. */
const BUDGET: number = 1;

/**
 * How far the floor load may stand from the weight, as a share of it: #3092's
 * strict floor-load bound, here applied to the body's vertical momentum over
 * every window of the run.
 */
const LOAD: number = 0.02;

/** The window the vertical momentum balance is read over, seconds. */
const WINDOW: number = 0.15;

/**
 * The margin the centre of pressure keeps from the supports' edges, metres
 * (Pratt et al., M2V2, footnote 2).
 */
const MARGIN: number = 0.02;

/**
 * How far a support's sole edge may rise off its plant and stay flat, metres:
 * the project's foot lift verdict bound
 * (`AutoMovieMotionHumanAuditLimits.lift`), the sole geometry #3092 keeps.
 */
const LIFT: number = 0.005;

/**
 * The rounding a contact witness's place may carry beyond half its separation,
 * metres: a millimetre, far under any collider's size.
 */
const WITNESS: number = 0.001;

/**
 * The root tilt past which a body has tipped over, degrees: the hip strategy's
 * range, 0.5 rad (Stephens 2011, Table 4.1).
 */
const TIPPED: number = (0.5 * 180) / Math.PI;

/**
 * The share of the standing centre-of-mass height below which a body is down,
 * the fall verdict's own bound.
 */
const FALLEN: number = 0.6;

/**
 * Pushing a standing body and judging the outcome against bounds stated from
 * its own inverted pendulum, shared by the disturbance-recovery tests
 * (`test_physical_disturbance_*`).
 *
 * Every push is stated from the body itself. With omega = sqrt(g / h) for the
 * standing centre-of-mass height h:
 *
 * - In place: a push below m omega (b - margin), b the distance from the centre
 *   of mass to the supports' edge along the push, keeps the extrapolated centre
 *   of mass within the base of support (Hof, Gazendam and Sinke 2005, Eqs. 5,
 *   8); held at the edge through the whole pulse the centre of pressure absorbs
 *   at most m omega b (omega T) / (1 - e^(-omega T)), T the pulse, which no
 *   controller exceeds without a step or the hip.
 * - One step: the leading limb steps after the reaction, its unloading ramp
 *   (`AutoMovieEnginePhysicalStanceBalance.FADE`) and its quickest swing to its reach l, T in
 *   all (Khadiv et al. 2017, Section III-B), while the remaining supports hold
 *   the centre of pressure at their edge p. The capture point there grows as p
 *
 *   - (xi - p) e^(omega T) (Hof et al. 2005, Eq. 3), so a push is capturable while
 *       that stays within the leading limb's reach l.
 * - Any steps: repeated steps of reach l every T capture at most l e^(-omega T) /
 *   (1 - e^(-omega T)) beyond the edge (Koolen et al., Eq. 26). The pushes are
 *   half the in-place bound, the middle of the one-step window and one and a
 *   half times the any-step bound, forward or sideways (Yin, Loken and van de
 *   Panne 2007, Section 7.2). Sideways the same bounds leave the canonical
 *   Human no one-step window: its trailing foot holds the centre of pressure a
 *   stance width away from the stepping one.
 *
 * A record of a pushed body, its frames, contacts, wrenches and recovery state,
 * is judged against its outcome (`judge`) and audited (`audit`) as pure
 * functions of the record; no simulation runs here.
 */
export namespace PhysicalDisturbance {
  /** The parts of a run's cache the verdicts read. */
  export type ICache = Pick<
    IAutoMoviePhysicalSimulation["cache"],
    "frames" | "recovery" | "contacts" | "supportWrenches"
  >;

  /** A standing body ready to be pushed. */
  export interface ISubject {
    /** The body's profile. */
    profile: IAutoMoviePhysicalProfile;
    /** Its standing targets, world metres. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /** A fresh simulation body over one step. */
    body: () => IAutoMoviePhysicalSimulationInput.IBody;
    /** Its recovery policy, its support limbs with it, read once. */
    policy: IAutoMoviePhysicalRecoveryPolicy;
  }

  /** The impulses that bound each outcome, newton seconds. */
  export interface IPushes {
    /** The largest push the stance absorbs in place. */
    place: number;
    /** The largest push one leading-limb step captures. */
    step: number;
    /** The largest push any number of steps captures. */
    any: number;
  }

  /** A push's outcome. */
  export type Outcome = "sustained" | "recover" | "fall";

  /** A push's direction: forward along +z or sideways along +x. */
  export type Axis = "x" | "z";

  /** A run's verdict so far: whether it is decided, and what failed. */
  export interface IVerdict {
    /** Whether the outcome is decided, passed or failed. */
    decided: boolean;
    /** What failed, empty when it passed or is undecided. */
    failures: string[];
  }

  /** The canonical Human in its public Stand, handed over to physics. */
  export function standing(human: IAutoMovieMotionHumanBody): ISubject {
    const profile: IAutoMoviePhysicalProfile = human.profile;
    const performance: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
      seed: "disturbance",
      performers: [
        {
          subject: "a",
          body: human,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanChain.subject("a").stand({ hold: 1, sway: 0 }).node,
    });
    // The pose's bones by name, which the profile's segments are keyed by.
    const pose = performance.bones("a", 0.9);
    const bones = new Map<string, NonNullable<ReturnType<typeof pose.get>>>(
      pose,
    );
    const fit: ReturnType<typeof AutoMovieHumanPhysicalStandingPose.fit> =
      AutoMovieHumanPhysicalStandingPose.fit({
        profile,
        targets: Object.fromEntries(
          profile.segments.map(
            (
              segment: IAutoMoviePhysicalSegment,
            ): [string, IAutoMovieRigidTransform] => {
              const bone = bones.get(segment.bone)!;
              return [
                segment.bone,
                { position: bone.worldPosition, rotation: bone.worldRotation },
              ];
            },
          ),
        ),
        floor: 0,
        tolerance: 0.000025,
        iterations: 32,
      });
    if (fit.kind !== "fitted")
      throw new Error(`The Stand handoff refused ${fit.reason}`);
    const body = (): IAutoMoviePhysicalSimulationInput.IBody => {
      const result: IAutoMoviePhysicalSimulationInput.IBody =
        PhysicalSupportFixtures.canonical(profile, BUDGET / RATE);
      for (const target of result.targets)
        target.segments = structuredClone(fit.targets);
      return result;
    };
    return {
      profile,
      targets: structuredClone(fit.targets),
      body,
      policy: body().balance!,
    };
  }

  /** The four-support primitive at rest on its supports. */
  export function planted(
    profile: IAutoMoviePhysicalProfile,
    declared?: Readonly<Record<string, readonly string[]>>,
  ): ISubject {
    const body = (): IAutoMoviePhysicalSimulationInput.IBody =>
      PhysicalSupportFixtures.body(profile, BUDGET / RATE, declared);
    return {
      profile,
      targets: Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => [
            segment.bone,
            structuredClone(segment.neutral),
          ],
        ),
      ),
      body,
      policy: body().balance!,
    };
  }

  /** The impulse each outcome is checked with along an axis. */
  export function impulse(
    subject: ISubject,
    name: Outcome,
    axis: Axis,
  ): number {
    const pushes: IPushes = bounds(subject, axis);
    return name === "sustained"
      ? pushes.place / 2
      : name === "recover"
        ? (pushes.place + pushes.step) / 2
        : 1.5 * pushes.any;
  }

  /** The standing pendulum's rate, sqrt(g / h), per second. */
  export function omegaOf(subject: ISubject): number {
    return Math.sqrt(9.81 / centerOf(subject.profile, subject.targets).y);
  }

  /**
   * State each outcome's bound for a push along an axis from the body's own
   * pendulum, with the controller's own step time (`timing`). The linear
   * inverted pendulum is integrated through the 0.1 s pulse under the
   * centre-of-pressure law clamped to the support polygon
   * (`AutoMovieEnginePhysicalStanceSupport.polygon`, `.GAIN`):
   *
   * - In place: the largest pulse whose capture point stays on the polygon (Hof
   *   et al. 2005, Eqs. 7-8);
   * - One step: the capture point at the trigger, two steps after the pulse,
   *   within the reach's e^(-omega T) of the remaining supports' edge (Koolen
   *   et al., Eq. 25);
   * - Any steps: Koolen et al., Eq. 26 with that T.
   */
  export function bounds(subject: ISubject, axis: Axis): IPushes {
    return window(subject, axis, timing(subject));
  }

  /**
   * The body's pendulum along an axis: its mass, omega, the standing centre of
   * mass's coordinate, the support polygon's edges either way, the remaining
   * supports' far edge when the leading limb steps, and the reach.
   */
  export function pendulum(
    subject: ISubject,
    axis: Axis,
  ): {
    mass: number;
    omega: number;
    from: number;
    low: number;
    high: number;
    rest: number;
    reach: number;
  } {
    const policy = subject.policy;
    const limbs = policy.pattern.limbs;
    const center: IAutoMovieVector3 = centerOf(
      subject.profile,
      subject.targets,
    );
    const along = (sign: number): IAutoMovieVector3 => ({
      x: axis === "x" ? sign : 0,
      y: 0,
      z: axis === "z" ? sign : 0,
    });
    const polygon: IAutoMovieVector3[] = AutoMovieEnginePhysicalStanceSupport.polygon(
      subject.profile,
      subject.targets,
      limbs,
      0,
    );
    const from: number = center[axis];
    const middles = limbs.map((limb) => {
      const at: number[] = AutoMovieEnginePhysicalStanceSupport
        .polygon(subject.profile, subject.targets, [limb], 0)
        .map((point: IAutoMovieVector3): number => point[axis]);
      return { limb, middle: (Math.min(...at) + Math.max(...at)) / 2 };
    });
    const lead = middles.reduce((a, b) => (b.middle > a.middle ? b : a));
    return {
      mass: subject.profile.mass,
      omega: omegaOf(subject),
      from,
      high:
        from +
        AutoMovieEnginePhysicalStanceSwing.reach(polygon, { ...center, y: 0 }, along(1)),
      low:
        from -
        AutoMovieEnginePhysicalStanceSwing.reach(polygon, { ...center, y: 0 }, along(-1)),
      rest: Math.max(
        ...AutoMovieEnginePhysicalStanceSupport
          .polygon(
            subject.profile,
            subject.targets,
            limbs.filter((limb) => limb !== lead.limb),
            0,
          )
          .map((point: IAutoMovieVector3): number => point[axis]),
      ),
      reach: policy.maximumStep,
    };
  }

  /** The bounds for a push along an axis with a given step time, seconds. */
  export function window(subject: ISubject, axis: Axis, time: number): IPushes {
    const { mass, omega, from, low, high, rest, reach } = pendulum(
      subject,
      axis,
    );
    // The pendulum through the pulse and on to the trigger, the centre of
    // pressure following the law within [low, high]: the capture point's
    // peak and its value at the trigger.
    const run = (impulse: number): { peak: number; trigger: number } => {
      const dt: number = 1 / 1200;
      const force: number = impulse / PUSH_SECONDS;
      let x: number = from;
      let v: number = 0;
      let peak: number = from;
      const until: number = PUSH_SECONDS + 2 / RATE;
      for (let t: number = 0; t < until; t += dt) {
        const xi: number = x + v / omega;
        const u: number = Math.max(
          low,
          Math.min(high, xi + AutoMovieEnginePhysicalStanceBalance.GAIN * (xi - from)),
        );
        const a: number =
          omega * omega * (x - u) + (t < PUSH_SECONDS ? force / mass : 0);
        v += a * dt;
        x += v * dt;
        peak = Math.max(peak, x + v / omega);
      }
      return { peak, trigger: x + v / omega };
    };
    const largest = (holds: (impulse: number) => boolean): number => {
      let near: number = 0;
      let far: number = mass * omega * (reach + high - from) * 4;
      for (let pass: number = 0; pass < 60; pass++) {
        const middle: number = (near + far) / 2;
        if (holds(middle)) near = middle;
        else far = middle;
      }
      return near;
    };
    const decay: number = Math.exp(-omega * time);
    return {
      place: largest((impulse) => run(impulse).peak <= high),
      step: largest((impulse) => run(impulse).trigger - rest <= reach * decay),
      any: mass * omega * (high + (reach * decay) / (1 - decay) - from),
    };
  }

  /**
   * A recovery's swing phases in time order: the steps sharing one start, a
   * diagonal pair's two feet lifting together as one contact switch of the gait
   * (Chen et al. 2022, Section 2.1, Example 1).
   */
  export function phases(
    steps: IAutoMoviePhysicalRecoveryState["steps"],
  ): IAutoMoviePhysicalRecoveryState["steps"][] {
    const out: IAutoMoviePhysicalRecoveryState["steps"][] = [];
    for (const step of [...steps].sort((a, b) => a.start - b.start)) {
      const last: IAutoMoviePhysicalRecoveryState["steps"] | undefined =
        out.at(-1);
      if (last && Math.abs(last[0]!.start - step.start) <= 1e-9)
        last.push(step);
      else out.push([step]);
    }
    return out;
  }

  /**
   * The swing phases armed before the one ahead of them had resolved: one swing
   * phase at a time, so none is ever armed during another.
   */
  export function overlaps(
    steps: IAutoMoviePhysicalRecoveryState["steps"],
  ): number[] {
    const ordered: IAutoMoviePhysicalRecoveryState["steps"][] = phases(steps);
    return ordered.flatMap((phase, index: number): number[] =>
      index > 0 &&
      !ordered[index - 1]!.every(
        (step): boolean =>
          step.resolved !== undefined &&
          step.resolved.seconds <= phase[0]!.start + 1e-9,
      )
        ? [index]
        : [],
    );
  }

  /** How many swing phases landed: a phase lands when any of its feet does. */
  export function landed(
    steps: IAutoMoviePhysicalRecoveryState["steps"],
  ): number {
    return phases(steps).filter((phase): boolean =>
      phase.some((step): boolean => step.resolved?.status === "landed"),
    ).length;
  }

  /**
   * The controller's own step time for a full-reach step, seconds: the
   * reaction, the unloading ramp and the quickest swing the hip allows
   * (`AutoMovieEnginePhysicalStanceSwing.swingBound`), as `advancePhysicalBalance` states it
   * at the standing pose.
   */
  export function timing(subject: ISubject): number {
    const policy = subject.policy;
    const limbs = policy.pattern.limbs;
    const reach: number = policy.maximumStep;
    const heaviest: number = Math.max(
      ...limbs.map((limb): number =>
        [...new Set([...limb.chain, ...(limb.contacts ?? [])])].reduce(
          (sum: number, bone: string): number =>
            sum +
            (subject.profile.segments.find(
              (segment: IAutoMoviePhysicalSegment): boolean =>
                segment.bone === bone,
            )?.mass ?? 0),
          0,
        ),
      ),
    );
    const leg = limbs
      .map((limb) =>
        AutoMovieEnginePhysicalStanceSwing.swingLeg(
          subject.profile,
          // The targets as the rigid poses the swing reads.
          new Map(
            Object.entries(subject.targets).map(
              ([bone, at]: [string, IAutoMovieRigidTransform]) => [
                bone,
                {
                  translation: (): IAutoMovieVector3 => at.position,
                  rotation: (): IAutoMovieQuaternion => at.rotation,
                },
              ],
            ),
          ),
          limb,
        ),
      )
      .reduce((a, b) => (b.mass > a.mass ? b : a));
    const peak: number = Math.min(
      policy.maximumForce / heaviest - 9.81,
      AutoMovieEnginePhysicalStanceSwing.swingBound({
        effective: leg.mass,
        length: leg.length,
        torque: leg.torque,
      }),
    );
    return (
      (policy.reactionSeconds ?? 0) +
      AutoMovieEnginePhysicalStanceBalance.FADE +
      AutoMovieEnginePhysicalBalance.duration(reach, 0, peak)
    );
  }

  /**
   * Judge a run so far against its outcome, from its record alone: whether the
   * outcome is decided, and what failed. `final` marks the outcome's cap, by
   * which an undecided run has failed.
   *
   * - Sustained: never a step, the root never tipped, every support flat and only
   *   supports on the floor throughout; decided once, after the push, the
   *   capture point is inside the support and coming back.
   * - Recover: never down, at most one landed swing phase, no failed landing, one
   *   swing phase at a time and only supports on the floor; decided once every
   *   step resolved and the capture point stayed inside the support for 1 /
   *   omega, the time in which a diverging one grows e times, with the root
   *   upright, the supports flat and the height kept.
   * - Fall: never captured after the push; decided once the body is down or
   *   tipped, or at the cap still diverging from landing to landing.
   */
  export function judge(
    subject: ISubject,
    name: Outcome,
    cache: ICache,
    id: string,
    final: boolean,
  ): IVerdict {
    const frames = cache.frames;
    const index: number = frames.length - 1;
    const recovery = cache.recovery[id];
    const steps: IAutoMoviePhysicalRecoveryState["steps"] =
      recovery?.steps ?? [];
    const start: number = centerOf(subject.profile, subject.targets).y;
    const root: string = rootOf(subject.profile);
    const height = (i: number): number =>
      centerOf(subject.profile, frames[i]!.bodies[id]!).y;
    const tilt = (i: number): number =>
      turn(
        frames[i]!.bodies[id]![root]!.rotation,
        subject.targets[root]!.rotation,
      );
    const fail = (failure: string): IVerdict => ({
      decided: true,
      failures: [failure],
    });
    if (name === "fall") {
      for (let i: number = PUSH_END + 1; i <= index; i++)
        if (captured(subject, cache, id, i))
          return fail(
            `captured at ${frames[i]!.seconds} s (${recovery?.last}, height ${height(i)} of ${start})`,
          );
      if (height(index) < FALLEN * start || tilt(index) > TIPPED)
        return { decided: true, failures: [] };
      if (!final) return { decided: false, failures: [] };
      const excesses: number[] = landedExcesses(subject, cache, id);
      return diverging(excesses)
        ? { decided: true, failures: [] }
        : fail(
            `still up at the cap, the capture point past the support at its landings ${excesses.map((e) => e.toFixed(3))} not growing`,
          );
    }
    const strays: string[] = touched(cache, id).filter(
      (bone: string): boolean => !supportsOf(subject).has(bone),
    );
    if (strays.length !== 0)
      return fail(`non-support bones touched the floor: ${strays}`);
    if (name === "sustained") {
      if (steps.length !== 0) return fail(`stepped ${steps.length} times`);
      for (let i: number = 0; i <= index; i++) {
        if (tilt(i) > TIPPED)
          return fail(
            `root tipped ${tilt(i).toFixed(1)} deg at ${frames[i]!.seconds} s`,
          );
        const raised: number = lift(subject, frames[i]!.bodies[id]!);
        if (raised > LIFT)
          return fail(
            `a support lifted ${(raised * 1000).toFixed(1)} mm at ${frames[i]!.seconds} s`,
          );
      }
      if (index >= PUSH_END + CHECKPOINT) {
        const now = captureAt(subject, cache, id, index);
        const before = captureAt(subject, cache, id, index - CHECKPOINT);
        if (
          now.polygon.length >= 3 &&
          now.beyond < 1e-9 &&
          now.offset < before.offset &&
          recovery?.last === "supported"
        )
          return { decided: true, failures: [] };
      }
      return final
        ? fail(`not back inside the support by the cap (${recovery?.last})`)
        : { decided: false, failures: [] };
    }
    // Recover.
    if (height(index) < FALLEN * start)
      return fail(`down at ${frames[index]!.seconds} s, ${steps.length} steps`);
    if (landed(steps) > 1) return fail(`landed ${landed(steps)} swing phases`);
    if (steps.some((step): boolean => step.resolved?.status === "failed"))
      return fail("a landing failed");
    if (overlaps(steps).length !== 0)
      return fail(
        `swing phases ${overlaps(steps)} armed before the one ahead resolved`,
      );
    const dwell: number = Math.ceil(RATE / omegaOf(subject));
    const settled: number = Math.max(
      PUSH_END + 1,
      ...steps.map((step): number =>
        Math.round((step.resolved?.seconds ?? Infinity) * RATE),
      ),
    );
    let inside: boolean =
      steps.every((step): boolean => step.resolved !== undefined) &&
      recovery?.last === "supported" &&
      index - dwell >= settled;
    for (let i: number = index; inside && i > index - dwell; i--) {
      const at = captureAt(subject, cache, id, i);
      inside = at.polygon.length >= 3 && at.beyond < 1e-9;
    }
    if (inside) {
      const raised: number = lift(subject, frames[index]!.bodies[id]!);
      return tilt(index) > TIPPED ||
        raised > LIFT ||
        !(height(index) > start * 0.9)
        ? fail(
            `captured with the root tilted ${tilt(index).toFixed(1)} deg, a support lifted ${(raised * 1000).toFixed(1)} mm, height ${height(index)} of ${start}`,
          )
        : { decided: true, failures: [] };
    }
    return final
      ? fail(
          `not captured by the cap: ${recovery?.last}, ${steps.length} steps (landed ${landed(steps)})`,
        )
      : { decided: false, failures: [] };
  }

  /**
   * Audit a decided run's record, whatever the outcome:
   *
   * - Floor load: over every window the body's vertical momentum changes by the
   *   floor's recorded normal impulse less its weight's, within #3092's 2
   *   percent of the weight (Newton's second law): an external force holding
   *   the body, or a floor load left out of the record, breaks it.
   * - Contact provenance: every solver sample of the floor's contact with the
   *   body, a world witness midpoint merged over its step's substeps
   *   (`readXpbdManifolds`, `recordPhysicalContact`), lies within half its
   *   separation of the floor and of the bone it names, as the bone sweeps from
   *   the frame before to the sample's own.
   * - Bounded effort: no support wrench exceeds the body's force bound.
   * - Honest steps: every landed step's limb left the floor after the step began
   *   and touched it again by its landing.
   */
  export function audit(
    subject: ISubject,
    cache: ICache,
    id: string,
    maximum: number,
  ): string[] {
    const failures: string[] = [];
    const frames = cache.frames;
    const weight: number = subject.profile.mass * 9.81;
    const loads: number[] = frames.map((): number => 0);
    const loaded: Map<string, Set<number>> = new Map();
    const bounds: Map<
      string,
      { min: IAutoMovieVector3; max: IAutoMovieVector3 }
    > = new Map();
    for (const receipt of cache.contacts) {
      const end: "a" | "b" | undefined =
        receipt.a.body === id && receipt.b.body === "floor"
          ? "a"
          : receipt.b.body === id && receipt.a.body === "floor"
            ? "b"
            : undefined;
      if (!end || receipt.source !== "solver") continue;
      const bone: string = receipt[end].bone;
      const segment: IAutoMoviePhysicalSegment | undefined =
        subject.profile.segments.find(
          (candidate: IAutoMoviePhysicalSegment): boolean =>
            candidate.bone === bone,
        );
      if (!segment) {
        failures.push(`a floor receipt names ${bone}, no segment of the body`);
        continue;
      }
      for (const sample of receipt.samples ?? []) {
        const step: number = Math.round(sample.seconds * RATE);
        if (step < 1 || step >= frames.length) continue;
        loads[step]! +=
          (sample.appliedImpulse?.[end] ?? sample.impulse) *
          (end === "a" ? -sample.normal.y : sample.normal.y);
        let set: Set<number> | undefined = loaded.get(bone);
        if (!set) loaded.set(bone, (set = new Set()));
        set.add(step);
        // The sample merges the step's substeps, so the bone sweeps from the
        // frame before to this one: its bounds over both.
        const key: string = `${bone}@${step}`;
        let box = bounds.get(key);
        if (!box) {
          const boxes = [step - 1, step].flatMap((k: number) =>
            [...segment.shapes, ...(segment.contactShapes ?? [])].map((shape) =>
              AutoMovieEnginePhysics.physicalShapeBounds(frames[k]!.bodies[id]![bone]!, shape),
            ),
          );
          box = {
            min: {
              x: Math.min(...boxes.map((b) => b.min.x)),
              y: Math.min(...boxes.map((b) => b.min.y)),
              z: Math.min(...boxes.map((b) => b.min.z)),
            },
            max: {
              x: Math.max(...boxes.map((b) => b.max.x)),
              y: Math.max(...boxes.map((b) => b.max.y)),
              z: Math.max(...boxes.map((b) => b.max.z)),
            },
          };
          bounds.set(key, box);
        }
        // A world witness midpoint lies within half the contact's separation
        // of each witness's surface (`readXpbdManifolds`), the floor's and the
        // bone's, up to rounding.
        const reach: number = Math.abs(sample.separation) / 2 + WITNESS;
        const p: IAutoMovieVector3 = sample.point;
        if (
          Math.abs(p.y) > reach ||
          p.x < box.min.x - reach ||
          p.x > box.max.x + reach ||
          p.y < box.min.y - reach ||
          p.y > box.max.y + reach ||
          p.z < box.min.z - reach ||
          p.z > box.max.z + reach
        ) {
          failures.push(
            `a floor sample at ${sample.seconds} s, ${JSON.stringify(p)}, lies off the floor or off ${bone}`,
          );
          break;
        }
      }
    }
    // The vertical momentum balance, window by window.
    const momentum: number[] = frames.map((frame): number =>
      subject.profile.segments.reduce(
        (sum: number, segment: IAutoMoviePhysicalSegment): number => {
          const state = frame.bodies[id]![segment.bone]!;
          const arm: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
            state.rotation,
            segment.centerOfMass,
          );
          return (
            sum +
            segment.mass *
              (state.velocity.y + AutoMovieEngineVector3.cross(state.angularVelocity, arm).y)
          );
        },
        0,
      ),
    );
    const span: number = Math.round(WINDOW * RATE);
    for (let from: number = 0; from + span < frames.length; from += span) {
      let impulse: number = 0;
      for (let k: number = from + 1; k <= from + span; k++)
        impulse += loads[k]!;
      const residual: number =
        momentum[from + span]! - momentum[from]! - (impulse - weight * WINDOW);
      if (Math.abs(residual) > LOAD * weight * WINDOW) {
        failures.push(
          `from ${frames[from]!.seconds} s the vertical momentum moved ${residual.toFixed(2)} N s more than the recorded floor load and gravity allow`,
        );
        break;
      }
    }
    const excess: number = Math.max(
      0,
      ...cache.supportWrenches
        .filter((wrench): boolean => wrench.body === id)
        .map(
          (wrench): number => AutoMovieEngineVector3.length(wrench.allocated.force) - maximum,
        ),
    );
    if (excess > 1e-6)
      failures.push(`a support wrench exceeded its bound by ${excess} N`);
    const limbs = limbsOf(subject);
    for (const step of cache.recovery[id]?.steps ?? []) {
      if (step.resolved?.status !== "landed") continue;
      const limb = limbs.find((candidate) => candidate.bone === step.bone);
      const bones: string[] = limb
        ? [limb.bone, ...(limb.contacts ?? [])]
        : [step.bone];
      const on = (k: number): boolean =>
        bones.some(
          (bone: string): boolean => loaded.get(bone)?.has(k) ?? false,
        );
      const from: number = Math.ceil(step.start * RATE);
      const to: number = Math.round(step.resolved.seconds * RATE);
      let left: number = -1;
      for (let k: number = from; k < to && left < 0; k++) if (!on(k)) left = k;
      let back: boolean = false;
      for (let k: number = Math.max(left, from); left >= 0 && k <= to + 1; k++)
        back ||= on(k);
      if (left < 0 || !back)
        failures.push(
          `${step.bone}'s step from ${step.start} s landed at ${step.resolved.seconds} s ${left < 0 ? "without leaving the floor" : "with no floor contact"}`,
        );
    }
    return failures;
  }

  /** The body's support limbs. */
  function limbsOf(subject: ISubject) {
    return subject.policy.pattern.limbs;
  }

  /** The bones the body's supports touch the floor with. */
  function supportsOf(subject: ISubject): Set<string> {
    return new Set(
      limbsOf(subject).flatMap((limb) => [limb.bone, ...(limb.contacts ?? [])]),
    );
  }

  /** The body's bones the solver recorded on the floor. */
  function touched(cache: ICache, id: string): string[] {
    return [
      ...new Set(
        cache.contacts
          .filter((receipt): boolean => receipt.source === "solver")
          .flatMap((receipt): string[] =>
            receipt.a.body === id && receipt.b.body === "floor"
              ? [receipt.a.bone]
              : receipt.b.body === id && receipt.a.body === "floor"
                ? [receipt.b.bone]
                : [],
          ),
      ),
    ];
  }

  /**
   * How far the supports' sole edges have risen off their plants, metres: the
   * largest rise, over the supports, of the bearing face's height spread at the
   * pose over its spread when planted, the face's corners carried rigidly with
   * the bone. The controller's seating latches the same spread when a stance
   * begins (`IAutoMoviePhysicalRecoveryState.seating`).
   */
  function lift(
    subject: ISubject,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): number {
    return Math.max(
      ...[...supportsOf(subject)].map((bone: string): number => {
        const face: IAutoMovieVector3[] = bearing(subject, bone);
        if (face.length === 0) return 0;
        const spread = (pose: IAutoMovieRigidTransform): number => {
          const heights: number[] = face.map(
            (local: IAutoMovieVector3): number =>
              AutoMovieEnginePhysics.physicalSupportPoint(pose, local).y,
          );
          return Math.max(...heights) - Math.min(...heights);
        };
        return spread(poses[bone]!) - spread(subject.targets[bone]!);
      }),
    );
  }

  /**
   * A support bone's bearing face in its own frame: its shapes' vertices, a
   * hull's points or a box's corners, within the foot-lift bound of the lowest
   * at the planted pose, so a side or a raised toe is not bearing.
   */
  function bearing(subject: ISubject, bone: string): IAutoMovieVector3[] {
    const segment: IAutoMoviePhysicalSegment | undefined =
      subject.profile.segments.find(
        (candidate: IAutoMoviePhysicalSegment): boolean =>
          candidate.bone === bone,
      );
    if (!segment) return [];
    const pose: IAutoMovieRigidTransform = subject.targets[bone]!;
    const local: IAutoMovieVector3[] = [];
    for (const shape of [...segment.shapes, ...(segment.contactShapes ?? [])])
      if (shape.kind === "hull")
        for (const point of shape.points)
          local.push(AutoMovieEnginePhysics.physicalSupportPoint(shape.transform, point));
      else if (shape.kind === "box")
        for (const x of [-1, 1])
          for (const y of [-1, 1])
            for (const z of [-1, 1])
              local.push(
                AutoMovieEnginePhysics.physicalSupportPoint(shape.transform, {
                  x: x * shape.halfExtents.x,
                  y: y * shape.halfExtents.y,
                  z: z * shape.halfExtents.z,
                }),
              );
    if (local.length === 0) return [];
    const heights: number[] = local.map(
      (point: IAutoMovieVector3): number => AutoMovieEnginePhysics.physicalSupportPoint(pose, point).y,
    );
    const lowest: number = Math.min(...heights);
    return local.filter(
      (_, i: number): boolean => heights[i]! <= lowest + LIFT,
    );
  }

  /** The angle between two orientations, degrees. */
  function turn(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
    const q: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(b),
      a,
    );
    return (2 * Math.acos(Math.min(1, Math.abs(q.w))) * 180) / Math.PI;
  }

  /**
   * Whether a body is captured at a frame: its capture point inside the
   * shrunken support polygon its limbs stand on and its horizontal speed within
   * omega times the margin (Koolen et al., Corollary 3; Hof et al. 2005, Eq.
   * 7).
   */
  function captured(
    subject: ISubject,
    cache: ICache,
    id: string,
    index: number,
  ): boolean {
    const at = captureAt(subject, cache, id, index);
    return (
      at.polygon.length >= 3 &&
      at.beyond < 1e-9 &&
      at.speed <= at.omega * MARGIN
    );
  }

  /**
   * A frame's capture point against the support its limbs stand on: how far
   * past it, metres, its distance from the standing centre of mass's ground
   * point, the polygon, the horizontal speed and omega.
   */
  function captureAt(
    subject: ISubject,
    cache: ICache,
    id: string,
    index: number,
  ): {
    beyond: number;
    offset: number;
    polygon: IAutoMovieVector3[];
    speed: number;
    omega: number;
  } {
    const frames = cache.frames;
    const poses = frames[index]!.bodies[id]!;
    const now: IAutoMovieVector3 = centerOf(subject.profile, poses);
    const before: IAutoMovieVector3 = centerOf(
      subject.profile,
      frames[Math.max(0, index - 1)]!.bodies[id]!,
    );
    const dt: number = Math.max(
      1e-9,
      frames[index]!.seconds - frames[Math.max(0, index - 1)]!.seconds,
    );
    const velocity = { x: (now.x - before.x) / dt, z: (now.z - before.z) / dt };
    const omega: number = omegaOf(subject);
    const capture: IAutoMovieVector3 = {
      x: now.x + velocity.x / omega,
      y: 0,
      z: now.z + velocity.z / omega,
    };
    const polygon: IAutoMovieVector3[] = AutoMovieEnginePhysicalStanceSupport.polygon(
      subject.profile,
      poses,
      limbsOf(subject),
      0,
    );
    const nearest: IAutoMovieVector3 = AutoMovieEnginePhysicalBalance.nearest(
      polygon,
      capture,
    );
    const standing: IAutoMovieVector3 = centerOf(
      subject.profile,
      subject.targets,
    );
    return {
      beyond: Math.hypot(nearest.x - capture.x, nearest.z - capture.z),
      offset: Math.hypot(capture.x - standing.x, capture.z - standing.z),
      polygon,
      speed: Math.hypot(velocity.x, velocity.z),
      omega,
    };
  }

  /**
   * The capture point's distance past the support at each landed swing phase,
   * metres: at the frame of the phase's last landing.
   */
  export function landedExcesses(
    subject: ISubject,
    cache: ICache,
    id: string,
  ): number[] {
    const frames = cache.frames;
    return phases(cache.recovery[id]?.steps ?? []).flatMap(
      (phase): number[] => {
        const times: number[] = phase.flatMap((step): number[] =>
          step.resolved?.status === "landed" ? [step.resolved.seconds] : [],
        );
        if (times.length === 0) return [];
        const index: number = frames.findIndex(
          (frame): boolean => frame.seconds >= Math.max(...times) - 1e-9,
        );
        return index > 0 ? [captureAt(subject, cache, id, index).beyond] : [];
      },
    );
  }

  /**
   * Whether a body keeps diverging from step to step: the capture point past
   * the support at each landing further than at the one before, as the capture
   * point beyond the any-step bound does (Koolen et al., Eq. 25); fewer than
   * two landings leave the verdict to capture alone.
   */
  export function diverging(excesses: readonly number[]): boolean {
    return excesses.every(
      (excess: number, i: number): boolean =>
        i === 0 || excess > excesses[i - 1]!,
    );
  }

  /** The profile's root segment: the one no joint moves. */
  function rootOf(profile: IAutoMoviePhysicalProfile): string {
    return profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        !profile.joints.some((joint): boolean => joint.child === segment.bone),
    )!.bone;
  }

  /** The mass centre of a set of segment frames, world metres. */
  export function centerOf(
    profile: IAutoMoviePhysicalProfile,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): IAutoMovieVector3 {
    return profile.segments.reduce(
      (
        sum: IAutoMovieVector3,
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(
          sum,
          AutoMovieEngineVector3.scale(
            AutoMovieEngineVector3.add(
              poses[segment.bone]!.position,
              AutoMovieEngineQuaternion.rotateVector(
                poses[segment.bone]!.rotation,
                segment.centerOfMass,
              ),
            ),
            segment.mass / profile.mass,
          ),
        ),
      { x: 0, y: 0, z: 0 },
    );
  }
}

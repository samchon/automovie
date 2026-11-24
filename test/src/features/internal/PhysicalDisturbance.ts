import {
  AutoMoviePhysicalBalance,
  AutoMoviePhysicalSimulation,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalStanceBalance,
  physicalSupportPoint,
} from "@automovie/engine";
import { fitHumanPhysicalStandingPose } from "@automovie/human";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { createHash } from "node:crypto";

import { PhysicalSupportFixtures } from "./PhysicalSupportFixtures";
import { createPhysicalBalanceInput } from "./createPhysicalBalanceInput";

/**
 * The run lengths a disturbance is simulated to, seconds, each resuming the
 * last: whole numbers of 120 Hz steps, up to 2.5 s, which a step landing by
 * 0.75 s needs to settle, t_land + 5 / omega (the review's run length).
 */
const CHUNKS: readonly number[] = [
  0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5,
];

/** The longest run, seconds: the standing body's targets cover it. */
const DURATION: number = 2.5;

/** The simulation's step rate, per second (`createPhysicalBalanceInput`). */
const RATE: number = 120;

/** Steps between the checkpoints a longer run resumes from. */
const CHECKPOINT: number = 6;

/**
 * The steps the capture point must stay outside before a step starts
 * (`advancePhysicalBalance`).
 */
const TRIGGER: number = 2;

/**
 * The fixed step at which the push starts, after a fifth of a second of quiet
 * stance.
 */
const PUSH_STEP: number = 24;

/**
 * How long the push lasts, seconds: a rectangular force at the root through the
 * centre of mass (Yin, Loken and van de Panne 2007, Section 7; Stephens 2011,
 * Figure 4.5).
 */
const PUSH_SECONDS: number = 0.1;

/**
 * How far the floor load may stand from the weight once a body stands again, as
 * a share of it.
 */
const LOAD: number = 0.02;

/** The late window in which a standing body's floor load is read, seconds. */
const WINDOW: number = 0.15;

/**
 * The margin the centre of pressure keeps from the supports' edges, metres: the
 * in-place bound is m omega (b - margin) (Pratt et al., M2V2, footnote 2).
 */
const MARGIN: number = 0.02;

/**
 * How far a support's sole edge may rise off its plant and stay flat, metres:
 * the project's foot lift verdict bound
 * (`AutoMovieMotionHumanAuditLimits.lift`).
 */
const LIFT: number = 0.005;

/**
 * The root tilt past which a body has tipped over, degrees: the hip strategy's
 * range, 0.5 rad (Stephens 2011, Table 4.1).
 */
const TIPPED: number = (0.5 * 180) / Math.PI;

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
 *   8).
 * - One step: the leading limb steps after the reaction, its unloading ramp
 *   (`physicalStanceBalance.FADE`) and its quickest swing to its reach l, a
 *   minimum-jerk transfer at the leg's peak acceleration a, sqrt(5.77 l / a), T
 *   in all (Khadiv et al. 2017, Section III-B), while the remaining supports
 *   hold the centre of pressure at their edge p. The capture point there grows
 *   as p + (xi - p) e^(omega T) (Hof et al. 2005, Eq. 3), so a push is
 *   capturable while that stays within the leading limb's reach l.
 * - Any steps: repeated steps of reach l every T capture at most l e^(-omega T) /
 *   (1 - e^(-omega T)) beyond the edge. The pushes are half the in-place bound,
 *   the middle of the one-step window and one and a half times the any-step
 *   bound, forward or sideways, the first directions SIMBICON's evaluation
 *   lists (Yin, Loken and van de Panne 2007, Section 7.2). Sideways the same
 *   bounds leave the canonical Human no one-step window: its trailing foot
 *   holds the centre of pressure a stance width away from the stepping one.
 */
export namespace PhysicalDisturbance {
  /** A standing body ready to be pushed. */
  export interface ISubject {
    /** The body's profile. */
    profile: IAutoMoviePhysicalProfile;
    /** Its standing targets, world metres. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /** A fresh simulation body over the run. */
    body: () => IAutoMoviePhysicalSimulationInput.IBody;
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

  /** The canonical Human in its public Stand, handed over to physics. */
  export function standing(human: IAutoMovieMotionHumanBody): ISubject {
    const profile: IAutoMoviePhysicalProfile = human.profile;
    const performance: HumanPerformance = new HumanPerformance({
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
      composition: HumanChain.subject("a").stand({ hold: 1, sway: 0 }).node,
    });
    const bones = performance.bones("a", 0.9);
    const fit: ReturnType<typeof fitHumanPhysicalStandingPose> =
      fitHumanPhysicalStandingPose({
        profile,
        targets: Object.fromEntries(
          profile.segments.map(
            (
              segment: IAutoMoviePhysicalSegment,
            ): [string, IAutoMovieRigidTransform] => {
              const bone = bones.get(segment.bone as never)!;
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
    return {
      profile,
      targets: structuredClone(fit.targets),
      body: (): IAutoMoviePhysicalSimulationInput.IBody => {
        const body: IAutoMoviePhysicalSimulationInput.IBody =
          PhysicalSupportFixtures.canonical(profile, DURATION);
        for (const target of body.targets)
          target.segments = structuredClone(fit.targets);
        return body;
      },
    };
  }

  /** The four-support primitive at rest on its supports. */
  export function planted(profile: IAutoMoviePhysicalProfile): ISubject {
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
      body: (): IAutoMoviePhysicalSimulationInput.IBody =>
        PhysicalSupportFixtures.body(profile, DURATION),
    };
  }

  /** Push a body by an outcome's impulse along an axis and check that outcome. */
  export async function verify(
    subject: ISubject,
    name: Outcome,
    axis: Axis,
    failures: string[],
  ): Promise<void> {
    const pushes: IPushes = bounds(subject, axis);
    if (name === "recover" && !(pushes.step > pushes.place))
      failures.push(
        `${subject.profile.id}/${axis}: no one-step window ${JSON.stringify(pushes)}`,
      );
    // The independent anchor: the controller's one-step bound lies within
    // Koolen et al.'s Eq. 25 for the step times the literature reports, 0.3
    // to 0.6 s (Khadiv et al. 2017, Section V; Pratt et al., M2V2, IX-B).
    if (name === "recover") {
      const slow: number = window(subject, axis, 0.6).step;
      const fast: number = window(subject, axis, 0.3).step;
      if (!(pushes.step >= slow - 1e-9 && pushes.step <= fast + 1e-9))
        failures.push(
          `${subject.profile.id}/${axis}: one-step bound ${pushes.step} N s lies outside Koolen's Eq. 25 at 0.3-0.6 s, [${slow}, ${fast}]`,
        );
    }
    await push(subject, name, axis, impulse(subject, name, axis), failures);
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

  /**
   * State each outcome's bound for a push along an axis from the body's own
   * pendulum, with the controller's own pure functions (the review's derived
   * procedure). The linear inverted pendulum is integrated through the 0.1 s
   * pulse under the centre-of-pressure law clamped to the support polygon the
   * controller holds it within (`physicalStanceBalance.polygon`, `.law`):
   *
   * - In place: the largest pulse whose capture point stays on the polygon (Hof
   *   et al. 2005, Eqs. 7-8);
   * - One step: the capture point at the trigger, two steps after the pulse,
   *   within the reach's e^(-omega T) of the remaining supports' shrunken edge
   *   (Koolen et al., Eq. 25), T the controller's own step time;
   * - Any steps: Koolen et al., Eq. 26 with that T.
   */
  export function bounds(subject: ISubject, axis: Axis): IPushes {
    return window(subject, axis, timing(subject));
  }

  /** The bounds for a push along an axis with a given step time, seconds. */
  export function window(subject: ISubject, axis: Axis, time: number): IPushes {
    const policy = subject.body().balance!;
    const limbs = policy.pattern.limbs;
    const center: IAutoMovieVector3 = centerOf(
      subject.profile,
      subject.targets,
    );
    const omega: number = Math.sqrt(9.81 / center.y);
    const along = (sign: number): IAutoMovieVector3 => ({
      x: axis === "x" ? sign : 0,
      y: 0,
      z: axis === "z" ? sign : 0,
    });
    const polygon: IAutoMovieVector3[] = physicalStanceBalance.polygon(
      subject.profile,
      subject.targets,
      limbs,
      0,
    );
    const from: number = center[axis];
    const high: number =
      from +
      physicalStanceBalance.reach(polygon, { ...center, y: 0 }, along(1));
    const low: number =
      from -
      physicalStanceBalance.reach(polygon, { ...center, y: 0 }, along(-1));
    const middles = limbs.map((limb) => {
      const at: number[] = physicalStanceBalance
        .polygon(subject.profile, subject.targets, [limb], 0)
        .map((point: IAutoMovieVector3): number => point[axis]);
      return { limb, middle: (Math.min(...at) + Math.max(...at)) / 2 };
    });
    const lead = middles.reduce((a, b) => (b.middle > a.middle ? b : a));
    const rest: number = Math.max(
      ...physicalStanceBalance
        .polygon(
          subject.profile,
          subject.targets,
          limbs.filter((limb) => limb !== lead.limb),
          0,
        )
        .map((point: IAutoMovieVector3): number => point[axis]),
    );
    const reach: number = policy.maximumStep;
    const mass: number = subject.profile.mass;
    // The pendulum through the pulse and on to the trigger, the centre of
    // pressure following the law within [low, high]: the capture point's
    // peak and its value at the trigger.
    const run = (impulse: number): { peak: number; trigger: number } => {
      const dt: number = 1 / 1200;
      const force: number = impulse / PUSH_SECONDS;
      let x: number = from;
      let v: number = 0;
      let peak: number = from;
      const until: number = PUSH_SECONDS + TRIGGER / RATE;
      for (let t: number = 0; t < until; t += dt) {
        const xi: number = x + v / omega;
        const u: number = Math.max(
          low,
          Math.min(high, xi + physicalStanceBalance.GAIN * (xi - from)),
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
   * diagonal pair's two feet lifting together as one contact switch of the
   * gait (Chen et al. 2022, Section 2.1, Example 1).
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
   * The swing phases armed before the one ahead of them had resolved: one
   * swing phase at a time, so none is ever armed during another.
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
   * unloading ramp and the quickest swing the hip allows
   * (`physicalStanceBalance.swingBound`), no shorter than Khadiv's 0.3 s, as
   * `advancePhysicalBalance` states it at the standing pose.
   */
  export function timing(subject: ISubject): number {
    const policy = subject.body().balance!;
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
        physicalStanceBalance.swingLeg(subject.profile, subject.targets, limb),
      )
      .reduce((a, b) => (b.mass > a.mass ? b : a));
    const peak: number = Math.min(
      policy.maximumForce / heaviest - 9.81,
      physicalStanceBalance.swingBound({
        effective: leg.mass,
        length: leg.length,
        torque: leg.torque,
      }),
    );
    return (
      (policy.reactionSeconds ?? 0) +
      physicalStanceBalance.FADE +
      AutoMoviePhysicalBalance.duration(reach, 0, peak)
    );
  } /**
   * The coordinates along an axis of the named carriers' bearing face projected
   * to the floor: the shape points within the foot-lift bound of their lowest,
   * so a side or a toe held off the floor is not support.
   */
  function outline(
    subject: ISubject,
    carriers: readonly string[],
    axis: Axis,
  ): number[] {
    const points: IAutoMovieVector3[] = [];
    for (const segment of subject.profile.segments) {
      if (!carriers.includes(segment.bone)) continue;
      const pose: IAutoMovieRigidTransform = subject.targets[segment.bone]!;
      for (const shape of [...segment.shapes, ...(segment.contactShapes ?? [])])
        if (shape.kind === "hull")
          for (const point of shape.points)
            points.push(
              physicalSupportPoint(
                pose,
                physicalSupportPoint(shape.transform, point),
              ),
            );
        else if (shape.kind === "box")
          for (const x of [-1, 1])
            for (const y of [-1, 1])
              for (const z of [-1, 1])
                points.push(
                  physicalSupportPoint(
                    pose,
                    physicalSupportPoint(shape.transform, {
                      x: x * shape.halfExtents.x,
                      y: y * shape.halfExtents.y,
                      z: z * shape.halfExtents.z,
                    }),
                  ),
                );
        else {
          const box = physicalShapeBounds(pose, shape);
          for (const x of [box.min.x, box.max.x])
            for (const z of [box.min.z, box.max.z])
              points.push({ x, y: box.min.y, z });
        }
    }
    const lowest: number = Math.min(...points.map((point) => point.y));
    return points
      .filter((point: IAutoMovieVector3): boolean => point.y <= lowest + LIFT)
      .map((point: IAutoMovieVector3): number => point[axis]);
  }
  /**
   * Push the standing body at its root through its centre of mass, as a
   * rectangular force, and run it only until its outcome is decided: each
   * longer run resumes the last from its checkpoint, and the run stops once the
   * outcome holds on a settled body or has plainly failed.
   */
  async function push(
    subject: ISubject,
    name: Outcome,
    axis: Axis,
    impulse: number,
    failures: string[],
  ): Promise<void> {
    const full: IAutoMoviePhysicalSimulationInput.IBody = subject.body();
    const root: string = rootOf(subject.profile);
    const start: number = centerOf(subject.profile, subject.targets).y;
    let run: IAutoMoviePhysicalSimulation | undefined;
    let last: string[] = [];
    for (const duration of CHUNKS) {
      run = await AutoMoviePhysicalSimulation.compute(
        inputOf(subject, full, axis, impulse, duration),
        run,
      );
      const outcome = { run, id: full.id, maximum: full.maximumRootForce };
      const trial: string[] = [];
      check(subject, name, axis, impulse, outcome, trial);
      const frames = run.cache.frames;
      const now = centerOf(subject.profile, frames.at(-1)!.bodies[full.id]!);
      const recovery = run.cache.recovery[full.id];
      // A fall is decided once the body is down; otherwise the run goes on
      // to its end, never captured.
      if (
        trial.length === 0 &&
        (name === "fall"
          ? now.y < start * 0.6
          : captured(subject, run, full.id))
      )
        return;
      const lost: boolean =
        name === "fall"
          ? trial.length > 0
          : now.y < start * 0.6 ||
            (name === "sustained" &&
              ((recovery?.steps.length ?? 0) > 0 ||
                Math.max(
                  ...frames.map((frame): number =>
                    turn(
                      frame.bodies[full.id]![root]!.rotation,
                      subject.targets[root]!.rotation,
                    ),
                  ),
                ) > TIPPED));
      last = trial;
      if (lost) break;
    }
    failures.push(...last);
  }

  /**
   * Run one push unbroken, then in two chunks the second resuming the first
   * from its checkpoint, then unbroken again, and compare the three runs'
   * frames bit for bit: every segment's transform at every step, the root's
   * trajectory with them. A controller state kept outside the checkpoint shows
   * as a resumed run that parts from the unbroken one.
   */
  export async function resume(
    subject: ISubject,
    axis: Axis,
    impulse: number,
    durations: readonly [number, number],
  ): Promise<string[]> {
    const full: IAutoMoviePhysicalSimulationInput.IBody = subject.body();
    const [early, late] = durations;
    const digest = (run: IAutoMoviePhysicalSimulation): string =>
      createHash("sha256")
        .update(
          new Uint8Array(
            Float64Array.from(
              run.cache.frames.flatMap((frame): number[] =>
                Object.values(frame.bodies[full.id]!).flatMap(
                  (transform: IAutoMovieRigidTransform): number[] => [
                    transform.position.x,
                    transform.position.y,
                    transform.position.z,
                    transform.rotation.x,
                    transform.rotation.y,
                    transform.rotation.z,
                    transform.rotation.w,
                  ],
                ),
              ),
            ).buffer,
          ),
        )
        .digest("hex");
    const unbroken: string = digest(
      await AutoMoviePhysicalSimulation.compute(
        inputOf(subject, full, axis, impulse, late),
      ),
    );
    const chunked: string = digest(
      await AutoMoviePhysicalSimulation.compute(
        inputOf(subject, full, axis, impulse, late),
        await AutoMoviePhysicalSimulation.compute(
          inputOf(subject, full, axis, impulse, early),
        ),
      ),
    );
    const again: string = digest(
      await AutoMoviePhysicalSimulation.compute(
        inputOf(subject, full, axis, impulse, late),
      ),
    );
    const label: string = `${subject.profile.id}/${axis} ${impulse.toFixed(1)} N s`;
    return [
      ...(chunked === unbroken
        ? []
        : [
            `${label}: the run resumed at ${early} s parts from the unbroken one`,
          ]),
      ...(again === unbroken ? [] : [`${label}: two unbroken runs differ`]),
    ];
  }

  /**
   * The simulation input of one push run to a duration: the body's targets cut
   * there, the push a rectangular force through the standing centre of mass at
   * the root. Every run states the longest one's step budget, so a longer run's
   * settings match the last and it resumes from its checkpoint.
   */
  function inputOf(
    subject: ISubject,
    full: IAutoMoviePhysicalSimulationInput.IBody,
    axis: Axis,
    impulse: number,
    duration: number,
  ): IAutoMoviePhysicalSimulationInput.IInput {
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      createPhysicalBalanceInput(
        subject.profile,
        "internal",
        impulse,
        duration,
        {
          ...full,
          targets: full.targets.slice(0, Math.round(duration * RATE) + 1),
        },
      );
    input.checkpointEvery = CHECKPOINT;
    input.maximumSteps = Math.round(DURATION * RATE);
    const template = input.impulses[0]!;
    const steps: number = Math.round(PUSH_SECONDS * input.rate);
    input.impulses = Array.from({ length: steps }, (_, index: number) => ({
      ...structuredClone(template),
      step: PUSH_STEP + index,
      impulse: {
        x: axis === "x" ? impulse / steps : 0,
        y: 0,
        z: axis === "z" ? impulse / steps : 0,
      },
      bone: rootOf(subject.profile),
      point: centerOf(subject.profile, subject.targets),
    }));
    return input;
  }

  /** Check one outcome against what its push requires. */
  function check(
    subject: ISubject,
    name: Outcome,
    axis: Axis,
    impulse: number,
    outcome: { run: IAutoMoviePhysicalSimulation; id: string; maximum: number },
    failures: string[],
  ): void {
    const { run, id } = outcome;
    const label: string = `${subject.profile.id}/${name} ${axis} ${impulse.toFixed(1)} N s`;
    const recovery = run.cache.recovery[id];
    const start: number = centerOf(subject.profile, subject.targets).y;
    const last: Readonly<Record<string, IAutoMovieRigidTransform>> =
      run.cache.frames.at(-1)!.bodies[id]!;
    const end: number = centerOf(subject.profile, last).y;
    const limbs = subject.body().balance!.pattern.limbs;
    const supports: Set<string> = new Set(
      limbs.flatMap((limb) => [limb.bone, ...(limb.contacts ?? [])]),
    );
    const touched: string[] = [
      ...new Set(
        run.cache.contacts
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
    const strays: string[] = touched.filter(
      (bone: string): boolean => !supports.has(bone),
    );
    if (name === "fall") {
      // Past the any-step bound the body cannot be captured: never, after the
      // push, its capture point inside the support with its speed settled,
      // whether it falls or keeps stepping.
      const after: number = Math.round(
        (PUSH_STEP / RATE + PUSH_SECONDS) * RATE,
      );
      const caught: number = run.cache.frames.findIndex(
        (_, index: number): boolean =>
          index > after && captured(subject, run, id, index),
      );
      if (caught >= 0)
        failures.push(
          `${label}: captured at ${run.cache.frames[caught]!.seconds} s (${recovery?.last}, height ${end} of ${start}, touched ${touched})`,
        );
      const excess: number = Math.max(
        0,
        ...run.cache.supportWrenches
          .filter((wrench): boolean => wrench.body === id)
          .map(
            (wrench): number =>
              Vector3.length(wrench.allocated.force) - outcome.maximum,
          ),
      );
      if (excess > 1e-6)
        failures.push(
          `${label}: a support wrench exceeded its bound by ${excess} N`,
        );
      return;
    }
    // A body that tipped over is not supported, whatever its recovery state
    // says; a sustained push also keeps every support flat throughout, and
    // a recovered body stands on flat supports at the end.
    const root: string = rootOf(subject.profile);
    // A sustained push keeps the root up throughout; a recovered body is
    // judged settled, at the end, landing transients left out.
    const tilt: number = Math.max(
      ...(name === "sustained"
        ? run.cache.frames
        : [run.cache.frames.at(-1)!]
      ).map((frame): number =>
        turn(
          frame.bodies[id]![root]!.rotation,
          subject.targets[root]!.rotation,
        ),
      ),
    );
    const lift = (poses: Readonly<Record<string, IAutoMovieRigidTransform>>) =>
      Math.max(
        ...[...supports].map((bone: string): number => {
          const xs: number[] = outline(subject, [bone], "x");
          const zs: number[] = outline(subject, [bone], "z");
          const span: number = Math.hypot(
            Math.max(...xs) - Math.min(...xs),
            Math.max(...zs) - Math.min(...zs),
          );
          return (
            span *
            Math.sin(
              (lean(poses[bone]!.rotation, subject.targets[bone]!.rotation) *
                Math.PI) /
                180,
            )
          );
        }),
      );
    const raised: number =
      name === "sustained"
        ? Math.max(
            ...run.cache.frames.map((frame): number => lift(frame.bodies[id]!)),
          )
        : lift(last);
    const weight: number = subject.profile.mass * 9.81;
    const load: number = floorLoad(run, id, run.cache.duration - WINDOW);
    // One swing phase at a time: a phase starts only once the one before it
    // resolved, so no two are ever armed together; a diagonal pair's feet
    // lift together as one phase.
    const ordered = phases(recovery?.steps ?? []);
    for (const index of overlaps(recovery?.steps ?? []))
      failures.push(
        `: swing phase ${index} armed at ${ordered[index]![0]!.start} before phase ${index - 1} resolved`,
      );
    const landed: number = PhysicalDisturbance.landed(recovery?.steps ?? []);
    if (
      recovery?.last !== "supported" ||
      tilt > TIPPED ||
      raised > LIFT ||
      !(end > start * 0.9) ||
      Math.abs(load - weight) > weight * LOAD ||
      strays.length !== 0 ||
      // A 0.1 s push held by an active centre of pressure raises the in-place
      // bound by about a quarter, past the one-step window's lower part, so a
      // recovered body may stand in place or after one step (the review).
      (name === "sustained" ? (recovery?.steps.length ?? 0) !== 0 : landed > 1)
    )
      failures.push(
        `${label}: ${recovery?.last}, root tilt ${tilt.toFixed(1)} deg, support lift ${(raised * 1000).toFixed(1)} mm, ${recovery?.steps.length ?? 0} steps (landed ${landed}), height ${end} of ${start}, floor load ${load} of ${weight} N, strays ${strays}`,
      );
  }

  /**
   * How far a segment's planted up direction has tipped, degrees: a turn about
   * the vertical raises no sole edge, so only the tilt lifts one.
   */
  function lean(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const before: IAutoMovieVector3 = Quaternion.rotateVector(b, up);
    const after: IAutoMovieVector3 = Quaternion.rotateVector(a, up);
    return (
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(before, after)))) * 180) /
      Math.PI
    );
  }
  /** The angle between two orientations, degrees. */
  function turn(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
    const q: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(b),
      a,
    );
    return (2 * Math.acos(Math.min(1, Math.abs(q.w))) * 180) / Math.PI;
  }

  /**
   * Whether a body has been captured at a run's end: its capture point inside
   * the shrunken support polygon its limbs stand on and its horizontal speed
   * within omega times the margin (Koolen et al., Corollary 3; Hof et al. 2005,
   * Eq. 7).
   */
  function captured(
    subject: ISubject,
    run: IAutoMoviePhysicalSimulation,
    id: string,
    index: number = run.cache.frames.length - 1,
  ): boolean {
    const frames = run.cache.frames;
    const poses = frames[index]!.bodies[id]!;
    const now: IAutoMovieVector3 = centerOf(subject.profile, poses);
    const before: IAutoMovieVector3 = centerOf(
      subject.profile,
      frames[index - 1]!.bodies[id]!,
    );
    const dt: number = frames[index]!.seconds - frames[index - 1]!.seconds;
    const velocity = { x: (now.x - before.x) / dt, z: (now.z - before.z) / dt };
    const omega: number = Math.sqrt(
      9.81 / centerOf(subject.profile, subject.targets).y,
    );
    const capture: IAutoMovieVector3 = {
      x: now.x + velocity.x / omega,
      y: 0,
      z: now.z + velocity.z / omega,
    };
    const polygon: IAutoMovieVector3[] = physicalStanceBalance.polygon(
      subject.profile,
      poses,
      subject.body().balance!.pattern.limbs,
      0,
    );
    const nearest: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      polygon,
      capture,
    );
    return (
      polygon.length >= 3 &&
      Math.hypot(nearest.x - capture.x, nearest.z - capture.z) < 1e-9 &&
      Math.hypot(velocity.x, velocity.z) <= omega * MARGIN
    );
  }
  /** The profile's root segment: the one no joint moves. */
  function rootOf(profile: IAutoMoviePhysicalProfile): string {
    return profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        !profile.joints.some((joint): boolean => joint.child === segment.bone),
    )!.bone;
  }

  /**
   * Mean upward floor load on a body from the window's start to the run's end,
   * newtons.
   */
  function floorLoad(
    run: IAutoMoviePhysicalSimulation,
    id: string,
    from: number,
  ): number {
    let total: number = 0;
    for (const receipt of run.cache.contacts) {
      if (receipt.source !== "solver") continue;
      const end: "a" | "b" | undefined =
        receipt.a.body === id && receipt.b.body === "floor"
          ? "a"
          : receipt.b.body === id && receipt.a.body === "floor"
            ? "b"
            : undefined;
      if (!end) continue;
      for (const sample of receipt.samples ?? [])
        if (sample.seconds > from)
          total +=
            ((sample.appliedImpulse?.[end] ?? sample.impulse) *
              (end === "a" ? -sample.normal.y : sample.normal.y)) /
            (run.cache.duration - from);
    }
    return total;
  }

  /** The mass centre of a set of segment frames, world metres. */
  function centerOf(
    profile: IAutoMoviePhysicalProfile,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): IAutoMovieVector3 {
    return profile.segments.reduce(
      (
        sum: IAutoMovieVector3,
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(
            Vector3.add(
              poses[segment.bone]!.position,
              Quaternion.rotateVector(
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

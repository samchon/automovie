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
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { PhysicalSupportFixtures } from "./PhysicalSupportFixtures";
import { createPhysicalBalanceInput } from "./createPhysicalBalanceInput";

/**
 * The run lengths a disturbance is simulated to, seconds, each resuming the
 * last: whole numbers of 120 Hz steps, up to 2.5 s, which a step landing
 * by 0.75 s needs to settle, t_land + 5 / omega (the review's run length).
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

/** The fixed step at which the push starts, after a fifth of a second of quiet stance. */
const PUSH_STEP: number = 24;

/**
 * How long the push lasts, seconds: a rectangular force at the root through
 * the centre of mass (Yin, Loken and van de Panne 2007, Section 7;
 * Stephens 2011, Figure 4.5).
 */
const PUSH_SECONDS: number = 0.1;

/** How far the floor load may stand from the weight once a body stands again, as a share of it. */
const LOAD: number = 0.02;

/** The late window in which a standing body's floor load is read, seconds. */
const WINDOW: number = 0.15;

/**
 * The margin the centre of pressure keeps from the supports' edges, metres:
 * the in-place bound is m omega (b - margin) (Pratt et al., M2V2, footnote 2).
 */
const MARGIN: number = 0.02;

/**
 * How far a support's sole edge may rise off its plant and stay flat,
 * metres: the project's foot lift verdict bound
 * (`AutoMovieMotionHumanAuditLimits.lift`).
 */
const LIFT: number = 0.005;

/**
 * The root tilt past which a body has tipped over, degrees: the hip
 * strategy's range, 0.5 rad (Stephens 2011, Table 4.1).
 */
const TIPPED: number = (0.5 * 180) / Math.PI;

/**
 * Pushing a standing body and judging the outcome against bounds stated from
 * its own inverted pendulum, shared by the disturbance-recovery tests
 * (`test_physical_disturbance_*`).
 *
 * Every push is stated from the body itself. With omega = sqrt(g / h) for
 * the standing centre-of-mass height h:
 * - In place: a push below m omega (b - margin), b the distance from the
 *   centre of mass to the supports' edge along the push, keeps the
 *   extrapolated centre of mass within the base of support (Hof, Gazendam
 *   and Sinke 2005, Eqs. 5, 8).
 * - One step: the leading limb steps after the reaction, its unloading ramp
 *   (`physicalStanceBalance.FADE`) and its quickest swing to its reach l, a
 *   minimum-jerk transfer at the leg's peak acceleration a, sqrt(5.77 l /
 *   a), T in all (Khadiv et al. 2017, Section III-B), while the remaining
 *   supports hold the centre of pressure at their edge p. The capture point there grows
 *   as p + (xi - p) e^(omega T) (Hof et al. 2005, Eq. 3), so a push is
 *   capturable while that stays within the leading limb's reach l.
 * - Any steps: repeated steps of reach l every T capture at most
 *   l e^(-omega T) / (1 - e^(-omega T)) beyond the edge.
 * The pushes are half the in-place bound, the middle of the one-step window
 * and one and a half times the any-step bound, forward or sideways, the
 * first directions SIMBICON's evaluation lists (Yin, Loken and van de Panne
 * 2007, Section 7.2). Sideways the same bounds leave the canonical Human no
 * one-step window: its trailing foot holds the centre of pressure a stance
 * width away from the stepping one.
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
      composition: HumanChain.subject("a").stand({ seconds: 1, sway: 0 }).node,
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
   * pendulum, on the support polygon the controller holds its centre of
   * pressure within (`physicalStanceBalance.polygon`): the in-place bound
   * along the push's ray from the centre of mass to that polygon's edge
   * (Hof et al. 2005, Eqs. 7-8), so a diagonal edge counts where the ray
   * meets it, not at the outline's extreme.
   */
  export function bounds(subject: ISubject, axis: Axis): IPushes {
    const policy = subject.body().balance!;
    const limbs = policy.pattern.limbs;
    const center: IAutoMovieVector3 = centerOf(
      subject.profile,
      subject.targets,
    );
    const omega: number = Math.sqrt(9.81 / center.y);
    const direction: IAutoMovieVector3 = {
      x: axis === "x" ? 1 : 0,
      y: 0,
      z: axis === "z" ? 1 : 0,
    };
    const from: number = center[axis];
    const ray: number = physicalStanceBalance.reach(
      physicalStanceBalance.polygon(subject.profile, subject.targets, limbs, 0),
      { ...center, y: 0 },
      direction,
    );
    const edge: number = from + ray;
    const middles = limbs.map((limb) => {
      const along: number[] = physicalStanceBalance
        .polygon(subject.profile, subject.targets, [limb], 0)
        .map((point: IAutoMovieVector3): number => point[axis]);
      return { limb, middle: (Math.min(...along) + Math.max(...along)) / 2 };
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
    // The leg's peak swing acceleration, as the controller bounds it: what
    // the stance can react (`physicalStanceBalance.swing`), under the
    // policy's force bound over the heaviest leg less its weight.
    const leg: number = Math.max(
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
    const mass: number = subject.profile.mass;
    const peak: number = Math.min(
      policy.maximumForce / leg - 9.81,
      physicalStanceBalance.swing(mass, leg, center.y, 9.81),
    );
    const time: number =
      (policy.reactionSeconds ?? 0) +
      physicalStanceBalance.FADE +
      Math.sqrt((AutoMoviePhysicalBalance.MINIMUM_JERK * reach) / peak);
    const decay: number = Math.exp(-omega * time);
    return {
      place: mass * omega * (edge - from),
      step: mass * omega * (rest + (lead.middle + reach - rest) * decay - from),
      any: mass * omega * (edge + (reach * decay) / (1 - decay) - from),
    };
  }
  /**
   * The coordinates along an axis of the named carriers' bearing face
   * projected to the floor: the shape points within the foot-lift bound of
   * their lowest, so a side or a toe held off the floor is not support.
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
      for (const shape of segment.shapes)
        if (shape.kind === "hull")
          for (const point of shape.points)
            points.push(
              physicalSupportPoint(
                pose,
                physicalSupportPoint(shape.transform, point),
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
   * longer run resumes the last from its checkpoint, and the run stops once
   * the outcome holds on a settled body or has plainly failed.
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
      const body: IAutoMoviePhysicalSimulationInput.IBody = {
        ...full,
        targets: full.targets.slice(0, Math.round(duration * RATE) + 1),
      };
      const input: IAutoMoviePhysicalSimulationInput.IInput =
        createPhysicalBalanceInput(
          subject.profile,
          "internal",
          impulse,
          duration,
          body,
        );
      input.checkpointEvery = CHECKPOINT;
      // Every run states the longest one's step budget, so a longer run's
      // settings match the last and it resumes from its checkpoint.
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
        bone: root,
        point: centerOf(subject.profile, subject.targets),
      }));
      run = await AutoMoviePhysicalSimulation.compute(input, run);
      const outcome = { run, id: full.id, maximum: full.maximumRootForce };
      const trial: string[] = [];
      check(subject, name, axis, impulse, outcome, trial);
      const frames = run.cache.frames;
      const now = centerOf(subject.profile, frames.at(-1)!.bodies[full.id]!);
      const recovery = run.cache.recovery[full.id];
      if (
        trial.length === 0 &&
        (name === "fall" || captured(subject, run, full.id))
      )
        return;
      const lost: boolean =
        name === "fall"
          ? false
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
      if (
        recovery?.last !== "unrecoverable" ||
        !(end < start * 0.6) ||
        strays.length === 0
      )
        failures.push(
          `${label}: did not fall honestly (${recovery?.last}, height ${end} of ${start}, touched ${touched})`,
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
    const landed: number = (recovery?.steps ?? []).filter(
      (step): boolean => step.resolved?.status === "landed",
    ).length;
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
   * How far a segment's planted up direction has tipped, degrees: a turn
   * about the vertical raises no sole edge, so only the tilt lifts one.
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
   * Whether a body has been captured at a run's end: its capture point
   * inside the shrunken support polygon its limbs stand on and its
   * horizontal speed within omega times the margin (Koolen et al.,
   * Corollary 3; Hof et al. 2005, Eq. 7).
   */
  function captured(
    subject: ISubject,
    run: IAutoMoviePhysicalSimulation,
    id: string,
  ): boolean {
    const frames = run.cache.frames;
    const poses = frames.at(-1)!.bodies[id]!;
    const now: IAutoMovieVector3 = centerOf(subject.profile, poses);
    const before: IAutoMovieVector3 = centerOf(
      subject.profile,
      frames.at(-2)!.bodies[id]!,
    );
    const dt: number = frames.at(-1)!.seconds - frames.at(-2)!.seconds;
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

  /** Mean upward floor load on a body from the window's start to the run's end, newtons. */
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

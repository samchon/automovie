import {
  AutoMoviePhysicalSimulation,
  Quaternion,
  Vector3,
  physicalShapeBounds,
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

/** Native seconds simulated per disturbance. */
const DURATION: number = 1.2;

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

/** The root tilt past which a body has tipped over, degrees. */
const TIPPED: number = 15;

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
 * - One step: the leading limb steps after the reaction, its unloading
 *   (Mille et al. 2005: a loaded limb is unloaded before it steps), at most
 *   one swing, and its swing, T in all, while the remaining supports hold
 *   the centre of pressure at their edge p. The capture point there grows
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
    const impulse: number =
      name === "sustained"
        ? pushes.place / 2
        : name === "recover"
          ? (pushes.place + pushes.step) / 2
          : 1.5 * pushes.any;
    check(
      subject,
      name,
      axis,
      impulse,
      await push(subject, axis, impulse),
      failures,
    );
  }

  /** State each outcome's bound for a push along an axis from the body's own pendulum. */
  function bounds(subject: ISubject, axis: Axis): IPushes {
    const policy = subject.body().balance!;
    const center: IAutoMovieVector3 = centerOf(
      subject.profile,
      subject.targets,
    );
    const omega: number = Math.sqrt(9.81 / center.y);
    const outlines: { low: number; high: number; middle: number }[] =
      policy.pattern.limbs.map((limb) => {
        const along: number[] = outline(
          subject,
          limb.contacts ?? [limb.bone],
          axis,
        );
        const low: number = Math.min(...along);
        const high: number = Math.max(...along);
        return { low, high, middle: (low + high) / 2 };
      });
    const edge: number = Math.max(...outlines.map((o) => o.high)) - MARGIN;
    const lead = outlines.reduce((a, b) => (b.middle > a.middle ? b : a));
    const rest: number =
      Math.max(...outlines.filter((o) => o !== lead).map((o) => o.high)) -
      MARGIN;
    const time: number = (policy.reactionSeconds ?? 0) + 2 * policy.duration;
    const decay: number = Math.exp(-omega * time);
    const reach: number = policy.maximumStep;
    const mass: number = subject.profile.mass;
    const from: number = center[axis];
    return {
      place: mass * omega * (edge - from),
      step: mass * omega * (rest + (lead.middle + reach - rest) * decay - from),
      any: mass * omega * (edge + (reach * decay) / (1 - decay) - from),
    };
  }

  /** The coordinates along an axis of the named carriers' shapes projected to the floor. */
  function outline(
    subject: ISubject,
    carriers: readonly string[],
    axis: Axis,
  ): number[] {
    const along: number[] = [];
    for (const segment of subject.profile.segments) {
      if (!carriers.includes(segment.bone)) continue;
      const pose: IAutoMovieRigidTransform = subject.targets[segment.bone]!;
      for (const shape of segment.shapes)
        if (shape.kind === "hull")
          for (const point of shape.points)
            along.push(
              physicalSupportPoint(
                pose,
                physicalSupportPoint(shape.transform, point),
              )[axis],
            );
        else {
          const box = physicalShapeBounds(pose, shape);
          along.push(box.min[axis], box.max[axis]);
        }
    }
    return along;
  }

  /** Push the standing body at its root through its centre of mass, as a rectangular force, and run it. */
  async function push(
    subject: ISubject,
    axis: Axis,
    impulse: number,
  ): Promise<{
    run: IAutoMoviePhysicalSimulation;
    id: string;
    maximum: number;
  }> {
    const body: IAutoMoviePhysicalSimulationInput.IBody = subject.body();
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      createPhysicalBalanceInput(
        subject.profile,
        "internal",
        impulse,
        DURATION,
        body,
      );
    const root: string = rootOf(subject.profile);
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
    return {
      run: await AutoMoviePhysicalSimulation.compute(input),
      id: body.id,
      maximum: body.maximumRootForce,
    };
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
    const tilt: number = Math.max(
      ...run.cache.frames.map((frame): number =>
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
              (turn(poses[bone]!.rotation, subject.targets[bone]!.rotation) *
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
    const load: number = floorLoad(run, id, DURATION - WINDOW);
    const landed: boolean = (recovery?.steps ?? []).some(
      (step): boolean => step.resolved?.status === "landed",
    );
    if (
      recovery?.last !== "supported" ||
      tilt > TIPPED ||
      raised > LIFT ||
      !(end > start * 0.9) ||
      Math.abs(load - weight) > weight * LOAD ||
      strays.length !== 0 ||
      (name === "sustained" ? (recovery?.steps.length ?? 0) !== 0 : !landed)
    )
      failures.push(
        `${label}: ${recovery?.last}, root tilt ${tilt.toFixed(1)} deg, support lift ${(raised * 1000).toFixed(1)} mm, ${recovery?.steps.length ?? 0} steps (landed ${landed}), height ${end} of ${start}, floor load ${load} of ${weight} N, strays ${strays}`,
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

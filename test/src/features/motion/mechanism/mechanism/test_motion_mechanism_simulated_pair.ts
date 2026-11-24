import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieContactReceipt,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanSimulationWindow,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../internal/assertTakeClean";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { simulationResiduals } from "../../../internal/simulationResiduals";

/** Cache intervals per second the window issue fixes (#3434). */
const RATE: number = 120;

/**
 * Two bodies in one simulated window with their grips as collider bindings
 * (#3441): the average man and the smallest woman.
 *
 * Scenarios:
 * 1. Kinematic mode shows the coupled handshake's own poses of both people bit for bit.
 * 2. Simulated, the gripping arms are the solver's and every grip stays within the solver's contact tolerance at every tracked step; two bakes give the same identity and solved frames.
 * 3. Both people released in the air together: the pair's total linear momentum changes by gravity's impulse only, within the float64 rounding the substeps run can leave, bounded in the standard model of floating-point arithmetic (Higham 2002) from each segment's position and velocity updates.
 * 4. Joint residuals in both windows: every hand-back's post-stabilization and every fewer-axis joint's distance from its limit box stay within the 0.01 degree guard, the engine's ROM_TOLERANCE (`simulationResiduals`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Bakes two-body windows through `HumanPerformance.simulate` and reads the displayed poses and the engine's solved frames; catches a kinematic mode that departs from the coupled output, a grip the solver lets slip or pass in, a bake that differs between runs, and a coupling that creates momentum.
 * @evidence contracts/development/testing.md#independent-expectations Equality for the mode contract and determinism; bindings measured as the convex distance of the bound colliders against the admitted contact tolerance; momentum against Newton's second law with gravity alone, read from segment masses and solved velocities.
 * @evidence contracts/development/testing.md#distinguishing-cases A kinematic and a simulated mode of one coupled window; tracked grips against released free bodies; a floor-contact receipt would void the momentum premise and is asserted absent.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_pair`; it runs the WASM solver in process and starts no viewer. Every scenario runs and every failure is gathered before the one assertion.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export async function test_motion_mechanism_simulated_pair(): Promise<void> {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const all: motionComplaints.IGatherer = motionComplaints();
  await guarded(all, "handshake", (): Promise<void> => handshake(all, a, b));
  await guarded(all, "released pair", (): Promise<void> => together(all, a, b));
  all.assert("simulated pair");
}

/** Run one scenario, recording a throw as a failure so later scenarios still run. */
async function guarded(
  all: motionComplaints.IGatherer,
  title: string,
  task: () => Promise<void>,
): Promise<void> {
  try {
    await task();
  } catch (error: unknown) {
    all.check(
      `${title} threw: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}

/** The shipped verdicts over the take, a fault recorded as a failure. */
function verdicts(
  all: motionComplaints.IGatherer,
  label: string,
  take: HumanPerformance,
): void {
  try {
    assertTakeClean(label, take);
  } catch (error: unknown) {
    all.check(error instanceof Error ? error.message : String(error), false);
  }
}

/** Scenarios 1 and 2: a handshake's grips, kinematic and simulated. */
async function handshake(
  all: motionComplaints.IGatherer,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): Promise<void> {
  const shoulder: (body: IAutoMovieMotionHumanBody) => IAutoMovieVector3 = (
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieVector3 =>
    poseBones(
      body,
      resolveHumanPosture(
        body,
        AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
      ),
    ).get("rightUpperArm")!.worldPosition;
  const sa: IAutoMovieVector3 = shoulder(a);
  const sb: IAutoMovieVector3 = shoulder(b);
  const take: HumanPerformance = new HumanPerformance({
    seed: "simulated-pair",
    performers: [
      performer("a", a, { x: 0, y: 0, z: 0 }, 0),
      performer("b", b, { x: sa.x + sb.x, y: 0, z: sa.z + sb.z + 0.729 }, 180),
    ],
    composition: HumanChain.pair(
      HumanChain.subject("a"),
      HumanChain.subject("b"),
    ).handshake({
      count: 2,
    }).node,
  });
  const closed: number = event(take, "a", "gripClosed");
  const release: number = event(take, "a", "release");
  const from: number = closed + 0.05;
  const window: IAutoMovieMotionHumanSimulationWindow = {
    from,
    to: from + Math.floor(Math.min(1, release - 0.05 - from) * RATE) / RATE,
  };

  // 1. Kinematic mode is the coupled output itself.
  const still: HumanPerformance = await take.simulate(window, {
    kind: "kinematic",
  });
  for (let step: number = 0; step <= 24; step++)
    for (const subject of ["a", "b"]) {
      const at: number = window.from + ((window.to - window.from) * step) / 24;
      all.equals(
        `kinematic pair pose of ${subject} at ${at} s`,
        JSON.stringify(still.pose(subject, at)),
        JSON.stringify(take.pose(subject, at)),
      );
    }

  // 2. Simulated grips hold, and two bakes agree.
  const solved: HumanPerformance = await take.simulate(window, {
    kind: "simulated",
  });
  const again: HumanPerformance = await take.simulate(window, {
    kind: "simulated",
  });
  const record: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  simulationResiduals(all, "simulated handshake", record, ["a", "b"]);
  const other: IAutoMovieMotionHumanSimulation = again.simulations()[0]!;
  all.equals(
    "pair bake identity",
    other.simulation.cache.identity,
    record.simulation.cache.identity,
  );
  all.check(
    "two pair bakes solve the same frames",
    JSON.stringify(other.simulation.cache.frames) ===
      JSON.stringify(record.simulation.cache.frames),
  );
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    record.simulation.input;
  const tolerance: number = input.contactTolerance!;
  let tracked: number = 0;
  let authored: number = 0;
  let worst: number = 0;
  let where: string = "";
  for (const body of input.bodies.filter(
    (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      candidate.id === "a" || candidate.id === "b",
  ))
    body.targets.forEach(
      (
        target: IAutoMoviePhysicalSimulationInput.ITarget,
        step: number,
      ): void => {
        if (target.strength === 0) return;
        for (const binding of target.bindings ?? []) {
          tracked++;
          const frame: IAutoMoviePhysicalFrame =
            record.simulation.cache.frames[step]!;
          if (
            record.simulation.cache.ownershipAt(
              body.id,
              binding.source.bone,
              frame.seconds,
            ) !== "dynamic"
          )
            authored++;
          const gap: number = physicalShapePairDistance(
            frame.bodies[body.id]![binding.source.bone]!,
            collider(input, body.id, binding.source),
            frame.bodies[binding.target.body]![binding.target.bone]!,
            collider(input, binding.target.body, binding.target),
          );
          if (Math.abs(gap) > Math.abs(worst)) {
            worst = gap;
            where = `${body.id}'s ${binding.id} at step ${step}`;
          }
        }
      },
    );
  all.check(`the window binds the grips at ${tracked} steps`, tracked > 0);
  all.check(
    `a bound hand is the solver's at every bound step; authored at ${authored}`,
    authored === 0,
  );
  all.check(
    `every grip stays within the contact tolerance ${tolerance} m; worst ${worst} m, ${where}`,
    Math.abs(worst) <= tolerance,
  );
  verdicts(all, "simulated handshake", solved);
}

/** Scenario 3: two people jumping side by side, released in the air. */
async function together(
  all: motionComplaints.IGatherer,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): Promise<void> {
  const jump: (subject: string, x: number) => IAutoMovieComposition = (
    subject: string,
    x: number,
  ): IAutoMovieComposition =>
    HumanChain.subject(subject)
      .stand({ hold: 0.3, sway: 0 })
      .jump({ to: { x, y: 0, z: 0.3 }, apex: 0.5 }).node;
  const take: HumanPerformance = new HumanPerformance({
    seed: "simulated-pair-flight",
    performers: [
      performer("a", a, { x: 0, y: 0, z: 0 }, 0),
      performer("b", b, { x: 1.2, y: 0, z: 0 }, 0),
    ],
    composition: { kind: "parallel", parts: [jump("a", 0), jump("b", 1.2)] },
  });
  // The window is centred on the two apexes, where both bodies are highest,
  // and spans three quarters of what the shorter flight leaves on each side
  // of its apex: the centre is then still above standing height at both
  // ends, so neither the release nor the hand-back nears the floor.
  const apex: number =
    (event(take, "a", "apex") + event(take, "b", "apex")) / 2;
  const half: number =
    Math.min(
      apex - Math.max(event(take, "a", "takeoff"), event(take, "b", "takeoff")),
      Math.min(event(take, "a", "touchdown"), event(take, "b", "touchdown")) -
        apex,
    ) * 0.75;
  const from: number = apex - half;
  const solved: HumanPerformance = await take.simulate(
    {
      from,
      to: from + Math.floor(2 * half * RATE) / RATE,
      subjects: ["a", "b"],
      released: ["a", "b"],
    },
    { kind: "simulated" },
  );
  const record: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  simulationResiduals(all, "released pair in flight", record, ["a", "b"]);
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    record.simulation.input;
  all.check(
    "the released pair never touches the floor",
    record.simulation.cache.contacts.every(
      (receipt: IAutoMovieContactReceipt): boolean =>
        receipt.a.body !== "floor" && receipt.b.body !== "floor",
    ),
  );
  const people: IAutoMoviePhysicalSimulationInput.IBody[] = input.bodies.filter(
    (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      body.id === "a" || body.id === "b",
  );
  const mass: number = people.reduce(
    (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
      sum + body.profile.mass,
    0,
  );
  const frames: readonly IAutoMoviePhysicalFrame[] =
    record.simulation.cache.frames;
  const released: (frame: IAutoMoviePhysicalFrame) => boolean = (
    frame: IAutoMoviePhysicalFrame,
  ): boolean =>
    people.every(
      (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
        record.simulation.cache.ownershipAt(body.id, "hips", frame.seconds) ===
        "dynamic",
    );
  const first: number = frames.findIndex(released);
  all.check("the window releases both people", first >= 0);
  const start: IAutoMovieVector3 = momentum(people, frames[first]!);
  const h: number = 1 / (input.rate * input.substeps!);
  const segments: number = people.reduce(
    (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
      sum + body.profile.segments.length,
    0,
  );
  // Every operation the solver performs conserves momentum exactly, so the
  // departure is rounding alone, bounded in Higham's standard model
  // (fl(a op b) = (a op b)(1 + delta), |delta| <= u; Higham 2002, sec. 2.2)
  // per substep and segment: each of the substep's position updates of the
  // segment (the prediction and one per joint correction it takes part in)
  // rounds its centre by u |x|, which the velocity derived from the pose
  // change, v = dx / h, carries as u |x| / h and keeps; each velocity
  // update rounds by u |v| per term of the sweep that forms it, at most 7
  // per tree level down to the segment and two more for the derivation and
  // the motors' addition. Reading the momentum as a sum of N terms adds
  // gamma_N times the summed magnitudes (Higham 2002, sec. 4.2) at both ends.
  const u: number = Number.EPSILON / 2;
  let accumulated: number = 0;
  let checked: number = 0;
  for (const [index, frame] of frames.entries()) {
    if (index <= first || !released(frame)) continue;
    checked++;
    accumulated += input.substeps! * u * rounding(people, frame, h);
    const elapsed: number = frame.seconds - frames[first]!.seconds;
    const expected: IAutoMovieVector3 = Vector3.add(
      start,
      Vector3.scale(input.gravity, mass * elapsed),
    );
    const error: number = Vector3.length(
      Vector3.subtract(momentum(people, frame), expected),
    );
    const reading: number =
      ((segments * u) / (1 - segments * u)) *
      (magnitude(people, frames[first]!) + magnitude(people, frame));
    const bound: number = accumulated + reading;
    all.check(
      `the pair's momentum departs ${error} N s from gravity's impulse at ${frame.seconds} s, within the rounding bound ${bound} N s`,
      error <= bound,
    );
  }
  all.check(`the momentum is read at ${checked} released frames`, checked > 0);
  verdicts(all, "released pair in flight", solved);
}

/** A performer standing at a place and heading. */
function performer(
  subject: string,
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
  yaw: number,
): IAutoMovieMotionHumanPerformer {
  return { subject, body, at, yaw, proficiency: { level: "trained" } };
}

/** A named event of a performer's first action that has it, film seconds. */
function event(take: HumanPerformance, subject: string, name: string): number {
  const segment: IAutoMovieMotionHumanSegment = take
    .segments(subject)
    .find((candidate: IAutoMovieMotionHumanSegment): boolean =>
      candidate.plan.events.some(
        (e: IAutoMovieMotionHumanSegment["plan"]["events"][number]): boolean =>
          e.name === name,
      ),
    )!;
  return (
    segment.start +
    segment.plan.events.find(
      (e: IAutoMovieMotionHumanSegment["plan"]["events"][number]): boolean =>
        e.name === name,
    )!.share *
      segment.plan.duration
  );
}

/** A bound collider's shape in the admitted input. */
function collider(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: string,
  at: IAutoMoviePhysicalContactBinding["source"],
): IAutoMoviePhysicalShape {
  return input.bodies
    .find(
      (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
        candidate.id === body,
    )!
    .profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === at.bone,
    )!
    .shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id === at.shape,
    )!;
}

/** Each segment's centre-of-mass velocity times its mass, summed over the bodies, N s. */
function momentum(
  bodies: readonly IAutoMoviePhysicalSimulationInput.IBody[],
  frame: IAutoMoviePhysicalFrame,
): IAutoMovieVector3 {
  return bodies.reduce(
    (
      sum: IAutoMovieVector3,
      body: IAutoMoviePhysicalSimulationInput.IBody,
    ): IAutoMovieVector3 =>
      body.profile.segments.reduce(
        (
          inner: IAutoMovieVector3,
          segment: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          Vector3.add(
            inner,
            Vector3.scale(centre(frame, body.id, segment), segment.mass),
          ),
        sum,
      ),
    { x: 0, y: 0, z: 0 },
  );
}

/**
 * One substep's rounding scale of the bodies' momentum over u, N s: each
 * segment's mass times its position updates' reach over the substep, `K
 * |x| / h` with K the prediction plus one per joint it takes part in, plus
 * its velocity updates' reach, `(7 d + 2) |v|` with d its depth in the tree.
 */
function rounding(
  bodies: readonly IAutoMoviePhysicalSimulationInput.IBody[],
  frame: IAutoMoviePhysicalFrame,
  h: number,
): number {
  return bodies.reduce(
    (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
      body.profile.segments.reduce(
        (inner: number, segment: IAutoMoviePhysicalSegment): number => {
          const state: IAutoMoviePhysicalFrame["bodies"][string][string] =
            frame.bodies[body.id]![segment.bone]!;
          const at: IAutoMovieVector3 = Vector3.add(
            state.position,
            Quaternion.rotateVector(state.rotation, segment.centerOfMass),
          );
          const updates: number =
            1 +
            body.profile.joints.filter(
              (joint: IAutoMoviePhysicalJoint): boolean =>
                joint.child === segment.bone || joint.parent === segment.bone,
            ).length;
          let depth: number = 0;
          for (
            let bone: string | undefined = segment.bone;
            bone !== undefined;
            bone = body.profile.joints.find(
              (joint: IAutoMoviePhysicalJoint): boolean => joint.child === bone,
            )?.parent
          )
            depth++;
          return (
            inner +
            segment.mass *
              ((updates * Vector3.length(at)) / h +
                (7 * (depth - 1) + 2) *
                  Vector3.length(centre(frame, body.id, segment)))
          );
        },
        sum,
      ),
    0,
  );
}

/** The summed magnitudes of the segments' momenta, N s: the scale their rounding acts on. */
function magnitude(
  bodies: readonly IAutoMoviePhysicalSimulationInput.IBody[],
  frame: IAutoMoviePhysicalFrame,
): number {
  return bodies.reduce(
    (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
      body.profile.segments.reduce(
        (inner: number, segment: IAutoMoviePhysicalSegment): number =>
          inner +
          segment.mass * Vector3.length(centre(frame, body.id, segment)),
        sum,
      ),
    0,
  );
}

/** A segment's centre-of-mass velocity: its origin's velocity plus the spin about the origin. */
function centre(
  frame: IAutoMoviePhysicalFrame,
  body: string,
  segment: IAutoMoviePhysicalSegment,
): IAutoMovieVector3 {
  const state: IAutoMoviePhysicalFrame["bodies"][string][string] =
    frame.bodies[body]![segment.bone]!;
  return Vector3.add(
    state.velocity,
    Vector3.cross(
      state.angularVelocity,
      Quaternion.rotateVector(state.rotation, segment.centerOfMass),
    ),
  );
}

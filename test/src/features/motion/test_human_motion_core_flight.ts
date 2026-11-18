import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAuditSpin,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditSpin,
  HumanAirborneShape,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertHumanFlightPlacement } from "../internal/assertHumanFlightPlacement";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanRefusal } from "../internal/motionHumanRefusal";
import { nclose } from "../internal/nclose";
import { qunit } from "../internal/qunit";

/**
 * A flight window and the performance pass over the composed shape (#3427):
 * a jump asked for turns is turned by the momentum its composed body needs,
 * after placement, through `IHumanActionPlan.airborne`. This specification
 * explicitly selects physical flight; staged film hints have a separate
 * authored-rotation contract without conservation or impulse claims.
 *
 * Every case stands 0.3 s, then jumps 1 m forward with a 0.5 m apex,
 * anchored `leap`, on the average man and the small woman; a tuck is laid
 * over the flight as a layer from `takeoff` to `touchdown`.
 *
 * Scenarios:
 * 1. The solver's contract, for one somersault laid out and tucked: the
 *    displayed root lands, against its take-off attitude in Yeadon's angles,
 *    within `solveAirborneTakeoff.TOLERANCE` of the request on every axis
 *    (the turn is read a microsecond before touchdown, where the display
 *    still applies it, so that microsecond's own turn is allowed), and the
 *    momentum read back at mid-flight is within the take-off's ceiling, the
 *    mass times the centre's take-off speed times Hof's pendulum length.
 *    No closed form relates the tuck's momentum to the layout's here: the
 *    one-footed take-off's free-leg tuck gives the shape a product of
 *    inertia between the lateral and forward axes, and with the two larger
 *    moments close (12.20 and 12.98 kg m² for the average man, principal
 *    axes 17 degrees off the root's) the somersault couples to tilt and
 *    twist, so the solved momentum leaves the somersault axis. The planar
 *    relation `L = 2π / ∫ dt / I` holds exactly only for a planar shape and
 *    is pinned on one in `test_engine_airborne_rotation`.
 *    The actual displayed root's long axis also winds once in the take-off
 *    frame, sampled at the existing seek grid's 60 Hz. This sampled relation
 *    does not certify winding or angular speed between samples. The YZ projection must stay
 *    numerically observable: its radius exceeds sqrt(machine epsilon), the
 *    square-root precision guard for atan2's 1/r conditioning on a unit
 *    direction. A singular projection is reported as an observer failure,
 *    rather than inventing an angle or rejecting that physical orientation.
 * 2. The momentum read back from the displayed bones (#3422) holds within
 *    1 % of its take-off value at every twentieth of the flight
 *    (#3416's acceptance), for a layout and a tuck.
 * 3. Seek, on the average man: the pose at the original 30 flight instants
 *    plus six instants immediately around phase1/4,1/2,3/4, read in a
 *    shuffled order on a fresh performance, equals the pose read after
 *    evaluating the whole film in order, bit for bit. The extra phase
 *    offsets are +/-1e-6, interleaved across dyadic bins so equal-level
 *    predecessor candidates recur after another bin. Actual internal anchor
 *    visits/evictions are not exposed and are not inferred from a passing
 *    pose comparison.
 * 4. On the average man, a flight asked for more turns than its take-off can
 *    give (twenty somersaults) is refused with a `HumanRefusal` on the axis
 *    `turns`.
 *
 * Scenarios 3 and 4 run on one body because neither decision has a body
 * branch. A seek's result depends on the order in which the performance
 * evaluates the flight's instants, and those instants and their dyadic bins
 * are shares of the flight span, which no body measure enters; the body only
 * changes the values both reads must agree on bit for bit. Twenty
 * somersaults lie twenty times past the one turn each body lands within its
 * take-off ceiling in scenario 1, so both bodies fall in the same partition,
 * far outside the feasible turns, and the second adds no branch of the
 * refusal. Each of those two reads also performs the longest work of the
 * specification: a cold film besides the ordered one, and a take-off search
 * that runs to its refusal.
 * 5. No bone retains a snap above 5 degrees after the spin audit's adaptive
 *    interval refinement (`AutoMovieMotionHumanAuditSpin.turn`).
 * 6. The centre of mass read from the displayed poses stays within 5 mm of
 *    the same jump's centre without turns at every flight instant (a turn
 *    about the centre leaves it where the composed shape puts it).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs jumps with turns through the public performance and reads displayed bones; a landing off its request, a momentum over the take-off's ceiling, a rotation not about the centre, a momentum that drifts, a pass that reads the frame grid, an impossible request accepted or a landing snap fails.
 * @evidence contracts/development/testing.md#independent-expectations The solver's tolerance and the take-off's ceiling as contracts read from the displayed bones, conservation of angular momentum in flight, the composed tensor of #3422, the spin audit's 5-degree residual snap bound, and the campaign's 1 % and 5 mm bounds. Sampled take-off-frame long-axis winding distinguishes a one-turn request from an unchanged root without claiming a continuous winding certificate.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies for every per-body bound (landing, ceiling, winding, conservation, snap, centre), a tuck and a layout, ordered and cold reads at all original thirty instants plus both sides of three dyadic boundaries, a feasible and an infeasible request, with and without turns. The seek and the refusal run on the average man alone, since neither decision has a body branch (the partition argument above). Additional seeks reuse the existing ordered/fresh performances and unchanged exact root/joint comparison; actual internal anchor eviction is not independently observed. The shapes' own rows belong to the airborne rows' tests.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two canonical polygon bodies and short performances in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and their bounds.
 */
export function test_human_motion_core_flight(): void {
  const findings: string[] = [];
  const tuck: IAutoMovieMotionHumanLayer.IScheduled = {
    layer: HumanAirborneShape.layer("tuck"),
    from: { of: "leap", event: "takeoff" },
    to: { of: "leap", event: "touchdown" },
    fade: 0.05,
  };
  const perform = (
    body: IAutoMovieMotionHumanBody,
    rotation: IAutoMovieMotionHumanJump.IParams["rotation"] | undefined,
    tucked: boolean,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "flight",
      flight: "physical",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .jump(
          {
            to: { x: 0, y: 0, z: 1 },
            apex: 0.5,
            ...(rotation === undefined ? {} : { rotation }),
          },
          "leap",
        ).node,
      ...(tucked ? { layers: { a: [tuck] } } : {}),
    });
  const span = (p: IAutoMovieMotionHumanPerformance): [number, number] => {
    const s: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
    const at = (n: string): number =>
      s.start +
      s.plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === n)!
        .share *
        s.plan.duration;
    return [at("takeoff"), at("touchdown")];
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const momentum = (p: IAutoMovieMotionHumanPerformance, t: number): IAutoMovieVector3 =>
      resolveAutoMovieMomentum(
        model,
        p.bones("a", t - 1e-3),
        p.bones("a", t + 1e-3),
        2e-3,
      ).angular;
    let layout: IAutoMovieMotionHumanPerformance;
    let tucked: IAutoMovieMotionHumanPerformance;
    try {
      layout = perform(body, { somersault: 1 }, false);
      if (name === "m-average") assertHumanFlightPlacement(layout, body, findings);
      tucked = perform(body, { somersault: 1 }, true);
    } catch (error) {
      findings.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    // 1. The solver's contract: the landing meets the request within its
    // tolerance, by a momentum under the take-off's ceiling.
    const [t0, t1] = span(layout);
    const centre = (p: IAutoMovieMotionHumanPerformance, t: number): IAutoMovieVector3 =>
      resolveAutoMovieCenterOfMass.place(model, p.bones("a", t));
    for (const [label, p] of [
      ["layout", layout],
      ["tuck", tucked],
    ] as const) {
      const [a, b] = label === "layout" ? [t0, t1] : span(p);
      const root = (t: number): IAutoMovieQuaternion =>
        p.pose("a", t).root!.rotation;
      const end: number = b - 1e-6;
      const takeoff: IAutoMovieQuaternion = root(a);
      const landing: IAutoMovieQuaternion = root(end);
      const off: IAutoMovieSolveAirborneTakeoff.IAngles = solveAirborneTakeoff.angles(
        takeoff,
        landing,
      );
      const last: number = Quaternion.angle(root(b - 2e-6), landing);
      const worst: number = Math.max(
        Math.abs(off.somersault),
        Math.abs(off.tilt),
        Math.abs(off.twist),
      );
      if (
        !Number.isFinite(worst) ||
        !Number.isFinite(last) ||
        !(worst <= solveAirborneTakeoff.TOLERANCE + last)
      )
        findings.push(
          `${name} ${label}: lands ${(worst / (2 * Math.PI)).toFixed(4)} revolution off the request`,
        );
      let observable: boolean = qunit(takeoff);
      if (!observable)
        findings.push(
          `${name} ${label}: the displayed take-off root is not a finite unit rotation`,
        );
      const frame: IAutoMovieQuaternion = observable
        ? Quaternion.inverse(takeoff)
        : Quaternion.identity();
      const samples: number = Math.max(1, Math.ceil((end - a) * 60));
      let previous: number = 0;
      let winding: number = 0;
      for (let k: number = 0; observable && k <= samples; k++) {
        const seconds: number =
          k === samples ? end : a + ((end - a) * k) / samples;
        const shown: IAutoMovieQuaternion = k === 0 ? takeoff : k === samples ? landing : root(seconds);
        if (!qunit(shown)) {
          findings.push(
            `${name} ${label}: the displayed root is not a finite unit rotation at ${seconds} s`,
          );
          observable = false;
          break;
        }
        const relative: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(frame, shown),
        );
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
          x: 0,
          y: 1,
          z: 0,
        });
        const radius: number = Math.hypot(direction.y, direction.z);
        if (!(Number.isFinite(radius) && radius > Math.sqrt(Number.EPSILON))) {
          findings.push(
            `${name} ${label}: long-axis winding is unobservable at ${seconds} s; YZ radius ${radius}`,
          );
          observable = false;
          break;
        }
        const angle: number = Math.atan2(direction.z, direction.y);
        if (k > 0)
          winding += Math.atan2(
            Math.sin(angle - previous),
            Math.cos(angle - previous),
          );
        previous = angle;
      }
      if (
        observable &&
        !(
          Math.abs(winding - 2 * Math.PI) <=
          solveAirborneTakeoff.TOLERANCE + last
        )
      )
        findings.push(
          `${name} ${label}: the actual displayed root winds ${winding / (2 * Math.PI)} turns, one requested`,
        );
      const delta: number = integrateAirborneRotation.DELTA;
      const one: IAutoMovieVector3 = centre(p, a + delta);
      const two: IAutoMovieVector3 = centre(p, a + 2 * delta);
      const v0: number = Vector3.length({
        x: (two.x - one.x) / delta,
        y: (two.y - one.y) / delta + 1.5 * AutoMovieGravity.STANDARD * delta,
        z: (two.z - one.z) / delta,
      });
      const ceiling: number =
        model.mass *
        v0 *
        resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight);
      const middle: number = (a + b) / 2;
      const middleMomentum: IAutoMovieVector3 = momentum(p, middle);
      const held: number = Vector3.length(middleMomentum);
      if (
        !Number.isFinite(held) ||
        !Number.isFinite(ceiling) ||
        !(held <= ceiling)
      )
        findings.push(
          `${name} ${label}: ${held.toFixed(1)} kg m²/s over the take-off's ceiling ${ceiling.toFixed(1)}`,
        );
      // 2. The momentum holds through the flight. Reuse the ceiling or
      // reference sample only where the two film clocks coincide exactly.
      const reference: number = a + 0.05 * (b - a);
      const L0: IAutoMovieVector3 = momentum(p, reference);
      const magnitude: number = Vector3.length(L0);
      for (let k: number = 1; k < 20; k++) {
        const t: number = a + ((b - a) * k) / 20;
        const displayed: IAutoMovieVector3 =
          t === reference ? L0 : t === middle ? middleMomentum : momentum(p, t);
        const difference: number = Vector3.length(Vector3.subtract(displayed, L0));

        // The same one-percent inequality in absolute units also handles
        // a zero reference: its allowed difference is zero, never 0/0.
        if (
          !Number.isFinite(magnitude) ||
          !Number.isFinite(difference) ||
          !(difference <= 0.01 * magnitude)
        ) {
          findings.push(
            `${name} ${label}: momentum changes ${difference} kg m²/s from magnitude ${magnitude} at ${k}/20 of the flight (one percent allowed)`,
          );
          break;
        }
      }
    }

    // 3 and 4 have no body branch, so they are read on the average man alone.
    if (name === "m-average") {
      // 3. Seek invariance.
      const instants: number[] = Array.from(
        { length: 30 },
        (_: unknown, k: number): number => t0 + ((t1 - t0) * ((k * 7) % 30)) / 29,
      );
      instants.push(...[
        0.5 + 1e-6, 0.25 - 1e-6, 0.75 + 1e-6,
        0.5 - 1e-6, 0.75 - 1e-6, 0.25 + 1e-6,
      ].map((share: number): number => t0 + (t1 - t0) * share));
      const rootValues: (pose: IAutoMoviePose) => readonly number[] = (
        pose: IAutoMoviePose,
      ): readonly number[] =>
        pose.root === null
          ? []
          : [
              pose.root.translation.x,
              pose.root.translation.y,
              pose.root.translation.z,
              pose.root.rotation.x,
              pose.root.rotation.y,
              pose.root.rotation.z,
              pose.root.rotation.w,
              pose.root.scale.x,
              pose.root.scale.y,
              pose.root.scale.z,
            ];
      const ordered: Map<number, IAutoMoviePose> = new Map();
      const compared: Set<number> = new Set(instants);
      const chronological: Set<number> = new Set(compared);
      for (let t: number = 0; t <= layout.duration; t += 1 / 60)
        chronological.add(t);
      for (const t of [...chronological].sort(
        (a: number, b: number): number => a - b,
      )) {
        motionHumanFrame(layout.bones("a", t), `${name} ordered at ${t} s`);
        if (!compared.has(t)) continue;
        const pose: IAutoMoviePose = layout.pose("a", t);
        ordered.set(t, {
          ...pose,
          joints: pose.joints.map(
            (joint: IAutoMovieJointPose): IAutoMovieJointPose => ({ ...joint }),
          ),
          root:
            pose.root === null
              ? null
              : {
                  ...pose.root,
                  translation: { ...pose.root.translation },
                  rotation: { ...pose.root.rotation },
                  scale: { ...pose.root.scale },
                },
        });
      }
      const cold: IAutoMovieMotionHumanPerformance = perform(
        { ...body },
        { somersault: 1 },
        false,
      );
      for (const t of instants) {
        motionHumanFrame(cold.bones("a", t), `${name} cold at ${t} s`);
        const actual: IAutoMoviePose = cold.pose("a", t);
        const expected: IAutoMoviePose = ordered.get(t)!;
        const actualRoot: readonly number[] = rootValues(actual);
        const expectedRoot: readonly number[] = rootValues(expected);
        if (
          actual.skeleton !== expected.skeleton ||
          actualRoot.length !== expectedRoot.length ||
          actualRoot.some(
            (value: number, k: number): boolean =>
              !nclose(value, expectedRoot[k]!, 0),
          ) ||
          actual.joints.length !== expected.joints.length ||
          actual.joints.some((joint: IAutoMovieJointPose, k: number): boolean => {
            const other: IAutoMoviePose["joints"][number] = expected.joints[k]!;
            return (
              joint.bone !== other.bone ||
              (["flexion", "abduction", "twist"] as const).some(
                (axis): boolean => {
                  const observed: number | null = joint[axis];
                  const reference: number | null = other[axis];
                  return observed === null || reference === null
                    ? observed !== reference
                    : !nclose(observed, reference, 0);
                },
              )
            );
          })
        ) {
          findings.push(
            `${name}: a cold read at ${t.toFixed(3)} s differs from the ordered film`,
          );
          break;
        }
      }

      // 4. An impossible request is refused.
      TestValidator.predicate(
        `${name}: twenty somersaults are refused`,
        motionHumanRefusal(
          (): void => {
            perform(body, { somersault: 20 }, false);
          },
          { kind: "parameter", axis: "turns", act: "jump" },
        ),
      );
    }

    // 5. No snap at the landing.
    const spin: IAutoMovieMotionHumanAuditSpin.IResult =
      AutoMovieMotionHumanAuditSpin.measure(motionHumanLaw.film(layout), "a");
    if (!(spin.turn.value <= 5))
      findings.push(
        `${name}: a bone retains ${spin.turn.value.toFixed(2)} degrees of snap at ${spin.turn.seconds.toFixed(3)} s (${spin.turn.where})`,
      );

    // 6. The centre stays where the unturned jump puts it.
    const plain: IAutoMovieMotionHumanPerformance = perform(body, undefined, false);
    for (let k: number = 1; k < 20; k++) {
      const t: number = t0 + ((t1 - t0) * k) / 20;
      const gap: number = Vector3.length(
        Vector3.subtract(
          resolveAutoMovieCenterOfMass.place(model, layout.bones("a", t)),
          resolveAutoMovieCenterOfMass.place(model, plain.bones("a", t)),
        ),
      );
      if (!(gap <= 0.005)) {
        findings.push(
          `${name}: the turned centre lies ${(1000 * gap).toFixed(1)} mm off the unturned one at ${k}/20 of the flight`,
        );
        break;
      }
    }
  }

  TestValidator.predicate(
    `flight: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}

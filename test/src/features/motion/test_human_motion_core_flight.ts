import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditSpin,
  HumanAirborneShape,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanLayer,
  type jump,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * A flight window and the performance pass over the composed shape (#3427):
 * a jump asked for turns is turned by the momentum its composed body needs,
 * after placement, through `IHumanActionPlan.airborne`.
 *
 * Every case stands 0.3 s, then jumps 1 m forward with a 0.5 m apex,
 * anchored `leap`, on the average man and the small woman; a tuck is laid
 * over the flight as a layer from `takeoff` to `touchdown`.
 *
 * Scenarios:
 * 1. Metamorphic: one somersault tucked needs less angular momentum than one
 *    laid out, by the ratio of the composed bodies' moments about the
 *    somersault axis at mid-flight (#3422) within 5 %, both read back from
 *    the displayed bones.
 * 2. The momentum read back from the displayed bones (#3422) holds within
 *    1 % of its take-off value at every twentieth of the flight
 *    (#3416's acceptance), for a layout and a tuck.
 * 3. Seek: the pose at 30 flight instants read cold, in a shuffled order on
 *    a fresh performance, equals the pose read after evaluating the whole
 *    film in order, bit for bit.
 * 4. A flight asked for more turns than its take-off can give (twenty
 *    somersaults) is refused with a `HumanRefusal` on the axis `turns`.
 * 5. The landing reads no bone turning more than 5 turns a second between
 *    frames (`AutoMovieMotionHumanAuditSpin`).
 * 6. The centre of mass read from the displayed poses stays within 5 mm of
 *    the same jump's centre without turns at every flight instant (a turn
 *    about the centre leaves it where the composed shape puts it).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs jumps with turns through the public performance and reads displayed bones; a rotation not about the centre, a momentum that drifts, a pass that reads the frame grid, an impossible request accepted or a landing snap fails.
 * @evidence contracts/development/testing.md#independent-expectations Conservation of angular momentum in flight, the composed tensor of #3422, the spin audit's 5 turns a second, and the campaign's 1 % and 5 mm bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a tuck and a layout, ordered and cold reads, a feasible and an infeasible request, with and without turns; the shapes' own rows belong to the airborne rows' tests.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and short performances in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and their bounds.
 */
export function test_human_motion_core_flight(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const tuck: IHumanLayer.IScheduled = {
    layer: HumanAirborneShape.layer("tuck"),
    from: { of: "leap", event: "takeoff" },
    to: { of: "leap", event: "touchdown" },
    fade: 0.05,
  };
  const perform = (
    body: IHumanBody,
    rotation: jump.IParams["rotation"] | undefined,
    tucked: boolean,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "flight",
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
  const span = (p: HumanPerformance): [number, number] => {
    const s: HumanSegment.ISegment = p.segments("a")[1]!;
    const at = (n: string): number =>
      s.start +
      s.plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === n)!
        .share *
        s.plan.duration;
    return [at("takeoff"), at("touchdown")];
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const momentum = (p: HumanPerformance, t: number): IAutoMovieVector3 =>
      resolveAutoMovieMomentum(model, p.bones("a", t - 1e-3), p.bones("a", t + 1e-3), 2e-3)
        .angular;
    let layout: HumanPerformance;
    let tucked: HumanPerformance;
    try {
      layout = perform(body, { somersault: 1 }, false);
      tucked = perform(body, { somersault: 1 }, true);
    } catch (error) {
      findings.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    // 1. A tuck needs less momentum, by the moments' ratio.
    const [t0, t1] = span(layout);
    const middle: number = (t0 + t1) / 2;
    const lateral = (p: HumanPerformance): number => {
      const bones: Bones = p.bones("a", middle);
      return resolveAutoMovieMomentum.inertia(model, bones)[0]![0]!;
    };
    const ratio: number =
      Vector3.length(momentum(tucked, middle)) / Vector3.length(momentum(layout, middle));
    const moments: number = lateral(tucked) / lateral(layout);
    if (Math.abs(ratio - moments) > 0.05 * moments)
      findings.push(`${name}: the tuck needs ${ratio.toFixed(3)} of the layout's momentum, the moments' ratio ${moments.toFixed(3)}`);

    // 2. The momentum holds through the flight.
    for (const [label, p] of [
      ["layout", layout],
      ["tuck", tucked],
    ] as const) {
      const [a, b] = span(p);
      const L0: IAutoMovieVector3 = momentum(p, a + 0.05 * (b - a));
      for (let k: number = 1; k < 20; k++) {
        const t: number = a + ((b - a) * k) / 20;
        const drift: number =
          Vector3.length(Vector3.subtract(momentum(p, t), L0)) / Vector3.length(L0);
        if (drift > 0.01) {
          findings.push(`${name} ${label}: momentum drifts ${(100 * drift).toFixed(2)} % at ${k}/20 of the flight`);
          break;
        }
      }
    }

    // 3. Seek invariance.
    const ordered: Map<number, string> = new Map();
    for (let t: number = 0; t <= layout.duration; t += 1 / 60)
      ordered.set(Math.round(t * 600), JSON.stringify(layout.pose("a", t)));
    const cold: HumanPerformance = perform(body, { somersault: 1 }, false);
    const instants: number[] = Array.from(
      { length: 30 },
      (_: unknown, k: number): number => t0 + ((t1 - t0) * ((k * 7) % 30)) / 29,
    );
    for (const t of instants)
      if (JSON.stringify(cold.pose("a", t)) !== JSON.stringify(layout.pose("a", t))) {
        findings.push(`${name}: a cold read at ${t.toFixed(3)} s differs from the ordered film`);
        break;
      }

    // 4. An impossible request is refused.
    TestValidator.error(`${name}: twenty somersaults are refused`, (): void => {
      try {
        perform(body, { somersault: 20 }, false);
      } catch (error) {
        if (error instanceof HumanRefusal) throw error;
        throw new Error(`refused without a HumanRefusal: ${String(error)}`);
      }
    });

    // 5. No snap at the landing.
    const spin: AutoMovieMotionHumanAuditSpin.IResult =
      AutoMovieMotionHumanAuditSpin.measure(motionHumanLaw.film(layout), "a");
    if (spin.turn.value > 5)
      findings.push(`${name}: a bone turns ${spin.turn.value.toFixed(2)} turns a second at ${spin.turn.seconds.toFixed(3)} s (${spin.turn.where})`);

    // 6. The centre stays where the unturned jump puts it.
    const plain: HumanPerformance = perform(body, undefined, false);
    for (let k: number = 1; k < 20; k++) {
      const t: number = t0 + ((t1 - t0) * k) / 20;
      const gap: number = Vector3.length(
        Vector3.subtract(
          resolveAutoMovieCenterOfMass.place(model, layout.bones("a", t)),
          resolveAutoMovieCenterOfMass.place(model, plain.bones("a", t)),
        ),
      );
      if (gap > 0.005) {
        findings.push(`${name}: the turned centre lies ${(1000 * gap).toFixed(1)} mm off the unturned one at ${k}/20 of the flight`);
        break;
      }
    }
  }

  TestValidator.predicate(
    `flight: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}

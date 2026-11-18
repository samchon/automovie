import {
  AutoMovieGravity,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTiming,
  HumanChain,
  HumanPerformance,
  HumanPhysics,
  HumanRefusal,
  stagger,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanRefusal } from "../internal/motionHumanRefusal";

/**
 * One perturbation law whose response follows from the impulse (#3430):
 * `perturb`, after half a second of standing, an impulse on the chest at
 * its start.
 *
 * The impulses are sized by the centre's speed they give, `v = J / m`: 0.05
 * m/s (within the base), 0.5 m/s (past the base, one step catches it) and
 * 5 m/s (past every capture), on the average man and the small woman,
 * pushed forward (+z), backward, left and right.
 *
 * Scenarios:
 * 1. Outcome by impulse: the plan the performance places is the absorb's
 *    (event `peak`), `stagger`'s (events `tipped` and `caught`) or
 *    `knockdown`'s, as the engine's balance outcome for that impulse says.
 * 2. Absorb: both feet stay planted, their balls moving at most 5 mm (the
 *    campaign's slip bound), and the centre of mass travels along the push
 *    and back, its largest travel `v / (e ω0)` within 20 % (the critically
 *    damped pendulum's peak; the tolerance is the hips' share of the whole
 *    body's travel, provisional).
 * 3. Step: the capture step is `stagger`'s and lands (`caught`) after the
 *    impulse, on the side the push drives the body to; pushed forward, at
 *    `stagger.LANDING` within a sixtieth of a second (the reaction, the
 *    weight shift and the forward swing at the threshold of recovery). A
 *    step back or to a side lands as `stagger` lays it for that direction
 *    and body (the backward swing is shorter, and a lateral step is placed
 *    by its stance course), which `stagger`'s own tests pin.
 * 4. Fall: the action is `knockdown`'s, its seat contact no earlier than
 *    free fall over the centre's own drop from the entry to the seat's
 *    contact, `sqrt(2 Δ / g)`, read from the displayed poses (a body cannot
 *    come down faster than gravity takes its centre).
 * 5. An author's outcome the impulse cannot give (an absorb of the 5 m/s
 *    push, a fall of the 0.05 m/s one) is refused with a `HumanRefusal` on
 *    the axis `outcome`; the outcome the impulse gives is accepted.
 * 6. No impulse: the absorb of nothing, the centre within 1 mm of where it
 *    stood throughout.
 * 7. Determinism: the same input performed twice gives the same bones bit
 *    for bit at ten instants.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the law through the public performance with forces and reads the placed plan and the displayed bones; an outcome not the impulse's, a sliding foot, an absorb that never returns, a step off stagger's landing, a fall faster than free fall or an impossible outcome accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The critically damped pendulum's peak, stagger's landing as its owner states it, free fall's time over the centre's drop and the campaign's slip bound; the outcome is compared with the engine's own decision, which `test_engine_balance_outcome` checks against closed forms.
 * @evidence contracts/development/testing.md#distinguishing-cases Three sizes, four directions, two bodies, an author's possible and impossible outcomes, no impulse and a replay; the hit-to-impulse conversion belongs to `test_human_motion_core_force`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short performances in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios, the impulses and the bounds with their sources.
 */
export function test_human_motion_perturb(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const START: number = 0.5;
  const directions: Record<string, IAutoMovieVector3> = {
    forward: { x: 0, y: 0, z: 1 },
    backward: { x: 0, y: 0, z: -1 },
    left: { x: 1, y: 0, z: 0 },
    right: { x: -1, y: 0, z: 0 },
  };
  const perform = (
    body: IAutoMovieMotionHumanBody,
    impulse: IAutoMovieVector3 | null,
    outcome?: IAutoMovieMotionHumanPerturb.IParams["outcome"],
  ): IAutoMovieMotionHumanPerformance => {
    const forces: IAutoMovieMotionHumanForce[] =
      impulse === null
        ? []
        : [
            {
              kind: "impulse",
              subject: "a",
              at: "sternum",
              seconds: START,
              impulse,
            },
          ];
    return new HumanPerformance({
      seed: "perturb",
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
        .stand({ seconds: START })
        .perturb(outcome === undefined ? {} : { outcome }).node,
      forces,
    });
  };
  const names = (plan: { events: IAutoMovieMotionEvent[] }): string[] =>
    plan.events.map((e: IAutoMovieMotionEvent): string => e.name);

  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const mass: number = body.profile.mass;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const w0: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
    const centre = (
      p: IAutoMovieMotionHumanPerformance,
      t: number,
    ): IAutoMovieVector3 =>
      resolveAutoMovieCenterOfMass.place(model, p.bones("a", t));

    for (const [way, d] of Object.entries(directions)) {
      for (const [size, speed] of [
        ["absorb", 0.05],
        ["step", 0.5],
        ["fall", 5],
      ] as const) {
        const label: string = `${name} ${way} ${size}`;
        let p: IAutoMovieMotionHumanPerformance;
        try {
          p = perform(body, {
            x: d.x * speed * mass,
            y: 0,
            z: d.z * speed * mass,
          });
        } catch (error) {
          findings.push(
            `${label}: ${error instanceof Error ? error.message : String(error)}`,
          );
          continue;
        }
        const segment: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
        const events: string[] = names(segment.plan);

        // 1. The plan placed is the outcome's.
        const shape: string = events.includes("peak")
          ? "absorb"
          : events.includes("caught")
            ? "step"
            : "fall";
        if (shape !== size)
          findings.push(
            `${label}: planned a ${shape} (events ${events.join(", ")})`,
          );

        if (size === "absorb") {
          // 2. Feet planted, the centre travels and returns.
          const ball = (t: number, side: "left" | "right"): IAutoMovieVector3 =>
            p.bones("a", t).get(`${side}Toes`)?.worldPosition ??
            p.bones("a", t).get(`${side}Foot`)!.worldPosition;
          for (const side of ["left", "right"] as const) {
            const first: IAutoMovieVector3 = ball(segment.entryTime, side);
            let worst: number = 0;
            for (
              let t: number = segment.entryTime;
              t <= segment.end;
              t += 1 / 24
            ) {
              const b: IAutoMovieVector3 = ball(t, side);
              worst = Math.max(worst, Math.hypot(b.x - first.x, b.z - first.z));
            }
            if (worst > 0.005)
              findings.push(
                `${label}: the ${side} foot slides ${(1000 * worst).toFixed(1)} mm`,
              );
          }
          const c0: IAutoMovieVector3 = centre(p, segment.entryTime);
          let peak: number = 0;
          for (
            let t: number = segment.entryTime;
            t <= segment.end;
            t += 1 / 48
          ) {
            const c: IAutoMovieVector3 = centre(p, t);
            peak = Math.max(peak, (c.x - c0.x) * d.x + (c.z - c0.z) * d.z);
          }
          const expected: number = speed / (Math.E * w0);
          if (Math.abs(peak - expected) > 0.2 * expected)
            findings.push(
              `${label}: the centre travels ${(1000 * peak).toFixed(2)} mm, the damped pendulum ${(1000 * expected).toFixed(2)} mm`,
            );
          const back: IAutoMovieVector3 = centre(p, segment.end);
          if (Math.hypot(back.x - c0.x, back.z - c0.z) > 0.1 * expected + 1e-3)
            findings.push(
              `${label}: the centre does not return, ${(1000 * Math.hypot(back.x - c0.x, back.z - c0.z)).toFixed(2)} mm off`,
            );
        }

        if (size === "step") {
          // 3. The step lands at stagger's landing, on the push's side.
          const caught: IAutoMovieMotionEvent | undefined =
            segment.plan.events.find(
              (e: IAutoMovieMotionEvent): boolean => e.name === "caught",
            );
          const at: number =
            caught === undefined
              ? Number.NaN
              : segment.start + caught.share * segment.plan.duration - START;
          const landing: number = AutoMovieMotionHumanTiming.seconds(
            stagger.LANDING,
          );
          if (
            !(at > 0) ||
            (way === "forward" && !(Math.abs(at - landing) <= 1 / 60))
          )
            findings.push(
              `${label}: the step lands ${at.toFixed(3)} s after the impulse, stagger's forward landing ${landing.toFixed(3)} s`,
            );
          const moved: IAutoMovieMotionHumanContactWindow | undefined =
            segment.plan.contacts.find(
              (w: IAutoMovieMotionHumanContactWindow): boolean =>
                w.kind === "plant" && w.from > 0,
            );
          if (moved !== undefined) {
            const side: "left" | "right" =
              moved.part === "leftFoot" ? "left" : "right";
            const foot: IAutoMovieVector3 = p
              .bones("a", segment.end)
              .get(`${side}Foot`)!.worldPosition;
            const start: IAutoMovieVector3 = p
              .bones("a", segment.entryTime)
              .get(`${side}Foot`)!.worldPosition;
            if ((foot.x - start.x) * d.x + (foot.z - start.z) * d.z <= 0)
              findings.push(
                `${label}: the ${side} foot steps against the push`,
              );
          }
        }

        if (size === "fall") {
          // The physical fall stops at the named down event. The subsequent
          // lying hold still belongs to the plan but needs no fall judgement.
          const down: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
            (event: IAutoMovieMotionEvent): boolean => event.name === "down",
          );
          const phase: typeof segment.plan.physicalWindow = segment.plan.physicalWindow;
          if (down === undefined || phase === undefined ||
              phase.from !== 0 || Math.abs(phase.to - down.share * segment.plan.duration) > 1e-12 ||
              !(phase.to < segment.plan.duration))
            findings.push(`${label}: the fall's judged phase must end at down before the lying hold`);
          // 4. No faster than free fall.
          const seat: IAutoMovieMotionHumanContactWindow | undefined =
            segment.plan.contacts.find(
              (w: IAutoMovieMotionHumanContactWindow): boolean =>
                w.part === "seat",
            );
          if (seat === undefined)
            findings.push(`${label}: the fall declares no seat contact`);
          else {
            // The centre's drop from the entry to the seat's contact, read
            // from the displayed poses, and free fall's time over it.
            const landed: number = seat.from * segment.plan.duration;
            const drop: number =
              centre(p, segment.entryTime).y -
              centre(p, segment.start + landed).y;
            const free: number = Math.sqrt(
              (2 * Math.max(0, drop)) / AutoMovieGravity.STANDARD,
            );
            if (landed < free)
              findings.push(
                `${label}: the seat lands at ${landed.toFixed(3)} s, before free fall's ${free.toFixed(3)} s over the centre's ${(1000 * drop).toFixed(0)} mm drop`,
              );
          }
        }
      }
    }

    // 5. An outcome the impulse cannot give is refused; the one it gives is accepted.
    const pushed = (speed: number): IAutoMovieVector3 => ({
      x: 0,
      y: 0,
      z: speed * mass,
    });
    for (const [speed, asked] of [
      [5, "absorb"],
      [0.05, "fall"],
    ] as const)
      TestValidator.predicate(
        `${name}: a ${asked} of a ${speed} m/s push is refused`,
        motionHumanRefusal(
          (): void => {
            perform(body, pushed(speed), asked);
          },
          { kind: "parameter", axis: "outcome", act: "perturb" },
        ),
      );
    try {
      perform(body, pushed(0.05), "absorb");
    } catch (error) {
      findings.push(
        `${name}: the absorb a 0.05 m/s push gives is refused: ${error instanceof HumanRefusal ? error.message : String(error)}`,
      );
    }

    // 6. No impulse: nothing moves.
    const quiet: IAutoMovieMotionHumanPerformance = perform(body, null);
    const q: IAutoMovieMotionHumanSegment = quiet.segments("a")[1]!;
    const c0: IAutoMovieVector3 = centre(quiet, q.entryTime);
    for (let t: number = q.entryTime; t <= q.end; t += 1 / 12) {
      const c: IAutoMovieVector3 = centre(quiet, t);
      if (Math.hypot(c.x - c0.x, c.z - c0.z) > 1e-3) {
        findings.push(
          `${name}: with no impulse the centre moves at ${t.toFixed(2)} s`,
        );
        break;
      }
    }

    // 7. Replay.
    const a: IAutoMovieMotionHumanPerformance = perform(body, pushed(0.5));
    const b: IAutoMovieMotionHumanPerformance = perform(body, pushed(0.5));
    for (let k: number = 0; k < 10; k++) {
      const t: number = (a.duration * k) / 9;
      const x: Bones = a.bones("a", t);
      const y: Bones = b.bones("a", t);
      if (JSON.stringify([...x.values()]) !== JSON.stringify([...y.values()])) {
        findings.push(`${name}: two performances differ at ${t.toFixed(2)} s`);
        break;
      }
    }
  }

  // A quarter-second quiet lead-in precedes a one-second sustained load.
  // The following fall has no lying tail, so down is its final instant.
  const onset: number = START + 0.25;
  const release: number = onset + 1;
  const delayed: HumanPerformance = new HumanPerformance({
    seed: "delayed-balance",
    performers: [{
      subject: "a", body: motionHumanBody("m-average"),
      at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" },
    }],
    forces: [{
      kind: "sustained", subject: "a", at: "sternum",
      from: onset, to: release, force: { x: 0, y: 0, z: 1 },
    }],
    composition: HumanChain.subject("a").stand({ seconds: START })
      .perturb({ outcome: "resist" }).knockdown({ seconds: 0 }).node,
  });
  const spans: readonly IAutoMovieMotionHumanSegment[] = delayed.segments("a");
  const resisted: IAutoMovieMotionHumanSegment = spans[1]!;
  const fallen: IAutoMovieMotionHumanSegment = spans[2]!;
  if (HumanPhysics.judged(resisted, (resisted.start + onset) / 2) ||
      !HumanPhysics.judged(resisted, onset) || !HumanPhysics.judged(resisted, release) ||
      resisted.plan.physicalWindow?.from !== onset - resisted.start ||
      resisted.plan.physicalWindow.to !== release - resisted.start)
    findings.push("a delayed response judges outside the authored force interval or misses its endpoints");
  const down: IAutoMovieMotionEvent | undefined = fallen.plan.events.find(
    (event: IAutoMovieMotionEvent): boolean => event.name === "down",
  );
  if (down?.share !== 1 || fallen.plan.physicalWindow?.from !== 0 ||
      fallen.plan.physicalWindow.to !== fallen.plan.duration)
    findings.push("a fall without a lying hold must judge through its terminal down event");
  TestValidator.predicate(
    `perturb: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}

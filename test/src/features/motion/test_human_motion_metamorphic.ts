import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES } from "../internal/MOTION_HUMAN_LAW_STAGES";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanLawCovering } from "../internal/motionHumanLawCovering";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Metamorphic relations of the action laws: properties that relate two
 * performances to each other, so one relation checks what many separate
 * cases would, without knowing either performance's right answer.
 *
 * Relations:
 * 1. Mirror: a row that acts on the left is the mirror image of its right
 *    row within the 10 mm skin tolerance, for every law and side parameter
 *    (`motionHumanLawCovering.mirrors`; a human body is bilaterally symmetric).
 * 2. Placement: a scene turned 90 degrees about +Y and moved 3 m across and
 *    2 m back is the same performance, its bones the turned and moved bones
 *    within 1 mm at every quarter second (the laws of motion hold the same
 *    in every place and heading), for a walk, a wave, a punch, a crouch and
 *    a jump.
 * 3. Dynamic similarity: people of different size moving at the same named
 *    pace move alike at equal Froude number, so the step frequency scaled by
 *    the pendulum time `sqrt(l / g)` of the hip height `l`, the duty factor
 *    and the stride length per hip height are the same across bodies
 *    (Alexander 1984, Int J Robot Res 3:49). Bound: for each walking and
 *    running pace, each body's value of each within 15 % of the four bodies'
 *    mean (provisional tolerance for the spread of preferred speeds).
 * 4. Tempo: a manner of twice the pace halves every span a performer
 *    chooses, so a crouch, a kneel and an exercise at pace 2 last half as
 *    long with every event at half its time, within 1 % (the manner's own
 *    definition; none of these spans is set by physics).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws in pairs and compares their displayed bones, gaits and events; a lopsided side, a law that depends on where it stands, a gait whose timing does not scale with size or a tempo that leaves a span fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations Each relation is a symmetry of the body, of space, of dynamic similarity or of the manner's definition; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Every side parameter of every law, five laws placed twice, six gait paces on four bodies, three laws at two paces.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because films of fitted poses are costly; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the four relations with their sources and tolerances.
 */
export function test_human_motion_metamorphic(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const all: Record<string, motionHumanLawSweep.Stage> = Object.assign(
    {},
    ...Object.values(MOTION_HUMAN_LAW_STAGES),
  );

  // 1. Mirror.
  for (const line of motionHumanLawCovering.mirrors(all))
    complaints.check(line, false);

  // 2. Placement.
  const turn: number = 90;
  const shift: IAutoMovieVector3 = { x: 3, y: 0, z: -2 };
  const place = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.z + shift.x,
    y: p.y + shift.y,
    z: -p.x + shift.z,
  });
  const moved = (value: unknown, key: string = ""): unknown => {
    if (Array.isArray(value)) return value.map((v) => moved(v));
    if (value === null || typeof value !== "object") return value;
    const o = value as Record<string, unknown>;
    if (
      (key === "to" || key === "at") &&
      typeof o.x === "number" &&
      typeof o.y === "number" &&
      typeof o.z === "number"
    )
      return place(o as unknown as IAutoMovieVector3);
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, moved(v, k)]),
    );
  };
  for (const [law, row] of [
    ["walk", "default"],
    ["gesture", "kind=wave"],
    ["punch", "default"],
    ["crouch", "default"],
    ["jump", "default"],
  ] as const) {
    const a = motionHumanBody("m-average");
    const b = motionHumanBody("f-small");
    const at: number = row.indexOf("=");
    const pick = (p: string): string | undefined =>
      at >= 0 && p === row.slice(0, at) ? row.slice(at + 1) : undefined;
    const scene: motionHumanLawSweep.IScene = all[law]!(pick, a, b);
    const here = motionHumanLaw.perform(
      "metamorphic",
      scene.people,
      scene.composition,
      scene.props,
    );
    const there = motionHumanLaw.perform(
      "metamorphic",
      scene.people.map((p) => ({
        ...p,
        at: place(p.at),
        yaw: p.yaw + turn,
      })),
      moved(scene.composition) as typeof scene.composition,
      scene.props,
    );
    let worst: number = 0;
    let where: string = "";
    for (const t of M.times(0, here.duration, 4)) {
      const one = here.bones("a", t);
      const two = there.bones("a", t);
      for (const [bone, value] of one) {
        const p: IAutoMovieVector3 = place(value.worldPosition);
        const q: IAutoMovieVector3 = two.get(bone)!.worldPosition;
        const d: number = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        if (d > worst) {
          worst = d;
          where = `${bone} at ${t.toFixed(2)} s`;
        }
      }
    }
    complaints.check(
      `${law} ${row}: the turned and moved scene differs by ${(worst * 1000).toFixed(2)} mm (${where}), within 1 mm expected`,
      worst <= 0.001 && Math.abs(here.duration - there.duration) <= 1e-6,
    );
  }

  // 3. Dynamic similarity, per gait and pace.
  for (const [law, row] of [
    ["walk", "pace=slow"],
    ["walk", "pace=normal"],
    ["walk", "pace=fast"],
    ["run", "pace=jog"],
    ["run", "pace=run"],
    ["run", "pace=sprint"],
  ] as const) {
    const read: Record<
      string,
      { frequency: number; duty: number; stride: number }
    > = {};
    for (const name of motionHumanBody.EXTREMES) {
      const s: M.IStaged = M.stage(law, row, name);
      const from: number = 0.25 * s.film.duration;
      const to: number = 0.75 * s.film.duration;
      const g: M.IGait = M.gait(s, from, to);
      const l: number = s.body.measure.hipHeight;
      const hips = (t: number): IAutoMovieVector3 => {
        const a = M.joint(s, t, "leftUpperLeg");
        const b = M.joint(s, t, "rightUpperLeg");
        return { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 };
      };
      const p: IAutoMovieVector3 = hips(from);
      const q: IAutoMovieVector3 = hips(to);
      const speed: number = Math.hypot(q.x - p.x, q.z - p.z) / (to - from);
      // A stride is two steps.
      const strides: number = g.cadence / 120;
      read[name] = {
        frequency: (g.cadence / 60) * Math.sqrt(l / 9.81),
        duty: g.duty,
        stride: strides > 0 ? speed / strides / l : 0,
      };
    }
    for (const measure of ["frequency", "duty", "stride"] as const) {
      const values: number[] = Object.values(read).map((r) => r[measure]);
      const mean: number = values.reduce((x, y) => x + y, 0) / values.length;
      for (const [name, r] of Object.entries(read))
        complaints.check(
          `${law} ${row} ${name}: ${measure === "frequency" ? "reduced step frequency" : measure === "duty" ? "duty factor" : "stride per hip height"} ${r[measure].toFixed(3)} is ${((r[measure] / mean - 1) * 100).toFixed(1)} % off the bodies' mean ${mean.toFixed(3)}, within 15 % expected (Alexander 1984)`,
          mean > 0 && Math.abs(r[measure] / mean - 1) <= 0.15,
        );
    }
  }

  // 4. Tempo.
  const body = motionHumanBody("m-average");
  for (const [law, params] of [
    ["crouch", { hold: 0.5 }],
    ["kneel", { hold: 0.5 }],
    ["exercise", { kind: "squat" }],
  ] as const) {
    const film = (pace: number) =>
      motionHumanLaw.perform(
        "metamorphic",
        [{ subject: "a", body }],
        HumanChain.subject("a").act(law, {
          ...params,
          manner: { pace },
        } as never),
      );
    const slow = film(1);
    const fast = film(2);
    const events = (f: motionHumanLaw.IFilm): number[] =>
      f.performance
        .segments("a")
        .flatMap((s) =>
          s.plan.events.map((e) => s.start + e.share * s.plan.duration),
        );
    const one: number[] = events(slow);
    const two: number[] = events(fast);
    const ratio: number = fast.duration / slow.duration;
    complaints.check(
      `${law}: pace 2 lasts ${ratio.toFixed(3)} of pace 1 with ${two.length} of ${one.length} events at half their times, 0.5 expected within 1 %`,
      Math.abs(ratio - 0.5) <= 0.005 &&
        one.length === two.length &&
        one.every(
          (t: number, i: number): boolean =>
            Math.abs(two[i]! - t / 2) <= 0.01 * Math.max(t, 0.01),
        ),
    );
  }
  complaints.assert("every metamorphic relation holds");
}

import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanChain, type IHumanBody } from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES } from "./MOTION_HUMAN_LAW_STAGES";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawCovering } from "./motionHumanLawCovering";
import type { motionHumanLawSweep } from "./motionHumanLawSweep";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * Metamorphic relations of the action laws: properties that relate two
 * performances to each other, so one relation checks what many separate
 * cases would, without knowing either performance's right answer. Each
 * reader returns its findings as lines; the specs
 * `test_human_motion_metamorphic_*` read one family, law or pace each, so
 * each runs under a minute.
 *
 * - Mirror: a row that acts on the left is the mirror image of its right
 *   row within the 10 mm skin tolerance (`motionHumanLawCovering.mirrors`;
 *   a human body is bilaterally symmetric).
 * - Placement: a scene turned 90 degrees about +Y and moved 3 m across and
 *   2 m back is the same performance, its bones the turned and moved bones
 *   within 1 mm at every quarter second (the laws of motion hold the same in
 *   every place and heading).
 * - Dynamic similarity: people of different size moving at the same named
 *   pace move alike at equal Froude number, so the step frequency scaled by
 *   the pendulum time `sqrt(l / g)` of the hip height `l`, the duty factor
 *   and the stride length per hip height are the same across bodies
 *   (Alexander 1984, Int J Robot Res 3:49). Bound: each body's value of each
 *   within 15 % of the four bodies' mean (provisional tolerance for the
 *   spread of preferred speeds).
 * - Tempo: a manner of twice the pace halves every span a performer
 *   chooses, so the action at pace 2 lasts half as long with every event at
 *   half its time, within 1 % (the manner's own definition).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four relations with their sources and tolerances, and how the specs share them.
 * @evidence contracts/development/implementation.md#principled-implementation Each relation is a symmetry of the body, of space, of dynamic similarity or of the manner's definition; no expected value is read from a law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader per relation, each over the subject a spec names.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every finding is a line with its numbers; nothing is skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two films per placement or tempo subject, four per pace.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Films come from `motionHumanLaw`, readings from `motionHumanSignature`, the mirror relation from `motionHumanLawCovering`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A reader keeps nothing once read.
 */
export namespace motionHumanMetamorphic {
  /**
   * The mirror relation over one family of laws: a sided law is
   * mirror-equivariant for every seed. Its precondition is that sideless
   * staging carries no lateral seeded variation in mirror stages
   * (`MOTION_HUMAN_LAW_STAGES`).
   *
   * @param family The family of `MOTION_HUMAN_LAW_STAGES`.
   * @returns The findings.
   */
  export function mirror(
    family: keyof typeof MOTION_HUMAN_LAW_STAGES,
  ): string[] {
    return motionHumanLawCovering.mirrors(MOTION_HUMAN_LAW_STAGES[family]);
  }

  /**
   * The placement relation for one law's row: the scene turned and moved is
   * the same performance.
   *
   * @param law The law.
   * @param row `default` or `param=value`.
   * @returns The findings.
   */
  export function placement(law: string, row: string): string[] {
    const all: Record<string, motionHumanLawSweep.Stage> = Object.assign(
      {},
      ...Object.values(MOTION_HUMAN_LAW_STAGES),
    );
    const turn: number = 90;
    const shift: IAutoMovieVector3 = { x: 3, y: 0, z: -2 };
    const place = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.z + shift.x,
      y: p.y + shift.y,
      z: -p.x + shift.z,
    });
    const moved = (value: unknown, key: string = ""): unknown => {
      if (Array.isArray(value)) return value.map((v: unknown) => moved(v));
      if (value === null || typeof value !== "object") return value;
      const o: Record<string, unknown> = value as Record<string, unknown>;
      if (
        (key === "to" || key === "at") &&
        typeof o.x === "number" &&
        typeof o.y === "number" &&
        typeof o.z === "number"
      )
        return place(o as unknown as IAutoMovieVector3);
      return Object.fromEntries(
        Object.entries(o).map(([k, v]: [string, unknown]) => [k, moved(v, k)]),
      );
    };
    const a: IHumanBody = motionHumanBody("m-average");
    const b: IHumanBody = motionHumanBody("f-small");
    const at: number = row.indexOf("=");
    const pick = (p: string): string | undefined =>
      at >= 0 && p === row.slice(0, at) ? row.slice(at + 1) : undefined;
    const scene: motionHumanLawSweep.IScene = all[law]!(pick, a, b);
    const here: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "metamorphic",
      scene.people,
      scene.composition,
      scene.props,
    );
    const there: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "metamorphic",
      scene.people.map((p: motionHumanLawSweep.IPerson) => ({
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
    return worst <= 0.001 && Math.abs(here.duration - there.duration) <= 1e-6
      ? []
      : [
          `${law} ${row}: the turned and moved scene differs by ${(worst * 1000).toFixed(2)} mm (${where}), within 1 mm expected`,
        ];
  }

  /**
   * The dynamic similarity of one gait's pace across the four extreme bodies.
   *
   * @param law `walk` or `run`.
   * @param row The pace, `pace=value`.
   * @returns The findings.
   */
  export function similarity(law: string, row: string): string[] {
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
        const a: IAutoMovieVector3 = M.joint(s, t, "leftUpperLeg");
        const b: IAutoMovieVector3 = M.joint(s, t, "rightUpperLeg");
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
    const out: string[] = [];
    for (const measure of ["frequency", "duty", "stride"] as const) {
      const values: number[] = Object.values(read).map(
        (r: { frequency: number; duty: number; stride: number }) => r[measure],
      );
      const mean: number =
        values.reduce((x: number, y: number) => x + y, 0) / values.length;
      for (const [name, r] of Object.entries(read))
        if (!(mean > 0 && Math.abs(r[measure] / mean - 1) <= 0.15))
          out.push(
            `${law} ${row} ${name}: ${measure === "frequency" ? "reduced step frequency" : measure === "duty" ? "duty factor" : "stride per hip height"} ${r[measure].toFixed(3)} is ${((r[measure] / mean - 1) * 100).toFixed(1)} % off the bodies' mean ${mean.toFixed(3)}, within 15 % expected (Alexander 1984)`,
          );
    }
    return out;
  }

  /**
   * The tempo relation of one law: at pace 2 it lasts half as long, every
   * event at half its time.
   *
   * @param law The law.
   * @param params Its parameters besides the manner.
   * @returns The findings.
   */
  export function tempo(law: string, params: object): string[] {
    const body: IHumanBody = motionHumanBody("m-average");
    const film = (pace: number): motionHumanLaw.IFilm =>
      motionHumanLaw.perform(
        "metamorphic",
        [{ subject: "a", body }],
        HumanChain.subject("a").act(
          law as "crouch",
          {
            ...params,
            manner: { pace },
          } as never,
        ),
      );
    const slow: motionHumanLaw.IFilm = film(1);
    const fast: motionHumanLaw.IFilm = film(2);
    const events = (f: motionHumanLaw.IFilm): number[] =>
      f.performance
        .segments("a")
        .flatMap((s) =>
          s.plan.events.map(
            (e: { share: number }): number =>
              s.start + e.share * s.plan.duration,
          ),
        );
    const one: number[] = events(slow);
    const two: number[] = events(fast);
    const ratio: number = fast.duration / slow.duration;
    return Math.abs(ratio - 0.5) <= 0.005 &&
      one.length === two.length &&
      one.every(
        (t: number, i: number): boolean =>
          Math.abs(two[i]! - t / 2) <= 0.01 * Math.max(t, 0.01),
      )
      ? []
      : [
          `${law}: pace 2 lasts ${ratio.toFixed(3)} of pace 1 with ${two.length} of ${one.length} events at half their times, 0.5 expected within 1 %`,
        ];
  }
}

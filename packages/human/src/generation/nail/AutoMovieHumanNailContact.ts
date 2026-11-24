import {
  AutoMovieLoftAdmissionError,
  AutoMovieViewLoft,
  AutoMovieSolidDomain as Domain,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionSharedLoop,
  IAutoMovieHumanNail,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanNailLoop as Loop } from "./AutoMovieHumanNailLoop";

type Chart = ReturnType<IAutoMovieSolidSharedCurve.Loop>;
type Ready = Extract<
  IAutoMovieConstructionSharedLoop.ISource,
  { kind: "ready" }
>;

/**
 * One nail edge owns both original B-rep chart curves, fixed by the parent
 * footprint clock. The physical equality and its derivatives are solved in the
 * three remaining scalar chart coordinates.
 *
 * @see https://occt3d.com/dev/doc/refman/html/class_b_rep_builder_a_p_i___sewing.html
 */
export namespace AutoMovieHumanNailContact {
  /** Parent ellipse shares, from the authored inner support to overflow guard. */
  const SHARES: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
  /** Four observed points per quarter fit the initial closed chart controls. */
  const GUIDE: number = 16;
  const TURN: number = 2 * Math.PI;

  /** Return both original millimetre/radian curves on the same contact loop. */
  export function prepare(
    nail: IAutoMovieHumanNail.INail,
    plate: IAutoMovieViewPart,
    digit: IAutoMovieViewPart,
    tip: number,
  ): Ready {
    const p = AutoMovieViewLoft.create(plate);
    const h = AutoMovieViewLoft.create(digit);
    if (
      p.chain === null ||
      p.surface === null ||
      h.chain === null ||
      h.surface === null
    )
      throw new AutoMovieLoftAdmissionError(
        "Missing native nail face jets: " +
          JSON.stringify([...p.diagnostics, ...h.diagnostics]),
      );
    const part: IAutoMovieSolidSurface = p.surface;
    const host: IAutoMovieSolidSurface = h.surface;
    const { centre, semi, read } = Loop.prepare(nail, p.chain, h.chain, tip);

    /** The first physical exit belongs to this ray's admitted interior. */
    function initial(clock: number): P3 {
      let lo: number = SHARES[0]!;
      let previous = read(clock, lo);
      const inside = (a: ReturnType<typeof read>): boolean =>
        a !== null && Math.max(a.gap, a.floorGap) < 0;
      if (!inside(previous))
        throw new AutoMovieLoftAdmissionError(
          "Nail footprint lacks an interior anchor at " + clock,
        );
      const last: number | undefined = SHARES.slice(1).find((s): boolean => {
        const current = read(clock, s);
        if (!inside(current)) return true;
        lo = s;
        previous = current;
        return false;
      });
      if (last === undefined)
        throw new AutoMovieLoftAdmissionError(
          "Nail footprint has no outward exit at " + clock,
        );
      let hi: number = last;
      for (let i: number = 0; i < 16; ++i) {
        const m: number = (lo + hi) / 2;
        const a = read(clock, m);
        if (inside(a)) {
          lo = m;
          previous = a;
        } else hi = m;
      }
      const value = previous!;
      return [
        lo,
        value.station,
        value.gap >= value.floorGap ? value.phase : value.floorPhase,
      ];
    }

    /** Exact first and second derivatives of the two joined charts. */
    function readAt(
      clock: number,
      start: P3,
    ): { parent: Chart; plate: Chart } | null {
      const d: P2 = [semi[0] * Math.cos(clock), semi[1] * Math.sin(clock)];
      const dc: P2 = [-semi[0] * Math.sin(clock), semi[1] * Math.cos(clock)];
      const fields = ([r, s, f]: P3) => {
        const address: P2 = [centre[0] + r * d[0], centre[1] + r * d[1]];
        const a = Domain.jet(host, ...address),
          b = Domain.jet(part, s, f);
        if (a === null || b === null) return null;
        const error: P3 = Vec.sub(a.p, b.p);
        const solve = (rhs: P3): P3 | null =>
          Vec.solve3(
            tangent(a, d),
            Vec.scale(b.u, -1),
            Vec.scale(b.v, -1),
            rhs,
          );
        return { a, b, address, solve, error, gap: Vec.norm(error) };
      };
      let x: P3 = start,
        j = fields(start);
      if (j === null) return null;
      // Scale the stopping residual to roundoff in the world source frame.
      const roundoff: number =
        256 * Number.EPSILON * Math.max(1, Vec.norm(j.a.p));
      for (let i: number = 0; j.gap > roundoff && i < 12; ++i) {
        const move: P3 | null = j.solve(Vec.scale(j.error, -1));
        if (move === null) return null;
        let next: ReturnType<typeof fields> = null;
        for (let weight: number = 1; weight >= 1 / 256; weight /= 2) {
          const candidate: P3 = Vec.add(x, Vec.scale(move, weight));
          const value = fields(candidate);
          if (value === null || value.gap >= j.gap) continue;
          next = value;
          x = candidate;
          break;
        }
        if (next === null) return null;
        j = next;
      }
      if (j.gap > roundoff || !(x[0] > 0)) return null;

      const r: number = x[0];
      const first: P3 | null = j.solve(Vec.scale(tangent(j.a, dc), -r));
      if (first === null) return null;
      const rate: P2 = [
        d[0] * first[0] + r * dc[0],
        d[1] * first[0] + r * dc[1],
      ];
      const extra: P2 = [
        2 * dc[0] * first[0] - r * d[0],
        2 * dc[1] * first[0] - r * d[1],
      ];
      const rhs: P3 = Vec.sub(
        quadratic(j.b, [first[1], first[2]]),
        Vec.add(quadratic(j.a, rate), tangent(j.a, extra)),
      );
      const second: P3 | null = j.solve(rhs);
      if (second === null) return null;
      return {
        parent: {
          point: j.address,
          first: rate,
          second: [d[0] * second[0] + extra[0], d[1] * second[0] + extra[1]],
        },
        plate: {
          point: [x[1], x[2]],
          first: [first[1], first[2]],
          second: [second[1], second[2]],
        },
      };
    }

    const controls: P3[] = Array.from({ length: GUIDE }, (_, i): P3 => {
      const clock: number = (i * TURN) / GUIDE;
      const point = readAt(clock, initial(clock));
      if (point === null)
        throw new AutoMovieLoftAdmissionError(
          "The paired nail clock has no regular solver at " + clock,
        );
      return [
        Math.hypot(
          (point.parent.point[0] - centre[0]) / semi[0],
          (point.parent.point[1] - centre[1]) / semi[1],
        ),
        ...point.plate.point,
      ];
    });
    const nearest = (phase: number, before: number): number =>
      before + Math.atan2(Math.sin(phase - before), Math.cos(phase - before));
    for (let i: number = 1; i < controls.length; ++i)
      controls[i]![2] = nearest(controls[i]![2], controls[i - 1]![2]);
    const endPhase: number = nearest(controls[0]![2], controls.at(-1)![2]);
    const phaseTurn: number =
      TURN * Math.round((endPhase - controls[0]![2]) / TURN);
    const at = (clock: number) => {
      const laps: number = Math.floor(clock / TURN);
      const turn: number = clock - laps * TURN;
      const step: number = (turn * GUIDE) / TURN;
      const i: number = Math.floor(step),
        w: number = step - i;
      const a: P3 = controls[i % GUIDE]!,
        b: P3 = controls[(i + 1) % GUIDE]!;
      const phaseStep: number = (i + 1 === GUIDE ? endPhase : b[2]) - a[2];
      const guess: P3 = [
        a[0] + w * (b[0] - a[0]),
        a[1] + w * (b[1] - a[1]),
        a[2] + w * phaseStep,
      ];
      const direct = readAt(turn, guess) ?? readAt(turn, initial(turn));
      if (direct === null)
        throw new AutoMovieLoftAdmissionError(
          "The paired nail clock has no regular solver at " + clock,
        );
      direct.plate.point[1] =
        nearest(direct.plate.point[1], guess[2]) + laps * phaseTurn;
      return direct;
    };
    return {
      kind: "ready",
      hostFace: digit.name,
      partFace: plate.name,
      at: (clock) => at(clock).parent,
      partAt: (clock) => at(clock).plate,
    };
  }

  function tangent(j: IAutoMovieSolidSurface.IJet, rate: P2): P3 {
    return Vec.add(Vec.scale(j.u, rate[0]), Vec.scale(j.v, rate[1]));
  }

  function quadratic(j: IAutoMovieSolidSurface.IJet, [s, p]: P2): P3 {
    return Vec.add(
      Vec.add(Vec.scale(j.uu, s * s), Vec.scale(j.uv, 2 * s * p)),
      Vec.scale(j.vv, p * p),
    );
  }
}

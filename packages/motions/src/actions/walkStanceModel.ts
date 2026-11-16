import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { walkLegClearance } from "./walkLegClearance";
import { walkReach } from "./walkReach";
import { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";
import { walkStanceGeometry } from "./walkStanceGeometry";
import { walkStanceRows } from "./walkStanceRows";
import { walkStanceOutline } from "./walkStanceOutline";

/**
 * A stance course's problem over its knots (`walkStanceCourse`), its first
 * `hold` knots held as `start` holds them: the starting variables, the cost
 * and the constraints at a course (`sweep`), the rows linear in it
 * (`bounds`), and each stance's reading, on the geometry
 * `walkStanceGeometry` reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the problem holds and who reads it.
 * @evidence contracts/development/design.md#principled-representation The cost and constraint half of one course's problem, its closures sharing the geometry built once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder, read by `walkStanceSolve.problem`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weights are `walkStanceCourse`'s named constants, the units and steps `walkStanceTerms`'.
 */
export namespace walkStanceModel {
  /**
   * The course's problem over its knots, its first `hold` knots held as
   * `start` holds them.
   *
   * @param body The body.
   * @param knots The knots.
   * @param start A course to start from.
   * @param hold How many first knots are held.
   * @returns The problem.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed knot/held prefix and exposes starting variables, full sweeps, linear bounds and planted-only goals.
   * @evidence contracts/development/implementation.md#principled-implementation Retains each published stance residual and range/contact/clearance constraint, their original finite-difference steps and second differences across the held overlap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure walkStanceGeometry owns prepared physical readings and walkStanceRows owns linear row topology; this builder alone assembles the course's residuals and nonlinear constraints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original residual, constraint order, landing-region sample, held-knot acceleration and physical bound without changing sample rate or tolerances.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each knot reads at most two legs and seven probes per leg when linearizing; clearance reuses those identical base/probe legs instead of posing them again, and merit reads request no gradient probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact single-coordinate readings within the same sweep feed both each leg's own constraints and two-leg clearance; prepared goals and bounded pelvis/pivot/support readings share fixed problem geometry. A landing's complete x/z region-probe arrays are each read once and feed every bound component at those exact inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned problem retains its initial vector and geometry/row closures, linear in knots for fixed foot geometry; per-knot gradient records release after each sweep and no history is retained.
   */
  export function of(
    body: IHumanBody,
    knots: readonly walkStanceCourse.IKnot[],
    start: walkStanceCourse.ICourse | undefined,
    hold: number,
  ): {
    n: number;
    size: number;
    x: Float64Array;
    sweep: (
      x: Float64Array,
      linear: boolean,
      residual: (r: number, idx: number[], g: number[]) => void,
      constraint: (over: number, idx: number[], g: () => number[]) => void,
    ) => void;
    bounds: ReturnType<typeof walkStanceRows.of>;
    planted: ReturnType<typeof walkStanceGeometry.of>["planted"];
  } {
    const geometry: ReturnType<typeof walkStanceGeometry.of> = walkStanceGeometry.of(body, knots);
    const {
      n,
      step,
      limit,
      lengthwise,
      dorsal,
      unloadedDorsal,
      size,
      pitchOf,
      slideOf,
      turnOf,
      scheduled,
      planted,
      read,
      load,
      support,
    }: ReturnType<typeof walkStanceGeometry.of> = geometry;
    // The starting course: flat feet, an upright or held trunk, no turn, and
    // the drop each knot's legs need.
    const x: Float64Array = new Float64Array(size);
    for (let k: number = 0; k < n; k++) {
      const o: number = walkStanceTerms.WIDTH * k;
      const knot: walkStanceCourse.IKnot = knots[k]!;
      x[o + 3] = knot.trunk?.pitch ?? 0;
      x[o + 4] = knot.trunk?.roll ?? 0;
      const pelvis: walkStanceCourse.IPelvis = knot.pelvis({
        pitch: x[o + 3]!,
        roll: x[o + 4]!,
      });
      let drop: number = 0;
      knot.stances.forEach((s: walkStanceCourse.IStance, j: number): void => {
        x[o + pitchOf(s.side)] = scheduled[k]![j]!;
        const hip: IAutoMovieVector3 = pelvis.hips[s.side];
        const dh: number = Math.hypot(
          hip.x - s.placement.ankle.x,
          hip.z - s.placement.ankle.z,
        );
        if (dh < limit)
          drop = Math.max(
            drop,
            hip.y - s.placement.ankle.y - Math.sqrt(limit * limit - dh * dh),
          );
      });
      x[o] = knot.drop ?? drop;
      // A held knot is its start's.
      if (start !== undefined && k < hold) {
        const values: number[] = [
          start.drop[k]!,
          start.pitch.left[k]!,
          start.pitch.right[k]!,
          start.trunk.pitch[k]!,
          start.trunk.roll[k]!,
          start.turn.left[k]!,
          start.turn.right[k]!,
          start.slide.left.x[k]!,
          start.slide.left.z[k]!,
          start.slide.right.x[k]!,
          start.slide.right.z[k]!,
        ];
        values.forEach((v: number, i: number): void => {
          x[o + i] = v;
        });
        continue;
      }
      // A course solved before for the same first knots starts this one.
      if (start !== undefined && k < start.knots.length) {
        if (knot.drop === undefined) x[o] = start.drop[k]!;
        if (knot.trunk === undefined) {
          x[o + 3] = start.trunk.pitch[k]!;
          x[o + 4] = start.trunk.roll[k]!;
        }
        for (const side of ["left", "right"] as const) {
          const j: number = knot.stances.findIndex(
            (s: walkStanceCourse.IStance): boolean => s.side === side,
          );
          const pitch: number = start.pitch[side][k]!;
          if (
            j < 0 ||
            (scheduled[k]![j]! <= 1e-6 && pitch <= scheduled[k]![j]!)
          )
            x[o + pitchOf(side)] = pitch;
          if (j < 0 || knot.stances[j]!.turning === true)
            x[o + turnOf(side)] = start.turn[side][k]!;
          if (j < 0 || knot.stances[j]!.landing !== undefined) {
            x[o + slideOf(side)] = start.slide[side].x[k]!;
            x[o + slideOf(side) + 1] = start.slide[side].z[k]!;
          }
        }
      }
    }

    // The cost and the constraints at a course: each cost residual with its
    // gradient (the model reads both, the merit the residual alone), and each
    // constraint as its excess over its bound, in degrees, a length read as
    // the leg's turn that moves its ankle by it, with its gradient. Gradients are read only
    // when `linear` asks for them.
    const sweep: ReturnType<typeof of>["sweep"] = (
      x: Float64Array,
      linear: boolean,
      residual: (r: number, idx: number[], g: number[]) => void,
      constraint: (over: number, idx: number[], g: () => number[]) => void,
    ): void => {
      for (let k: number = 0; k < n; k++) {
        const o: number = walkStanceTerms.WIDTH * k;
        const knot: walkStanceCourse.IKnot = knots[k]!;
        // A held knot is read only through the second differences it joins.
        if (k < hold) {
          if (k > 0 && k < n - 1 && k + 1 >= hold)
            for (let s: number = 0; s < walkStanceTerms.WIDTH; s++) {
              const scale: number = step * step * walkStanceTerms.ACCELERATIONS[s]!;
              const a: number = o - walkStanceTerms.WIDTH + s;
              const b: number = o + s;
              const c: number = o + walkStanceTerms.WIDTH + s;
              residual(
                (x[a]! - 2 * x[b]! + x[c]!) / scale,
                [a, b, c],
                [1 / scale, -2 / scale, 1 / scale],
              );
            }
          continue;
        }
        // The body stands as tall and as upright as it can.
        residual(x[o]! / walkStanceCourse.UPRIGHT, [o], [1 / walkStanceCourse.UPRIGHT]);
        if (knot.trunk === undefined) {
          residual(x[o + 3]! / walkStanceCourse.TRUNK, [o + 3], [1 / walkStanceCourse.TRUNK]);
          residual(x[o + 4]! / walkStanceCourse.TRUNK, [o + 4], [1 / walkStanceCourse.TRUNK]);
        }
        const readings: {
          indices: number[];
          at: ReturnType<typeof read>;
          moved: ReturnType<typeof read>[];
        }[] = [];
        knot.stances.forEach((s: walkStanceCourse.IStance, j: number): void => {
          const p: number = o + pitchOf(s.side);
          const t: number = o + turnOf(s.side);
          const d: number = o + slideOf(s.side);
          const idx: number[] = [o, p, o + 3, o + 4, t, d, d + 1];
          const at: ReturnType<typeof read> = read(x, k, j);
          // Each variable moved once, every quantity read from that move.
          const moved: ReturnType<typeof read>[] = linear
            ? idx.map((i: number): ReturnType<typeof read> => {
                const kept: number = x[i]!;
                x[i] = kept + walkStanceTerms.STEPS[i % walkStanceTerms.WIDTH]!;
                const r: ReturnType<typeof read> = read(x, k, j);
                x[i] = kept;
                return r;
              })
            : [];
          readings.push({ indices: idx, at, moved });
          const grad: (pick: (r: ReturnType<typeof read>) => number) => number[] = (
            pick: (r: ReturnType<typeof read>) => number,
          ): number[] =>
            moved.map(
              (r: ReturnType<typeof read>, a: number): number =>
                (pick(r) - pick(at)) / walkStanceTerms.STEPS[idx[a]! % walkStanceTerms.WIDTH]!,
            );
          // The ankle's dorsiflexion past heel-off, on a smooth hinge.
          const z: number = (at.dorsi - walkStanceCourse.HEEL_OFF) / walkStanceCourse.SPREAD;
          const slope: number = 1 / (1 + Math.exp(-z)) / walkStanceCourse.SPREAD;
          const dorsi: number[] = grad((r: ReturnType<typeof read>): number => r.dorsi);
          residual(
            walkStanceTerms.softplus(z),
            idx,
            dorsi.map((g: number): number => slope * g),
          );
          // Turning about the ball past the schedule's pitch, and a landing
          // foot's turn on the floor.
          residual((x[p]! - scheduled[k]![j]!) / walkStanceCourse.BALL, [p], [1 / walkStanceCourse.BALL]);
          if (s.turning === true) {
            residual(x[t]! / walkStanceCourse.TURN, [t], [1 / walkStanceCourse.TURN]);
            // The hip turns the foot no further than it rotates.
            constraint(at.twist - walkReach.TWIST, [t], (): number[] => [1]);
            constraint(-at.twist - walkReach.TWIST, [t], (): number[] => [-1]);
          }
          // A landing slides toward its goal, inside its region.
          const landing: walkStanceCourse.IStance["landing"] = s.landing;
          if (landing !== undefined) {
            const ankle: (dx: number, dz: number) => IAutoMovieVector3 = (dx: number, dz: number): IAutoMovieVector3 => ({
              x: s.placement.ankle.x + dx,
              y: s.placement.ankle.y,
              z: s.placement.ankle.z + dz,
            });
            const here: IAutoMovieVector3 = ankle(x[d]!, x[d + 1]!);
            residual((here.x - landing.goal.x) / walkStanceTerms.PLACE, [d], [1 / walkStanceTerms.PLACE]);
            residual((here.z - landing.goal.z) / walkStanceTerms.PLACE, [d + 1], [1 / walkStanceTerms.PLACE]);
            const excess: number[] = landing.region(here);
            const h: number = walkStanceTerms.STEPS[slideOf(s.side) % walkStanceTerms.WIDTH]!;
            let probes: readonly [number[], number[]] | undefined;
            const shifted: () => readonly [number[], number[]] = (): readonly [number[], number[]] =>
              (probes ??= [
                landing.region(ankle(x[d]! + h, x[d + 1]!)),
                landing.region(ankle(x[d]!, x[d + 1]! + h)),
              ]);
            excess.forEach((value: number, b: number): void => {
              constraint(value * lengthwise, [d, d + 1], (): number[] => {
                const [across, along]: readonly [number[], number[]] = shifted();
                return [
                  (across[b]! - value) / h * lengthwise,
                  (along[b]! - value) / h * lengthwise,
                ];
              });
            });
          }
          // The leg reaches its ankle, the ankle stays in its range, and the
          // thigh trails no further than the hip extends.
          constraint((at.reach - limit) * lengthwise, idx, (): number[] =>
            grad((r: ReturnType<typeof read>): number => r.reach).map(
              (g: number): number => g * lengthwise,
            ),
          );
          // An ankle reaches as far as its foot is loaded: the loaded range
          // under the whole weight, the unloaded one under none, in
          // proportion between, the foot's share of the weight read from
          // where the take's centre of pressure lies between the feet
          // (`load`), so a foot that is about to leave the floor, or has just
          // met it, keeps the range of the weight it bears.
          constraint(
            at.dorsi -
              (unloadedDorsal + (dorsal - unloadedDorsal) * load(k, j)),
            idx,
            (): number[] => dorsi,
          );
          constraint(at.trail - walkReach.EXTENSION, idx, (): number[] =>
            grad((r: ReturnType<typeof read>): number => r.trail),
          );
        });
        // The feet bear the points the take asks them to: a raised heel
        // leaves each no shallower inside the base than the feet as
        // scheduled hold it, nor outside where they hold it.
        const borne: readonly IAutoMovieVector3[] = knot.borne ?? [];
        if (knot.stances.length > 0 && borne.length > 0) {
          const idx: number[] = knot.stances.flatMap((s: walkStanceCourse.IStance): number[] => [
            o + pitchOf(s.side),
            o + turnOf(s.side),
            o + slideOf(s.side),
            o + slideOf(s.side) + 1,
          ]);
          const kept: number[] = idx.map((i: number): number => x[i]!);
          knot.stances.forEach((s: walkStanceCourse.IStance, j: number): void => {
            x[o + pitchOf(s.side)] = scheduled[k]![j]!;
          });
          const flatBase: IAutoMovieVector3[] = support(x, k);
          idx.forEach((i: number, r: number): void => {
            x[i] = kept[r]!;
          });
          const base: IAutoMovieVector3[] = support(x, k);
          // The bases at each variable moved, built only for a constraint
          // that asks for its gradient.
          let moved: IAutoMovieVector3[][] | undefined;
          const bases: () => IAutoMovieVector3[][] = (): IAutoMovieVector3[][] =>
            (moved ??= idx.map((i: number): IAutoMovieVector3[] => {
              const before: number = x[i]!;
              x[i] = before + walkStanceTerms.STEPS[i % walkStanceTerms.WIDTH]!;
              const out: IAutoMovieVector3[] = support(x, k);
              x[i] = before;
              return out;
            }));
          for (const point of borne) {
            const held: number = Math.min(0, walkStanceOutline.depth(flatBase, point));
            const deep: number = walkStanceOutline.depth(base, point);
            constraint((held - deep) * lengthwise, idx, (): number[] =>
              bases().map(
                (hull: IAutoMovieVector3[], a: number): number =>
                  -(walkStanceOutline.depth(hull, point) - deep) /
                  walkStanceTerms.STEPS[idx[a]! % walkStanceTerms.WIDTH]! *
                  lengthwise,
              ),
            );
          }
        }
        // Two legs that stand, both posed at the swivels the take holds, keep
        // clear of each other as the tangle audit reads them, within the
        // skin's give (`walkLegClearance`): a foot that crosses the other,
        // as a sideways recovery's does, lands and stands in front of or
        // behind it, its leg clear of the other leg.
        if (
          knot.stances.length === 2 &&
          knot.stances.every((s: walkStanceCourse.IStance): boolean => s.swivel !== undefined)
        ) {
          const idx: number[] = [
            o,
            o + 3,
            o + 4,
            ...knot.stances.flatMap((s: walkStanceCourse.IStance): number[] => [
              o + pitchOf(s.side),
              o + turnOf(s.side),
              o + slideOf(s.side),
              o + slideOf(s.side) + 1,
            ]),
          ];
          // The excess is the greatest of linear pieces, each a probe's depth
          // below a face plane: its gradient is its binding piece's, read
          // with each variable moved.
          const clear: walkLegClearance.IReading = walkLegClearance.reading(
            body,
            readings[0]!.at.leg!,
            readings[1]!.at.leg!,
          );
          constraint(
            (clear.excess - walkLegClearance.BOUND) * lengthwise,
            idx,
            (): number[] =>
              idx.map((i: number): number => {
                // Each leg's constraint reading already contains the same
                // single-coordinate probes. A variable of the other foot
                // leaves this leg at its base reading.
                const legs: walkLegClearance.ILeg[] = readings.map(
                  (reading: (typeof readings)[number]): walkLegClearance.ILeg => {
                    const at: number = reading.indices.indexOf(i);
                    return (at < 0 ? reading.at : reading.moved[at]!).leg!;
                  },
                );
                const moved: number = clear.at(
                  legs[0]!,
                  legs[1]!,
                );
                return (moved - clear.excess) / walkStanceTerms.STEPS[i % walkStanceTerms.WIDTH]! * lengthwise;
              }),
          );
        }
        // The course's acceleration, each series over three knots.
        if (k > 0 && k < n - 1)
          for (let s: number = 0; s < walkStanceTerms.WIDTH; s++) {
            const scale: number = step * step * walkStanceTerms.ACCELERATIONS[s]!;
            const a: number = o - walkStanceTerms.WIDTH + s;
            const b: number = o + s;
            const c: number = o + walkStanceTerms.WIDTH + s;
            residual(
              (x[a]! - 2 * x[b]! + x[c]!) / scale,
              [a, b, c],
              [1 / scale, -2 / scale, 1 / scale],
            );
          }
      }
    };

    const bounds: ReturnType<typeof walkStanceRows.of> = walkStanceRows.of(knots, hold, geometry);

    return { n, size, x, sweep, bounds, planted };
  }
}

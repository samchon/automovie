import {
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
  hingedArmSwivel,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { walkStanceCourse } from "../actions/walkStanceCourse";
import { walkStanceSolve } from "../actions/walkStanceSolve";
import { walkStanceTerms } from "../actions/walkStanceTerms";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanLegChain } from "../posture/HumanLegChain";
import { HumanFrame } from "../posture/HumanFrame";
import type {
  HumanQuadraticProgram as QP,
} from "../posture/HumanQuadraticProgram";
import { staggerKnots } from "./staggerKnots";

/**
 * A stagger's stance course solved with the posture's own knees
 * (`walkStanceCourse`, `HumanLegChain`), each knot's leg fit run at the
 * course and its swivel held as its first-order piece in the convex
 * subproblem.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved and how the knees enter it.
 * @evidence contracts/development/design.md#principled-representation One solve over the knots `staggerKnots` builds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `staggerStep`, `staggerClose` and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The slope's step is the fit's own resolution, not a tuned number.
 */
export namespace staggerSequential {
  /**
   * A recovery's stance course whose knees are the posture's own, solved as
   * a sequential convex problem by the shared loop (`HumanSequentialConvex`,
   * TrajOpt's outer loop, Schulman et al. 2014): at a course, each planted
   * leg's bend branch and swivel are the posture's leg fit run there
   * (`HumanLegChain.fit`, with the knee hint the posture gives it,
   * `kneePole`), and the course is evaluated with them; the convex
   * subproblem about a course holds each swivel as its first-order piece in
   * the leg's own variables (`walkStanceCourse.ISwivel`), so the subproblem
   * sees how the knee follows the course, as TrajOpt linearises a nonconvex
   * function at the iterate. The slope is a forward difference of the fit
   * with the branch held, each step's fit continuing the base fit's seed
   * (`HumanLegChain.seeded`, a refinement about it rather than a sweep, the
   * fit's own warm start), of a step `sqrt(eps) x scale` (Nocedal and Wright
   * 2006, section 8.1): `eps` the fit's own resolution relative to its
   * swivel, the engine's swivel resolution over its sweep's step
   * (`hingedArmSwivel.RESOLUTION`, `hingedArmSwivel.STEP`), and `scale` the
   * course's trust region per variable. A difference that flips the branch
   * is taken on the other side; one that flips it on both is no slope, and
   * the subproblem keeps that variable within the step, the branch's edge
   * bounding the region there (`walkStanceSolve.optimise` runs the loop).
   * Knots a parent course settles keep the parent's swivels.
   *
   * @param body The body.
   * @param knots The knots, each with its frame.
   * @param parent The course whose first `from` knots this one keeps.
   * @param from How many first knots the parent settles.
   * @returns The course at the last iterate taken, its largest excess as `unmet`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the original branch-held forward differences, parent overlap, trust-region edge behavior and seeded-fit resolution.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the original TrajOpt stance course with each leg's actual seeded hinged fit and the same branch-preserving two-sided fallback; every changed course keeps the original fit, derivative spacing and edge constraints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private stance problem owns invariant frames, placements and support data; fitted swivels or their first-order pieces are installed immediately before each synchronous reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body sample, phase, support, target, tolerance or solver round is removed; probes still fit each requested leg and fall back to the other side on a branch change.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each changed course retains the original cold remembered fit per active leg; every piece keeps its original seven probes and possible opposite-side fit. Goal-only reads, one private probe vector and one fixed-geometry problem avoid unrelated posing and rebuilds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the latest fitted/piece records reuse their same immutable course-vector identity; a changed course always executes its original live remembered queries, even when one leg's coordinates match a prior course. Each side's four foot-coordinate probes share only fixed hips-only source/FK preparation, while changed drop/trunk probes prepare their own source and every probe still passes its actual goals/near through remembered.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous solve owns one problem, one latest actual fit record, one latest piece record and one probe vector, each linear in active course size and released on return or failure. One side's prepared source/FK workspace ends with its slope map; returned knots retain only final swivels.
   */
  export function solve(
    body: IHumanActionContext["body"],
    knots: readonly staggerKnots.IKnot[],
    parent?: walkStanceCourse.ICourse,
    from: number = 0,
  ): walkStanceCourse.ICourse {
    // The parent's swivels, kept on the knots it settles.
    const kept: (
      k: number,
      side: "left" | "right",
    ) => walkStanceCourse.ISwivel | undefined = (
      k: number,
      side: "left" | "right",
    ): walkStanceCourse.ISwivel | undefined =>
      parent === undefined || k >= from || k >= parent.knots.length
        ? undefined
        : parent.knots[k]!.stances.find(
            (s: walkStanceCourse.IStance): boolean => s.side === side,
          )?.swivel;
    // Only the held swivels vary between evaluations. These private knot
    // records keep placements, schedules, frames and support geometry fixed
    // for the lifetime of this synchronous solve.
    const active: walkStanceCourse.IKnot[] = knots.map(
      (knot: staggerKnots.IKnot): walkStanceCourse.IKnot => ({
        ...knot,
        stances: [...knot.stances],
      }),
    );
    /** Immutable swivel records installed by one fit or piece reading. */
    type ISwivels = readonly (
      | Partial<Record<"left" | "right", walkStanceCourse.ISwivel>>
      | undefined
    )[];
    let held: ISwivels | undefined;
    const holding: (swivels: ISwivels) => void = (swivels: ISwivels): void => {
      if (held === swivels) return;
      for (let k: number = 0; k < knots.length; k++)
        active[k]!.stances = knots[k]!.stances.map(
          (s: walkStanceCourse.IStance): walkStanceCourse.IStance => {
            const swivel: walkStanceCourse.ISwivel | undefined =
              swivels[k]?.[s.side] ?? kept(k, s.side);
            return swivel === undefined ? s : { ...s, swivel };
          },
        );
      held = swivels;
    };

    // The problem's shape, its knots without swivels: the swivels change
    // only the readings, never the variables or the rows' order.
    holding([]);
    const shape: walkStanceCourse.IProblem = walkStanceSolve.problem(
      body,
      active,
      parent,
      from,
    );
    const variables: Record<"left" | "right", number[]>[] = knots.map(
      (_: staggerKnots.IKnot, k: number): Record<"left" | "right", number[]> => ({
        left: shape.variables(k, "left"),
        right: shape.variables(k, "right"),
      }),
    );
    const knees: Record<"left" | "right", ReturnType<typeof HumanFrame.preparePoint>>[] = knots.map(
      (knot: staggerKnots.IKnot): Record<"left" | "right", ReturnType<typeof HumanFrame.preparePoint>> => ({
        left: HumanFrame.preparePoint(knot.frame.yaw, body.rest.get("leftLowerLeg")!),
        right: HumanFrame.preparePoint(knot.frame.yaw, body.rest.get("rightLowerLeg")!),
      }),
    );

    // The posture's fit of a planted leg at a course, continuing a nearby fit
    // of the same leg when one is given (`HumanLegChain.seeded`).
    const fitOf: (k: number, p: walkStanceCourse.IPlanted, x: Float64Array, near?: IAutoMovieSwivelNear, prepared?: ReturnType<typeof HumanLegChain.prepareSeeded>) => ISeeded = (
      k: number,
      p: walkStanceCourse.IPlanted,
      x: Float64Array,
      near?: IAutoMovieSwivelNear,
      prepared?: ReturnType<typeof HumanLegChain.prepareSeeded>,
    ): ISeeded => {
      const root: IAutoMovieVector3 = knots[k]!.frame.root({
        pitch: x[variables[k]![p.side][1]!]!,
        roll: x[variables[k]![p.side][2]!]!,
      });
      const bend: IAutoMovieVector3 = staggerKnots.kneePole(
        body,
        { ...root, y: root.y - p.drop },
        knots[k]!.frame.yaw,
        p.side,
        p.heading,
        knees[k]![p.side],
      );
      const fitted: ReturnType<typeof HumanLegChain.seeded> = prepared === undefined
        ? HumanLegChain.seeded(body, p.side, p.pelvis, p.hip, p.ankle, bend, p.rotation, near)
        : prepared(p.ankle, bend, p.rotation, near);
      return { ...fitted.swivel, seed: fitted.seed };
    };
    /** A leg fit plus the engine's seed used by its nearby coordinate probes. */
    type ISeeded = HumanLegChain.ISwivel & {
      seed: IAutoMovieSwivelSeed | null;
    };
    /** Each knot's active planted-leg fits; held knots have no new fit. */
    type Fitted = (Partial<Record<"left" | "right", ISeeded>> | undefined)[];

    /** The latest original course-identity memo, with no cross-course fit reuse. */
    type ICachedFits = { x: Float64Array; at: Fitted };
    let last: ICachedFits | undefined;
    const fits: (x: Float64Array) => Fitted = (x: Float64Array): Fitted =>
      knots.map(
        (
          _knot: staggerKnots.IKnot,
          k: number,
        ): Partial<Record<"left" | "right", ISeeded>> | undefined => {
          if (k < shape.first) return undefined;
          const out: Partial<Record<"left" | "right", ISeeded>> = {};
          for (const p of shape.planted(x, k)) out[p.side] = fitOf(k, p, x);
          return out;
        },
      );

    // Preserve the latest exact course-identity memo only. A changed vector
    // must pass every leg through the fit owner's live memory policy.
    const fitted: (x: Float64Array) => Fitted = (x: Float64Array): Fitted => {
      if (last === undefined || last.x !== x) last = { x, at: fits(x) };
      return last.at;
    };

    // Each swivel's first-order piece about a course, and the variables a
    // branch's edge bounds, read once a course: a subproblem convexified again
    // at another penalty about the same course reads the same pieces.
    let known: { x: Float64Array; at: ReturnType<typeof piecesOf> } | undefined;
    const pieces: (x: Float64Array) => ReturnType<typeof piecesOf> = (x: Float64Array): ReturnType<typeof piecesOf> => {
      if (known === undefined || known.x !== x) known = { x, at: piecesOf(x) };
      return known.at;
    };
    /** A course's held-swivel pieces and branch-limiting coordinate radii. */
    type IPieces = {
      swivels: (
        | Partial<Record<"left" | "right", walkStanceCourse.ISwivel>>
        | undefined
      )[];
      edges: Map<number, number>;
    };
    const piecesOf: (x: Float64Array) => IPieces = (x: Float64Array): IPieces => {
      const edges: Map<number, number> = new Map();
      // The differences are synchronous, and the original course never
      // changes. One private vector serves all single-coordinate probes.
      const moved: Float64Array = Float64Array.from(x);
      const baseFits: Fitted = fitted(x);
      const swivels: IPieces["swivels"] = baseFits.map(
        (
          fit: Partial<Record<"left" | "right", ISeeded>> | undefined,
          k: number,
        ): Partial<Record<"left" | "right", walkStanceCourse.ISwivel>> | undefined => {
          if (fit === undefined) return undefined;
          const out: Partial<Record<"left" | "right", walkStanceCourse.ISwivel>> =
            {};
          for (const side of ["left", "right"] as const) {
            const seededBase: ISeeded | undefined = fit[side];
            if (seededBase === undefined) continue;
            const { seed, ...base }: ISeeded = seededBase;
            // A step's fit continues the base fit's seed: a step of `h` moves
            // the swivel by far less than the sweep's own step, so the
            // refinement about the seed finds the swivel the sweep would, to
            // the fit's resolution (`hingedArmSwivel.RESOLUTION`).
            const near: IAutoMovieSwivelNear | undefined =
              seed === null
                ? undefined
                : { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
            const indices: number[] = variables[k]![side];
            let prepared: ReturnType<typeof HumanLegChain.prepareSeeded> | undefined;
            const slope: number[] = indices.map((i: number, v: number): number => {
              const h: number =
                Math.sqrt(hingedArmSwivel.RESOLUTION / hingedArmSwivel.STEP) *
                walkStanceTerms.SCALE[v]!;
              const read: (sign: number) => HumanLegChain.ISwivel | undefined = (sign: number): HumanLegChain.ISwivel | undefined => {
                moved[i] = x[i]! + sign * h;
                try {
                  const p: walkStanceCourse.IPlanted | undefined =
                    shape.planted(moved, k, side)[0];
                  if (p === undefined) return undefined;
                  // Foot pitch/turn/slide never change this knot's pelvis
                  // or hip. Drop and trunk probes retain their own source.
                  if (v >= 3 && prepared === undefined)
                    prepared = HumanLegChain.prepareSeeded(body, side, p.pelvis, p.hip);
                  return fitOf(k, p, moved, near, v >= 3 ? prepared : undefined);
                } finally {
                  moved[i] = x[i]!;
                }
              };
              const turned: (a: number, b: number) => number = (a: number, b: number): number =>
                ((((a - b + 180) % 360) + 360) % 360) - 180;
              const ahead: HumanLegChain.ISwivel | undefined = read(1);
              if (ahead !== undefined && ahead.branch === base.branch)
                return turned(ahead.swivel, base.swivel) / h;
              const behind: HumanLegChain.ISwivel | undefined = read(-1);
              if (behind !== undefined && behind.branch === base.branch)
                return turned(base.swivel, behind.swivel) / h;
              edges.set(i, h);
              return 0;
            });
            out[side] = {
              ...base,
              slope,
              about: indices.map((i: number): number => x[i]!),
            };
          }
          return out;
        },
      );
      return { swivels, edges };
    };

    return walkStanceSolve.optimise(
      body,
      shape,
      (
        x: Float64Array,
        model: boolean,
      ): { problem: walkStanceCourse.IProblem; rows: QP.IRow[] } => {
        if (!model) {
          holding(fitted(x));
          return { problem: shape, rows: [] };
        }
        const { swivels, edges }: IPieces = pieces(x);
        holding(swivels);
        return {
          problem: shape,
          rows: [...edges].map(
            ([i, h]: [number, number]): QP.IRow => ({
              index: [i],
              coef: [1],
              l: -h,
              u: h,
            }),
          ),
        };
      },
    );
  }
}

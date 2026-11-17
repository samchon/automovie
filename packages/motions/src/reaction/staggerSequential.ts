import { hingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanLegChain,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanWalkStanceCourse,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkStanceSolve } from "../actions/walkStanceSolve";
import { walkStanceTerms } from "../actions/walkStanceTerms";
import { HumanLegChain } from "../posture/HumanLegChain";
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
   */
  export function solve(
    body: IAutoMovieMotionHumanActionContext["body"],
    knots: readonly staggerKnots.IKnot[],
    parent?: IAutoMovieMotionHumanWalkStanceCourse.ICourse,
    from: number = 0,
  ): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    // The parent's swivels, kept on the knots it settles.
    const kept = (
      k: number,
      side: "left" | "right",
    ): IAutoMovieMotionHumanWalkStanceCourse.ISwivel | undefined =>
      parent === undefined || k >= from || k >= parent.knots.length
        ? undefined
        : parent.knots[k]!.stances.find(
            (s: IAutoMovieMotionHumanWalkStanceCourse.IStance): boolean =>
              s.side === side,
          )?.swivel;
    const holding = (
      swivels: readonly (
        | Partial<
            Record<
              "left" | "right",
              IAutoMovieMotionHumanWalkStanceCourse.ISwivel
            >
          >
        | undefined
      )[],
    ): IAutoMovieMotionHumanWalkStanceCourse.IKnot[] =>
      knots.map(
        (
          knot: staggerKnots.IKnot,
          k: number,
        ): IAutoMovieMotionHumanWalkStanceCourse.IKnot => ({
          ...knot,
          stances: knot.stances.map(
            (
              s: IAutoMovieMotionHumanWalkStanceCourse.IStance,
            ): IAutoMovieMotionHumanWalkStanceCourse.IStance => {
              const swivel:
                | IAutoMovieMotionHumanWalkStanceCourse.ISwivel
                | undefined = swivels[k]?.[s.side] ?? kept(k, s.side);
              return swivel === undefined ? s : { ...s, swivel };
            },
          ),
        }),
      );
    const problemOf = (
      swivels: readonly (
        | Partial<
            Record<
              "left" | "right",
              IAutoMovieMotionHumanWalkStanceCourse.ISwivel
            >
          >
        | undefined
      )[],
    ): IAutoMovieMotionHumanWalkStanceCourse.IProblem =>
      walkStanceSolve.problem(body, holding(swivels), parent, from);

    // The problem's shape, its knots without swivels: the swivels change
    // only the readings, never the variables or the rows' order.
    const shape: IAutoMovieMotionHumanWalkStanceCourse.IProblem = problemOf([]);

    // The posture's fit of a planted leg at a course, continuing a nearby fit
    // of the same leg when one is given (`HumanLegChain.seeded`).
    const fitOf = (
      k: number,
      p: IAutoMovieMotionHumanWalkStanceCourse.IPlanted,
      x: Float64Array,
      near?: IAutoMovieSwivelNear,
    ): ISeeded => {
      const root: IAutoMovieVector3 = knots[k]!.frame.root({
        pitch: x[shape.variables(k, p.side)[1]!]!,
        roll: x[shape.variables(k, p.side)[2]!]!,
      });
      const fitted = HumanLegChain.seeded(
        body,
        p.side,
        p.pelvis,
        p.hip,
        p.ankle,
        staggerKnots.kneePole(
          body,
          { ...root, y: root.y - p.drop },
          knots[k]!.frame.yaw,
          p.side,
          p.heading,
        ),
        p.rotation,
        near,
      );
      return { ...fitted.swivel, seed: fitted.seed };
    };
    type ISeeded = IAutoMovieMotionHumanLegChain.ISwivel & {
      seed: IAutoMovieSwivelSeed | null;
    };
    type Fitted = (Partial<Record<"left" | "right", ISeeded>> | undefined)[];
    const fits = (x: Float64Array): Fitted =>
      knots.map(
        (
          _: staggerKnots.IKnot,
          k: number,
        ): Partial<Record<"left" | "right", ISeeded>> | undefined => {
          if (k < shape.first) return undefined;
          const out: Partial<Record<"left" | "right", ISeeded>> = {};
          for (const p of shape.planted(x, k)) out[p.side] = fitOf(k, p, x);
          return out;
        },
      );

    // The fits at the last course read, read once a course.
    let last: { x: Float64Array; at: Fitted } | undefined;
    const fitted = (x: Float64Array): Fitted => {
      if (last === undefined || last.x !== x) last = { x, at: fits(x) };
      return last.at;
    };

    // Each swivel's first-order piece about a course, and the variables a
    // branch's edge bounds, read once a course: a subproblem convexified again
    // at another penalty about the same course reads the same pieces.
    let known: { x: Float64Array; at: ReturnType<typeof piecesOf> } | undefined;
    const pieces = (x: Float64Array): ReturnType<typeof piecesOf> => {
      if (known === undefined || known.x !== x) known = { x, at: piecesOf(x) };
      return known.at;
    };
    const piecesOf = (
      x: Float64Array,
    ): {
      swivels: (
        | Partial<
            Record<
              "left" | "right",
              IAutoMovieMotionHumanWalkStanceCourse.ISwivel
            >
          >
        | undefined
      )[];
      edges: Map<number, number>;
    } => {
      const edges: Map<number, number> = new Map();
      const swivels = fitted(x).map(
        (
          fit: Partial<Record<"left" | "right", ISeeded>> | undefined,
          k: number,
        ):
          | Partial<
              Record<
                "left" | "right",
                IAutoMovieMotionHumanWalkStanceCourse.ISwivel
              >
            >
          | undefined => {
          if (fit === undefined) return undefined;
          const out: Partial<
            Record<
              "left" | "right",
              IAutoMovieMotionHumanWalkStanceCourse.ISwivel
            >
          > = {};
          for (const side of ["left", "right"] as const) {
            const seededBase: ISeeded | undefined = fit[side];
            if (seededBase === undefined) continue;
            const { seed, ...base } = seededBase;
            // A step's fit continues the base fit's seed: a step of `h` moves
            // the swivel by far less than the sweep's own step, so the
            // refinement about the seed finds the swivel the sweep would, to
            // the fit's resolution (`hingedArmSwivel.RESOLUTION`).
            const near: IAutoMovieSwivelNear | undefined =
              seed === null
                ? undefined
                : { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
            const indices: number[] = shape.variables(k, side);
            const slope: number[] = indices.map(
              (i: number, v: number): number => {
                const h: number =
                  Math.sqrt(hingedArmSwivel.RESOLUTION / hingedArmSwivel.STEP) *
                  walkStanceTerms.SCALE[v]!;
                const read = (
                  sign: number,
                ): IAutoMovieMotionHumanLegChain.ISwivel | undefined => {
                  const moved: Float64Array = Float64Array.from(x);
                  moved[i] = moved[i]! + sign * h;
                  const p:
                    | IAutoMovieMotionHumanWalkStanceCourse.IPlanted
                    | undefined = shape
                    .planted(moved, k)
                    .find(
                      (
                        q: IAutoMovieMotionHumanWalkStanceCourse.IPlanted,
                      ): boolean => q.side === side,
                    );
                  return p === undefined ? undefined : fitOf(k, p, moved, near);
                };
                const turned = (a: number, b: number): number =>
                  ((((a - b + 180) % 360) + 360) % 360) - 180;
                const ahead: IAutoMovieMotionHumanLegChain.ISwivel | undefined =
                  read(1);
                if (ahead !== undefined && ahead.branch === base.branch)
                  return turned(ahead.swivel, base.swivel) / h;
                const behind:
                  | IAutoMovieMotionHumanLegChain.ISwivel
                  | undefined = read(-1);
                if (behind !== undefined && behind.branch === base.branch)
                  return turned(base.swivel, behind.swivel) / h;
                edges.set(i, h);
                return 0;
              },
            );
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
      ): {
        problem: IAutoMovieMotionHumanWalkStanceCourse.IProblem;
        rows: IAutoMovieMotionHumanQuadraticProgram.IRow[];
      } => {
        if (!model) return { problem: problemOf(fitted(x)), rows: [] };
        const { swivels, edges } = pieces(x);
        return {
          problem: problemOf(swivels),
          rows: [...edges].map(
            ([i, h]: [
              number,
              number,
            ]): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
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

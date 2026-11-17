import {
  Quaternion,
  Vector3,
  getConstraint,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingFit,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanQuadraticProgram as QP } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedCouplingRigid } from "./HumanCarriedCouplingRigid";

/**
 * The key pose of a coupled carry placed on its bearer (#3437): the
 * bearer's stance and the borne legs changed least from the upright bearer
 * and the carry's own legs so every hold's wrist goal lies within its arm, the borne
 * resting region exactly on the bearer's, its turn about that point fitted
 * to the row's hold places. `HumanCarriedCoupling` builds the coupling on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, what is placed, how and for whom.
 * @evidence contracts/development/design.md#principled-representation The stance and the legs as five angles a least-change program fits, and a rigid placement as a turn and a point map, Wahba's problem's answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The placement record and its one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resting contact is never traded for the holds.
 */
export namespace HumanCarriedCouplingFit {
  /**
   * The key pose placed on its bearer. The bearer's stance (its trunk's
   * inclination and its knees' lowering, `HumanCarriedCouplingPose.stance`)
   * and the borne legs are the upright bearer and the carry's own legs
   * changed least, each angle weighed by its range, such that every held
   * region's palm-facing wrist goal lies within the arm that holds it, from
   * the shoulder joint to the wrist: upright and the carry's own where they reach. On that stance the
   * resting region lies exactly on the bearer's (raised by the row's
   * `rise`), and the turn about that point is the one that best brings each
   * held region to where the bearer's hand holds it by the row (its region
   * and offset in arm lengths).
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region each bearer hand holds, left then right.
   * @param bends Whether the bearer may leave upright: not when a second helper shares the body, whose contacts a bend of the first would carry away.
   * @returns The placement.
   * @throws {HumanRefusal} A `reach` refusal on `carry` when no stance and legs within their ranges bring every held region within its arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, what is held exactly, the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The stance and the legs: the least range-weighted change from upright and the carry's own subject to each held region's gap past its arm being none, by the l1 exact penalty's trust-region sequential convex optimisation with a steered penalty (Nocedal and Wright's Algorithm 4.1 schedule), each model the quadratic program of the change with the gaps linearised by central differences, one-sided at a range's end; it settles at the square root of machine epsilon of the arm. The turn about the resting point is Wahba's problem over the hold directions, solved by Horn's absolute orientation (`fitRigidMeshTransform`) on each direction and its mirror about the resting point, so both clouds' centroids are the resting points and only the turn is fitted. With fewer than two holds the key pose's own axes join the directions, so its heading is kept where no hold decides it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ranges, gaps, one minimisation, the placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The resting contact is kept exact and every angle stays within its range: the legs within the range table, the trunk within full forward bending, the lowering within a squat; a hold still beyond its arm is refused, never stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Where upright and the carry's own legs reach, one placement; otherwise at most eleven per linearization, with stance FK shared. Each actual registration/gap pair shares its one borne FK map. Steering reprices rows without another geometric pass, radius retries update intervals and discarded trial vectors stay lazy. Actual QP/acceptance remain current; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed range weights own one curvature per objective flag. At the same x/e/objective, gap slopes, P/q/A and row order are penalty-independent, so fresh penalty shells share their numeric preparation while resetting warm state; only radius retries share a shell's actual iterates. Stance, rigid turn, ranges and palm goals still use their original owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One fit owns its stance map, two small curvatures and the current linearization/preparation. Repriced shells share those fixed data without a history chain and release their warm state on replacement; the returned placement closes only over two points and a turn.
   */
  export function fit(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    held: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ],
    bends: boolean,
  ): IAutoMovieMotionHumanCarriedCouplingFit.IFit {
    // The five angles: the borne hip flexion, knee flexion and hip
    // abduction, the bearer's trunk inclination and lowering; each one's
    // bounds, and the span its change is weighed by.
    const legRanges: IAutoMovieAngleRange[] = (
      [
        ["leftUpperLeg", "flexion"],
        ["leftLowerLeg", "flexion"],
        ["leftUpperLeg", "abduction"],
      ] as const
    ).map(
      (
        [bone, axis]: readonly [AutoMovieHumanoidBone, "flexion" | "abduction"],
        k: number,
      ): IAutoMovieAngleRange =>
        getConstraint(
          bone,
          readHumanBone(borne, bone)?.constraint ?? null,
        )?.[axis] ?? { min: row.legs[k]!, max: row.legs[k]! },
    );
    const spans: number[] = [
      ...legRanges.map((r: IAutoMovieAngleRange): number => r.max - r.min),
      BENT,
      1,
    ];
    // The trust region bounds each angle's step by its share of the widest
    // span, so it is one region over angles of unlike ranges.
    const widest: number = Math.max(...spans);
    const ranges: IAutoMovieAngleRange[] = [
      ...legRanges,
      { min: 0, max: bends ? BENT : 0 },
      { min: 0, max: bends ? 1 : 0 },
    ];
    const start: number[] = [...row.legs, 0, 0];
    const weight: number[] = spans.map((s: number): number =>
      s > 0 ? 1 / s ** 2 : 0,
    );
    const n: number = start.length;
    const curvatures: readonly Float64Array[][] = [false, true].map(
      (objective: boolean): Float64Array[] => weight.map((w: number): Float64Array => {
        const diagonal: Float64Array = new Float64Array(n);
        diagonal[0] = objective ? w : 0;
        return diagonal;
      }),
    );
    const all: number[] = Array.from(
      { length: n },
      (_: unknown, k: number): number => k,
    );
    const sides: ("left" | "right")[] = (["left", "right"] as const).filter(
      (_: "left" | "right", k: number): boolean =>
        row.holds[k] !== null && held[k] !== null,
    );

    // The bearer's bones by stance, so a change of the legs alone reads
    // them once.
    const stances: Map<
      string,
      Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    > = new Map();
    const stood = (
      x: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const key: string = `${x[3]}|${x[4]}`;
      const found:
        | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
        | undefined = stances.get(key);
      if (found !== undefined) return found;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanCarriedCouplingPose.stood(bearer, {
          incline: x[3]!,
          depth: x[4]!,
        });
      stances.set(key, bones);
      return bones;
    };
    const legsOf = (
      x: readonly number[],
    ): readonly [number, number, number] => [x[0]!, x[1]!, x[2]!];
    const gaps = (x: readonly number[]): number[] => {
      const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        stood(x);
      const registration: HumanCarriedCouplingRigid.IRead = HumanCarriedCouplingRigid.read(
        bearer,
        theirs,
        borne,
        row,
        held,
        legsOf(x),
        {
          incline: x[3]!,
          depth: x[4]!,
        },
      );
      const placed: IAutoMovieMotionHumanCarriedCouplingFit.IFit = registration.fit;
      const mine: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = registration.bones;
      return sides.map((side: "left" | "right"): number => {
        const k: number = side === "left" ? 0 : 1;
        const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
          borne.surfaces.regions[held[k]!];
        const local: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
          resolveAutoMovieHumanoidSurfaces.place(
            surface,
            mine.get(surface.bone)!,
          );

        // A palm's farthest possible reach assumes it continues the forearm.
        // The bearing instead faces the carried surface: judge that very
        // wrist target, since the surface normal fixes the palm's offset.
        const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArmTarget.goal(
          bearer,
          side,
          AutoMovieMotionHumanTarget.hand(
            bearer,
            { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
            side,
            {
              point: placed.place(local.point),
              normal: Quaternion.rotateVector(placed.turn, local.normal),
            },
            { surface: "palm", shape: "relaxed", bend: "hang" },
          ),
        );
        return (
          Vector3.length(
            Vector3.subtract(
              goal.point,
              theirs.get(`${side}UpperArm`)!.worldPosition,
            ),
          ) -
          (bearer.measure.upperArm + bearer.measure.forearm)
        );
      });
    };
    const arm: number = bearer.measure.upperArm + bearer.measure.forearm;
    const accuracy: number = arm * Number.EPSILON ** 0.5;
    const evaluate = (x: Float64Array): IReading => {
      const g: number[] = gaps([...x]);
      return {
        objective: all.reduce(
          (s: number, k: number): number =>
            s + (weight[k]! * (x[k]! - start[k]!) ** 2) / 2,
          0,
        ),
        violation: g.reduce(
          (s: number, v: number): number => s + Math.max(0, v),
          0,
        ),
        worst: Math.max(0, ...g),
        gaps: g,
      };
    };
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<Float64Array, IReading> = SCO.minimise(
      {
        evaluate,
        feasible: (e: IReading): boolean => e.worst <= accuracy,
        convexify: (
          x: Float64Array,
          e: IReading,
          mu: number,
          _radius: number,
          objective: boolean,
        ): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
          // Central differences at the step that balances their truncation
          // against round-off, one-sided at a range's end; an angle pinned
          // by its range has no slope.
          const slope: number[][] = all.map((k: number): number[] => {
            const h: number = spans[k]! * Number.EPSILON ** (1 / 3);
            const up: number[] = [...x];
            const down: number[] = [...x];
            up[k] = Math.min(ranges[k]!.max, x[k]! + h);
            down[k] = Math.max(ranges[k]!.min, x[k]! - h);
            if (!(up[k]! > down[k]!)) return e.gaps.map((): number => 0);
            const a: number[] = gaps(up);
            const b: number[] = gaps(down);
            return a.map(
              (v: number, i: number): number =>
                (v - b[i]!) / (up[k]! - down[k]!),
            );
          });
          let prepared: ReturnType<typeof QP.prepare> | undefined;
          const q: Float64Array = Float64Array.from(all, (k: number): number =>
            objective ? weight[k]! * (x[k]! - start[k]!) : 0,
          );
          const priced: (price: number) => IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> = (price: number): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
            const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
              n,
              band: n - 1,
              p: curvatures[objective ? 1 : 0]!,
              q,
              rows: [
                ...e.gaps.map(
                  (g: number, i: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                    key: `g|${i}`,
                    index: all,
                    coef: all.map((k: number): number => slope[k]![i]!),
                    l: -Infinity,
                    u: -g,
                    weight: price,
                  }),
                ),
                ...all.map(
                  (k: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                    key: `r|${k}`,
                    index: [k],
                    coef: [1],
                    l: ranges[k]!.min - x[k]!,
                    u: ranges[k]!.max - x[k]!,
                  }),
                ),
              ],
            };
            const zero: number = QP.value(model);
            let warm: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
            return {
              reprice: priced,
              solve: (r: number): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
                const problem: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
                  ...model,
                  rows: [
                    ...model.rows,
                    ...all.map(
                      (k: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                        key: `t|${k}`,
                        index: [k],
                        coef: [1],
                        l: (-r * spans[k]!) / widest,
                        u: (r * spans[k]!) / widest,
                      }),
                    ),
                  ],
                };
                prepared ??= QP.prepare(problem);
                warm = prepared.solve(problem.rows, warm);
                const solved: Float64Array = warm.x;
                const longest: number = Math.max(
                  ...all.map((k: number): number =>
                    spans[k]! > 0
                      ? (Math.abs(solved[k]!) * widest) / spans[k]!
                      : 0,
                  ),
                );
                // The gaps the step leaves on the linearisation, which the
                // steered penalty reads.
                const left: number[] = e.gaps.map(
                  (g: number, i: number): number =>
                    Math.max(
                      0,
                      g +
                        all.reduce(
                          (s: number, k: number): number =>
                            s + slope[k]![i]! * solved[k]!,
                          0,
                        ),
                    ),
                );
                let trial: Float64Array | undefined;
                return {
                  violation: left.reduce(
                    (s: number, v: number): number => s + v,
                    0,
                  ),
                  met: Math.max(0, ...left) <= accuracy,
                  get trial(): Float64Array {
                    return (trial ??= Float64Array.from(x, (v: number, k: number): number => v + solved[k]!));
                  },
                  predicted: zero - QP.value(model, solved),
                  length: longest,
                  full: longest >= r * (1 - QP.TOLERANCE),
                };
              },
            };
          };
          return priced(mu);
        },
      },
      Float64Array.from(start),
      {
        schedule: {
          eta: ACCEPTED,
          low: POOR,
          high: GOOD,
          shrink: SHRINK,
          expand: EXPAND,
          boundary: true,
          widest,
          trust: widest,
          least: widest * Number.EPSILON ** 0.5,
          tries: Math.ceil(
            Math.log(Number.EPSILON ** -0.5) / Math.log(1 / SHRINK),
          ),
          improved: (merit: number): number =>
            Number.EPSILON ** 0.5 * Math.max(accuracy, merit),
        },
        penalties: [1],
        rounds: Math.ceil(Math.log2(Number.EPSILON ** -0.5)),
        steer: true,
      },
    );
    if (!(solved.evaluation.worst <= accuracy))
      throw new HumanRefusal({
        kind: "reach",
        axis: "carry",
        value: solved.evaluation.worst,
        reason: `a held region's wrist goal lies ${solved.evaluation.worst.toFixed(3)} m beyond the bearer's arm; the local fit stopped on ${solved.reason} at leg angles ${[
          ...solved.x,
        ]
          .slice(0, 3)
          .map((v: number): string => v.toFixed(2))
          .join(
            ", ",
          )} degrees and bearer inclination ${solved.x[3]!.toFixed(2)} degrees, squat depth ${solved.x[4]!.toFixed(4)}`,
        fix: "choose a carry whose holds lie within the bearer's arms, or a bearer of a longer reach",
      });
    const x: number[] = [...solved.x];
    return HumanCarriedCouplingRigid.fit(
      bearer,
      stood(x),
      borne,
      row,
      held,
      legsOf(x),
      {
        incline: x[3]!,
        depth: x[4]!,
      },
    );
  }

  /** The trunk's forward inclination at full forward bending, degrees: about 70 of hip flexion and 40 of lumbar flexion (Esola et al. 1996, Spine 21:71, the measure `HumanTrunk.RHYTHM` shares). */
  const BENT: number = 110;

  /** A step is taken where the merit falls by more than this share of the model's prediction: Nocedal and Wright's Algorithm 4.1 asks for one in [0, 1/4). */
  const ACCEPTED: number = 0.1;

  /** The ratio below which the region shrinks: Nocedal and Wright's Algorithm 4.1. */
  const POOR: number = 1 / 4;

  /** The ratio above which a step at the region's edge grows it: Nocedal and Wright's Algorithm 4.1. */
  const GOOD: number = 3 / 4;

  /** The region's factor where it shrinks: Nocedal and Wright's Algorithm 4.1. */
  const SHRINK: number = 1 / 4;

  /** The region's factor where it grows: Nocedal and Wright's Algorithm 4.1. */
  const EXPAND: number = 2;

  /** A stance and legs' reading: the change, the summed and the worst gap past the arms, and each gap, metres. */
  interface IReading extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    worst: number;
    gaps: number[];
  }
}

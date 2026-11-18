import {
  Quaternion,
  Vector3,
  getConstraint,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingFit,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { HumanQuadraticProgram as QP } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedCouplingRigid } from "./HumanCarriedCouplingRigid";
import { HumanCarriedStraddle } from "./HumanCarriedStraddle";

/** A borne region a hand holds, or no grip for that hand. */
type HeldRegion = AutoMovieHumanoidRegion | null;

/** The borne regions held by the bearer's left and right hands. */
type Grip = readonly [HeldRegion, HeldRegion];

/** The upper-leg coordinates used to vary the borne key pose. */
type LegAxis = "flexion" | "abduction";

/** A clinical coordinate whose limits bound the key-pose fit. */
type LegCoordinate = readonly [AutoMovieHumanoidBone, LegAxis];

/** A complete kinematic reading before carrying either body. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** The current gap for one bearing arm at a known surface. */
type Gap = (bones: Bones, place: IAutoMovieMotionHumanCarriedCouplingPose.IHold) => number;

/** Grip indices follow the carry row's left-to-right order. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * The key pose of a coupled carry placed on its bearer (#3437): the
 * bearer's stance and the borne legs changed least from the upright bearer
 * and the carry's own legs so every hold's wrist goal lies within its arm, the borne
 * resting region exactly on the bearer's, its turn about that point fitted
 * to the row's hold places. `HumanCarriedCoupling` builds the coupling on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, what is placed, how and for whom.
 * @evidence contracts/development/design.md#principled-representation The stance and the legs as five angles a least-change program fits, and a rigid placement as a turn and a point map, Wahba's problem's answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The placement record, its one builder and the reach gap it fits against.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resting contact is never traded for the holds.
 */
export namespace HumanCarriedCouplingFit {
  /**
   * The successful registration and the same two bone maps it used to judge reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which frames the bone maps hold and why the fit and maps belong together.
   * @evidence contracts/development/design.md#principled-representation A rigid placement plus the untranslated bones it maps between. The placement carries the borne key pose onto the bearer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The coupling consumes both existing maps for anchor, contact and mass placement; `fit` exposes only the placement to callers that need no maps.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No re-fit or near-match can stand in for the final winning registration.
   */
  export interface IRead {
    /** The placement from the borne key pose to the bearer's stance. */
    fit: IAutoMovieMotionHumanCarriedCouplingFit.IFit;

    /** The borne bones at the origin in the key pose, before placement. */
    mine: Bones;

    /** The bearer bones at the origin in the fitted stance. */
    theirs: Bones;
  }

  /**
   * Place the borne body's key pose on the bearer while keeping the grips reachable.
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's key and hold geometry.
   * @param held The borne region each bearer hand holds, left then right.
   * @param bends Whether the bearer may leave upright to reach the grips.
   * @param grips An optional pair of actual grips, left then right, when the row's nominal regions cannot be reached.
   * @returns The placement within the bearer's origin frame.
   * @throws {HumanRefusal} When no stance within the ranges reaches the grips.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reach premise, optional nearer grips and placement frame.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same fixed-contact registration and reach test as `read`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the solver, then reads its placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Delegates the complete check to `read` with every supplied input.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The shared solver owns the work; the caller keeps only the placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses `read` for both the reachable key and the fallback.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No bone map leaves this wrapper.
   */
  export function fit(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    held: Grip,
    bends: boolean,
    grips: Grip = held,
  ): IAutoMovieMotionHumanCarriedCouplingFit.IFit {
    return read(bearer, borne, row, held, bends, grips).fit;
  }

  /**
   * Register the carried region on the bearer at the authored key. If any
   * wrist cannot reach its grip, find the least change to the bearer's stance
   * and borne legs that preserves the resting contact and reaches every grip.
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region each bearer hand holds, left then right.
   * @param bends Whether the bearer may leave upright: not when a second helper shares the body, whose contacts a bend of the first would carry away.
   * @param grips The borne region each hand grips where the bearer takes a nearer grip than the row describes (`HumanCarriedCoupling.NEARER`), left then right: the arms must reach these, while the turn stays fitted to the described holds, so a grip never turns the borne body; the described holds when absent.
   * @returns The placement with the bones used to judge its reach.
   * @throws {HumanRefusal} A `reach` refusal on `carry` when no stance and legs within their ranges bring every held region within its arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, what is held exactly, the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The stance and the legs: the least range-weighted change from upright and the carry's own subject to each held region's gap past its arm being none, by the l1 exact penalty's trust-region sequential convex optimisation with a steered penalty (Nocedal and Wright's Algorithm 4.1 schedule), each model the quadratic program of the change with the gaps linearised by central differences, one-sided at a range's end; it settles at the square root of machine epsilon of the arm. The turn about the resting point is Wahba's problem over the hold directions, solved by Horn's absolute orientation (`fitRigidMeshTransform`) on each direction and its mirror about the resting point, so both clouds' centroids are the resting points and only the turn is fitted. With fewer than two holds the key pose's own axes join the directions, so its heading is kept where no hold decides it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the authored key first; prepare the trust-region search only if the key violates a reach or angle constraint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The resting contact is kept exact and every angle stays within its range: the legs within the range table, the trunk within full forward bending, the lowering within a squat; a hold still beyond its arm is refused, never stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms A reachable key takes one registration and one reach check per grip. Fallback linearises at most five angles using two points each, and reuses the current stance for leg derivatives and the current gaps at each one-sided endpoint. Penalty changes reprice the model without new geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fallback starts with the measured key and returns its winning reading. The curvature is built once per objective flag and costs from one linearisation share slopes and solver preparation across penalties.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fit holds two curvatures and the current linearisation until it returns or throws. Only the winning placement and two maps leave the fit.
   */
  export function read(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    held: Grip,
    bends: boolean,
    grips: Grip = held,
  ): IRead {
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
        [bone, axis]: LegCoordinate,
        k: number,
      ): IAutoMovieAngleRange =>
        getConstraint(
          bone,
          readHumanBone(borne, bone)?.constraint ?? null,
        )?.[axis] ?? { min: row.legs[k]!, max: row.legs[k]! },
    );
    const start: number[] = [...row.legs, 0, 0];
    const sides: AutoMovieHumanSide[] = SIDES.filter(
      (_: AutoMovieHumanSide, k: number): boolean =>
        row.holds[k] !== null && grips[k] !== null,
    );
    const reach: Gap[] = sides.map((side: AutoMovieHumanSide): Gap => prepareGap(bearer, side, row.holds[side === "left" ? 0 : 1]?.shape));

    // A perturbation of the borne legs leaves the bearer's current stance exact.
    function at(x: readonly number[], sameStance?: Bones): IRead {
      const theirs: Bones = sameStance ?? HumanCarriedCouplingPose.stood(bearer, {
        incline: x[3]!,
        depth: x[4]!,
      });
      const registration: HumanCarriedCouplingRigid.IRead = HumanCarriedCouplingRigid.read(
        bearer,
        theirs,
        borne,
        row,
        held,
        [x[0]!, x[1]!, x[2]!],
        {
          incline: x[3]!,
          depth: x[4]!,
        },
      );
      return { fit: registration.fit, mine: registration.bones, theirs };
    }
    const gaps: (reading: IRead) => number[] = (reading: IRead): number[] => {
      const { fit, mine, theirs }: IRead = reading;
      const gaps: number[] = sides.map((side: AutoMovieHumanSide, index: number): number => {
        const k: number = side === "left" ? 0 : 1;
        const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
          borne.surfaces.regions[grips[k]!];
        const local: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
          resolveAutoMovieHumanoidSurfaces.place(
            surface,
            mine.get(surface.bone)!,
          );
        const fingers: IAutoMovieVector3 | undefined = row.holds[k]?.fingers;
        return reach[index]!(theirs, {
          point: fit.place(local.point),
          normal: Quaternion.rotateVector(fit.turn, local.normal),
          ...(fingers === undefined ? {} : { forward: Quaternion.rotateVector(fit.turn,
            Quaternion.rotateVector(mine.get("hips")!.worldRotation, fingers)) }),
        });
      });
      return row.straddles === true ? [...gaps, ...HumanCarriedStraddle(bearer, borne, reading)] : gaps;
    };
    const keyed: IRead = at(start);
    const keyGaps: number[] = gaps(keyed);
    if (keyGaps.every((g: number): boolean => g <= 0) && legRanges.every(
      (range: IAutoMovieAngleRange, k: number): boolean =>
        start[k]! >= range.min && start[k]! <= range.max,
    )) return keyed;

    // Only an inadmissible key needs to vary the legs or the bearer's stance.
    const spans: number[] = [
      ...legRanges.map((r: IAutoMovieAngleRange): number => r.max - r.min),
      BENT,
      1,
    ];
    // Share the widest range's trust region among all five coordinates.
    const widest: number = Math.max(...spans);
    const ranges: IAutoMovieAngleRange[] = [
      ...legRanges,
      { min: 0, max: bends ? BENT : 0 },
      { min: 0, max: bends ? 1 : 0 },
    ];
    const weight: number[] = spans.map((s: number): number => s > 0 ? 1 / s ** 2 : 0);
    const n: number = start.length;
    const curvatures: readonly Float64Array[][] = [false, true].map(
      (objective: boolean): Float64Array[] => weight.map((w: number): Float64Array => {
        const diagonal: Float64Array = new Float64Array(n);
        diagonal[0] = objective ? w : 0;
        return diagonal;
      }),
    );
    const all: number[] = Array.from({ length: n }, (_: unknown, k: number): number => k);
    const arm: number = bearer.measure.upperArm + bearer.measure.forearm;
    const accuracy: number = arm * Number.EPSILON ** 0.5;
    const origin: Float64Array = Float64Array.from(start);
    const evaluate = (x: Float64Array): IReading => {
      const read: IRead = x === origin ? keyed : at([...x]);
      const g: number[] = x === origin ? keyGaps : gaps(read);
      return {
        read,
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
            const sameStance: Bones | undefined = k < legRanges.length ? e.read.theirs : undefined;
            const a: number[] = up[k] === x[k] ? e.gaps : gaps(at(up, sameStance));
            const b: number[] = down[k] === x[k] ? e.gaps : gaps(at(down, sameStance));
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
      origin,
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
    const met: IReading = solved.evaluation;
    const clear: boolean = met.worst <= accuracy || (row.straddles === true &&
      sides.every((_, index: number): boolean => met.gaps[index]! <= accuracy) &&
      HumanCarriedStraddle.clear(bearer, met.read));
    if (!clear)
      throw new HumanRefusal({
        kind: "reach",
        axis: "carry",
        value: solved.evaluation.worst,
        reason: `the carry's reach or straddling clearance misses by ${solved.evaluation.worst.toFixed(3)} m; the local fit stopped on ${solved.reason} at leg angles ${[
          ...solved.x,
        ]
          .slice(0, 3)
          .map((v: number): string => v.toFixed(2))
          .join(
            ", ",
          )} degrees and bearer inclination ${solved.x[3]!.toFixed(2)} degrees, squat depth ${solved.x[4]!.toFixed(4)}`,
        fix: "choose a carry whose holds lie within the bearer's arms, or a bearer of a longer reach",
      });
    return solved.evaluation.read;
  }

  /**
   * Distance in metres beyond the bearing arm's real wrist reach, or at most zero within reach.
   * @evidence contracts/development/common.md#meaningful-documentation States the distance and its sign.
   * @evidence contracts/development/implementation.md#principled-implementation A bearing palm faces the held surface, so its hand offset fixes the wrist goal tested against the arm span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared wrist reader and one distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the held surface's real current normal and the same palm offset as playback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads only the modeled shoulder and wrist, with no elbow solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The stance and further helper use the same prepared wrist gap.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after the observation.
   */
  export function gap(
    bearer: IAutoMovieMotionHumanBody,
    bones: Bones,
    side: AutoMovieHumanSide,
    place: IAutoMovieMotionHumanCarriedCouplingPose.IHold,
    shape?: IAutoMovieMotionHumanCarried.IHold["shape"],
  ): number {
    return prepareGap(bearer, side, shape)(bones, place);
  }

  /** The changing palm normal places its wrist while the fixed hand geometry is shared. */
  function prepareGap(bearer: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide, shape?: IAutoMovieMotionHumanCarried.IHold["shape"]): Gap {
    const palm: ReturnType<typeof HumanHandTarget.prepareMoving>["wrist"] =
      HumanHandTarget.prepareMoving(bearer, side, shape === undefined ? undefined : { shape }).wrist;
    const arm: number = bearer.measure.upperArm + bearer.measure.forearm;
    return (bones, place): number => Vector3.length(Vector3.subtract(
      palm({ root: { x: 0, y: 0, z: 0 }, yaw: 0 }, place, place.forward).point,
      bones.get(`${side}UpperArm`)!.worldPosition,
    )) - arm;
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
    read: IRead;
    worst: number;
    gaps: number[];
  }
}

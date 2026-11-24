import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingFit,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanQuadraticProgram as QP } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedCouplingRigid } from "./HumanCarriedCouplingRigid";
import { HumanCarriedGripGaps } from "./HumanCarriedGripGaps";
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

/** Grip indices follow the carry row's left-to-right order. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * The key pose of a coupled carry placed on its bearer: the bearer's stance and
 * the borne legs changed least from the upright bearer and the carry's own legs
 * so every hold's wrist goal lies within its arm, the borne resting region
 * exactly on the bearer's, its turn about that point fitted to the row's hold
 * places. `HumanCarriedCoupling` builds the coupling on it.
 */
export namespace HumanCarriedCouplingFit {
  /**
   * The successful registration and the same two bone maps it used to judge
   * reach.
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
   * Place the borne body's key pose on the bearer while keeping the grips
   * reachable.
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's key and hold geometry.
   * @param held The borne region each bearer hand holds, left then right.
   * @param planted The additional height fixed by a second bearer standing on
   *   the common floor.
   * @param bends Whether the bearer may leave upright to reach the grips.
   * @param grips An optional pair of actual grips, left then right, when the
   *   row's nominal regions cannot be reached.
   * @returns The placement within the bearer's origin frame.
   * @throws {HumanRefusal} When no stance within the ranges reaches the grips.
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
   * Register the carried region on the bearer at the authored key. If any wrist
   * cannot reach its grip, find the least change to the bearer's stance and
   * borne legs that preserves the resting contact and reaches every grip:
   * trajopt's sequential convex loop (`HumanSequentialConvex`, the port of
   * `sco::BasicTrustRegionSQP::optimize`) at sco's defaults, the grips' gaps
   * its constraints, in metres as sco's are, met to its `cnt_tolerance_` (1e-4
   * m), the tolerance the admission below reads too, each convex model solved
   * by the operator splitting (`HumanQuadraticProgram.prepare`); a model the
   * splitting leaves unsolved ends the fit failed, as sco's ends where its
   * convex solver fails.
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region each bearer hand holds, left then right.
   * @param planted The additional height fixed by a second bearer standing on
   *   the common floor.
   * @param bends Whether the bearer may leave upright: not when a second helper
   *   shares the body, whose contacts a bend of the first would carry away.
   * @param grips The borne region each hand grips where the bearer takes a
   *   nearer grip than the row describes (`HumanCarriedCoupling.NEARER`), left
   *   then right: the arms must reach these, while the turn stays fitted to the
   *   described holds, so a grip never turns the borne body; the described
   *   holds when absent.
   * @returns The placement with the bones used to judge its reach.
   * @throws {HumanRefusal} A `reach` refusal on `carry` when no stance and legs
   *   within their ranges bring every held region within its arm.
   */
  export function read(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    held: Grip,
    bends: boolean,
    grips: Grip = held,
    planted?: HumanCarriedGripGaps.IPlantedContact,
  ): IRead {
    // The borne hip flexion, knee flexion and hip
    // abduction, the bearer's trunk inclination and lowering; each one's
    // bounds, and the swivel about the fixed resting contact normal.
    const legRanges: IAutoMovieAngleRange[] = (
      [
        ["leftUpperLeg", "flexion"],
        ["leftLowerLeg", "flexion"],
        ["leftUpperLeg", "abduction"],
      ] as const
    ).map(
      ([bone, axis]: LegCoordinate, k: number): IAutoMovieAngleRange =>
        getConstraint(bone, readHumanBone(borne, bone)?.constraint ?? null)?.[
          axis
        ] ?? { min: row.legs[k]!, max: row.legs[k]! },
    );
    const start: number[] = [...row.legs, 0, 0, 0];
    const sides: AutoMovieHumanSide[] = SIDES.filter(
      (_: AutoMovieHumanSide, k: number): boolean =>
        row.holds[k] !== null && grips[k] !== null,
    );
    // A perturbation of the borne legs leaves the bearer's current stance exact.
    function at(
      x: readonly number[],
      sameStance?: Bones,
      keyBones?: ReturnType<typeof HumanTrunk.prepareResolve>,
    ): IRead {
      const theirs: Bones =
        sameStance ??
        HumanCarriedCouplingPose.stood(bearer, {
          incline: x[3]!,
          depth: x[4]!,
        });
      const registration: HumanCarriedCouplingRigid.IRead =
        HumanCarriedCouplingRigid.read(
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
          x[5]!,
          keyBones,
        );
      return { fit: registration.fit, mine: registration.bones, theirs };
    }
    const gaps: ReturnType<typeof HumanCarriedGripGaps.prepare> =
      HumanCarriedGripGaps.prepare(bearer, borne, row, grips, sides, planted);
    const keyed: IRead = at(start);
    const keyGaps: number[] = gaps(keyed);
    if (
      keyGaps.every((g: number): boolean => g <= 0) &&
      legRanges.every(
        (range: IAutoMovieAngleRange, k: number): boolean =>
          start[k]! >= range.min && start[k]! <= range.max,
      )
    )
      return keyed;

    const observed: Set<AutoMovieHumanoidBone> = new Set([
      borne.surfaces.regions[row.mine].bone,
    ]);
    for (const region of [...held, ...grips])
      if (region !== null) observed.add(borne.surfaces.regions[region].bone);
    if (planted !== undefined)
      observed.add(borne.surfaces.regions[planted.region].bone);
    if (row.straddles === true) {
      observed.add("leftLowerLeg");
      observed.add("rightLowerLeg");
    }
    const keyBones: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(borne, observed);
    // Only an inadmissible key needs to vary the legs or the bearer's stance.
    const spans: number[] = [
      ...legRanges.map((r: IAutoMovieAngleRange): number => r.max - r.min),
      BENT,
      1,
      360,
    ];
    // A full turn spans every distinct orientation about the fixed support normal.
    const widest: number = Math.max(...spans);
    const ranges: IAutoMovieAngleRange[] = [
      ...legRanges,
      { min: 0, max: bends ? BENT : 0 },
      { min: 0, max: bends ? 1 : 0 },
      { min: -180, max: 180 },
    ];
    const weight: number[] = spans.map((s: number): number =>
      s > 0 ? 1 / s ** 2 : 0,
    );
    const n: number = start.length;
    // The change's curvature, diagonal, the same at every iterate.
    const curvature: Float64Array[] = weight.map((w: number): Float64Array => {
      const diagonal: Float64Array = new Float64Array(n);
      diagonal[0] = w;
      return diagonal;
    });
    const all: number[] = Array.from(
      { length: n },
      (_: unknown, k: number): number => k,
    );
    const origin: Float64Array = Float64Array.from(start);
    const evaluate: (x: Float64Array) => IReading = (
      x: Float64Array,
    ): IReading => {
      const read: IRead =
        x === origin ? keyed : at([...x], undefined, keyBones);
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
        greatest: Math.max(0, ...g),
        gaps: g,
      };
    };
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      Float64Array,
      IReading
    > = SCO.minimise(
      {
        // getClosestFeasiblePoint: each coordinate clamped into its range.
        closest: (x: Float64Array): Float64Array =>
          Float64Array.from(x, (v: number, k: number): number =>
            Math.min(ranges[k]!.max, Math.max(ranges[k]!.min, v)),
          ),
        evaluate,
        convexify: (
          x: Float64Array,
          e: IReading,
          coefficient: number,
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
            const sameStance: Bones | undefined =
              k < legRanges.length || k === 5 ? e.read.theirs : undefined;
            const a: number[] =
              up[k] === x[k] ? e.gaps : gaps(at(up, sameStance, keyBones));
            const b: number[] =
              down[k] === x[k] ? e.gaps : gaps(at(down, sameStance, keyBones));
            return a.map(
              (v: number, i: number): number =>
                (v - b[i]!) / (up[k]! - down[k]!),
            );
          });
          const q: Float64Array = Float64Array.from(
            all,
            (k: number): number => weight[k]! * (x[k]! - start[k]!),
          );

          // The model's rows: the gaps priced at the coefficient, the ranges
          // hard; then the box's rows, whose ends each solve sets
          // (`setTrustBoxConstraints`), the box scaled to each coordinate's
          // span as the problem's variables are.
          const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
            n,
            band: n - 1,
            p: curvature,
            q,
            rows: [
              ...e.gaps.map(
                (
                  g: number,
                  i: number,
                ): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                  key: `g|${i}`,
                  index: all,
                  coef: all.map((k: number): number => slope[k]![i]!),
                  l: -Infinity,
                  u: -g,
                  weight: coefficient,
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
          const trust: IAutoMovieMotionHumanQuadraticProgram.IRow[] = all.map(
            (k: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
              key: `t|${k}`,
              index: [k],
              coef: [1],
              l: 0,
              u: 0,
            }),
          );
          const trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
            ...model,
            rows: [...model.rows, ...trust],
          };
          const prepared: ReturnType<typeof QP.prepare> = QP.prepare(trusted);
          const warm: IWarm = {};
          return {
            solve: (
              box: number,
            ): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
              all.forEach((k: number): void => {
                trust[k]!.l = (-box * spans[k]!) / widest;
                trust[k]!.u = (box * spans[k]!) / widest;
              });
              const state: IAutoMovieMotionHumanQuadraticProgram.IState =
                prepared.solve(trusted.rows, warm.state);
              // Only a converged state warms the next solve: an unfinished one
              // may hold a diverged iterate.
              if (state.status !== "solved" && state.status !== "polished") {
                warm.state = undefined;
                return { trial: x, merit: Infinity, failed: true };
              }
              warm.state = state;

              // The model merit at the solution: the change's quadratic about
              // the iterate and the priced linearised gaps, plus the change's
              // value at the iterate, the constant the model omits.
              return {
                trial: Float64Array.from(
                  x,
                  (v: number, k: number): number => v + state.x[k]!,
                ),
                merit: e.objective + QP.value(model, state.x),
                failed: false,
              };
            },
          };
        },
      },
      origin,
      SCO.DEFAULTS,
    );
    const met: IReading = solved.evaluation;
    const clear: boolean =
      met.greatest < SCO.DEFAULTS.cntTolerance ||
      (planted === undefined &&
        row.straddles === true &&
        sides.every(
          (_, index: number): boolean =>
            met.gaps[index]! < SCO.DEFAULTS.cntTolerance,
        ) &&
        HumanCarriedStraddle.clear(bearer, met.read));
    if (!clear)
      throw new HumanRefusal({
        kind: "reach",
        axis: "carry",
        value: solved.evaluation.greatest,
        reason: `the ${row.mine}-to-${row.theirs} carry's ${sides[met.gaps.indexOf(met.greatest)] ?? "knee envelope"} clearance misses by ${(met.greatest * 1000).toFixed(2)} mm; the contact-preserving fit ended ${solved.status}`,
        fix: "choose a carry whose holds lie within the bearer's arms, or a bearer of a longer reach",
      });
    // Downstream mass and contact consumers receive the full winning key.
    if (met.read === keyed) return keyed;
    return {
      ...met.read,
      mine: HumanTrunk.resolve(
        borne,
        HumanCarriedCouplingPose.key(row, met.read.fit.legs),
      ),
    };
  }

  /** The signed reachable distance of one bearing wrist, in metres. */
  export const gap: typeof HumanCarriedGripGaps.gap = HumanCarriedGripGaps.gap;

  /**
   * The trunk's forward inclination at full forward bending, degrees: about 70
   * of hip flexion and 40 of lumbar flexion (Esola et al. 1996, Spine 21:71,
   * the measure `HumanTrunk.RHYTHM` shares).
   */
  const BENT: number = 110;

  /**
   * A stance and legs' reading: the change, the summed and the greatest gap
   * past the arms, and each gap, metres.
   */
  interface IReading extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    /** The registration read at the iterate. */
    read: IRead;

    /** Each grip's gap past its arm, metres. */
    gaps: number[];
  }

  /** The last solve of a model's rows, from which its next solve starts. */
  interface IWarm {
    /** The last state; absent before the first solve. */
    state?: IAutoMovieMotionHumanQuadraticProgram.IState;
  }
}

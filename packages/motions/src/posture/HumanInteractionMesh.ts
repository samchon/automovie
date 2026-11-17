import type {
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3, tetrahedralizeAutoMovieDelaunay } from "@automovie/engine";

import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import { HumanInteractionMeshLaplacian as Laplacian } from "./HumanInteractionMeshLaplacian";
import { HumanInteractionMeshSide as Side } from "./HumanInteractionMeshSide";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "./HumanSequentialConvex";

/**
 * Adapt the spatial relations of a multi-body key pose to bodies of other
 * proportions by an interaction mesh (Ho, Komura and Tai 2010, "Spatial
 * relationship preserving character motion adaptation", ACM TOG 29(4),
 * article 33): a volumetric mesh over every joint and contact point of all
 * bodies at the key pose records how they lie among each other, and the
 * adapted pose is the one that deforms that mesh least, by its Laplacian
 * coordinates, while each body keeps its own bone lengths and every contact
 * its pairing, two points coinciding or held at a fixed offset.
 *
 * - **Mesh.** The Delaunay tetrahedralization of the points
 *   (`tetrahedralizeAutoMovieDelaunay`, Bowyer-Watson on Qhull's joggled
 *   input). Its edges are the points' neighbourhoods.
 * - **Laplacian coordinates.** Each point's offset from the inverse-distance
 *   weighted mean of its neighbours, excluding bone edges so deformation
 *   does not oppose the bone lengths being changed (Ho et al. 2010,
 *   equation 3 and section 5.1; `HumanInteractionMeshLaplacian`).
 * - **Solve.** `min sum_i |L(p)_i - d_i|^2 / 2` subject to each bone's
 *   length and each contact's pairing, by the l1 exact penalty's sequential
 *   convex optimisation with a trust region and a steered penalty
 *   (`HumanSequentialConvex`; Nocedal and Wright 2006, "Numerical
 *   Optimization", 2nd ed., sections 17.2 and 18.5; Byrd, Nocedal and Waltz
 *   2008): each convex model linearizes a bone `|p_i - p_j| = l` along its
 *   current direction and holds the Laplacian's quadratic exactly, solved by
 *   `HumanQuadraticProgram` within the region; a step is taken only where
 *   the merit falls, so a large change of proportions is approached in
 *   steps the linearization holds over.
 *
 * - **Sides.** Each tetrahedron not flat on the key pose keeps its
 *   orientation (`HumanInteractionMeshSide`), an inequality on its signed
 *   volume linearised as a hard row in each model: a point that crossed the face across from it would have passed
 *   through the bodies the mesh spans, the interpenetration the paper's
 *   mesh is built to reduce. The strictly positive determinant is the
 *   nonlinear solve's domain: a trial outside it has infinite merit and is
 *   rejected by the trust region, as an inversion barrier excludes flips
 *   (Schueller et al. 2013, "Locally Injective Mappings", section 3).
 *
 * Ho et al.'s full text (author upload: https://www.researchgate.net/publication/220183715_Spatial_Relationship_Preserving_Character_Motion_Adaptation)
 * uses collision constraints on bounding volumes during iterative
 * morphing. This key-pose adaptation instead keeps every recorded
 * tetrahedron's orientation as a hard domain, with the physical contact
 * accuracy of the whole-body fit (`HumanBodyFitMerit.TOLERANCE`), stricter
 * than #3438's 10 mm bone and contact acceptance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method with its sources, each stage, the solve and its globalisation, and what is not taken from the paper.
 * @evidence contracts/development/design.md#principled-representation Points by index, bones and contacts as index pairs and the mesh as its tetrahedra, the data of an interaction mesh; nothing names a body, so any skeleton serves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The input, the result and the adaptation; the mesh is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constraints are met by the merit's own steps, never projected after the solve.
 */
export namespace HumanInteractionMesh {
  /**
   * Adapt a key pose.
   *
   * @param props The key pose's points, the target bones and contacts, and the start.
   * @returns The adapted points and the mesh.
   * @throws {Error} When fewer than four points are given, an index is out of range, a bone's length is not positive, or the solve cannot meet the bones and contacts while preserving the recorded sides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the errors.
   * @evidence contracts/development/implementation.md#principled-implementation The interaction mesh's least inverse-distance Laplacian deformation with bone edges omitted (Ho et al. 2010, equation 3 and section 5.1), under the bones and contacts by the l1 exact penalty's trust-region sequential convex optimisation with a steered penalty, inside the positive-determinant domain of every recorded side (Schueller et al. 2013, section 3); inverted trials have infinite merit, so the region shrinks before another trial, starting from the reference if the optional guess inverts a side. Bones and contact coordinates must meet the whole-body fit's 0.5 mm tolerance and every side remain strictly positive, or the adaptation throws; a feasible reference has zero deformation energy and is returned exactly, preserving identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, mesh, coordinates, then one minimisation over a reading and a convex model.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed input throws; no point is clamped after the solve.
   * @evidence contracts/development/implementation.md#efficient-algorithms The insertion is quadratic in the points at worst; each model is one quadratic program over three coordinates per point; run once per key pose, never per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The loop is `HumanSequentialConvex`, the models `HumanQuadraticProgram`, the mesh the engine's; the mesh is returned so a caller adapting one key pose to many pairs passes it back (`mesh`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the arrays it returns are the caller's.
   */
  export function adapt(
    props: IAutoMovieMotionHumanInteractionMesh.IProps,
  ): IAutoMovieMotionHumanInteractionMesh.IResult {
    const n: number = props.reference.length;
    if (n < 4)
      throw new Error("An interaction mesh needs at least four points");
    const inside = (index: number): boolean =>
      Number.isInteger(index) && index >= 0 && index < n;
    for (const bone of props.bones)
      if (!(bone.length > 0) || !inside(bone.from) || !inside(bone.to))
        throw new Error(
          `A bone ${bone.from}-${bone.to} needs two points and a positive length`,
        );
    for (const contact of props.contacts)
      if (!inside(contact.a) || !inside(contact.b))
        throw new Error(`A contact ${contact.a}-${contact.b} needs two points`);
    const mesh: IAutoMovieTetrahedralizeDelaunay.IMesh =
      props.mesh ?? tetrahedralizeAutoMovieDelaunay(props.reference);
    const neighbours: number[][] = tetrahedralizeAutoMovieDelaunay.neighbours(
      mesh,
      n,
    );
    const extent: number = Math.max(
      ...props.reference.map((p: IAutoMovieVector3): number =>
        Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)),
      ),
      Number.MIN_VALUE,
    );
    const accuracy: number = HumanBodyFitMerit.TOLERANCE;

    // The Laplacian rows, each a point's own coefficient and its
    // neighbours' (one per axis), and their coordinates at the reference.
    const rows: Laplacian.Row[] = Laplacian.rows(
      props.reference,
      neighbours,
      props.bones,
    );
    const coordinate = (x: Float64Array, i: number, k: number): number =>
      rows[i]!.reduce(
        (s: number, e: { point: number; value: number }): number =>
          s + e.value * x[3 * e.point + k]!,
        0,
      );
    const reference: Float64Array = flat(props.reference);
    const delta: number[] = Array.from(
      { length: 3 * n },
      (_: unknown, c: number): number =>
        coordinate(reference, Math.floor(c / 3), c % 3),
    );

    // The curvature L^T L, the same on each axis, in the band its
    // couplings span.
    const couplings: Map<string, number> = new Map();
    for (const row of rows)
      for (const a of row)
        for (const b of row)
          if (a.point <= b.point) {
            const key: string = `${a.point}|${b.point}`;
            couplings.set(key, (couplings.get(key) ?? 0) + a.value * b.value);
          }
    const spans: number[] = [
      ...[...couplings.keys()].map((key: string): number => {
        const [a, b] = key.split("|").map(Number) as [number, number];
        return 3 * (b - a);
      }),
      ...props.bones.map(
        (bone: IAutoMovieMotionHumanInteractionMesh.IBone): number =>
          3 * Math.abs(bone.from - bone.to) + 2,
      ),
      ...props.contacts.map(
        (c: IAutoMovieMotionHumanInteractionMesh.IContact): number =>
          3 * Math.abs(c.a - c.b),
      ),
      // A side's row couples every axis of its four corners.
      ...mesh.tetrahedra.map(
        (t: readonly [number, number, number, number]): number =>
          3 * (Math.max(...t) - Math.min(...t)) + 2,
      ),
    ];
    const band: number = Math.max(0, ...spans);

    // The sides the mesh records (`HumanInteractionMeshSide`).
    const sided: Side.ISide[] = Side.record(mesh, props.reference, extent);

    const evaluate = (x: Float64Array): IEvaluation => {
      let objective: number = 0;
      for (let c: number = 0; c < 3 * n; c++)
        objective +=
          (coordinate(x, Math.floor(c / 3), c % 3) - delta[c]!) ** 2 / 2;
      let violation: number = 0;
      let worst: number = 0;
      const miss = (v: number): void => {
        violation += Math.abs(v);
        worst = Math.max(worst, Math.abs(v));
      };
      for (const bone of props.bones)
        miss(length(x, bone.from, bone.to) - bone.length);
      for (const c of props.contacts) {
        const off: number[] = offset(c);
        for (let k: number = 0; k < 3; k++)
          miss(x[3 * c.a + k]! - x[3 * c.b + k]! - off[k]!);
      }
      let flipped: number = 0;
      for (const t of sided) {
        const h: number = Side.value(x, t, extent);
        if (!(h > 0)) ++flipped;
      }
      return {
        objective: flipped === 0 ? objective : Infinity,
        violation,
        worst,
        flipped,
      };
    };
    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<
      Float64Array,
      IEvaluation
    > = {
      evaluate,
      feasible: (e: IEvaluation): boolean =>
        e.worst <= accuracy && e.flipped === 0,
      convexify: (
        x: Float64Array,
        _e: IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
        const p: Float64Array[] = Array.from(
          { length: 3 * n },
          (): Float64Array => new Float64Array(band + 1),
        );
        const q: Float64Array = new Float64Array(3 * n);
        if (objective) {
          for (const [key, value] of couplings) {
            const [a, b] = key.split("|").map(Number) as [number, number];
            // Each pair once, the band's upper half: `x^T P x / 2` reads a
            // diagonal entry halved and an off-diagonal one whole.
            for (let k: number = 0; k < 3; k++)
              p[3 * a + k]![3 * (b - a)]! += value;
          }
          for (let i: number = 0; i < n; i++)
            for (let k: number = 0; k < 3; k++) {
              const r: number = coordinate(x, i, k) - delta[3 * i + k]!;
              for (const e of rows[i]!) q[3 * e.point + k]! += e.value * r;
            }
        }
        const held: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [
          ...props.bones.map(
            (
              bone: IAutoMovieMotionHumanInteractionMesh.IBone,
              b: number,
            ): IAutoMovieMotionHumanQuadraticProgram.IRow => {
              const d: number[] = [0, 1, 2].map(
                (k: number): number =>
                  x[3 * bone.from + k]! - x[3 * bone.to + k]!,
              );
              const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
              const u: number[] =
                l > 0 ? d.map((v: number): number => v / l) : [0, 1, 0];
              const [lo, hi]: [number, number] =
                bone.from < bone.to
                  ? [bone.from, bone.to]
                  : [bone.to, bone.from];
              const sign: number = lo === bone.from ? 1 : -1;
              return {
                key: `b|${b}`,
                index: [0, 1, 2, 0, 1, 2].map(
                  (k: number, a: number): number => 3 * (a < 3 ? lo : hi) + k,
                ),
                coef: [0, 1, 2, 0, 1, 2].map(
                  (k: number, a: number): number =>
                    (a < 3 ? sign : -sign) * u[k]!,
                ),
                l: bone.length - l,
                u: bone.length - l,
                weight: mu,
              };
            },
          ),
          ...props.contacts.flatMap(
            (
              c: IAutoMovieMotionHumanInteractionMesh.IContact,
              h: number,
            ): IAutoMovieMotionHumanQuadraticProgram.IRow[] => {
              const off: number[] = offset(c);
              return [0, 1, 2].map(
                (k: number): IAutoMovieMotionHumanQuadraticProgram.IRow => {
                  const r: number =
                    off[k]! - (x[3 * c.a + k]! - x[3 * c.b + k]!);
                  return {
                    key: `c|${h}|${k}`,
                    index: [3 * c.a + k, 3 * c.b + k],
                    coef: [1, -1],
                    l: r,
                    u: r,
                    weight: mu,
                  };
                },
              );
            },
          ),
          // Each side kept, its signed volume linearised.
          ...sided.map(
            (
              t: Side.ISide,
              s: number,
            ): IAutoMovieMotionHumanQuadraticProgram.IRow =>
              Side.row(x, t, extent, `o|${s}`),
          ),
        ];
        const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
          n: 3 * n,
          band,
          p,
          q,
          rows: held,
        };
        const zero: number = QP.value(model, new Float64Array(3 * n));
        let trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem | undefined;
        let warm: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
        return {
          solve: (
            r: number,
          ): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
            trusted = {
              ...model,
              rows: [
                ...held,
                ...Array.from(
                  { length: 3 * n },
                  (
                    _: unknown,
                    i: number,
                  ): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                    index: [i],
                    coef: [1],
                    l: -r,
                    u: r,
                    key: `t|${i}`,
                  }),
                ),
              ],
            };
            warm = QP.solve(trusted, warm, duals);
            let longest: number = 0;
            for (let i: number = 0; i < warm.x.length; ++i)
              longest = Math.max(longest, Math.abs(warm.x[i]!));
            // The constraints the step leaves unmet on their linearisation,
            // which the steered penalty reads.
            const left: number[] = held.map(
              (row: IAutoMovieMotionHumanQuadraticProgram.IRow): number => {
                let s: number = 0;
                for (let a: number = 0; a < row.index.length; ++a)
                  s += row.coef[a]! * warm!.x[row.index[a]!]!;
                return Math.max(0, row.l - s, s - row.u);
              },
            );
            return {
              violation: left.reduce(
                (s: number, v: number): number => s + v,
                0,
              ),
              met: Math.max(0, ...left) <= accuracy,
              trial: Float64Array.from(
                x,
                (v: number, i: number): number => v + warm!.x[i]!,
              ),
              predicted: zero - QP.value(model, warm.x),
              length: longest,
              // The step at the region's edge, to the solver's own accuracy.
              full: longest >= r * (1 - QP.TOLERANCE),
            };
          },
          taken: (): void => {
            duals = QP.multipliers(trusted!, warm!);
          },
        };
      },
    };
    // Zero deformation is the global minimum. Returning a feasible
    // reference exactly also makes identity independent of QP round-off.
    const original: IEvaluation = evaluate(reference);
    if (problem.feasible(original))
      return {
        points: props.reference.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
        ),
        mesh,
      };
    // The multipliers of the last step taken, which the next model starts from.
    let duals: Map<string, number> | undefined;
    const tries: number = Math.max(
      1,
      Math.ceil(Math.log(extent / accuracy) / Math.log(1 / SHRINK)),
    );
    const guess: Float64Array = flat(props.start ?? props.reference);
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      Float64Array,
      IEvaluation
    > = SCO.minimise(
      problem,
      evaluate(guess).flipped === 0 ? guess : reference,
      {
        schedule: {
          eta: ACCEPTED,
          low: POOR,
          high: GOOD,
          shrink: SHRINK,
          expand: EXPAND,
          boundary: true,
          widest: extent,
          trust: extent,
          least: accuracy,
          tries,
          improved: (merit: number): number =>
            Number.EPSILON ** 0.5 * Math.max(accuracy, merit),
        },
        penalties: [extent],
        rounds: 3 * n,
        steer: true,
      },
    );
    if (!problem.feasible(solved.evaluation))
      throw new Error(
        `The interaction mesh could not preserve its contacts and bone lengths: ${solved.evaluation.worst} m residual, ${solved.evaluation.flipped} inverted tetrahedra (${solved.reason})`,
      );
    return {
      points: Array.from(
        { length: n },
        (_: unknown, i: number): IAutoMovieVector3 => ({
          x: solved.x[3 * i]!,
          y: solved.x[3 * i + 1]!,
          z: solved.x[3 * i + 2]!,
        }),
      ),
      mesh,
    };
  }

  /** A step is taken where the merit falls by more than this share of the model's prediction: Nocedal and Wright's Algorithm 4.1 asks for one in [0, 1/4). */
  const ACCEPTED: number = 0.1;

  /** The ratio below which the region shrinks, and its factor: Nocedal and Wright's Algorithm 4.1. */
  const POOR: number = 1 / 4;

  /** The ratio above which a step at the region's edge grows it: Nocedal and Wright's Algorithm 4.1. */
  const GOOD: number = 3 / 4;

  /** The region's factor where it shrinks: Nocedal and Wright's Algorithm 4.1. */
  const SHRINK: number = 1 / 4;

  /** The region's factor where it grows: Nocedal and Wright's Algorithm 4.1. */
  const EXPAND: number = 2;

  /** An iterate's reading: the objective, the summed violation, the worst and the sides lost. */
  interface IEvaluation
    extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    /** The worst constraint's violation, metres. */
    worst: number;

    /** How many tetrahedra that record a side have lost it, their signed volume no longer positive. */
    flipped: number;
  }

  /** Points as one array, x then y then z by point. */
  const flat = (points: readonly IAutoMovieVector3[]): Float64Array =>
    Float64Array.from(
      points.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
    );

  /** The distance between two points of the array. */
  const length = (x: Float64Array, a: number, b: number): number =>
    Vector3.length({
      x: x[3 * a]! - x[3 * b]!,
      y: x[3 * a + 1]! - x[3 * b + 1]!,
      z: x[3 * a + 2]! - x[3 * b + 2]!,
    });

  /** A contact's offset as an array. */
  const offset = (
    c: IAutoMovieMotionHumanInteractionMesh.IContact,
  ): number[] => [c.offset?.x ?? 0, c.offset?.y ?? 0, c.offset?.z ?? 0];
}

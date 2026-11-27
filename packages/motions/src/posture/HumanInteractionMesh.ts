import { tetrahedralizeAutoMovieDelaunay } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import { HumanInteractionMeshLaplacian as Laplacian } from "./HumanInteractionMeshLaplacian";
import { HumanInteractionMeshSide as Side } from "./HumanInteractionMeshSide";
import { HumanInteractionMeshStep as Step } from "./HumanInteractionMeshStep";
import { humanInteractionMeshShape } from "./internal/humanInteractionMeshShape";

/**
 * Adapt the spatial relations of a multi-body key pose to bodies of other
 * proportions by an interaction mesh (Ho, Komura and Tai 2010, "Spatial
 * relationship preserving character motion adaptation", ACM TOG 29(4), article
 * 33): a volumetric mesh over every joint and contact point of all bodies at
 * the key pose records how they lie among each other, and the adapted pose is
 * the one that deforms that mesh least, by its Laplacian coordinates, while
 * each body keeps its own bone lengths and every contact its pairing, two
 * points coinciding or held at a fixed offset.
 *
 * - **Mesh.** The Delaunay tetrahedralization of the points
 *   (`tetrahedralizeAutoMovieDelaunay`, Bowyer-Watson on Qhull's joggled
 *   input). Its edges are the points' neighbourhoods.
 * - **Laplacian coordinates.** Each point's offset from the inverse-distance
 *   weighted mean of its neighbours, excluding bone edges so deformation does
 *   not oppose the bone lengths being changed (Ho et al. 2010, equation 3 and
 *   section 5.1; `HumanInteractionMeshLaplacian`).
 * - **Solve.** A connected set of fixed offsets determines the whole shape up to
 *   translation. Without a supplied start, target-length bones in their
 *   reference directions give a candidate alongside those offsets. The
 *   continuous side test bounds its advance, and every residual and orientation
 *   is checked. Other cases minimize the deformation of the Laplacian
 *   coordinates with a progressively tightened equality penalty (Nocedal and
 *   Wright 2006, §17.1). Each sparse Gauss–Newton model holds the Cartesian
 *   terms exactly and linearizes the length of a bone along its current
 *   direction. The line search uses the actual energy.
 * - **Sides.** An element's determinant must stay strictly positive. Within the
 *   geometric accuracy of collapse, the smooth IPC barrier adds repulsion from
 *   the element's reference altitude scale. The projected Gauss–Newton
 *   component of the Hessian gives the local quadratic model, and the
 *   determinant's cubic in the step fraction limits the line before an element
 *   can turn inside out (Li et al. 2020 §§4.2–4.4, technical supplement §§4 and
 *   6).
 *
 * Ho et al.'s full text (author upload:
 * https://www.researchgate.net/publication/220183715_Spatial_Relationship_Preserving_Character_Motion_Adaptation)
 * uses collision constraints on bounding volumes during iterative morphing.
 * This key-pose adaptation instead keeps every recorded tetrahedron's
 * orientation as a hard domain, with the physical contact accuracy of the
 * whole-body fit (`HumanBodyFitMerit.TOLERANCE`), stricter than 10 mm bone and
 * contact acceptance.
 */
export namespace HumanInteractionMesh {
  /**
   * Adapt a key pose.
   *
   * @param props The key pose's points, the target bones and contacts, and the
   *   start.
   * @returns The adapted points and the mesh.
   * @throws {Error} When fewer than four points are given, an index is out of
   *   range, a bone's length is not positive, or the solve cannot meet the
   *   bones and contacts while preserving the recorded sides.
   */
  export function adapt(
    props: IAutoMovieMotionHumanInteractionMesh.IProps,
  ): IAutoMovieMotionHumanInteractionMesh.IResult {
    const n: number = props.reference.length;
    if (n < 4)
      throw new Error("An interaction mesh needs at least four points");
    const inside: (index: number) => boolean = (index: number): boolean =>
      index >= 0 && index < n;
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
    const contactOffsets: number[][] = props.contacts.map(offset);

    const rows: Laplacian.Row[] = Laplacian.rows(
      props.reference,
      neighbours,
      props.bones,
    );
    const reference: Float64Array = flat(props.reference);
    const sides: Side.ISide[] = Side.record(
      mesh,
      props.reference,
      extent,
      accuracy,
    );
    const baseStiffness: number = Math.max(
      Number.EPSILON,
      rows.reduce(
        (sum: number, row: Laplacian.Row): number =>
          sum +
          row.reduce((s: number, entry): number => s + entry.value ** 2, 0),
        0,
      ) / n,
    );

    // Cartesian components share each immutable Laplacian row. Only their
    // residuals change while the deformation is solved.
    const laplace: ILaplace[] = rows.flatMap((row: Laplacian.Row): ILaplace[] =>
      AXES.map((axis: number): ILaplace => {
        const index: number[] = row.map(
          (entry): number => 3 * entry.point + axis,
        );
        const coef: number[] = row.map((entry): number => entry.value);
        return { index, coef, goal: coordinate(reference, index, coef) };
      }),
    );
    const nearSides: Map<Side.ISide, number> = new Map();
    function evaluate(
      x: Float64Array,
      penalty: number,
      stiffness: number,
      model?: Step.IRow[],
    ): IEvaluation {
      let energy: number = 0;
      let barrier: number = 0;
      let worst: number = 0;
      function squared(
        residual: number,
        weight: number,
        index: readonly number[],
        coef: readonly number[],
      ): void {
        energy += (weight * residual * residual) / 2;
        model?.push({
          index,
          coef,
          slope: weight * residual,
          curvature: weight,
        });
      }
      for (const term of laplace)
        squared(
          coordinate(x, term.index, term.coef) - term.goal,
          1,
          term.index,
          term.coef,
        );
      for (const bone of props.bones) {
        const first: number = 3 * bone.from;
        const second: number = 3 * bone.to;
        const dx: number = x[first]! - x[second]!;
        const dy: number = x[first + 1]! - x[second + 1]!;
        const dz: number = x[first + 2]! - x[second + 2]!;
        const length: number = Math.hypot(dx, dy, dz);
        const miss: number = length - bone.length;
        worst = Math.max(worst, Math.abs(miss));
        if (model === undefined) energy += (penalty * miss * miss) / 2;
        else {
          const unit: readonly number[] =
            length > 0 ? [dx / length, dy / length, dz / length] : [0, 1, 0];
          squared(
            miss,
            penalty,
            [first, first + 1, first + 2, second, second + 1, second + 2],
            [unit[0]!, unit[1]!, unit[2]!, -unit[0]!, -unit[1]!, -unit[2]!],
          );
        }
      }
      for (const [i, contact] of props.contacts.entries())
        for (const axis of AXES) {
          const a: number = 3 * contact.a + axis;
          const b: number = 3 * contact.b + axis;
          const miss: number = x[a]! - x[b]! - contactOffsets[i]![axis]!;
          worst = Math.max(worst, Math.abs(miss));
          if (model === undefined) energy += (penalty * miss * miss) / 2;
          else squared(miss, penalty, [a, b], [1, -1]);
        }
      let flipped: number = 0;
      let closing: boolean = false;
      if (model !== undefined) nearSides.clear();
      for (const side of sides) {
        const altitude: number = Side.value(x, side);
        if (altitude < NEAR * extent) {
          if (model !== undefined) nearSides.set(side, altitude);
          else if (altitude < (nearSides.get(side) ?? -Infinity))
            closing = true;
        }
        if (!(altitude > 0)) ++flipped;
        else if (altitude < side.activation) {
          const log: number = Math.log(altitude / side.activation);
          const gap: number = altitude - side.activation;
          barrier -= gap * gap * log;
          if (model === undefined) continue;

          // The positive term of the barrier's projected Hessian is the
          // rank-one curvature along the altitude's exact gradient.
          const ratio: number = gap / altitude;
          model.push({
            ...Side.gradient(x, side),
            slope: -stiffness * gap * (2 * log + ratio),
            curvature: stiffness * (-2 * log - 4 * ratio + ratio * ratio),
          });
        }
      }
      return {
        energy: flipped === 0 ? energy + stiffness * barrier : Infinity,
        barrier,
        worst,
        flipped,
        closing,
      };
    }
    const feasible: (at: IEvaluation) => boolean = (at: IEvaluation): boolean =>
      at.worst <= accuracy && at.flipped === 0;
    const original: IEvaluation = evaluate(
      reference,
      baseStiffness,
      baseStiffness,
    );
    if (feasible(original))
      return {
        points: props.reference.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
        ),
        mesh,
      };

    // Starting from the authored geometric guess where its sides allow,
    // tighten the equality penalty between converged sparse local solves.
    // The barrier coefficient stays fixed throughout each line search.
    let x: Float64Array = reference;
    let current: IEvaluation = original;
    if (props.start !== undefined) {
      const guess: Float64Array = flat(props.start);
      const observed: IEvaluation = evaluate(
        guess,
        baseStiffness,
        baseStiffness,
      );
      if (observed.flipped === 0) {
        x = guess;
        current = observed;
      }
    }
    if (props.bones.length === 0 || props.start === undefined) {
      const direct: Float64Array | undefined = humanInteractionMeshShape(
        props.bones,
        props.contacts,
        reference,
      );
      if (direct !== undefined) {
        const displacement: Float64Array = direct.map(
          (coordinate: number, i: number): number => coordinate - x[i]!,
        );
        const safe: number = Side.limit(x, displacement, sides);
        const candidate: Float64Array =
          safe === 1
            ? direct
            : x.map(
                (v: number, i: number): number => v + safe * displacement[i]!,
              );
        const observed: IEvaluation = evaluate(
          candidate,
          baseStiffness,
          baseStiffness,
        );
        if (feasible(observed)) return { points: points(candidate, n), mesh };
        if (
          props.start === undefined &&
          observed.flipped === 0 &&
          observed.worst < current.worst
        ) {
          x = candidate;
          current = observed;
        }
      }
    }
    const lowerBarrier: number = stiffnessFloor(
      baseStiffness,
      extent,
      accuracy,
    );
    const upperBarrier: number = STIFFNESS_LIMIT * lowerBarrier;
    let stiffness: number = lowerBarrier;
    // Start halfway between the Laplacian scale and the penalty whose
    // quadratic energy gives the whole extent the target accuracy.
    let penalty: number = baseStiffness * (extent / accuracy);
    const largest: number = baseStiffness * (extent / accuracy) ** 2;
    const limit: number = Math.sqrt(Number.EPSILON) * extent;
    // The loop gate reads only feasibility, independent of either
    // stiffness. Its first model evaluates the energy with its own weights.
    for (
      let round: number = 0;
      round < x.length && !feasible(current);
      round++
    ) {
      const terms: Step.IRow[] = [];
      current = evaluate(x, penalty, round === 0 ? 1 : stiffness, terms);
      if (round === 0) {
        const constraints: number =
          laplace.length + props.bones.length + 3 * props.contacts.length;
        stiffness = Math.min(
          upperBarrier,
          Math.max(lowerBarrier, Step.balance(x.length, terms, constraints)),
        );
        for (let i: number = constraints; i < terms.length; i++) {
          terms[i]!.slope *= stiffness;
          terms[i]!.curvature *= stiffness;
        }
        current.energy += (stiffness - 1) * current.barrier;
      }
      const displacement: Float64Array = Step(
        x.length,
        terms,
        baseStiffness,
      );
      const magnitude: number = displacement.reduce(
        (maximum: number, value: number): number =>
          Math.max(maximum, Math.abs(value)),
        0,
      );
      let fraction: number = Side.limit(x, displacement, sides);
      let moved: boolean = false;
      while (fraction * magnitude > limit) {
        const candidate: Float64Array = Float64Array.from(
          x,
          (value: number, i: number): number =>
            value + fraction * displacement[i]!,
        );
        const result: IEvaluation = evaluate(candidate, penalty, stiffness);
        if (result.energy < current.energy || feasible(result)) {
          if (result.closing) stiffness = Math.min(upperBarrier, 2 * stiffness);
          const settled: boolean =
            Math.abs(result.worst - current.worst) <= limit;
          x = candidate;
          current = result;
          moved = true;
          if (settled && penalty < largest)
            penalty = Math.min(largest, penalty * PENALTY_GROWTH);
          break;
        }
        // Li et al. §4.4's line search halves the fraction after each trial.
        fraction /= 2;
      }
      if (!moved) {
        if (penalty >= largest) break;
        penalty = Math.min(largest, penalty * PENALTY_GROWTH);
      }
    }
    if (!feasible(current))
      throw new Error(
        `The interaction mesh could not preserve its contacts and bone lengths: ${current.worst} m residual, ${current.flipped} inverted tetrahedra`,
      );
    return { points: points(x, n), mesh };
  }

  /** The solved Cartesian points, indexed as in the reference. */
  function points(x: Float64Array, n: number): IAutoMovieVector3[] {
    return Array.from(
      { length: n },
      (_: unknown, i: number): IAutoMovieVector3 => ({
        x: x[3 * i]!,
        y: x[3 * i + 1]!,
        z: x[3 * i + 2]!,
      }),
    );
  }

  /** Cartesian coordinates within each mesh point. */
  const AXES: readonly number[] = [0, 1, 2];

  /**
   * Tightening factor for the equality penalty from Byrd, Nocedal and Waltz's
   * steered penalty schedule.
   */
  const PENALTY_GROWTH: number = 10;

  /**
   * Gap below which the adaptive barrier responds to conditioning (Li et al.
   * 2020 technical supplement §6).
   */
  const NEAR: number = 1e-9;

  /**
   * Maximum barrier stiffness relative to its starting scale (Li et al. 2020
   * technical supplement §6).
   */
  const STIFFNESS_LIMIT: number = 100;

  /**
   * The characteristic clearance of the conditioning measurement and its
   * curvature multiplier (Li et al. 2020 technical supplement §6).
   */
  const CONDITIONING_DISTANCE: number = 1e-8;
  const CONDITIONING_CURVATURE: number = 1e11;

  /**
   * The IPC conditioning scale, using the deformation diagonal in place of
   * lumped nodal mass.
   */
  function stiffnessFloor(
    background: number,
    extent: number,
    activation: number,
  ): number {
    const distance: number = Math.min(
      activation / 2,
      CONDITIONING_DISTANCE * extent,
    );
    const ratio: number = (distance - activation) / distance;
    const curvature: number =
      -2 * Math.log(distance / activation) - 4 * ratio + ratio * ratio;
    // Our signed altitude already has a unit derivative at the reference
    // face with the largest double area. IPC's squared distance needs the
    // extra derivative factor at this point.
    return (CONDITIONING_CURVATURE * background) / curvature;
  }

  /** One unchanged Cartesian Laplacian row and its reference coordinate. */
  interface ILaplace {
    /** Which global coordinates the row reads. */
    index: readonly number[];

    /** Linear coefficients in those coordinates. */
    coef: readonly number[];

    /** Reference differential coordinate, metres. */
    goal: number;
  }

  /** Merit, exact feasibility and contraction of previously near sides. */
  interface IEvaluation {
    /** Laplacian deformation, equality penalty and active barrier energy. */
    energy: number;

    /** The energy of the active barrier before applying its stiffness. */
    barrier: number;

    /** The worst bone or contact residual in metres. */
    worst: number;

    /** Number of elements that lost positive orientation. */
    flipped: number;

    /** Whether a side already near its barrier moved closer during this trial. */
    closing: boolean;
  }

  /** A sparse linear coordinate. */
  function coordinate(
    x: Float64Array,
    index: readonly number[],
    coef: readonly number[],
  ): number {
    let value: number = 0;
    for (const [i, c] of index.entries()) value += coef[i]! * x[c]!;
    return value;
  }

  /** Points as one array, x then y then z by point. */
  const flat: (points: readonly IAutoMovieVector3[]) => Float64Array = (
    points: readonly IAutoMovieVector3[],
  ): Float64Array =>
    Float64Array.from(
      points.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
    );

  /** A contact's world-metre relative offset. */
  const offset: (
    c: IAutoMovieMotionHumanInteractionMesh.IContact,
  ) => number[] = (
    c: IAutoMovieMotionHumanInteractionMesh.IContact,
  ): number[] => [c.offset?.x ?? 0, c.offset?.y ?? 0, c.offset?.z ?? 0];
}

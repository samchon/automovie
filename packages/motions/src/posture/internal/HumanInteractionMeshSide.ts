import { Vector3, AutoMovieEngineCurve, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieTetrahedralizedMesh,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The sides an interaction mesh records (`HumanInteractionMesh`): each
 * tetrahedron not flat on the key pose keeps its orientation, so no point
 * passes through the face across from it, which is how one body would pass into
 * another. The determinant is scaled by the reference's largest face area,
 * giving an altitude in metres. Close to zero, the barrier of Li et al. 2020
 * §4.2 repels compression. Their §4.4 line filter finds an admissible step
 * before the first possible element collapse.
 */
export namespace HumanInteractionMeshSide {
  /** A tetrahedron that records a side. */
  export interface ISide {
    /** The corners, in the mesh's positive orientation. */
    corners: readonly [number, number, number, number];

    /** The largest double face area of the reference element, in square metres. */
    area: number;

    /** The altitude below which the side's barrier acts, metres. */
    activation: number;
  }

  /**
   * The sides of a mesh over its reference points: every tetrahedron whose
   * reference volume exceeds what the joggle alone could give it.
   *
   * @param mesh The mesh.
   * @param reference The key pose's points, world metres.
   * @param extent The points' extent, metres.
   * @param accuracy The adaptation's geometric accuracy, metres.
   * @returns The sides.
   */
  export function record(
    mesh: IAutoMovieTetrahedralizedMesh,
    reference: readonly IAutoMovieVector3[],
    extent: number,
    accuracy: number,
  ): ISide[] {
    const joggle: number =
      AutoMovieEngineMath.DELAUNAY_JOGGLE * Number.EPSILON * extent;
    const flat: number = 3 * (2 * Math.sqrt(3) * joggle) * (2 * extent) ** 2;
    return mesh.tetrahedra
      .filter(
        (t: readonly [number, number, number, number]): boolean =>
          AutoMovieEngineMath.delaunayVolume(reference, t) > flat,
      )
      .map((corners: ISide["corners"]): ISide => {
        const [a, b, c, d] = corners;
        const e1: IAutoMovieVector3 = Vector3.subtract(
          reference[b]!,
          reference[a]!,
        );
        const e2: IAutoMovieVector3 = Vector3.subtract(
          reference[c]!,
          reference[a]!,
        );
        const e3: IAutoMovieVector3 = Vector3.subtract(
          reference[d]!,
          reference[a]!,
        );
        const bc: IAutoMovieVector3 = Vector3.cross(e1, e2);
        const bd: IAutoMovieVector3 = Vector3.cross(e1, e3);
        const cd: IAutoMovieVector3 = Vector3.cross(e2, e3);
        const area: number = Math.max(
          Vector3.length(bc),
          Vector3.length(bd),
          Vector3.length(cd),
          Vector3.length(Vector3.add(Vector3.subtract(cd, bd), bc)),
        );
        // The activation distance is physical, even for a very thin
        // reference element. Using the element's thin original altitude as
        // its own distance would leave that element effectively unprotected.
        return { corners, area, activation: accuracy };
      });
  }

  /**
   * A side's oriented determinant divided by the reference face area.
   *
   * @param x The points, x then y then z by point.
   * @param side The side.
   * @returns Metres; positive where the side is kept.
   */
  export function value(x: Float64Array, side: ISide): number {
    const [a, b, c, d] = side.corners;
    const p: IAutoMovieVector3 = at(x, a);
    return (
      triple(
        Vector3.subtract(at(x, b), p),
        Vector3.subtract(at(x, c), p),
        Vector3.subtract(at(x, d), p),
      ) / side.area
    );
  }

  /**
   * The gradient of a side's signed altitude for the barrier model.
   *
   * @param x The points, x then y then z by point.
   * @param side The side.
   * @returns Its twelve sparse Cartesian derivatives.
   */
  export function gradient(x: Float64Array, side: ISide): IGradient {
    const [a, b, c, d] = side.corners;
    const e1: IAutoMovieVector3 = Vector3.subtract(at(x, b), at(x, a));
    const e2: IAutoMovieVector3 = Vector3.subtract(at(x, c), at(x, a));
    const e3: IAutoMovieVector3 = Vector3.subtract(at(x, d), at(x, a));
    const gb: IAutoMovieVector3 = Vector3.cross(e2, e3);
    const gc: IAutoMovieVector3 = Vector3.cross(e3, e1);
    const gd: IAutoMovieVector3 = Vector3.cross(e1, e2);
    const ga: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(Vector3.add(gb, gc), gd),
      -1,
    );
    return {
      index: side.corners.flatMap((i: number): number[] => [
        3 * i,
        3 * i + 1,
        3 * i + 2,
      ]),
      coef: [ga, gb, gc, gd].flatMap((g: IAutoMovieVector3): number[] => [
        g.x / side.area,
        g.y / side.area,
        g.z / side.area,
      ]),
    };
  }

  /**
   * Largest admissible fraction of a Cartesian step.
   *
   * @param x The orientation-preserving iterate.
   * @param step The proposed Cartesian displacement.
   * @param sides The recorded elements.
   * @returns One, or the first conservative compression event on the step.
   */
  export function limit(
    x: Float64Array,
    step: Float64Array,
    sides: readonly ISide[],
  ): number {
    let fraction: number = 1;
    for (const side of sides) {
      const [a, b, c, d] = side.corners;
      const origin: IAutoMovieVector3 = at(x, a);
      const move: IAutoMovieVector3 = at(step, a);
      const e1: IAutoMovieVector3 = Vector3.subtract(at(x, b), origin);
      const e2: IAutoMovieVector3 = Vector3.subtract(at(x, c), origin);
      const e3: IAutoMovieVector3 = Vector3.subtract(at(x, d), origin);
      const f1: IAutoMovieVector3 = Vector3.add(
        e1,
        Vector3.scale(Vector3.subtract(at(step, b), move), fraction),
      );
      const f2: IAutoMovieVector3 = Vector3.add(
        e2,
        Vector3.scale(Vector3.subtract(at(step, c), move), fraction),
      );
      const f3: IAutoMovieVector3 = Vector3.add(
        e3,
        Vector3.scale(Vector3.subtract(at(step, d), move), fraction),
      );
      const initial: number = triple(e1, e2, e3);
      const floor: number = (1 - COMPRESSION) * initial;
      const coefficients: number[] = [
        initial - floor,
        (triple(f1, e2, e3) + triple(e1, f2, e3) + triple(e1, e2, f3)) / 3 -
          floor,
        (triple(e1, f2, f3) + triple(f1, e2, f3) + triple(f1, f2, e3)) / 3 -
          floor,
        triple(f1, f2, f3) - floor,
      ];
      if (coefficients.every((v: number): boolean => v > 0)) continue;
      const scale: number = Math.max(...coefficients.map(Math.abs));
      const root: number | undefined = AutoMovieEngineCurve.rootsCubicBernstein64(
        coefficients.map((v: number): number => v / scale),
      )[0];
      if (root !== undefined) fraction *= root;
      if (fraction === 0) break;
    }
    return fraction;
  }

  /** The indexed gradient of one signed altitude. */
  interface IGradient {
    /** The affine coordinate index of each entry. */
    index: number[];

    /** The derivative of the altitude at each coordinate. */
    coef: number[];
  }

  /**
   * Fraction of an element's current volume it may lose in one feasible step
   * (Li et al. 2020 technical supplement §4).
   */
  const COMPRESSION: number = 0.8;

  /** The oriented determinant of three tetrahedron edge vectors. */
  function triple(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
  ): number {
    return Vector3.dot(a, Vector3.cross(b, c));
  }

  /** A point of the array. */
  function at(x: Float64Array, i: number): IAutoMovieVector3 {
    return { x: x[3 * i]!, y: x[3 * i + 1]!, z: x[3 * i + 2]! };
  }
}

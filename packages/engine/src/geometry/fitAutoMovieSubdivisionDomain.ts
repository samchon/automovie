import { IAutoMovieQuadraticRow } from "../math/IAutoMovieQuadraticRow";
import { solveAutoMovieQuadraticProgram } from "../math/solveAutoMovieQuadraticProgram";
import { IAutoMovieSubdivisionCage } from "./IAutoMovieSubdivisionCage";
import { ISubdivisionLevel } from "./ISubdivisionLevel";
import { admitSubdivisionCage } from "./admitSubdivisionCage";
import { refineSubdivisionLevel } from "./refineSubdivisionLevel";
import { refineSubdivisionStencils } from "./refineSubdivisionStencils";
import { subdivisionBendingRows } from "./subdivisionBendingRows";
import { IAutoMovieSubdivisionStencil } from "./sweep/IAutoMovieSubdivisionStencil";
import { stencilAutoMovieSubdivisionLimit } from "./sweep/stencilAutoMovieSubdivisionLimit";

/**
 * Fit an explicitly refined generating domain to authored coarse limit points.
 *
 * Two uniform Catmull-Clark steps introduce fitting freedom, as in the
 * refinement principle of Halstead, Kass and DeRose (1993), section 5. The
 * objective is instead the frozen discrete cotangent bending norm documented
 * by subdivisionBendingRows, not that paper's analytic plate integral.
 * https://www.eecs.umich.edu/courses/eecs598-1/halstead.pdf
 *
 * Coordinates are hierarchical: Q = R P + D, with D zero at retained original
 * indices. Source control anchors constrain P. Independent source limit
 * targets constrain the limit of Q; an index may carry both equations. Fine
 * controls wholly supported by anchored P have zero detail. Outside regionFaces
 * the refined original control surface is fixed, preserving the consumer's
 * neighbouring surface rather than an isolated patch's boundary rule.
 *
 * The input is a manifold quad crop with a caller-owned support collar. Active
 * limit targets incident to an interior sharp edge are refused because their
 * limit masks are not smooth/boundary masks. Other support creases retain their
 * actual affine refinement and sharpness. The caller must validate support against the whole joined
 * consumer and preserve physical measurements not implied by point equations.
 * No embedding, no-fold, clinical measurement, or pose guarantee is made.
 *
 * @evidence contracts/common.md#principled-implementation Uses exact affine subdivision hierarchy with independent coarse control and limit constraints, a declared frozen physical discrete bending energy and the maintained PSD quadratic solver through residual-variable lifting. It does not claim the analytic plate energy, global injectivity, or measurement preservation from isolated interpolation equations.
 * @evidence contracts/common.md#clear-and-simple-design This function coordinates admitted topology, two sparse symbolic refinements, physical energy rows, equality construction and three coordinate solves. Callers own semantic region selection, collar adequacy, clinical measures and final consumer validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input-specific tuning, anatomy offsets, dropped target constraints, regularization, solver setting changes or source mesh baking. Active targets incident to interior sharp edges and incomplete native solves are refused; support creases outside those target fans retain their exact maintained refinement masks.
 * @evidence contracts/common.md#meaningful-documentation States units, hierarchy, the distinct meanings of anchors and limit targets, exterior preservation, the discrete energy, caller-owned collar and clinical checks, refusals and the absence of a no-fold claim.
 * @evidence contracts/performance.md#efficient-algorithms Two uniform refinements make O(16F) faces. Symbolic masks and energy composition use sparse local supports, not dense inverse or basis probing. Three sparse native QPs dominate time and fill-dependent workspace; each has twice the refined vertex count in variables due to residual lifting.
 * @evidence contracts/performance.md#reuse-equivalent-work One refined topology, affine map, physical metric and constraint pattern serves all three coordinate solves. There is no cross-request cache because geometry changes the metric and target data; the result retains the completed domain for render and construction consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All assembly maps and solver result arrays are local. The returned domain owns its refined arrays and copied coarse controls; temporary assembly is released on return or failure. Native reactor lifetime remains owned by the maintained solver.
 */
export function fitAutoMovieSubdivisionDomain(props: {
  /** Initial pre-inverse samples with original control pins applied, metres; indexed UV topology is preserved. */
  cage: IAutoMovieSubdivisionCage;

  /** Existing joined controls, metres, packed like cage.positions. */
  controlPositions: readonly number[];

  /** Exact original coarse-control constraints; one flag per source vertex. */
  anchors: readonly boolean[];

  /** Limit targets in metres; null omits a limit equation, independently of anchors. */
  limitTargets: ReadonlyArray<readonly [number, number, number] | null>;

  /** Source face indices permitted to change, with an anchored support collar. */
  regionFaces: ReadonlySet<number>;
}): {
  level: ISubdivisionLevel;
  coarseControls: number[];
  maximumEqualityError: number;
  iterations: number[];
} {
  let level: ISubdivisionLevel = admitSubdivisionCage(props.cage);
  const old: number = level.topology.vertexCount;
  if (
    props.controlPositions.length !== 3 * old ||
    props.controlPositions.some((x: number): boolean => !Number.isFinite(x))
  )
    throw new Error(
      "fitting control positions must be finite source vertex triples",
    );
  if (props.anchors.length !== old || props.limitTargets.length !== old)
    throw new Error("fitting constraints must match the source vertex count");
  for (let i: number = 0; i < old; i++)
    if (
      typeof props.anchors[i] !== "boolean" ||
      props.limitTargets[i] === undefined
    )
      throw new Error(
        "fitting constraints must be dense boolean anchors and target rows",
      );
  for (const target of props.limitTargets)
    if (
      target !== null &&
      (target.length !== 3 ||
        target.some((x: number): boolean => !Number.isFinite(x)))
    )
      throw new Error("fitting limit target must be a finite metre triple");
  for (let e: number = 0; e < level.topology.edgeSharpness.length; e++) {
    if (
      level.topology.edgeSharpness[e] === 0 ||
      level.topology.edgeCorners[2 * e + 1] === -1
    )
      continue;
    for (let end: number = 0; end < 2; end++) {
      const vertex: number = level.topology.edgeVertices[2 * e + end]!;
      if (props.limitTargets[vertex] !== null)
        throw new Error(
          `fitting limit target ${vertex} is incident to an unsupported interior crease`,
        );
    }
  }
  for (const face of props.regionFaces)
    if (
      !Number.isSafeInteger(face) ||
      face < 0 ||
      face >= props.cage.faces.length
    )
      throw new Error("fitting region face is out of range");
  const coarseStencil: IAutoMovieSubdivisionStencil =
    stencilAutoMovieSubdivisionLimit(props.cage.faces, old);
  let refinement: Array<Map<number, number>> = Array.from(
    { length: old },
    (_: unknown, i: number): Map<number, number> => new Map([[i, 1]]),
  );
  for (let step: number = 0; step < 2; step++) {
    refinement = refineSubdivisionStencils(level.topology, refinement);
    level = refineSubdivisionLevel(level);
  }
  const count: number = level.topology.vertexCount;
  const fineFaces: number[][] = Array.from(
    { length: level.topology.faceOffsets.length - 1 },
    (_: unknown, f: number): number[] =>
      level.topology.faceVertices.slice(
        level.topology.faceOffsets[f],
        level.topology.faceOffsets[f + 1],
      ),
  );
  const fineStencil: IAutoMovieSubdivisionStencil =
    stencilAutoMovieSubdivisionLimit(fineFaces, count);
  const equalities: Array<{
    terms: Map<number, number>;
    target: readonly number[];
  }> = [];
  const stencil: (
    input: IAutoMovieSubdivisionStencil,
    i: number,
  ) => Map<number, number> = (
    input: IAutoMovieSubdivisionStencil,
    i: number,
  ): Map<number, number> => {
    const terms: Map<number, number> = new Map();
    for (let k: number = input.offsets[i]!; k < input.offsets[i + 1]!; k++) {
      const j: number = input.indices[k]!;
      terms.set(j, (terms.get(j) ?? 0) + input.weights[k]!);
    }
    return terms;
  };
  for (let i: number = 0; i < old; i++) {
    const target: readonly [number, number, number] | null =
      props.limitTargets[i]!;
    if (target !== null) {
      const terms: Map<number, number> = stencil(coarseStencil, i);
      for (const [j, weight] of stencil(fineStencil, i))
        if (j >= old) terms.set(j, (terms.get(j) ?? 0) + weight);
      equalities.push({ terms, target });
    }
    if (props.anchors[i])
      equalities.push({
        terms: new Map([[i, 1]]),
        target: props.controlPositions.slice(3 * i, 3 * i + 3),
      });
  }
  const outside: Set<number> = new Set();
  fineFaces.forEach((face: number[], f: number): void => {
    if (!props.regionFaces.has(Math.floor(f / 16)))
      for (const vertex of face) outside.add(vertex);
  });
  refinement.forEach((row: Map<number, number>, i: number): void => {
    const pureAnchor: boolean = [...row.keys()].every(
      (j: number): boolean => props.anchors[j]!,
    );
    if (i >= old && pureAnchor)
      equalities.push({ terms: new Map([[i, 1]]), target: [0, 0, 0] });
    else if (outside.has(i) && !(i < old && pureAnchor)) {
      const terms: Map<number, number> = new Map(row);
      if (i >= old) terms.set(i, 1);
      equalities.push({
        terms,
        target: [0, 1, 2].map((axis: number): number =>
          [...row].reduce(
            (sum: number, [j, weight]: [number, number]): number =>
              sum + weight * props.controlPositions[3 * j + axis]!,
            0,
          ),
        ),
      });
    }
  });
  const energy: Array<Map<number, number>> = subdivisionBendingRows(level).map(
    (row: Map<number, number>): Map<number, number> => {
      const terms: Map<number, number> = new Map();
      for (const [i, weight] of row) {
        for (const [j, coefficient] of refinement[i]!)
          terms.set(j, (terms.get(j) ?? 0) + weight * coefficient);
        if (i >= old) terms.set(i, (terms.get(i) ?? 0) + weight);
      }
      return terms;
    },
  );
  const rows: IAutoMovieQuadraticRow[] = [
    ...equalities.map(
      (row: {
        terms: Map<number, number>;
        target: readonly number[];
      }): IAutoMovieQuadraticRow => ({
        indices: [...row.terms.keys()],
        weights: [...row.terms.values()],
        lower: 0,
        upper: 0,
      }),
    ),
    ...energy.map(
      (row: Map<number, number>, i: number): IAutoMovieQuadraticRow => ({
        indices: [...row.keys(), count + i],
        weights: [...row.values()].map((x: number): number => -x).concat(1),
        lower: 0,
        upper: 0,
      }),
    ),
  ];
  const diagonal: number[] = [
    ...new Array<number>(count).fill(0),
    ...new Array<number>(count).fill(1),
  ];
  const linear: number[] = new Array<number>(2 * count).fill(0);
  const coordinates: number[] = new Array<number>(3 * count).fill(0);
  const iterations: number[] = [];
  let maximumEqualityError: number = 0;
  for (let axis: number = 0; axis < 3; axis++) {
    equalities.forEach(
      (
        row: { terms: Map<number, number>; target: readonly number[] },
        i: number,
      ): void => {
        rows[i]!.lower = row.target[axis]!;
        rows[i]!.upper = row.target[axis]!;
      },
    );
    const solved: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      solveAutoMovieQuadraticProgram({ diagonal, linear, rows });
    if (solved.status !== 1)
      throw new Error(`subdivision fitting solve incomplete: ${solved.status}`);
    maximumEqualityError = Math.max(
      maximumEqualityError,
      solved.maximumViolation,
    );
    iterations.push(solved.iterations);
    for (let i: number = 0; i < count; i++)
      coordinates[3 * i + axis] = solved.primal[i]!;
  }
  const positions: number[] = new Array<number>(3 * count).fill(0);
  refinement.forEach((row: Map<number, number>, i: number): void => {
    for (let axis: number = 0; axis < 3; axis++) {
      let value: number = i >= old ? coordinates[3 * i + axis]! : 0;
      for (const [j, weight] of row)
        value += weight * coordinates[3 * j + axis]!;
      positions[3 * i + axis] = value;
    }
  });
  return {
    level: { ...level, positions },
    coarseControls: coordinates.slice(0, 3 * old),
    maximumEqualityError,
    iterations,
  };
}

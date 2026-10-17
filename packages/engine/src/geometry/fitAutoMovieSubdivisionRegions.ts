import { IAutoMovieSubdivisionCage } from "./IAutoMovieSubdivisionCage";
import { ISubdivisionLevel } from "./ISubdivisionLevel";
import { admitSubdivisionCage } from "./admitSubdivisionCage";
import { fitAutoMovieSubdivisionDomain } from "./fitAutoMovieSubdivisionDomain";
import { refineSubdivisionLevel } from "./refineSubdivisionLevel";

/**
 * Fit disjoint geometric regions on their actual joined subdivision domain.
 *
 * Every region receives four edge-adjacent face rings of support: two are the
 * two-step refinement support and two retain the limit one-ring. The collar's
 * controls and the exterior refined surface are anchored. Local-to-global
 * vertex identity is followed through exact edge/face subdivision identities,
 * never spatial welding. Only solved control deltas are composed into the
 * globally refined original cage, so artificial crop boundaries cannot replace
 * the joined surface. Original indexed UVs and source-face parameters refine
 * globally once and never pass through a value-based UV repacker.
 *
 * Regions must be disjoint source-face sets; shared boundaries are exterior
 * anchors for both. Constraints must lie on their region's source vertices.
 * Support creases preserve their actual refinement; active target fans with
 * interior sharp edges are refused by the domain fitter. The fit result still
 * requires the caller's physical measurement, intersection and pose checks.
 *
 * @evidence contracts/common.md#principled-implementation Uses finite support of two uniform Catmull-Clark refinements plus limit masks to crop local solves, retains graph identities through edge and face children and composes deltas on the globally refined joined cage. Original coarse targets and controls remain separate equations in fitAutoMovieSubdivisionDomain.
 * @evidence contracts/common.md#clear-and-simple-design Owns region extraction and exact global composition; the domain fitter owns the declared physical objective and equality solve. Semantic selection and clinical constraints remain with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not weld by distance or paste isolated part positions into a joined mesh. Regions are disjoint, supported crease masks refine unchanged, and unsupported sharp target fans are refused; no caller names or fixture-specific fit coefficients occur.
 * @evidence contracts/common.md#meaningful-documentation States collar derivation, graph identity, delta composition, preserved indexed UVs and source parameters, region overlap and crease refusals, and the outstanding caller validation duties.
 * @evidence contracts/performance.md#efficient-algorithms Global adjacency and two global refinements are linear in the resulting O(16F) faces. Each local solve costs its crop's sparse QPs and symbolic support terms; scanning source faces per region is needed to gather exact collar boundary anchors.
 * @evidence contracts/performance.md#reuse-equivalent-work Global topology, UV refinement and face adjacency are computed once and shared by all regions. Local solves share three coordinate systems internally and no completed model is cached against mutable caller input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Processes one crop at a time; temporary crop and solve arrays are released after their deltas are composed. The returned level owns one globally refined cage and result residuals, with no module retention.
 */
export function fitAutoMovieSubdivisionRegions(props: {
  /** Joined original controls and indexed face-varying UV topology, metres. */
  cage: IAutoMovieSubdivisionCage;

  /** Render refinements relative to the source cage, integer 2–6; omitted, 2. */
  levels?: number;

  /** Disjoint source-face regions with their authored source constraints. */
  regions: ReadonlyArray<{
    /** Source face identities permitted to change; regions may share only boundaries. */
    faces: ReadonlySet<number>;
    /** Initial generating samples, metres, keyed by source vertex identity. */
    samples: ReadonlyMap<number, readonly [number, number, number]>;
    /** Independent hard limit equalities, metres, keyed by source vertex identity. */
    limitTargets: ReadonlyMap<number, readonly [number, number, number]>;
    /** Source control vertices held at their original cage positions. */
    anchors: ReadonlySet<number>;
  }>;
}): { level: ISubdivisionLevel; maximumEqualityError: number } {
  const requested: number = props.levels ?? 2;
  if (!Number.isSafeInteger(requested) || requested < 2 || requested > 6)
    throw new Error("fitted subdivision levels must be an integer from 2 to 6");
  const source: ISubdivisionLevel = admitSubdivisionCage(props.cage);
  const levels: ISubdivisionLevel[] = [source];
  for (let step: number = 0; step < 2; step++)
    levels.push(refineSubdivisionLevel(levels[step]!));
  let output: ISubdivisionLevel = {
    ...levels[2]!,
    positions: [...levels[2]!.positions],
  };
  const faceCount: number = props.cage.faces.length;
  const adjacency: Array<Set<number>> = Array.from(
    { length: faceCount },
    (): Set<number> => new Set(),
  );
  for (let e: number = 0; e < source.topology.edgeSharpness.length; e++) {
    const left: number = source.topology.edgeCorners[2 * e]!;
    const right: number = source.topology.edgeCorners[2 * e + 1]!;
    if (right === -1) continue;
    const a: number = source.topology.cornerFaces[left]!;
    const b: number = source.topology.cornerFaces[right]!;
    adjacency[a]!.add(b);
    adjacency[b]!.add(a);
  }
  const owned: Set<number> = new Set();
  let maximumEqualityError: number = 0;
  for (const region of props.regions) {
    const inside: Set<number> = new Set();
    for (const f of region.faces) {
      if (!Number.isSafeInteger(f) || f < 0 || f >= faceCount || owned.has(f))
        throw new Error(
          "fitting regions must name disjoint valid source faces",
        );
      owned.add(f);
      for (const vertex of props.cage.faces[f]!) inside.add(vertex);
    }
    if (!region.faces.size)
      throw new Error("fitting region must contain a face");
    for (const vertex of [
      ...region.samples.keys(),
      ...region.limitTargets.keys(),
      ...region.anchors,
    ])
      if (!inside.has(vertex))
        throw new Error(
          "fitting region constraint is outside its source vertices",
        );
    const selected: Set<number> = new Set(region.faces);
    let front: number[] = [...region.faces];
    for (let ring: number = 0; ring < 4; ring++) {
      const next: number[] = [];
      for (const f of front)
        for (const other of adjacency[f]!) {
          if (selected.has(other)) continue;
          selected.add(other);
          next.push(other);
        }
      front = next;
    }
    const globalFaces: number[] = [...selected].sort(
      (a: number, b: number): number => a - b,
    );
    const globalVertices: number[] = [];
    const localVertex: Map<number, number> = new Map();
    const index: (v: number) => number = (v: number): number => {
      let found: number | undefined = localVertex.get(v);
      if (found === undefined) {
        found = globalVertices.length;
        globalVertices.push(v);
        localVertex.set(v, found);
      }
      return found;
    };
    const faces: number[][] = globalFaces.map((f: number): number[] =>
      props.cage.faces[f]!.map(index),
    );
    const cropEdges: Set<string> = new Set();
    for (const face of faces)
      face.forEach((a: number, k: number): void => {
        const b: number = face[(k + 1) % 4]!;
        cropEdges.add(`${Math.min(a, b)},${Math.max(a, b)}`);
      });
    const creases: NonNullable<IAutoMovieSubdivisionCage["creases"]>[number][] =
      [];
    for (const crease of props.cage.creases ?? []) {
      const a: number | undefined = localVertex.get(crease.from);
      const b: number | undefined = localVertex.get(crease.to);
      if (
        a !== undefined &&
        b !== undefined &&
        cropEdges.has(`${Math.min(a, b)},${Math.max(a, b)}`)
      )
        creases.push({ from: a, to: b, sharpness: crease.sharpness });
    }
    const controls: number[] = globalVertices.flatMap((v: number): number[] =>
      props.cage.positions.slice(3 * v, 3 * v + 3),
    );
    const samples: number[] = globalVertices.flatMap((v: number): number[] => [
      ...(region.samples.get(v) ??
        props.cage.positions.slice(3 * v, 3 * v + 3)),
    ]);
    const anchors: boolean[] = globalVertices.map(
      (v: number): boolean => !inside.has(v) || region.anchors.has(v),
    );
    globalFaces.forEach((f: number, local: number): void => {
      if (!region.faces.has(f))
        for (const v of faces[local]!) anchors[v] = true;
    });
    const regionFaces: Set<number> = new Set(
      globalFaces.flatMap((f: number, i: number): number[] =>
        region.faces.has(f) ? [i] : [],
      ),
    );
    const fitted: ReturnType<typeof fitAutoMovieSubdivisionDomain> =
      fitAutoMovieSubdivisionDomain({
        cage: { positions: samples, faces, creases },
        controlPositions: controls,
        anchors,
        limitTargets: globalVertices.map(
          (v: number): readonly [number, number, number] | null =>
            region.limitTargets.get(v) ?? null,
        ),
        regionFaces,
      });
    maximumEqualityError = Math.max(
      maximumEqualityError,
      fitted.maximumEqualityError,
    );
    let crop: ISubdivisionLevel = admitSubdivisionCage({
      positions: controls,
      faces,
      creases,
    });
    let vertexMap: number[] = globalVertices;
    let faceMap: number[] = globalFaces;
    for (let step: number = 0; step < 2; step++) {
      const whole: ISubdivisionLevel = levels[step]!;
      const nextVertices: number[] = [...vertexMap];
      const nextFaces: number[] = [];
      faceMap.forEach((f: number, local: number): void => {
        for (let k: number = 0; k < 4; k++) {
          const lc: number = crop.topology.faceOffsets[local]! + k;
          const gc: number = whole.topology.faceOffsets[f]! + k;
          nextVertices[
            crop.topology.vertexCount + crop.topology.cornerEdges[lc]!
          ] = whole.topology.vertexCount + whole.topology.cornerEdges[gc]!;
          nextFaces[4 * local + k] = gc;
        }
        nextVertices[
          crop.topology.vertexCount + crop.topology.edgeSharpness.length + local
        ] =
          whole.topology.vertexCount + whole.topology.edgeSharpness.length + f;
      });
      crop = refineSubdivisionLevel(crop);
      vertexMap = nextVertices;
      faceMap = nextFaces;
    }
    vertexMap.forEach((global: number, local: number): void => {
      for (let axis: number = 0; axis < 3; axis++)
        output.positions[3 * global + axis]! +=
          fitted.level.positions[3 * local + axis]! -
          crop.positions[3 * local + axis]!;
    });
  }
  for (let step: number = 2; step < requested; step++)
    output = refineSubdivisionLevel(output);
  return { level: output, maximumEqualityError };
}

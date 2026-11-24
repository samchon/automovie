import {
  createAutoMovieMeshCrossingQuery,
  createAutoMovieMeshWindingQuery,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshGap,
  measureAutoMovieMeshPieces,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshPiece,
  IAutoMovieMeshWinding,
} from "@automovie/interface";

/**
 * Measurements of supplied surfaces in one frame, independent of their
 * construction.
 */
export namespace FamilyConicSurfaceMeasurements {
  /** Original triangle buffers and any exact physical correspondence, in metres. */
  export type Mesh = Pick<
    IAutoMovieMesh,
    "positions" | "indices" | "physicalVertices"
  >;

  /** The declared topology of one orientable, consistently wound component. */
  export interface IPiece {
    /** Number of handles. */
    genus: number;
    /** Number of open boundary loops. A closed component has zero. */
    boundaryLoops: number;
  }

  /** One named solid or empty point, from the caller's own shape or inputs. */
  export interface IProbe {
    /** Name carried into the findings. */
    name: string;
    /** World coordinates in metres, in the supplied mesh frame. */
    point: readonly number[];
    /** A solid point must be inside an outward-wound component. */
    kind: "solid" | "empty";
  }

  /** Expectations may describe a whole figure or an isolated open surface. */
  export interface IExpectation {
    /** Expected components as an unordered list. */
    pieces: readonly IPiece[];
    /** Optional volume samples. Open components can omit them. */
    probes?: readonly IProbe[];
  }

  /** Measurements on the original triangle buffers. */
  export interface IReport {
    /** Actual components and their topology in first-triangle order. */
    pieces: IAutoMovieMeshPiece[];
    /** Winding at each supplied probe in input order. */
    probes: { probe: IProbe; reading: IAutoMovieMeshWinding }[];
    /** Strict original-buffer crossing witnesses. */
    crossings: IAutoMovieMeshCrossing[];
    /** All failed expectations. */
    findings: string[];
  }

  /**
   * Inspect the actual emitted surface. Topology uses the supplied physical
   * correspondence when available. Crossing and winding read the actual world
   * triangles. A caller chooses the number of pieces, the boundary loops, the
   * genera, and any interior or exterior points.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the original metre triangle buffers through the shared welded topology, generalized winding and strict triangle crossing readers.
   * @evidence contracts/development/implementation.md#efficient-algorithms A single winding preparation serves every supplied probe. Absent probes leave winding uncomputed. One crossing census retains at most one witness per input triangle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The surface, topology and named points come from the caller. No reference, underconstrained inference, renamed owner or evaluated stand-in enters the measurements.
   */
  export function measure(mesh: Mesh, expectation: IExpectation): IReport {
    const surface: IAutoMovieMesh = original(mesh);
    const pieces: IAutoMovieMeshPiece[] = measureAutoMovieMeshPieces(surface);
    const findings: string[] = [];
    if (pieces.length !== expectation.pieces.length)
      findings.push(
        `skin has ${pieces.length} welded pieces, expected ${expectation.pieces.length}`,
      );
    for (const piece of pieces)
      if (!piece.manifold || !piece.orientable || !piece.consistentlyWound)
        findings.push(
          `skin piece beginning at triangle ${piece.firstTriangle} must be manifold, orientable and consistently wound`,
        );
    const compare = (a: string, b: string): number => a.localeCompare(b);
    const actual = pieces
      .map(({ genus, boundaryLoops }) => `${genus}/${boundaryLoops}`)
      .sort(compare);
    const expected = expectation.pieces
      .map(({ genus, boundaryLoops }) => `${genus}/${boundaryLoops}`)
      .sort(compare);
    const known = new Set(expected);
    const topologyDiffers =
      actual.length === expected.length
        ? actual.some((piece, index) => piece !== expected[index])
        : actual.some((piece) => !known.has(piece));
    if (topologyDiffers)
      findings.push(
        `skin genus/boundary loops ${actual.join(", ")} differ from ${expected.join(", ")}`,
      );

    const probes: IReport["probes"] = [];
    if (expectation.probes?.length) {
      const winding = createAutoMovieMeshWindingQuery(surface);
      for (const probe of expectation.probes) {
        const reading: IAutoMovieMeshWinding = winding(probe.point);
        probes.push({ probe, reading });
        if (probe.kind === "solid") {
          if (!reading.inside || reading.surface || !(reading.winding > 0))
            findings.push(
              `${probe.name} must be inside the outward-wound skin`,
            );
        } else if (reading.inside || reading.surface)
          findings.push(probe.name + " probe is filled");
      }
    }

    const crossings: IAutoMovieMeshCrossing[] = measureAutoMovieMeshCrossings(
      surface,
      surface,
    );
    if (crossings.length !== 0)
      findings.push(`skin crosses at ${crossings.length} triangles`);
    return { pieces, probes, crossings, findings };
  }

  /**
   * Prepare one explicitly supplied face for pair gaps. When a whole-surface
   * census already ruled out crossings and both faces are subsets of that
   * census, pass false to omit their redundant crossing hierarchies. The caller
   * keeps the supplied geometry fixed while using the preparation.
   */
  export function prepareGap(mesh: Mesh, name: string, checkCrossings = true) {
    const surface: IAutoMovieMesh = original(mesh);
    return {
      distance: measureAutoMovieMeshGap.surface(surface, name),
      surface,
      crosses: checkCrossings
        ? createAutoMovieMeshCrossingQuery(surface).crosses
        : null,
    };
  }

  /** Minimum gap in millimetres. A transverse or coplanar crossing gives zero. */
  export function gap(
    first: ReturnType<typeof prepareGap>,
    second: ReturnType<typeof prepareGap>,
  ): number {
    if (first.crosses?.(second.surface) || second.crosses?.(first.surface))
      return 0;
    return measureAutoMovieMeshGap(first.distance, second.distance) * 1000;
  }

  /** Borrow the caller's buffers without copying or realizing geometry. */
  function original(mesh: Mesh): IAutoMovieMesh {
    return { ...mesh, normals: null, uvs: null, skin: null };
  }
}

import { inspectAutoMovieMeshTopology, AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieMeshTopology } from "@automovie/interface";

/**
 * Observe the one realized construction mesh without copying its buffers.
 * Topology retains the engine's physical-source or position-welded edge
 * identity. Components use exact indices of used triangles independently.
 * Neither measurement accepts the skin or its anatomical openings.
 *
 * @param mesh Same realized metre positions, triangle indices and any owned physical correspondence.
 * @returns The two actual measurements and their explicit scope.
 * @throws Either existing reader's admission failure; no replacement report is fabricated.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Calls the existing topology census and the mechanically extracted raw-index component census once each on one wrapper borrowing the actual realization's buffers. Absent normal/UV/skin attributes remain null.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One host observation owner keeps the two identities explicit; CaptureContext stores its result once and metadata serializes it without another census or realization.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No position welding is added to connectedness, no unused vertex is counted, no mesh is repaired or cloned, and no combined pass or anatomical-opening certificate is inferred.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed metre buffers, both identity rules, actual reader refusals, output scope and unmeasured surface properties.
 * @evidence contracts/development/implementation.md#efficient-algorithms The topology owner scans V vertices and T triangles linearly; the retained component algorithm initializes V parents and performs three path-compressed unions per triangle, conservatively O(V+TV). The wrapper adds constant work and no buffer copy; queryMs separately records this call and is excluded from generationMs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One invocation produces the report shared by both capture consumers. CaptureContext owns its validity for that one immutable realized mesh; no global key or cache is introduced.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reader work tables release after the call. The report retains scalar observations and the existing degenerate-triangle ordinal list, bounded by T, but no input buffer or running resource.
 */
export function FamilyConicMeshTopology(
  mesh: Pick<IAutoMovieMesh, "positions" | "indices" | "physicalVertices">,
): {
  /** Existing engine counts, edge-closedness observation and signed m3 volume. */
  topology: IAutoMovieMeshTopology;

  /** Raw-index components containing used triangles; unused vertices are ignored. */
  usedIndexComponents: number;

  /** Separate topology/component query wall time in milliseconds. */
  queryMs: number;

  /** Limits of these observations, with no automatic geometry verdict. */
  qualification: string;
} {
  const started: number = performance.now();
  const source: IAutoMovieMesh = {
    positions: mesh.positions,
    indices: mesh.indices,
    physicalVertices: mesh.physicalVertices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(source);
  const usedIndexComponents: number = AutoMovieEngineGeometry.countMeshComponents(source);
  return {
    topology,
    usedIndexComponents,
    queryMs: performance.now() - started,
    qualification:
      "same realized buffers; inspect and component queries each run once, with no new source, realization, tessellation or buffer copy; topology uses existing physical-source identity or position-welded edge incidence; components use raw indices of used triangles without welding; edge two-use/volume do not prove winding, vertex-manifoldness, self-intersection freedom, outwardness or preservation of original anatomical openings; no skin acceptance asserted",
  };
}

import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieResolvedPhysicalVertices } from "./IAutoMovieResolvedPhysicalVertices";
import { weldMeshVertices } from "./weldMeshVertices";

/**
 * Resolve actual source-point aliases and current-position legacy vertices.
 * Source pairs are interned in first render occurrence order, independently
 * of ID magnitude or table order. Legacy labels use the existing nanometre
 * grid and never share an identity with an explicit source point. Each source
 * alias must agree on that same grid in the mesh's local metre frame.
 *
 * Omitted correspondence delegates exactly to position welding. Explicit
 * correspondence needs dense aligned arrays, finite XYZ, nonblank domains,
 * safe nonnegative IDs and resident source references. Malformed metadata or
 * separated aliases throw a named physicalVertices refusal; no fallback hides
 * the declaration. Unused and repeated valid source rows are harmless.
 * Returned arrays are owned. Geometry, indices, areas and intersections remain
 * their independent owners' obligations, not a promise of this equivalence.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Resolves source-point incidence independently of contact while retaining current-coordinate legacy incidence.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Admits the source table and per-render correspondence without allocating by opaque ID magnitude.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Refuses malformed correspondence and aliases whose current coordinate-grid cells disagree.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Uses the same coordinate quantization for legacy welding and explicit alias agreement.
 */
export function resolveAutoMovieMeshPhysicalVertices(
  mesh: Pick<IAutoMovieMesh, "positions" | "physicalVertices">,
): IAutoMovieResolvedPhysicalVertices {
  const metadata = mesh.physicalVertices;
  if (metadata === undefined) return weldMeshVertices(mesh.positions);
  const refuse = (reason: string): never => {
    throw new Error(`Mesh physicalVertices ${reason}.`);
  };
  if (
    mesh.positions.length % 3 !== 0 ||
    Array.from(mesh.positions).some((value) => !Number.isFinite(value))
  )
    refuse("needs finite complete XYZ positions");
  if (
    metadata === null ||
    !Array.isArray(metadata.sources) ||
    !Array.isArray(metadata.vertices)
  )
    refuse("needs source and vertex arrays");
  if (metadata.vertices.length !== mesh.positions.length / 3)
    refuse("needs one source reference or null per render vertex");
  const keys: string[] = [];
  for (const source of metadata.sources) {
    if (
      source === undefined ||
      source === null ||
      typeof source.domain !== "string" ||
      source.domain.trim().length === 0 ||
      !Number.isSafeInteger(source.id) ||
      source.id < 0
    )
      refuse("sources need nonblank domains and nonnegative safe integer IDs");
    keys.push(`source:${JSON.stringify([source.domain, source.id])}`);
  }
  const coordinates = weldMeshVertices(mesh.positions);
  const labels: string[] = [];
  const vertices: number[] = [];
  const identities = new Map<string, number>();
  const aliasCells = new Map<string, string>();
  for (let vertex = 0; vertex < metadata.vertices.length; vertex++) {
    const reference = metadata.vertices[vertex];
    if (
      reference !== null &&
      (!Number.isSafeInteger(reference) ||
        reference! < 0 ||
        reference! >= keys.length)
    )
      refuse(`vertices[${vertex}] must be null or a resident source reference`);
    const cell = coordinates.labels[coordinates.vertices[vertex]];
    const key = reference === null ? `legacy:${cell}` : keys[reference!];
    if (reference !== null) {
      const previous = aliasCells.get(key);
      if (previous !== undefined && previous !== cell)
        refuse(`source ${key} aliases disagree on the coordinate grid`);
      aliasCells.set(key, cell);
    }
    let identity = identities.get(key);
    if (identity === undefined) {
      identity = labels.length;
      identities.set(key, identity);
      labels.push(key);
    }
    vertices.push(identity);
  }
  return { labels, vertices };
}

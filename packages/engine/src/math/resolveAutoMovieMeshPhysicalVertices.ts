import { IAutoMovieMesh, IAutoMovieMeshPhysicalVertices } from "@automovie/interface";
import { IAutoMovieResolvedPhysicalVertices } from "./IAutoMovieResolvedPhysicalVertices";
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
 * @evidence contracts/common.md#principled-implementation Explicit domain/id pairs and legacy grid cells use separate first-occurrence interning spaces; every explicit alias must agree on the same nanometre coordinate grid.
 * @evidence contracts/common.md#clear-and-simple-design The identity owner reuses position welding and supplies labels/ordinals to topology, deformation, merge and partition matching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed metadata and separated aliases throw; only omitted correspondence selects legacy welding rather than silently ignoring a declaration.
 * @evidence contracts/common.md#meaningful-documentation Documents key separation, dense numbering, finite positions, source-reference admission, alias agreement and geometry properties identity alone cannot establish.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and S source rows, key construction, welding and interning use O(V plus S) expected map work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One weld table supplies all alias-cell comparisons, and each source key is constructed once for all its render references.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Interning maps are released on return; caller-owned labels and ordinals are bounded by source/render populations and retain no source-buffer reference.
 */
export function resolveAutoMovieMeshPhysicalVertices(
  mesh: Pick<IAutoMovieMesh, "positions" | "physicalVertices">,
): IAutoMovieResolvedPhysicalVertices {
  const metadata: IAutoMovieMeshPhysicalVertices | undefined = mesh.physicalVertices;
  if (metadata === undefined) return weldMeshVertices(mesh.positions);
  const refuse: (reason: string) => never = (reason: string): never => {
    throw new Error(`Mesh physicalVertices ${reason}.`);
  };
  if (
    mesh.positions.length % 3 !== 0 ||
    Array.from(mesh.positions).some((value: number): boolean => !Number.isFinite(value))
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
  const coordinates: { labels: string[]; vertices: number[]; } = weldMeshVertices(mesh.positions);
  const labels: string[] = [];
  const vertices: number[] = [];
  const identities: Map<string, number> = new Map<string, number>();
  const aliasCells: Map<string, string> = new Map<string, string>();
  for (let vertex: number = 0; vertex < metadata.vertices.length; vertex++) {
    const reference: number | null = metadata.vertices[vertex];
    if (
      reference !== null &&
      (!Number.isSafeInteger(reference) ||
        reference! < 0 ||
        reference! >= keys.length)
    )
      refuse(`vertices[${vertex}] must be null or a resident source reference`);
    const cell: string = coordinates.labels[coordinates.vertices[vertex]];
    const key: string = reference === null ? `legacy:${cell}` : keys[reference!];
    if (reference !== null) {
      const previous: string | undefined = aliasCells.get(key);
      if (previous !== undefined && previous !== cell)
        refuse(`source ${key} aliases disagree on the coordinate grid`);
      aliasCells.set(key, cell);
    }
    let identity: number | undefined = identities.get(key);
    if (identity === undefined) {
      identity = labels.length;
      identities.set(key, identity);
      labels.push(key);
    }
    vertices.push(identity);
  }
  return { labels, vertices };
}

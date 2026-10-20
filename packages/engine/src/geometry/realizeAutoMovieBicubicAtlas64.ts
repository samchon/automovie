import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieMesh,
} from "@automovie/interface";

import { admitAutoMovieBicubicAtlas } from "./admitAutoMovieBicubicAtlas";
import { tessellateAutoMovieBicubicAtlas64 as T } from "./curve/tessellateAutoMovieBicubicAtlas64";

/**
 * Realize the public metre-valued bicubic recipe through its owning engine.
 * The polynomial kernel receives millimetres once and returns model metres.
 * Complete prior chunks survive a declared output budget; no source mesh is read.
 * Shared physical identities and actual global indices remain unchanged.
 * complete describes the retained patch domain, while approximationQualified
 * separately states whether the requested field-to-triangle estimate was met.
 * Retained coarse cells can preserve a complete domain with approximation false;
 * source-fit and normal qualifications remain independent of both fields.
 * After streaming ends, unreferenced render vertices left by a local omission
 * are compacted out. Triangle ordinals and physical domain/ID pairs remain the
 * same; only the returned render indices and source-table slots are remapped.
 * Requested triangle parameters retain actual chart coordinates per corner,
 * aligned with triangle ordinals and primitiveRanges, through that compaction.
 * A shared render vertex can have different incident chart coordinates; these
 * records are not per-vertex UV0, skin weights or semantic surface addresses.
 * Optional patch coefficients are the actual post-binding kernel grids in mm,
 * filtered to patches with retained triangles. They let construction consume
 * that same field instead of re-evaluating a pre-binding recipe. Omitted/false
 * retains no coefficient snapshots; invalid retention flags reject before work.
 *
 * @evidence contracts/common.md#principled-implementation Complete Bernstein coefficients and shared control identities feed the adaptive atlas operator; unit conversion is explicit and returned indices are appended without coordinate matching.
 * @evidence contracts/common.md#clear-and-simple-design One public-recipe adapter serves viewer, measurements and artifact compilation, separating structural admission from polynomial evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No external mesh, source normal, fallback primitive or hidden coefficient correction supplies geometry; partial resource output retains its diagnostics.
 * @evidence contracts/common.md#meaningful-documentation States units, physical identity, budget cancellation, partial realization and the absence of source-fidelity certification.
 * @evidence contracts/performance.md#efficient-algorithms Admission scans controls, patches and canonical declarations and sorts retained control IDs; conversion is linear in those retained values. The kernel owns adaptive costs. Appending and final omission compaction cost O(V+F), without regeneration or coordinate comparison.
 * @evidence contracts/performance.md#reuse-equivalent-work Each geometry call realizes one recipe once; callers own reuse across unchanged model records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One bounded generator chunk and at most maxVertices output vertices are retained. Requested triangle parameters add six numbers per retained output triangle and no buffer when disabled. O(V) scalar remapping scratch is allocated only after a local omission or zero-area output. Cancellation closes the generator; compacted mesh, ownership, optional parameters and diagnostics transfer to the caller.
 */
export function realizeAutoMovieBicubicAtlas64(
  input: IAutoMovieBicubicAtlasGeometry,
  options: {
    /** Retain actual patch-local triangle-corner parameters for downstream surface consumers; omitted allocates none. */
    retainTriangleParameters?: boolean;
    /** Retain actual canonically bound grids for construction and field consumers; omitted allocates none. */
    retainPatchCoefficients?: boolean;
  } = {},
): {
  mesh: IAutoMovieMesh;
  /** Requested [u0,v0,u1,v1,u2,v2] per retained triangle, with patch ownership in primitiveRanges. */
  triangleParameters?: number[];
  /** Requested prepared coefficient grids in mm; only patches with retained triangles are included. */
  patchCoefficients?: NonNullable<T.Summary["patchCoefficients"]>;
  complete: boolean;
  approximationQualified: boolean;
  diagnostics: string[];
  counts: {
    retainedCoarseCells: number;
    omittedZeroAreaTriangles: number;
    unresolvedVertexNormals: number;
    maxErrorBoundMm: number;
  };
  primitiveRanges: {
    patch: string;
    firstTriangle: number;
    triangleCount: number;
    u0: number;
    u1: number;
    v0: number;
    v1: number;
    approximationBoundMm: number;
  }[];
} {
  if (
    options.retainTriangleParameters !== undefined &&
    typeof options.retainTriangleParameters !== "boolean"
  )
    throw new Error("Triangle parameter retention must be boolean");
  if (
    options.retainPatchCoefficients !== undefined &&
    typeof options.retainPatchCoefficients !== "boolean"
  )
    throw new Error("Patch coefficient retention must be boolean");
  let patchCoefficients: T.Summary["patchCoefficients"] =
    options.retainPatchCoefficients ? [] : undefined;
  const admitted: ReturnType<typeof admitAutoMovieBicubicAtlas> =
    admitAutoMovieBicubicAtlas(input);
  const triangleParameters: number[] | undefined =
    options.retainTriangleParameters ? [] : undefined;
  const mesh: IAutoMovieMesh = {
    positions: [],
    normals: [],
    indices: [],
    uvs: null,
    skin: null,
    physicalVertices: { sources: [], vertices: [] },
  };
  const primitiveRanges: {
    patch: string;
    firstTriangle: number;
    triangleCount: number;
    u0: number;
    u1: number;
    v0: number;
    v1: number;
    approximationBoundMm: number;
  }[] = [];
  const diagnostics: string[] = [...admitted.diagnostics];
  const counts: {
    retainedCoarseCells: number;
    omittedZeroAreaTriangles: number;
    unresolvedVertexNormals: number;
    maxErrorBoundMm: number;
  } = {
    retainedCoarseCells: 0,
    omittedZeroAreaTriangles: 0,
    unresolvedVertexNormals: 0,
    maxErrorBoundMm: 0,
  };
  if (!admitted.patches.length)
    return {
      mesh,
      ...(triangleParameters === undefined ? {} : { triangleParameters }),
      ...(patchCoefficients === undefined ? {} : { patchCoefficients }),
      complete: false,
      approximationQualified: false,
      diagnostics,
      primitiveRanges,
      counts,
    };
  const slots: Map<number, number> = new Map(
    admitted.controls.map((id: number, slot: number): [number, number] => [
      id,
      slot,
    ]),
  );
  const iterator: ReturnType<typeof T> = T({
    ...(options.retainPatchCoefficients
      ? { retainPatchCoefficients: true }
      : {}),
    topologyDomain: input.topologyDomain,
    controlsMm: admitted.controls.map(
      (id: number): [number, number, number] => {
        const point: IAutoMovieBicubicAtlasGeometry["controls"][number] =
          input.controls[id]!;
        return [point.x * 1000, point.y * 1000, point.z * 1000];
      },
    ),
    patches: admitted.patches.map(
      (id: number): { id: string; controlIds: number[] } => ({
        id: input.patches[id]!.id,
        controlIds: input.patches[id]!.controlIds.map(
          (control: number): number => slots.get(control)!,
        ),
      }),
    ),
    boundaryAuthorities: admitted.boundaryAuthorities.map(
      (
        authority: NonNullable<
          IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
        >[number],
      ): NonNullable<T.Input["boundaryAuthorities"]>[number] => ({
        id: authority.id,
        controlIds: authority.controlIds.map(
          (id: number): number => slots.get(id)!,
        ) as [number, number, number, number],
      }),
    ),
    boundaryBindings: admitted.boundaryBindings,
    toleranceMm: input.tolerance * 1000,
    maxCells: input.maxCells,
    cellBudgetPolicy: input.cellBudgetPolicy,
    maxVerticesPerChunk: Math.min(4096, input.maxVertices),
    vertexOffset: 0,
    retainTriangleParameters: options.retainTriangleParameters,
  });
  const physical: Map<string, number> = new Map();
  let complete: boolean = admitted.patches.length === input.patches.length;
  let approximationQualified: boolean = false;
  try {
    let result: ReturnType<typeof iterator.next> = iterator.next();
    while (!result.done) {
      const chunk: T.Chunk = result.value,
        vertexCount: number = mesh.positions.length / 3;
      if (vertexCount + chunk.positions.length / 3 > input.maxVertices) {
        complete = false;
        diagnostics.push(
          `resource-unprocessed: maxVertices before patch ${chunk.patch}`,
        );
        break;
      }
      if (
        chunk.vertexStart !== vertexCount ||
        chunk.positions.length !== chunk.normals.length ||
        chunk.positions.length / 3 !== chunk.physicalVertexIds.length ||
        (triangleParameters !== undefined &&
          chunk.triangleParameters?.length !== chunk.indices.length * 2) ||
        chunk.indices.some(
          (index: number): boolean =>
            !Number.isSafeInteger(index) ||
            index < 0 ||
            index >= vertexCount + chunk.positions.length / 3,
        )
      )
        throw new Error(
          "Atlas engine violated append-only shared mesh identity",
        );
      const firstTriangle: number = mesh.indices!.length / 3;
      if (
        patchCoefficients !== undefined &&
        chunk.indices.length > 0 &&
        chunk.patchCoefficients !== undefined &&
        !patchCoefficients.some(
          (
            patch: NonNullable<T.Summary["patchCoefficients"]>[number],
          ): boolean => patch.patch === chunk.patch,
        )
      )
        patchCoefficients.push({
          patch: chunk.patch,
          gridMm: chunk.patchCoefficients,
        });
      for (const value of chunk.positions) mesh.positions.push(value);
      for (const value of chunk.normals) mesh.normals!.push(value);
      for (const value of chunk.indices) mesh.indices!.push(value);
      if (triangleParameters !== undefined)
        for (const value of chunk.triangleParameters!)
          triangleParameters.push(value);
      for (let i: number = 0; i < chunk.physicalVertexIds.length; i++) {
        const id: number = vertexCount + i;
        const identity: string = chunk.physicalVertexIds[i]!;
        let owner: number | undefined = physical.get(identity);
        if (owner === undefined) {
          owner = mesh.physicalVertices!.sources.length;
          physical.set(identity, owner);
          mesh.physicalVertices!.sources.push({
            domain: input.topologyDomain,
            id,
          });
        }
        mesh.physicalVertices!.vertices.push(owner);
      }
      for (const range of chunk.faceRanges)
        primitiveRanges.push({
          patch: chunk.patch,
          firstTriangle: firstTriangle + range.triangleStart,
          triangleCount: range.triangleCount,
          u0: range.u0,
          u1: range.u1,
          v0: range.v0,
          v1: range.v1,
          approximationBoundMm: range.approximationBoundMm,
        });
      counts.retainedCoarseCells += chunk.counts.retainedCoarseCells;
      counts.omittedZeroAreaTriangles += chunk.counts.omittedZeroAreaTriangles;
      counts.unresolvedVertexNormals += chunk.counts.unresolvedVertexNormals;
      counts.maxErrorBoundMm = Math.max(
        counts.maxErrorBoundMm,
        chunk.counts.maxErrorBoundMm,
      );
      for (const diagnostic of chunk.diagnostics) diagnostics.push(diagnostic);
      result = iterator.next();
    }
    if (result.done) {
      if (patchCoefficients !== undefined) {
        const retained: Set<string> = new Set(
          primitiveRanges.map(
            (range: (typeof primitiveRanges)[number]): string => range.patch,
          ),
        );
        patchCoefficients = (result.value.patchCoefficients ?? []).filter(
          (
            patch: NonNullable<T.Summary["patchCoefficients"]>[number],
          ): boolean => retained.has(patch.patch),
        );
      }
      complete &&= result.value.omittedPatches === 0;
      approximationQualified = result.value.approximationQualified && complete;
      for (const diagnostic of result.value.diagnostics)
        diagnostics.push(diagnostic);
    }
  } finally {
    iterator.return({
      patches: 0,
      omittedPatches: 0,
      approximationQualified: false,
      retainedCoarseCells: 0,
      vertices: 0,
      triangles: 0,
      diagnostics: [],
    });
  }
  if (!complete || counts.omittedZeroAreaTriangles || !mesh.indices!.length) {
    // Streaming consumers may still refer to earlier suffixes, so compaction
    // belongs after generator completion/cancellation, never inside a chunk.
    const vertexCount: number = mesh.positions.length / 3,
      remap: Float64Array = new Float64Array(vertexCount).fill(-1);
    for (const index of mesh.indices!) remap[index] = 0;
    let retained: number = 0;
    for (let old: number = 0; old < vertexCount; old++)
      if (remap[old] === 0) {
        remap[old] = retained;
        for (let axis: number = 0; axis < 3; axis++) {
          mesh.positions[retained * 3 + axis] = mesh.positions[old * 3 + axis]!;
          mesh.normals![retained * 3 + axis] = mesh.normals![old * 3 + axis]!;
        }
        mesh.physicalVertices!.vertices[retained] =
          mesh.physicalVertices!.vertices[old]!;
        retained++;
      }
    if (retained !== vertexCount) {
      for (let i: number = 0; i < mesh.indices!.length; i++)
        mesh.indices![i] = remap[mesh.indices![i]!]!;
      mesh.positions.length = retained * 3;
      mesh.normals!.length = retained * 3;
      mesh.physicalVertices!.vertices.length = retained;
      remap.fill(-1);
      const sources: NonNullable<
        IAutoMovieMesh["physicalVertices"]
      >["sources"] = [];
      for (let i: number = 0; i < retained; i++) {
        const original: number | null = mesh.physicalVertices!.vertices[i]!;
        if (original === null)
          throw new Error(
            "Generated atlas vertices require explicit physical ownership",
          );
        if (remap[original] === -1) {
          remap[original] = sources.length;
          sources.push(mesh.physicalVertices!.sources[original]!);
        }
        mesh.physicalVertices!.vertices[i] = remap[original]!;
      }
      mesh.physicalVertices!.sources = sources;
      diagnostics.push(
        `Omitted ${vertexCount - retained} unreferenced generated render vertices after local omissions; retained physical identities and triangle ordinals are unchanged`,
      );
    }
  }
  return {
    mesh,
    ...(patchCoefficients === undefined ? {} : { patchCoefficients }),
    ...(triangleParameters === undefined ? {} : { triangleParameters }),
    complete,
    approximationQualified,
    diagnostics,
    primitiveRanges,
    counts,
  };
}

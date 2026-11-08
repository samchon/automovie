import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * Display the adopted reference's two native static meshes without fitting or reconstructing them.
 *
 * Coordinates and vertex addressing stay in the artifact's metre frame. Cropping excludes an
 * original triangle unless all three vertices pass the millimetre-space predicate; it adds no
 * intersection vertex or cap. Boundary triangles can therefore disappear. Positions stay whole,
 * so ordinary mesh bounds can include unused vertices and require explicit camera framing.
 *
 * @evidence contracts/common.md#principled-implementation Adopts only native head/body indexed static meshes with null identity transforms, finite metre positions and valid triangle references; preserves position values and retained triangle order/winding exactly.
 * @evidence contracts/common.md#clear-and-simple-design This pure display adapter owns static compatibility and triangle exclusion; file discovery, source hashes and section-based diagnostics have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no region remapping, fit, scale, reconstruction or hole filling. Incompatible artifacts throw for the loader to diagnose and display its existing section fallback.
 * @evidence contracts/common.md#meaningful-documentation States the adopted frame, crop boundary loss, borrowed position ownership and bounds limitation. Null normals let the ordinary viewer derive normals from the displayed triangles.
 * @evidence contracts/performance.md#efficient-algorithms Scans V vertices and T triangles in O(V+T), including V keep calls; a predicate with B crop boxes adds O(VB).
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows original position arrays and shares original indices when no triangle is excluded; no Human source or loft is evaluated here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns borrowed source positions, at most O(T) filtered indices and constant-size bounds per native part; temporary flags end with each part. No cache, file or GPU handle is acquired.
 */
export function HumanInspectionReferenceMesh(
  model: IAutoMovieModel,
  keep: (
    region: string,
    x: number,
    y: number,
    z: number,
  ) => boolean = (): boolean => true,
): {
  parts: IAutoMovieModelPart[];
  regions: {
    name: string;
    vertices: number;
    triangles: number;
    keptTriangles: number;
    boundsMetres: { minimum: number[]; maximum: number[] };
  }[];
  crop: "original-triangle-exclusion-without-caps";
} {
  if (
    model.skeleton !== null ||
    model.parts.length !== 2 ||
    !["head", "body"].every(
      (name: string): boolean =>
        model.parts.filter(
          (part: IAutoMovieModelPart): boolean => part.id === name,
        ).length === 1,
    )
  )
    throw new Error(
      "Reference mesh requires exactly the native static head/body parts",
    );
  const parts: IAutoMovieModelPart[] = [];
  const regions: ReturnType<typeof HumanInspectionReferenceMesh>["regions"] = [];
  for (const part of model.parts) {
    if (
      part.transform !== null ||
      part.attachedBone !== null ||
      part.geometry.type !== "mesh"
    )
      throw new Error(
        "Reference mesh " +
          part.id +
          " must have untransformed static triangle geometry",
      );
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const positions: number[] = mesh.positions;
    const indices: number[] | null = mesh.indices;
    if (
      mesh.skin !== null ||
      (mesh.targets?.length ?? 0) !== 0 ||
      positions.length < 9 ||
      positions.length % 3 !== 0 ||
      !positions.every(Number.isFinite) ||
      indices === null ||
      indices.length < 3 ||
      indices.length % 3 !== 0 ||
      !indices.every(
        (index: number): boolean =>
          Number.isSafeInteger(index) &&
          index >= 0 &&
          index < positions.length / 3,
      )
    )
      throw new Error(
        "Reference mesh " +
          part.id +
          " has incompatible static vertex/triangle buffers",
      );
    const minimum: number[] = [Infinity, Infinity, Infinity];
    const maximum: number[] = [-Infinity, -Infinity, -Infinity];
    const selected: boolean[] = [];
    for (let i: number = 0; i < positions.length; i += 3) {
      for (let c: number = 0; c < 3; c++) {
        minimum[c] = Math.min(minimum[c]!, positions[i + c]!);
        maximum[c] = Math.max(maximum[c]!, positions[i + c]!);
      }
      selected.push(
        keep(
          part.id,
          positions[i]! * 1000,
          positions[i + 1]! * 1000,
          positions[i + 2]! * 1000,
        ),
      );
    }
    const kept: number[] = [];
    for (let i: number = 0; i < indices.length; i += 3)
      if (
        selected[indices[i]!] &&
        selected[indices[i + 1]!] &&
        selected[indices[i + 2]!]
      )
        kept.push(indices[i]!, indices[i + 1]!, indices[i + 2]!);
    regions.push({
      name: part.id,
      vertices: positions.length / 3,
      triangles: indices.length / 3,
      keptTriangles: kept.length / 3,
      boundsMetres: { minimum, maximum },
    });
    if (kept.length === 0) continue;
    parts.push({
      id: "human.skin.reference." + part.id + "/0",
      name: "native reference " + part.id,
      attachedBone: null,
      material: null,
      transform: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions,
          indices: kept.length === indices.length ? indices : kept,
          normals: null,
          uvs: null,
          skin: null,
        },
      },
    });
  }
  return { parts, regions, crop: "original-triangle-exclusion-without-caps" };
}

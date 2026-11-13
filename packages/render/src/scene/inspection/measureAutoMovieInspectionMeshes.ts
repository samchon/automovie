import type { IAutoMovieMeshDefect } from "@automovie/engine";
import * as THREE from "three";

import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionDefects } from "./measureAutoMovieInspectionDefects.js";
import { measureAutoMovieInspectionEdges } from "./measureAutoMovieInspectionEdges.js";

/**
 * Find the meshes an inspection draws and measure on them the kinds it measures itself and the request asks for: the `edge` kind and the `defect/<kind>` kinds.
 *
 * A mesh is drawn when it and its ancestors are visible and it has a position buffer; batched meshes are not. Edges and defects are measured on every drawn mesh `hidden` does not leave out, whether or not `parts` selects it, so a pattern can name one of its marks alone. `defects` are the engine defect kinds that exist under the request: the sliver kind only while a sliver limit is set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which meshes are drawn, which are measured and why selection does not narrow them, and which defect kinds exist.
 * @evidence contracts/development/implementation.md#principled-implementation Every mesh has edges and defects, so the inspection measures them as the renderer draws the meshes; a mark's path decides its selection afterwards, as for any supplied mark.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass listing the drawn meshes, then one producer call per kind family and mesh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mesh is skipped by name, and a kind not asked is not measured.
 * @evidence contracts/development/implementation.md#efficient-algorithms Measurement runs only for asked kinds, and defects once per geometry through one shared cache.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The defect cache is shared by every mesh of the call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The measured records live as long as the caller keeps them; the cache dies with the call.
 */
export function measureAutoMovieInspectionMeshes(props: {
  /** Every drawn object of the scene with its path. */
  drawn: readonly IAutoMovieInspectionPath[];

  /** The engine defect kinds that exist under the request. */
  defects: readonly IAutoMovieMeshDefect.Kind[];

  /** Sliver aspect limit, or null. */
  sliver: number | null;

  /** Whether the request asks for a kind. */
  asks: (kind: string) => boolean;

  /** Whether `hide` leaves a path out. */
  hidden: (path: string) => boolean;
}): {
  meshes: { path: string; mesh: THREE.Mesh }[];
  measured: IAutoMovieInspectionMeasured[];
} {
  const meshes: { path: string; mesh: THREE.Mesh }[] = [];
  for (const { path, object } of props.drawn)
    if (
      object instanceof THREE.Mesh &&
      (object as { isBatchedMesh?: boolean }).isBatchedMesh !== true &&
      object.geometry.hasAttribute("position") &&
      shown(object)
    )
      meshes.push({ path, mesh: object });

  const measured: IAutoMovieInspectionMeasured[] = [];
  const kept: { path: string; mesh: THREE.Mesh }[] = meshes.filter(
    ({ path }: { path: string }): boolean => !props.hidden(path),
  );
  if (props.asks("edge"))
    for (const { path, mesh } of kept)
      measured.push(measureAutoMovieInspectionEdges({ mesh, path }));
  const kinds: Set<IAutoMovieMeshDefect.Kind> =
    new Set<IAutoMovieMeshDefect.Kind>(
      props.defects.filter((kind: IAutoMovieMeshDefect.Kind): boolean =>
        props.asks(`defect/${kind}`),
      ),
    );
  if (kinds.size !== 0) {
    const cache: Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]> = new Map<
      THREE.BufferGeometry,
      IAutoMovieMeshDefect[]
    >();
    for (const { path, mesh } of kept)
      measured.push(
        measureAutoMovieInspectionDefects({
          mesh,
          path,
          kinds,
          sliver: props.sliver,
          measured: cache,
        }),
      );
  }
  return { meshes, measured };
}

/** Whether an object and every ancestor are visible. */
function shown(object: THREE.Object3D): boolean {
  for (
    let current: THREE.Object3D | null = object;
    current !== null;
    current = current.parent
  )
    if (!current.visible) return false;
  return true;
}

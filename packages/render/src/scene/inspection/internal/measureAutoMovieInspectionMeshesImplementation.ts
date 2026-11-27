import type { IAutoMovieMeshDefect } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import type { IAutoMovieInspectionMeasured } from "../IAutoMovieInspectionMeasured.js";
import { AutoMovieRenderInspectionGeometry } from "../AutoMovieRenderInspectionGeometry.js";

/**
 * Find the meshes an inspection draws and measure on them the kinds it measures
 * itself and the request asks for: the `edge` kind and the `defect/<kind>`
 * kinds.
 *
 * A mesh is drawn when it and its ancestors are visible and it has a position
 * buffer; batched meshes are not. Edges and defects are measured on every drawn
 * mesh `hidden` does not leave out, whether or not `parts` selects it, so a
 * pattern can name one of its marks alone. `defects` are the engine defect
 * kinds that exist under the request: the sliver kind only while a sliver limit
 * is set.
 */
export function measureAutoMovieInspectionMeshesImplementation(
  props: AutoMovieRenderInspectionGeometry.MeasureMeshes.IProps,
): AutoMovieRenderInspectionGeometry.MeasureMeshes.IResult {
  const meshes: { path: string; mesh: THREE.Mesh }[] = [];
  for (const { path, object } of props.drawn)
    if (
      AutoMovieThreeKind.isMesh(object) &&
      !AutoMovieThreeKind.isBatchedMesh(object) &&
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
      measured.push(AutoMovieRenderInspectionGeometry.measureEdges({ mesh, path }));
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
        AutoMovieRenderInspectionGeometry.measureDefects({
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

import {
  type IAutoMovieMeshDefect,
  measureAutoMovieMeshDefects,
} from "@automovie/engine";
import * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import { applyAutoMovieSectionPlanes } from "../applyAutoMovieSectionPlanes.js";
import { restoreAutoMovieRenderModeOnce } from "../restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_INSPECTION_PALETTE } from "./AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IApplyAutoMovieInspectionProps } from "./IApplyAutoMovieInspectionProps.js";
import type { IAutoMovieInspectionConstruction } from "./IAutoMovieInspectionConstruction.js";
import type { IAutoMovieInspectionHandle } from "./IAutoMovieInspectionHandle.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";
import { applyAutoMovieInspectionShade } from "./applyAutoMovieInspectionShade.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { buildAutoMovieInspectionCurves } from "./buildAutoMovieInspectionCurves.js";
import { buildAutoMovieInspectionDefects } from "./buildAutoMovieInspectionDefects.js";
import { listAutoMovieInspectionPaths } from "./listAutoMovieInspectionPaths.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionBounds } from "./measureAutoMovieInspectionBounds.js";
import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";

/**
 * Turn a built scene into the picture an inspection request asks for, in place, and return the handle that keeps its shade and marks current and puts the scene back.
 *
 * The same applied scene is drawn by the browser renderer and by the CPU rasterizer, so a view on the page and a still made in Node show the same thing. In order:
 *
 * 1. **Selection.** Every drawn object has a path, and a construction curve has the path of its form's object followed by the curve's part. An object or curve is selected when `parts` is empty or one of its patterns matches, and no `hide` pattern matches. A pattern that matches no object and no curve throws before anything changes, so a mistyped name is not an empty picture.
 * 2. **Isolation.** Unselected objects, and every mesh when `surface` is off, are taken off all layers. A layer is tested per object, so the objects beneath an isolated one stay as they were selected, which hiding it would not allow.
 * 3. **Shade.** Surfaces are coloured by `shade`. The `outline` pass draws its shells around the selected meshes only. The `pose` pass draws the skeleton of the whole scene, since a bone is not a drawn object and has no path to select.
 * 4. **Marks.** Selected curves of the asked kinds are drawn from the supplied constructions. Defects are measured once per geometry on every selected mesh whose ancestors are visible, and the asked kinds are drawn on it; batched meshes are not measured.
 * 5. **Wire.** With `wire`, every mesh material that has a wireframe switch draws edges.
 * 6. **Section.** With `section`, the plane is given to every material in the scene, marks included. It cuts three.js's built-in materials, the viewer's guide passes and inspection shades, and the marks. In the browser a film's own shader material is cut only when its shader includes three.js's clipping chunks, while the CPU rasterizer cuts every material.
 *
 * The legend lists each mark colour with the number of curves or defects drawn in it. Under the faces shade it also lists the two surface colours with the number of surfaces shaded, since which side shows depends on the view. `selected` lists the paths the request selected.
 *
 * A failure at any step undoes the steps before it and throws. An engine refusal while measuring a mesh is rethrown naming the mesh's path.
 *
 * ```ts
 * const inspection = applyAutoMovieInspection({ scene, request, constructions });
 * try {
 *   production.seek(2.4);
 *   inspection.update();
 *   const frame = rasterizeAutoMovieScene({ scene, camera, width: 960, height: 960 });
 * } finally {
 *   inspection.restore();
 * }
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared result for both renderers, each step with its rule and reason, what the legend counts, the failure behaviour, and shows the apply, seek, update, draw and restore order.
 * @evidence contracts/development/implementation.md#principled-implementation Each step changes one kind of scene state and records how to put it back, and the steps are ordered so that a later one sees the earlier one's result: overrides exist before wireframe and clipping are set on them, and marks exist before the cut.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Six steps in the documented order sharing one undo list; selection, shade, marks, bounds and legend tally each belong to their own module.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Objects are chosen by path pattern only, an unmatched pattern is refused, prior layers and clipping state are recorded and put back instead of reset to defaults, and a setup failure never leaves the scene half inspected.
 * @evidence contracts/development/implementation.md#efficient-algorithms Selection is decided once per distinct path, defects are measured once per geometry however many meshes share it, and each frame costs one world-matrix pass plus the marks and, under the outline or pose pass, its shells or bone links.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Guide passes, material overrides, section planes, restoration and the once guard are the viewer's existing owners; defect measurement is the engine's.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The handle owns the overlay group, the override materials and the recorded prior state until `restore`, which releases all of them once; the scene's own objects and materials are borrowed.
 */
export function applyAutoMovieInspection(
  props: IApplyAutoMovieInspectionProps,
): IAutoMovieInspectionHandle {
  const { scene, request } = props;
  const constructions: readonly IAutoMovieInspectionConstruction[] =
    props.constructions ?? [];
  if (!(Number.isFinite(request.stroke) && request.stroke > 0))
    throw new Error(
      `Inspection stroke ${request.stroke} is not a positive width`,
    );

  // Selection: paths of drawn objects and of curves, one verdict per distinct path.
  const drawn: IAutoMovieInspectionPath[] = listAutoMovieInspectionPaths(scene);
  const curvePaths: string[][] = constructions.map(
    (construction: IAutoMovieInspectionConstruction): string[] => {
      const base: string = autoMovieInspectionPathOf(
        scene,
        construction.parent,
      );
      return construction.curves.map((curve: { part: string }): string =>
        base === "" ? curve.part : `${base}/${curve.part}`,
      );
    },
  );
  const known: Set<string> = new Set<string>([
    ...drawn.map((entry: IAutoMovieInspectionPath): string => entry.path),
    ...curvePaths.flat(),
  ]);
  const unmatched: string[] = [...request.parts, ...request.hide].filter(
    (pattern: string): boolean =>
      ![...known].some((path: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      ),
  );
  if (unmatched.length !== 0)
    throw new Error(
      `Inspection patterns match no object or curve of the scene: ${unmatched.join(", ")}`,
    );
  const verdicts: Map<string, boolean> = new Map<string, boolean>();
  const selects: (path: string) => boolean = (path: string): boolean => {
    let verdict: boolean | undefined = verdicts.get(path);
    if (verdict === undefined) {
      verdict =
        (request.parts.length === 0 ||
          request.parts.some((pattern: string): boolean =>
            matchAutoMovieInspectionPath(path, pattern),
          )) &&
        !request.hide.some((pattern: string): boolean =>
          matchAutoMovieInspectionPath(path, pattern),
        );
      verdicts.set(path, verdict);
    }
    return verdict;
  };

  // The meshes a defect is measured on and a face colour counted for, read before any state changes.
  const meshes: { path: string; mesh: THREE.Mesh }[] = [];
  for (const { path, object } of drawn)
    if (
      object instanceof THREE.Mesh &&
      (object as { isBatchedMesh?: boolean }).isBatchedMesh !== true &&
      object.geometry.hasAttribute("position") &&
      selects(path) &&
      shown(object)
    )
      meshes.push({ path, mesh: object });

  const undo: (() => void)[] = [];
  const overlays: IAutoMovieInspectionOverlay[] = [];
  try {
    // Isolation: off every layer, which leaves the objects beneath as selected.
    const masks: Map<THREE.Object3D, number> = new Map<
      THREE.Object3D,
      number
    >();
    undo.push((): void => {
      for (const [object, mask] of masks) object.layers.mask = mask;
    });
    for (const { path, object } of drawn)
      if (
        !selects(path) ||
        (!request.surface && object instanceof THREE.Mesh)
      ) {
        masks.set(object, object.layers.mask);
        object.layers.mask = 0;
      }

    // Shade: the override owns its own failure, so the undo is recorded once it stands.
    const shade: { update: () => void; restore: () => void } =
      applyAutoMovieInspectionShade(scene, request.shade);
    undo.push(shade.restore);

    // Marks: one group at the scene root, each overlay released before the group leaves.
    const group: THREE.Group = new THREE.Group();
    scene.add(group);
    undo.push((): void => {
      scene.remove(group);
    });
    const attach: (overlay: IAutoMovieInspectionOverlay) => void = (
      overlay: IAutoMovieInspectionOverlay,
    ): void => {
      undo.push(overlay.dispose);
      group.add(overlay.object);
      overlays.push(overlay);
    };
    const style: { stroke: number; xray: boolean } = {
      stroke: request.stroke,
      xray: request.xray,
    };
    constructions.forEach(
      (construction: IAutoMovieInspectionConstruction, c: number): void => {
        const curves: IAutoMovieInspectionConstruction["curves"] =
          construction.curves.filter(
            (
              curve: { kind: (typeof request.curves)[number] },
              i: number,
            ): boolean =>
              request.curves.includes(curve.kind) &&
              selects(curvePaths[c]![i]!),
          );
        if (curves.length !== 0)
          attach(
            buildAutoMovieInspectionCurves(
              { parent: construction.parent, curves },
              style,
            ),
          );
      },
    );
    const wanted: Set<IAutoMovieMeshDefect.Kind> =
      new Set<IAutoMovieMeshDefect.Kind>(request.defects);
    if (request.sliver !== null) wanted.add("sliver");
    if (wanted.size !== 0) {
      const measured: Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]> =
        new Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]>();
      for (const { path, mesh } of meshes) {
        let defects: IAutoMovieMeshDefect[] | undefined = measured.get(
          mesh.geometry,
        );
        if (defects === undefined) {
          defects = measure(mesh.geometry, path, request.sliver).filter(
            (defect: IAutoMovieMeshDefect): boolean => wanted.has(defect.kind),
          );
          measured.set(mesh.geometry, defects);
        }
        if (defects.length !== 0)
          attach(buildAutoMovieInspectionDefects(mesh, defects, style));
      }
    }

    // Wire: every mesh material that has the switch, overrides included.
    if (request.wire) {
      const flags: Map<THREE.Material & { wireframe: boolean }, boolean> =
        new Map<THREE.Material & { wireframe: boolean }, boolean>();
      undo.push((): void => {
        for (const [material, flag] of flags) material.wireframe = flag;
      });
      scene.traverse((object: THREE.Object3D): void => {
        if (!(object instanceof THREE.Mesh)) return;
        for (const material of materialsOf(object)) {
          const holder: THREE.Material & { wireframe?: unknown } = material;
          if (typeof holder.wireframe !== "boolean") continue;
          const wired: THREE.Material & { wireframe: boolean } =
            holder as THREE.Material & { wireframe: boolean };
          if (flags.has(wired)) continue;
          flags.set(wired, wired.wireframe);
          wired.wireframe = true;
        }
      });
    }

    // Section: the plane owner overwrites clipping state, so the prior state is recorded here and put back.
    if (request.section !== null) {
      const renderer: IAutoMovieSectionRenderer = props.renderer ?? {
        localClippingEnabled: false,
      };
      const enabled: boolean = renderer.localClippingEnabled;
      const clipping: Map<
        THREE.Material,
        { planes: THREE.Plane[] | null; intersection: boolean }
      > = new Map<
        THREE.Material,
        { planes: THREE.Plane[] | null; intersection: boolean }
      >();
      scene.traverse((object: THREE.Object3D): void => {
        for (const material of materialsOf(object))
          if (!clipping.has(material))
            clipping.set(material, {
              planes: material.clippingPlanes,
              intersection: material.clipIntersection,
            });
      });
      undo.push((): void => {
        for (const [material, prior] of clipping) {
          if (
            (material.clippingPlanes?.length ?? 0) !==
            (prior.planes?.length ?? 0)
          )
            material.needsUpdate = true;
          material.clippingPlanes = prior.planes;
          material.clipIntersection = prior.intersection;
        }
        renderer.localClippingEnabled = enabled;
      });
      applyAutoMovieSectionPlanes({
        renderer,
        root: scene,
        planes: [request.section],
      });
    }

    // Bring the shade's own shells or segments, then the marks, to the scene as it stands.
    const update: () => void = (): void => {
      shade.update();
      scene.updateMatrixWorld();
      for (const overlay of overlays) overlay.update();
    };
    update();

    return {
      legend: mergeAutoMovieInspectionLegends([
        ...overlays.map(
          (
            overlay: IAutoMovieInspectionOverlay,
          ): IAutoMovieInspectionLegendEntry[] => overlay.legend,
        ),
        surfaces(request, meshes.length),
      ]),
      selected: [...known].filter(selects),
      update,
      bounds: (): IAutoMovieViewerSubjectBounds | null =>
        measureAutoMovieInspectionBounds(scene),
      restore: restoreAutoMovieRenderModeOnce((): void =>
        restoreAutoMovieRenderModeState([...undo].reverse()),
      ),
    };
  } catch (error) {
    return restoreAutoMovieRenderModeState([...undo].reverse(), { error });
  }
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

/** The materials an object draws with, none for an object that has no material. */
function materialsOf(object: THREE.Object3D): THREE.Material[] {
  const material: THREE.Material | THREE.Material[] | undefined = (
    object as Partial<Pick<THREE.Mesh, "material">>
  ).material;
  if (material === undefined) return [];
  return Array.isArray(material) ? material : [material];
}

/** Measure one geometry's defects on its stored positions, naming the mesh's path when the engine refuses the buffers. */
function measure(
  geometry: THREE.BufferGeometry,
  path: string,
  sliver: number | null,
): IAutoMovieMeshDefect[] {
  // Read through the attribute so interleaved and normalized buffers give metres.
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const positions: Float32Array = new Float32Array(position.count * 3);
  for (let i: number = 0; i < position.count; i++) {
    positions[i * 3] = position.getX(i);
    positions[i * 3 + 1] = position.getY(i);
    positions[i * 3 + 2] = position.getZ(i);
  }
  try {
    return measureAutoMovieMeshDefects(
      { positions, indices: geometry.getIndex()?.array ?? null },
      sliver === null ? {} : { sliver },
    );
  } catch (error) {
    throw new Error(
      `Mesh "${path}" cannot be measured for defects: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

/** The two surface colours of the faces shade with the number of surfaces shaded, or nothing under any other shade or with surfaces off. */
function surfaces(
  request: IAutoMovieInspectionRequest,
  count: number,
): IAutoMovieInspectionLegendEntry[] {
  if (request.shade !== "faces" || !request.surface || count === 0) return [];
  return [
    {
      label: "surface front",
      color: AUTO_MOVIE_INSPECTION_PALETTE.front,
      count,
    },
    { label: "surface back", color: AUTO_MOVIE_INSPECTION_PALETTE.back, count },
  ];
}

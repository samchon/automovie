import type { IAutoMovieMark, IAutoMovieMeshDefect } from "@automovie/engine";
import * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import { applyAutoMovieSectionPlanes } from "../applyAutoMovieSectionPlanes.js";
import { restoreAutoMovieRenderModeOnce } from "../restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_INSPECTION_PALETTE } from "./AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IApplyAutoMovieInspectionProps } from "./IApplyAutoMovieInspectionProps.js";
import type { IAutoMovieInspectionHandle } from "./IAutoMovieInspectionHandle.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionMarkSet } from "./IAutoMovieInspectionMarkSet.js";
import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";
import { applyAutoMovieInspectionShade } from "./applyAutoMovieInspectionShade.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { buildAutoMovieInspectionMarks } from "./buildAutoMovieInspectionMarks.js";
import { legendAutoMovieInspectionMarks } from "./legendAutoMovieInspectionMarks.js";
import { listAutoMovieInspectionPaths } from "./listAutoMovieInspectionPaths.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionBounds } from "./measureAutoMovieInspectionBounds.js";
import { measureAutoMovieInspectionDefects } from "./measureAutoMovieInspectionDefects.js";
import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";
import { resolveAutoMovieInspectionColors } from "./resolveAutoMovieInspectionColors.js";

/**
 * Turn a built scene into the picture an inspection request asks for, in place, and return the handle that keeps its shade and marks current and puts the scene back.
 *
 * The same applied scene is drawn by the browser renderer and by the CPU rasterizer, so a view on the page and a still made in Node show the same thing. In order:
 *
 * 1. **Kinds.** The kinds that exist are those of the supplied marks and those the inspection measures itself: `defect/open`, `defect/non-manifold`, `defect/inconsistent`, `defect/degenerate`, and `defect/sliver` while `sliver` is set. A `marks` pattern that matches none of them throws and lists them. A kind is drawn when a `marks` pattern matches it.
 * 2. **Measured marks.** Asked defect kinds are measured on every drawn, visible mesh that `hide` does not leave out; batched meshes are not measured.
 * 3. **Selection.** Every drawn object and every mark of an asked kind has a path. An object or a mark is selected when `parts` is empty or one of its patterns matches, and no `hide` pattern matches; a mark whose anchor object is invisible or matched by `hide` is left out too. A pattern that matches no object and no mark throws before anything changes, so a mistyped name is not an empty picture.
 * 4. **Isolation.** Unselected objects, and every mesh when `surface` is off, are taken off all layers. A layer is tested per object, so the objects beneath an isolated one stay as they were selected, which hiding it would not allow.
 * 5. **Shade.** Surfaces are coloured by `shade`. The `outline` pass draws its shells around the selected meshes only. The `pose` pass draws the skeleton of the whole scene, since a bone is not a drawn object and has no path to select.
 * 6. **Marks.** Selected marks are drawn in their kind's colour, or the flag colour when flagged, as lines `stroke` pixels wide and points three strokes across. Two kinds in one picture never share a colour, and no kind takes the flag colour or the active shade's surface colours; a clash throws naming both. With `xray` marks ignore depth.
 * 7. **Section.** With `section`, the plane is given to every material in the scene, marks included. It cuts three.js's built-in materials, the guide passes and inspection shades, and the marks. In the browser a film's own shader material is cut only when its shader includes three.js's clipping chunks, while the CPU rasterizer cuts every material.
 *
 * The legend lists each drawn kind once with its number of marks, a flag entry per kind with flagged marks, and under the faces shade the two surface colours with the number of surfaces shaded. `selected` lists the paths the request selected.
 *
 * A failure at any step undoes the steps before it and throws. An engine refusal while measuring a mesh is rethrown naming the mesh's path.
 *
 * ```ts
 * const inspection = applyAutoMovieInspection({ scene, request, marks: production.marks?.(2.4) });
 * try {
 *   production.seek(2.4);
 *   inspection.update(production.marks?.(2.4));
 *   const frame = rasterizeAutoMovieScene({ scene, camera, width: 960, height: 960 });
 * } finally {
 *   inspection.restore();
 * }
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared result for both renderers, each step with its rule and reason, the measured kinds, the colour law, what the legend counts, the failure behaviour, and shows the apply, seek, update, draw and restore order.
 * @evidence contracts/development/implementation.md#principled-implementation Each step changes one kind of scene state and records how to put it back, and the steps are ordered so a later one sees the earlier one's result: patterns are checked before anything changes, overrides exist before clipping is set on them, and marks exist before the cut. A mark is identified by its path and its kind, never by a list of meanings, so any producer's finding is drawn by the same rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The documented steps share one undo list; selection, shade, mark building, defect measurement, colours, legends and bounds each belong to their own module, and one local function chooses and builds supplied marks for both the apply and every update.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Objects and marks are chosen by path pattern and marks by kind pattern only, no curve or defect kind is named outside the defect producer, an unmatched pattern is refused, prior layers and clipping state are recorded and put back instead of reset to defaults, and a setup failure never leaves the scene half inspected.
 * @evidence contracts/development/implementation.md#efficient-algorithms Selection is decided once per distinct path and kind, defects are measured once per geometry however many meshes share it, and each frame costs one world-matrix pass plus the marks and, under the outline or pose pass, its shells or bone links.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Guide passes, material overrides, section planes, restoration and the once guard are the renderer's existing owners; defect measurement is the engine's.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The handle owns the overlay group, the built marks, the override materials and the recorded prior state until `restore`, which releases all of them once; replaced marks are released when replaced; the scene's own objects and materials are borrowed.
 */
export function applyAutoMovieInspection(
  props: IApplyAutoMovieInspectionProps,
): IAutoMovieInspectionHandle {
  const scene: THREE.Scene = props.scene;
  const request: IAutoMovieInspectionRequest = props.request;
  if (!(Number.isFinite(request.stroke) && request.stroke > 0))
    throw new Error(
      `Inspection stroke ${request.stroke} is not a positive width`,
    );

  // Kinds: what the owners supplied and what the inspection measures itself.
  const supplied: readonly IAutoMovieMark[] = props.marks ?? [];
  const defects: IAutoMovieMeshDefect.Kind[] = (
    Object.keys(AUTO_MOVIE_INSPECTION_PALETTE.defect) as IAutoMovieMeshDefect.Kind[]
  ).filter(
    (kind: IAutoMovieMeshDefect.Kind): boolean =>
      kind !== "sliver" || request.sliver !== null,
  );
  const available: string[] = [
    ...new Set<string>([
      ...supplied.map((mark: IAutoMovieMark): string => mark.kind),
      ...defects.map((kind: string): string => `defect/${kind}`),
    ]),
  ];
  const unknown: string[] = request.marks.filter(
    (pattern: string): boolean =>
      !available.some((kind: string): boolean =>
        matchAutoMovieInspectionPath(kind, pattern),
      ),
  );
  if (unknown.length !== 0)
    throw new Error(
      `Inspection marks patterns match no kind: ${unknown.join(", ")}; the kinds available are ${available.join(", ") || "none"}`,
    );
  const asks: (kind: string) => boolean = memo(
    (kind: string): boolean =>
      request.marks.some((pattern: string): boolean =>
        matchAutoMovieInspectionPath(kind, pattern),
      ),
  );
  const hidden: (path: string) => boolean = memo(
    (path: string): boolean =>
      request.hide.some((pattern: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      ),
  );

  // Measured marks on every drawn, visible mesh the request does not hide, read before any state changes.
  const drawn: IAutoMovieInspectionPath[] = listAutoMovieInspectionPaths(scene);
  const meshes: { path: string; mesh: THREE.Mesh }[] = [];
  for (const { path, object } of drawn)
    if (
      object instanceof THREE.Mesh &&
      (object as { isBatchedMesh?: boolean }).isBatchedMesh !== true &&
      object.geometry.hasAttribute("position") &&
      shown(object)
    )
      meshes.push({ path, mesh: object });
  const asked: Set<IAutoMovieMeshDefect.Kind> = new Set<IAutoMovieMeshDefect.Kind>(
    defects.filter((kind: string): boolean => asks(`defect/${kind}`)),
  );
  const measured: IAutoMovieInspectionMeasured[] = [];
  if (asked.size !== 0) {
    const cache: Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]> = new Map<
      THREE.BufferGeometry,
      IAutoMovieMeshDefect[]
    >();
    for (const { path, mesh } of meshes)
      if (!hidden(path))
        measured.push(
          measureAutoMovieInspectionDefects({
            mesh,
            path,
            kinds: asked,
            sliver: request.sliver,
            measured: cache,
          }),
        );
  }

  // Selection: object paths and the paths of marks of asked kinds, one verdict per distinct path.
  const known: Set<string> = new Set<string>([
    ...drawn.map((entry: IAutoMovieInspectionPath): string => entry.path),
    ...supplied
      .filter((mark: IAutoMovieMark): boolean => asks(mark.kind))
      .map((mark: IAutoMovieMark): string => mark.path),
    ...measured.flatMap((set: IAutoMovieInspectionMeasured): string[] =>
      set.marks.map((mark: IAutoMovieMark): string => mark.path),
    ),
  ]);
  const unmatched: string[] = [...request.parts, ...request.hide].filter(
    (pattern: string): boolean =>
      ![...known].some((path: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      ),
  );
  if (unmatched.length !== 0)
    throw new Error(
      `Inspection patterns match no object or mark of the scene: ${unmatched.join(", ")}`,
    );
  const selects: (path: string) => boolean = memo(
    (path: string): boolean =>
      (request.parts.length === 0 ||
        request.parts.some((pattern: string): boolean =>
          matchAutoMovieInspectionPath(path, pattern),
        )) &&
      !hidden(path),
  );
  const anchors: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();
  scene.traverse((object: THREE.Object3D): void => {
    const path: string = autoMovieInspectionPathOf(scene, object);
    if (!anchors.has(path)) anchors.set(path, object);
  });

  // The supplied marks a picture draws, grouped by the object their frame belongs to.
  const choose: (marks: readonly IAutoMovieMark[]) => IChosen = (
    marks: readonly IAutoMovieMark[],
  ): IChosen => {
    const chosen: IAutoMovieMark[] = [];
    const sets: Map<THREE.Object3D | null, IAutoMovieMark[]> = new Map<
      THREE.Object3D | null,
      IAutoMovieMark[]
    >();
    for (const mark of marks) {
      if (!asks(mark.kind) || !selects(mark.path)) continue;
      let anchor: THREE.Object3D | null = null;
      if (mark.anchor !== null) {
        anchor = anchors.get(mark.anchor) ?? null;
        if (anchor === null)
          throw new Error(
            `Mark "${mark.path}" follows "${mark.anchor}", which no object of the scene is`,
          );
        if (!shown(anchor) || hidden(mark.anchor)) continue;
      }
      chosen.push(mark);
      const set: IAutoMovieMark[] = sets.get(anchor) ?? [];
      set.push(mark);
      sets.set(anchor, set);
    }
    return { marks: chosen, sets };
  };
  const ownMarks: IAutoMovieMark[] = measured.flatMap(
    (set: IAutoMovieInspectionMeasured): IAutoMovieMark[] =>
      set.marks.filter((mark: IAutoMovieMark): boolean => selects(mark.path)),
  );
  const reserved: { use: string; color: number }[] = [
    { use: "the flag", color: AUTO_MOVIE_INSPECTION_PALETTE.flagged },
    ...(request.shade === "clay"
      ? [{ use: "the clay shade", color: AUTO_MOVIE_INSPECTION_PALETTE.clay }]
      : request.shade === "faces"
        ? [
            { use: "the front of a surface", color: AUTO_MOVIE_INSPECTION_PALETTE.front },
            { use: "the back of a surface", color: AUTO_MOVIE_INSPECTION_PALETTE.back },
          ]
        : []),
  ];
  const style: { stroke: number; xray: boolean } = {
    stroke: request.stroke,
    xray: request.xray,
  };
  const paint: (
    sets: Iterable<[THREE.Object3D | null, readonly IAutoMovieMark[]]>,
    kinds: ReadonlyMap<string, { color: number }>,
  ) => IAutoMovieInspectionMarkSet[] = (
    sets: Iterable<[THREE.Object3D | null, readonly IAutoMovieMark[]]>,
    kinds: ReadonlyMap<string, { color: number }>,
  ): IAutoMovieInspectionMarkSet[] =>
    [...sets].map(
      ([anchor, marks]: [THREE.Object3D | null, readonly IAutoMovieMark[]]): IAutoMovieInspectionMarkSet => ({
        anchor,
        marks: marks.map((mark: IAutoMovieMark): { mark: IAutoMovieMark; color: number } => ({
          mark,
          color: mark.flagged
            ? AUTO_MOVIE_INSPECTION_PALETTE.flagged
            : kinds.get(mark.kind)!.color,
        })),
      }),
    );
  const objectPaths: string[] = [
    ...new Set<string>(
      drawn.map((entry: IAutoMovieInspectionPath): string => entry.path),
    ),
  ].filter(selects);
  const surfaces: IAutoMovieInspectionLegendEntry[] = surfaceLegend(
    request,
    meshes.filter(({ path }: { path: string }): boolean => selects(path))
      .length,
  );

  const undo: (() => void)[] = [];
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

    // Wire: every mesh material that has the switch, overrides included, before the marks exist.
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

    // Marks: one group at the scene root holding the measured marks and the current supplied ones.
    const group: THREE.Group = new THREE.Group();
    scene.add(group);
    undo.push((): void => {
      scene.remove(group);
    });
    let current: IChosen = choose(supplied);
    let kinds: Map<string, { label: string; color: number }> =
      resolveAutoMovieInspectionColors({
        marks: [...current.marks, ...ownMarks],
        reserved,
      });
    const own: IAutoMovieInspectionOverlay = buildAutoMovieInspectionMarks(
      paint(
        measured.map(
          (set: IAutoMovieInspectionMeasured): [THREE.Object3D, IAutoMovieMark[]] => [
            set.anchor,
            set.marks.filter((mark: IAutoMovieMark): boolean => selects(mark.path)),
          ],
        ),
        kinds,
      ),
      style,
    );
    undo.push(own.dispose);
    group.add(own.object);
    let overlay: IAutoMovieInspectionOverlay = buildAutoMovieInspectionMarks(
      paint(current.sets, kinds),
      style,
    );
    undo.push((): void => overlay.dispose());
    group.add(overlay.object);

    // Section: the plane owner overwrites clipping state, so the prior state is recorded here and put back.
    const renderer: IAutoMovieSectionRenderer = props.renderer ?? {
      localClippingEnabled: false,
    };
    if (request.section !== null) {
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

    // The legend and the selection are rewritten in place whenever the supplied marks change.
    const legend: IAutoMovieInspectionLegendEntry[] = [];
    const selected: string[] = [];
    const describe: () => void = (): void => {
      const marks: IAutoMovieMark[] = [...current.marks, ...ownMarks];
      legend.splice(
        0,
        legend.length,
        ...mergeAutoMovieInspectionLegends([
          legendAutoMovieInspectionMarks(marks, kinds),
          surfaces,
        ]),
      );
      selected.splice(
        0,
        selected.length,
        ...objectPaths,
        ...new Set<string>(marks.map((mark: IAutoMovieMark): string => mark.path)),
      );
    };
    describe();

    let size: [number, number] | null = null;
    const update: (marks?: readonly IAutoMovieMark[]) => void = (
      marks?: readonly IAutoMovieMark[],
    ): void => {
      if (marks !== undefined) {
        // Check the new marks before the current ones are released.
        const next: IChosen = choose(marks);
        const nextKinds: Map<string, { label: string; color: number }> =
          resolveAutoMovieInspectionColors({
            marks: [...next.marks, ...ownMarks],
            reserved,
          });
        const built: IAutoMovieInspectionOverlay = buildAutoMovieInspectionMarks(
          paint(next.sets, nextKinds),
          style,
        );
        if (request.section !== null)
          applyAutoMovieSectionPlanes({
            renderer,
            root: built.object,
            planes: [request.section],
          });
        if (size !== null) built.resize(size[0], size[1]);
        overlay.dispose();
        overlay = built;
        group.add(overlay.object);
        current = next;
        kinds = nextKinds;
        describe();
      }
      shade.update();
      scene.updateMatrixWorld();
      for (const set of measured) set.refresh();
      own.update();
      overlay.update();
    };
    update();

    return {
      legend,
      selected,
      update,
      resize: (width: number, height: number): void => {
        if (
          !(Number.isFinite(width) && width > 0) ||
          !(Number.isFinite(height) && height > 0)
        )
          throw new Error(
            `Inspection target ${width} x ${height} is not a positive size`,
          );
        size = [width, height];
        own.resize(width, height);
        overlay.resize(width, height);
      },
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

/** Supplied marks a picture draws, and the same marks grouped by the object their frame belongs to, `null` for world space. */
interface IChosen {
  /** The marks drawn, in the order supplied. */
  marks: IAutoMovieMark[];

  /** The same marks by anchor. */
  sets: Map<THREE.Object3D | null, IAutoMovieMark[]>;
}

/** A one-argument predicate that decides each distinct argument once. */
function memo(decide: (key: string) => boolean): (key: string) => boolean {
  const verdicts: Map<string, boolean> = new Map<string, boolean>();
  return (key: string): boolean => {
    let verdict: boolean | undefined = verdicts.get(key);
    if (verdict === undefined) {
      verdict = decide(key);
      verdicts.set(key, verdict);
    }
    return verdict;
  };
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

/** The two surface colours of the faces shade with the number of surfaces shaded, or nothing under any other shade or with surfaces off. */
function surfaceLegend(
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

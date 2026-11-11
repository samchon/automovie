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
import type { IAutoMovieInspectionKind } from "./IAutoMovieInspectionKind.js";
import type { IAutoMovieInspectionLabel } from "./IAutoMovieInspectionLabel.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionMarkSet } from "./IAutoMovieInspectionMarkSet.js";
import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";
import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";
import { applyAutoMovieInspectionSection } from "./applyAutoMovieInspectionSection.js";
import { applyAutoMovieInspectionShade } from "./applyAutoMovieInspectionShade.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { buildAutoMovieInspectionMarks } from "./buildAutoMovieInspectionMarks.js";
import { chooseAutoMovieInspectionMarks } from "./chooseAutoMovieInspectionMarks.js";
import { colorAutoMovieInspectionObjects } from "./colorAutoMovieInspectionObjects.js";
import { focusAutoMovieInspection } from "./focusAutoMovieInspection.js";
import { legendAutoMovieInspectionMarks } from "./legendAutoMovieInspectionMarks.js";
import { listAutoMovieInspectionKinds } from "./listAutoMovieInspectionKinds.js";
import { listAutoMovieInspectionPaths } from "./listAutoMovieInspectionPaths.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionBounds } from "./measureAutoMovieInspectionBounds.js";
import { measureAutoMovieInspectionMeshes } from "./measureAutoMovieInspectionMeshes.js";
import { measureAutoMovieInspectionPaths } from "./measureAutoMovieInspectionPaths.js";
import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";
import { placeAutoMovieInspectionLabels } from "./placeAutoMovieInspectionLabels.js";
import { resolveAutoMovieInspectionColors } from "./resolveAutoMovieInspectionColors.js";

/**
 * Turn a built scene into the picture an inspection request asks for, in place, and return the handle that keeps its shade and marks current and puts the scene back.
 *
 * The applied scene is drawn by three.js like any other, so the inspector page and the draw-only function show the same picture. In order:
 *
 * 1. **Kinds.** The kinds that exist are those `listAutoMovieInspectionKinds` lists: the supplied marks' kinds and the inspection's own, `edge`, the triangle sides of a mesh, the `defect/<kind>` kinds, `defect/sliver` only while `sliver` is set, and `trail` and `trail/now` while `trail` names objects. A `marks` pattern that matches none of them throws and lists them. A kind is drawn when a `marks` pattern matches it.
 * 2. **Measured marks.** Asked edges and defect kinds are measured on every drawn, visible mesh that `hide` does not leave out; batched meshes are not measured. Edges drawn over a surface show how its triangles follow the form, and with `surface` off they are drawn alone; no material is switched to wireframe.
 * 3. **Selection.** Every drawn object and every mark of an asked kind has a path, and a mark's path extends the path of the object it belongs to, so one pattern selects, hides, labels and colours objects and marks alike: `parts=hero/torso/section/3` draws one curve. An object or a mark is selected when `parts` is empty or one of its patterns matches, and no `hide` pattern matches; a mark whose anchor object is invisible or matched by `hide` is left out too. A `parts`, `hide`, `label` or `color` pattern that matches no object, mark or kind throws before anything changes, so a mistyped name is not an empty picture.
 * 4. **Isolation.** Unselected objects, and every mesh when `surface` is off, are taken off all layers. A layer is tested per object, so the objects beneath an isolated one stay as they were selected, which hiding it would not allow.
 * 5. **Shade.** Surfaces are coloured by `shade`. The `outline` pass draws its shells around the selected meshes only. The `pose` pass draws the skeleton of the whole scene, since a bone is not a drawn object and has no path to select.
 * 6. **Colours and marks.** Meshes a `color` pattern matches take its colour as `colorAutoMovieInspectionObjects` draws it. Selected marks are drawn in their kind's colour, or the `color` a pattern gives the kind, or the flag colour when flagged, as lines `stroke` pixels wide and points three strokes across. Two kinds in one picture never share a colour, and no kind takes the flag colour or the active shade's surface colours; a clash throws naming both. With `xray` marks ignore depth.
 * 7. **Section.** With `section`, the plane is given to every material in the scene, marks included. It cuts three.js's built-in materials, the guide passes and inspection shades, and the marks. A film's own shader material is cut only when its shader includes three.js's clipping chunks.
 *
 * The legend lists each drawn kind once with its number of marks, a flag entry per kind with flagged marks, and under the faces shade the two surface colours with the number of surfaces shaded. `selected` lists the paths the request selected, and `labels` places the names the `label` patterns ask for on a picture.
 *
 * A failure at any step undoes the steps before it and throws. An engine refusal while measuring a mesh is rethrown naming the mesh's path.
 *
 * ```ts
 * const inspection = applyAutoMovieInspection({ scene, request, marks: production.marks?.(2.4) });
 * try {
 *   production.seek(2.4);
 *   inspection.update(production.marks?.(2.4));
 *   renderer.render(scene, camera);
 * } finally {
 *   inspection.restore();
 * }
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared result for both renderers, each step with its rule and reason, the measured kinds, the colour law, what the legend counts, the failure behaviour, and shows the apply, seek, update, draw and restore order.
 * @evidence contracts/development/implementation.md#principled-implementation Each step changes one kind of scene state and records how to put it back, and the steps are ordered so a later one sees the earlier one's result: patterns are checked before anything changes, overrides exist before clipping is set on them, and marks exist before the cut. A mark is identified by its path and its kind, never by a list of meanings, so any producer's finding is drawn by the same rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The documented steps share one undo list; selection, shade, mark building, edge and defect measurement, colours, legends and bounds each belong to their own module, and one local function chooses and builds supplied marks for both the apply and every update.
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
  const available: string[] = listAutoMovieInspectionKinds({
    request,
    marks: supplied,
  }).map((entry: IAutoMovieInspectionKind): string => entry.kind);
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
  const {
    meshes,
    measured,
  }: {
    meshes: { path: string; mesh: THREE.Mesh }[];
    measured: IAutoMovieInspectionMeasured[];
  } = measureAutoMovieInspectionMeshes({
    drawn,
    defects,
    sliver: request.sliver,
    asks,
    hidden,
  });

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
  const unlabelled: string[] = request.label.filter(
    (pattern: string): boolean =>
      ![...known].some((path: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      ),
  );
  const uncoloured: string[] = request.color
    .map((entry: IAutoMovieInspectionRequest.IColor): string => entry.pattern)
    .filter(
      (pattern: string): boolean =>
        ![...known, ...available].some((name: string): boolean =>
          matchAutoMovieInspectionPath(name, pattern),
        ),
    );
  if (unmatched.length + unlabelled.length + uncoloured.length !== 0)
    throw new Error(
      `Inspection patterns match no object, mark or kind of the scene: ${[...unmatched, ...unlabelled, ...uncoloured].join(", ")}`,
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
  ): IChosen =>
    chooseAutoMovieInspectionMarks({ marks, asks, selects, hidden, anchors });
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

    // Colours: the meshes the request colours take their colour over the shade.
    if (request.color.length !== 0)
      undo.push(
        colorAutoMovieInspectionObjects({
          meshes: meshes.filter(({ path }: { path: string }): boolean =>
            selects(path),
          ),
          shade: request.shade,
          color: request.color,
        }),
      );

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
        recolor: request.color,
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

    // Section: the cut and the restore of the clipping state it borrows belong to the section owner.
    const renderer: IAutoMovieSectionRenderer = props.renderer ?? {
      localClippingEnabled: false,
    };
    if (request.section !== null)
      undo.push(
        applyAutoMovieInspectionSection({
          scene,
          renderer,
          section: request.section,
        }),
      );

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
            recolor: request.color,
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

    // The drawn marks with the objects their frames belong to, for labels and focus.
    const placed: () => IPlaced[] = (): IPlaced[] => [
      ...[...current.sets].flatMap(
        ([anchor, marks]: [THREE.Object3D | null, IAutoMovieMark[]]): IPlaced[] =>
          marks.map((mark: IAutoMovieMark): IPlaced => ({ mark, anchor })),
      ),
      ...measured.flatMap((set: IAutoMovieInspectionMeasured): IPlaced[] =>
        set.marks
          .filter((mark: IAutoMovieMark): boolean => selects(mark.path))
          .map((mark: IAutoMovieMark): IPlaced => ({ mark, anchor: set.anchor })),
      ),
    ];
    const shownObjects: IAutoMovieInspectionPath[] = drawn.filter(
      (entry: IAutoMovieInspectionPath): boolean => selects(entry.path),
    );

    return {
      legend,
      selected,
      update,
      labels: (
        camera: THREE.Camera,
        width: number,
        height: number,
        scale: number,
      ): {
        labels: IAutoMovieInspectionLabel[];
        dropped: IAutoMovieInspectionLabel[];
      } =>
        placeAutoMovieInspectionLabels({
          boxes: measureAutoMovieInspectionPaths({
            objects: shownObjects,
            marks: placed(),
            choose: (path: string): boolean =>
              request.label.some((pattern: string): boolean =>
                matchAutoMovieInspectionPath(path, pattern),
              ),
          }),
          camera,
          width,
          height,
          scale,
        }),
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
      bounds: (
        focus?: IAutoMovieInspectionView.IFocus | null,
      ): IAutoMovieViewerSubjectBounds | null =>
        focus === undefined || focus === null
          ? measureAutoMovieInspectionBounds(scene)
          : focusAutoMovieInspection({
              focus,
              objects: shownObjects,
              marks: placed(),
            }),
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

/** A drawn mark with the object its frame belongs to, `null` for world space. */
interface IPlaced {
  /** The mark. */
  mark: IAutoMovieMark;

  /** Its anchor. */
  anchor: THREE.Object3D | null;
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

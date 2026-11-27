import type {
  IAutoMovieInspectionFocus,
  IAutoMovieInspectionLabel,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieInspectionRequest,
  IAutoMovieMark,
  IAutoMovieMeshDefect,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import type { IAutoMovieSectionRenderer } from "../../IAutoMovieSectionRenderer.js";
import { applyAutoMovieSectionPlanes } from "../../internal/applyAutoMovieSectionPlanes.js";
import { restoreAutoMovieRenderModeOnce } from "../../internal/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";
import type { IAutoMovieViewerSubjectBounds } from "../../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_INSPECTION_PALETTE } from "../AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IApplyAutoMovieInspectionProps } from "../IApplyAutoMovieInspectionProps.js";
import type { IAutoMovieInspectionHandle } from "../IAutoMovieInspectionHandle.js";
import type { IAutoMovieInspectionMarkSet } from "../IAutoMovieInspectionMarkSet.js";
import type { IAutoMovieInspectionMeasured } from "../IAutoMovieInspectionMeasured.js";
import type { IAutoMovieInspectionOverlay } from "../IAutoMovieInspectionOverlay.js";
import type { IAutoMovieInspectionPath } from "../IAutoMovieInspectionPath.js";
import { admitAutoMovieInspectionPatterns } from "../admitAutoMovieInspectionPatterns.js";
import { applyAutoMovieInspectionSection } from "../applyAutoMovieInspectionSection.js";
import { applyAutoMovieInspectionShade } from "../applyAutoMovieInspectionShade.js";
import { autoMovieInspectionPathOf } from "../autoMovieInspectionPathOf.js";
import { buildAutoMovieInspectionMarks } from "./buildAutoMovieInspectionMarks.js";
import { chooseAutoMovieInspectionMarks } from "../chooseAutoMovieInspectionMarks.js";
import { colorAutoMovieInspectionObjects } from "../colorAutoMovieInspectionObjects.js";
import { focusAutoMovieInspection } from "../focusAutoMovieInspection.js";
import { legendAutoMovieInspectionMarks } from "./legendAutoMovieInspectionMarks.js";
import { listAutoMovieInspectionPaths } from "../listAutoMovieInspectionPaths.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import { AutoMovieRenderInspectionGeometry } from "../AutoMovieRenderInspectionGeometry.js";
import { measureAutoMovieInspectionMeshes } from "../measureAutoMovieInspectionMeshes.js";

import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";
import { placeAutoMovieInspectionLabels } from "./placeAutoMovieInspectionLabels.js";
import { resolveAutoMovieInspectionColors } from "./resolveAutoMovieInspectionColors.js";

/** Every mesh defect kind the palette colours, in the palette's order. */
const DEFECT_KINDS: readonly IAutoMovieMeshDefect.Kind[] = [
  "open",
  "non-manifold",
  "inconsistent",
  "degenerate",
  "sliver",
];

/**
 * Turn a built scene into the picture an inspection request asks for, in place,
 * and return the handle that keeps its shade and marks current and puts the
 * scene back.
 *
 * The applied scene is drawn by three.js like any other, so the inspector page
 * and the draw-only function show the same picture. In order:
 *
 * 1. **Kinds.** `listAutoMovieInspectionKindOptions` admits lifetime declarations,
 *    supplied kinds, and kinds the inspection measures under the request. A
 *    `marks` pattern that matches none throws and lists the available names.
 *    Matching supplied or measured marks provide the geometry to draw.
 * 2. **Measured marks.** Asked edges and defect kinds are measured on every drawn,
 *    visible mesh that `hide` does not leave out; batched meshes are not
 *    measured. Edges drawn over a surface show how its triangles follow the
 *    form, and with `surface` off they are drawn alone; no material is switched
 *    to wireframe.
 * 3. **Selection.** Every drawn object and every mark of an asked kind has a path,
 *    and a mark's path extends the path of the object it belongs to, so one
 *    pattern selects, hides, labels and colours objects and marks alike:
 *    `parts=hero/torso/section/3` draws one curve. An object or a mark is
 *    selected when `parts` is empty or one of its patterns matches, and no
 *    `hide` pattern matches; a mark whose anchor object is invisible or matched
 *    by `hide` is left out too. A `parts`, `hide`, `label` or `color` pattern
 *    that matches no object, mark or kind throws before anything changes, so a
 *    mistyped name is not an empty picture.
 * 4. **Isolation.** Unselected objects, and every mesh when `surface` is off, are
 *    taken off all layers. A layer is tested per object, so the objects beneath
 *    an isolated one stay as they were selected, which hiding it would not
 *    allow.
 * 5. **Shade.** Surfaces are coloured by `shade`. The `outline` pass draws its
 *    shells around the selected meshes only. The `pose` pass draws the skeleton
 *    of the whole scene, since a bone is not a drawn object and has no path to
 *    select.
 * 6. **Colours and marks.** Meshes a `color` pattern matches take its colour as
 *    `colorAutoMovieInspectionObjects` draws it. Selected marks are drawn in
 *    their kind's colour, or the `color` a pattern gives the kind, or the flag
 *    colour when flagged, as lines `stroke` pixels wide and points three
 *    strokes across. Two kinds in one picture never share a colour, and no kind
 *    takes the flag colour or the active shade's surface colours; a clash
 *    throws naming both. With `xray` marks ignore depth.
 * 7. **Section.** With `section`, the plane is given to every material in the
 *    scene, marks included. It cuts three.js's built-in materials, the guide
 *    passes and inspection shades, and the marks. A film's own shader material
 *    is cut only when its shader includes three.js's clipping chunks.
 *
 * The legend lists each drawn kind once with its number of marks, a flag entry
 * per kind with flagged marks, and under the faces shade the two surface
 * colours with the number of surfaces shaded. `selected` lists the paths the
 * request selected, and `labels` places the names the `label` patterns ask for
 * on a picture.
 *
 * A failure at any step undoes the steps before it and throws. An engine
 * refusal while measuring a mesh is rethrown naming the mesh's path.
 *
 * ```ts
 * const inspection = applyAutoMovieInspection({
 *   scene,
 *   request,
 *   marks: production.marks?.(2.4),
 * });
 * try {
 *   production.seek(2.4);
 *   inspection.update(production.marks?.(2.4));
 *   renderer.render(scene, camera);
 * } finally {
 *   inspection.restore();
 * }
 * ```
 */
export function applyAutoMovieInspection(
  props: IApplyAutoMovieInspectionProps,
): IAutoMovieInspectionHandle {
  const scene: THREE.Scene = props.scene;
  const request: IAutoMovieInspectionRequest = props.request;
  if (!(request.stroke > 0))
    throw new Error(
      `Inspection stroke ${request.stroke} is not a positive width`,
    );

  // Kind admission includes names declared for frames outside the current one.
  const supplied: readonly IAutoMovieMark[] = props.marks ?? [];
  const defects: IAutoMovieMeshDefect.Kind[] = DEFECT_KINDS.filter(
    (kind: IAutoMovieMeshDefect.Kind): boolean =>
      kind !== "sliver" || request.sliver !== null,
  );
  const admitPaths: ReturnType<typeof admitAutoMovieInspectionPatterns> =
    admitAutoMovieInspectionPatterns(request, supplied, props.markKinds);
  const asks: (kind: string) => boolean = (kind: string): boolean =>
    request.marks.some((pattern: string): boolean =>
      matchAutoMovieInspectionPath(kind, pattern),
    );
  const hidden: (path: string) => boolean = (path: string): boolean =>
    request.hide.some((pattern: string): boolean =>
      matchAutoMovieInspectionPath(path, pattern),
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

  admitPaths(drawn, measured, asks);
  const selects: (path: string) => boolean = (path: string): boolean =>
    (request.parts.length === 0 ||
      request.parts.some((pattern: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      )) &&
    !hidden(path);
  const anchors: Map<string, THREE.Object3D> = new Map<
    string,
    THREE.Object3D
  >();
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
            {
              use: "the front of a surface",
              color: AUTO_MOVIE_INSPECTION_PALETTE.front,
            },
            {
              use: "the back of a surface",
              color: AUTO_MOVIE_INSPECTION_PALETTE.back,
            },
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
      ([anchor, marks]: [
        THREE.Object3D | null,
        readonly IAutoMovieMark[],
      ]): IAutoMovieInspectionMarkSet => ({
        anchor,
        marks: marks.map(
          (mark: IAutoMovieMark): { mark: IAutoMovieMark; color: number } => ({
            mark,
            color: mark.flagged
              ? AUTO_MOVIE_INSPECTION_PALETTE.flagged
              : kinds.get(mark.kind)!.color,
          }),
        ),
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
        (!request.surface && AutoMovieThreeKind.isMesh(object))
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
          (
            set: IAutoMovieInspectionMeasured,
          ): [THREE.Object3D, IAutoMovieMark[]] => [
            set.anchor,
            set.marks.filter((mark: IAutoMovieMark): boolean =>
              selects(mark.path),
            ),
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
        ...new Set<string>(
          marks.map((mark: IAutoMovieMark): string => mark.path),
        ),
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
        const built: IAutoMovieInspectionOverlay =
          buildAutoMovieInspectionMarks(paint(next.sets, nextKinds), style);
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
        ([anchor, marks]: [
          THREE.Object3D | null,
          IAutoMovieMark[],
        ]): IPlaced[] =>
          marks.map((mark: IAutoMovieMark): IPlaced => ({ mark, anchor })),
      ),
      ...measured.flatMap((set: IAutoMovieInspectionMeasured): IPlaced[] =>
        set.marks
          .filter((mark: IAutoMovieMark): boolean => selects(mark.path))
          .map(
            (mark: IAutoMovieMark): IPlaced => ({ mark, anchor: set.anchor }),
          ),
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
          boxes: AutoMovieRenderInspectionGeometry.measurePaths({
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
        if (!(width > 0) || !(height > 0))
          throw new Error(
            `Inspection target ${width} x ${height} is not a positive size`,
          );
        size = [width, height];
        own.resize(width, height);
        overlay.resize(width, height);
      },
      bounds: (
        focus?: IAutoMovieInspectionFocus | null,
      ): IAutoMovieViewerSubjectBounds | null =>
        focus === undefined || focus === null
          ? AutoMovieRenderInspectionGeometry.measureBounds(scene)
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

/**
 * Supplied marks a picture draws, and the same marks grouped by the object
 * their frame belongs to, `null` for world space.
 */
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

/**
 * The two surface colours of the faces shade with the number of surfaces
 * shaded, or nothing under any other shade or with surfaces off.
 */
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

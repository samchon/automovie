import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitLowerLidProfile } from "./createPortraitLowerLidProfile";
import { createPortraitUpperLidProfile } from "./createPortraitUpperLidProfile";
import { portraitEyeLidRows } from "./portraitEyeLidRows";
import { portraitEyeLoop } from "./portraitEyeLoop";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";
import type { IPortraitLowerLidSection } from "./structures/IPortraitLowerLidSection";
import type { IPortraitUpperLidSection } from "./structures/IPortraitUpperLidSection";

/**
 * Attach the lid rows to the already fitted shared outer rim. New inner vertex
 * identities are returned for the eyeball to read after common subdivision.
 * The optional group is a registered host skin region; omission retains zero.
 * An optional sphere-projected guide retains the gaze-independent outer seam
 * while the supplied aperture carries the inner ocular contact. Their XY
 * difference fades to zero across the same section bridge as its depth.
 *
 * With `n` aperture identities the function appends seven rings of `n` new
 * vertices to the cage (hood upper, hood edge, crease outer, crease inner,
 * tarsal, ridge and inner) and `14 * n` triangles joining the outer ring and
 * each new ring in turn, so the population depends on the socket and on the
 * fixed section, never on the lid shape. The cage is mutated in place, all in
 * head millimetres; `group` names the registered skin region of the new
 * triangles. The returned map sends each aperture identity to its inner-ring
 * vertex, which the eye reads after common subdivision. Refusals of the row
 * calculation and of the lower and upper profiles propagate unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Seven interpolated strips extend the current upper/lower aperture toward gaze-independent outer guides in construction millimetres.
 * @evidence contracts/common.md#clear-and-simple-design The caller's cage owns appended positions/faces while a returned map preserves original aperture-to-inner-margin incidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed strip count is an authored tessellation convention; this function establishes no physical clearance or acquired eyelid anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies millimetres, caller mutation, fixed outer attachment and returned correspondence.
 * @evidence contracts/performance.md#efficient-algorithms For N aperture vertices it appends 7N vertices and 14N triangles with proportional map work. The delegated row calculation also scans upper/lower membership lists per row and reads admitted profile sections; no unrelated-cage scan is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Each strip's interpolated vertices are shared by adjacent cells; both eye component phases retain the returned margin map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned cage and returned map retain new geometry; temporary interpolation vectors expire and no cache or task survives.
 */
export function appendPortraitEyeMargins(
  cage: IControlMesh,
  aperture: number[][],
  socket: IPortraitEyeSocket,
  shape: IPortraitEyeShape,
  group: number = 0,
  lowerProfile:
    | ((at: number) => IPortraitLowerLidSection)
    | undefined = shape.lowerLidProfile === undefined
    ? undefined
    : createPortraitLowerLidProfile(shape.lowerLidProfile),
  guide?: readonly (readonly number[])[],
  upperProfile:
    | ((at: number) => IPortraitUpperLidSection)
    | undefined = shape.upperLidProfile === undefined
    ? undefined
    : createPortraitUpperLidProfile(shape.upperLidProfile),
): Map<number, number> {
  const rows: {
    id: number;
    outer: number[];
    hoodUpper: number[];
    hoodEdge: number[];
    creaseOuter: number[];
    creaseInner: number[];
    tarsal: number[];
    ridge: number[];
    inner: number[];
  }[] = portraitEyeLidRows(
    aperture,
    socket,
    shape,
    new Map(
      portraitEyeLoop(socket).map((id: number): [number, number] => [
        id,
        cage.positions[id][2],
      ]),
    ),
    lowerProfile,
    guide,
    upperProfile,
  );
  const margins: Map<number, number> = new Map<number, number>();
  const rings: number[][] = [
    rows.map(
      (row: {
        id: number;
        outer: number[];
        hoodUpper: number[];
        hoodEdge: number[];
        creaseOuter: number[];
        creaseInner: number[];
        tarsal: number[];
        ridge: number[];
        inner: number[];
      }): number => row.id,
    ),
  ];
  for (const name of [
    "hoodUpper",
    "hoodEdge",
    "creaseOuter",
    "creaseInner",
    "tarsal",
    "ridge",
    "inner",
  ] as const)
    rings.push(
      rows.map(
        (row: {
          id: number;
          outer: number[];
          hoodUpper: number[];
          hoodEdge: number[];
          creaseOuter: number[];
          creaseInner: number[];
          tarsal: number[];
          ridge: number[];
          inner: number[];
        }): number => cage.positions.push(row[name]) - 1,
      ),
    );
  for (let i: number = 0; i < rows.length; i++)
    margins.set(rows[i].id, rings[rings.length - 1][i]);
  for (let ring: number = 0; ring < rings.length - 1; ring++)
    for (let i: number = 0; i < rows.length; i++) {
      const j: number = (i + 1) % rows.length;
      cage.indices.push(
        rings[ring][i],
        rings[ring][j],
        rings[ring + 1][i],
        rings[ring][j],
        rings[ring + 1][j],
        rings[ring + 1][i],
      );
      cage.groups.push(group, group);
    }
  return margins;
}

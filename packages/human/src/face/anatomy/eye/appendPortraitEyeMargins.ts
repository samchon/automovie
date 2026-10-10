import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitLowerLidProfile } from "./createPortraitLowerLidProfile";
import { createPortraitUpperLidProfile } from "./createPortraitUpperLidProfile";
import { portraitEyeLidRows } from "./portraitEyeLidRows";
import { portraitEyeLoop } from "./portraitEyeLoop";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

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
 */
export function appendPortraitEyeMargins(
  cage: IControlMesh,
  aperture: number[][],
  socket: IPortraitEyeSocket,
  shape: IPortraitEyeShape,
  group = 0,
  lowerProfile = shape.lowerLidProfile === undefined
    ? undefined
    : createPortraitLowerLidProfile(shape.lowerLidProfile),
  guide?: readonly (readonly number[])[],
  upperProfile = shape.upperLidProfile === undefined
    ? undefined
    : createPortraitUpperLidProfile(shape.upperLidProfile),
): Map<number, number> {
  const rows = portraitEyeLidRows(
    aperture,
    socket,
    shape,
    new Map(portraitEyeLoop(socket).map((id) => [id, cage.positions[id][2]])),
    lowerProfile,
    guide,
    upperProfile,
  );
  const margins = new Map<number, number>();
  const rings = [rows.map((row) => row.id)];
  for (const name of [
    "hoodUpper",
    "hoodEdge",
    "creaseOuter",
    "creaseInner",
    "tarsal",
    "ridge",
    "inner",
  ] as const)
    rings.push(rows.map((row) => cage.positions.push(row[name]) - 1));
  for (let i = 0; i < rows.length; i++)
    margins.set(rows[i].id, rings[rings.length - 1][i]);
  for (let ring = 0; ring < rings.length - 1; ring++)
    for (let i = 0; i < rows.length; i++) {
      const j = (i + 1) % rows.length;
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

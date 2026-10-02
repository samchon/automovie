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
 *
 * @evidence contracts/common.md#principled-implementation The rings are the section rows of `portraitEyeLidRows`, the same calculation that supplies the outer skin constraints, so the seam the host is asked to reach and the rows the lid starts from cannot disagree. Consecutive rings are joined by quads split along one diagonal, which is a closed strip because the loop wraps, and the last ring is what the ocular contact and the lashes attach to.
 * @evidence contracts/common.md#clear-and-simple-design One function turns the row calculation into rings and strips on a cage and returns the map the finish needs, with the section formulas kept in their single owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case is named after a subject or fixture; the rings are a function of the rows, and the cage mutation is the documented purpose of the function, not a patch of foreign internals.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is appended and how many, what is mutated, the unit, the group meaning, what is returned and where refusals come from.
 * @evidence contracts/modeling.md#emitted-geometry The population is seven rings of `n` vertices and `14 * n` triangles for the socket's `n` aperture identities, fixed by the section's seven rows and the host topology, whatever the lid shape or the tissue profile; the profiles change positions and never counts.
 * @evidence contracts/modeling.md#spatial-conventions The cage, aperture and rows are head millimetres in one right-handed frame with +Z anterior, and nothing is converted here.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the eye shape and defines no channel.
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

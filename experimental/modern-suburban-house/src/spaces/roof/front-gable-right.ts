/**
 * `roof.front-gable.right`: the east face of the front gable, toward the stair
 * window.
 *
 * Design owner: `docs/spaces/roof/front-gable-right.md#front-gable-right-roof`.
 * The exposed face is the triangle from the apex down the right valley to its
 * foot on the front eave and back along the ridge X = -3.775; height
 * F(X) = 6.30 + (9/12)(b − X), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { part, slopedSlab, type IHousePart } from "../solids";
import { roofFreeEdge } from "./edges";
import { gable, GABLE_CORNERS, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the gable's east face.
 * @evidence spaces/roof/front-gable-right.md This export constructs the stair-window side of the front gable.
 * @evidence spaces/roof/front-gable-right.md#front-gable-right-roof Its plan runs from apex through rightFoot to ridgeFront, so the eastern valley shares the computed apex with the western face.
 * @evidence principles/core/source-units.md#source-scope-preservation The function emits the right gable face alone, taking valley corners and thickness from junctions without moving the shared ridge.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab materializes the triangular roof mesh under gable(x), and part assigns its stable right-face identity.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-gable parent supplies the valley-to-eave triangle and roof depth; the mesh needed no extra stair-window or roof-edge decision.
 */
export const buildFrontGableRightRoof = (): IHousePart[] => {
  const { rightFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part(
      "roof-front-gable-right",
      "roof/front-gable-right.ts",
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: [apex, rightFoot, ridgeFront],
        top: (x) => gable(x),
        thickness: ROOF_THICKNESS,
        freeEdge: roofFreeEdge,
      }),
    ),
  ];
};

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
import { part, type IHousePart } from "../solid-records";
import { slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { gable, GABLE_CORNERS, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the gable's east face.
 * @evidence spaces/roof/front-gable-right.md This export constructs the stair-window side of the front gable.
 * @evidenceReview spaces/roof/front-gable-right.md #94198fb `buildFrontGableRightRoof` returns `roof-front-gable-right`, the +X slope above the stair-window side of the front gable.
 * @evidence spaces/roof/front-gable-right.md#front-gable-right-roof Its plan runs from apex through rightFoot to ridgeFront, so the eastern valley shares the computed apex with the western face.
 * @evidenceReview spaces/roof/front-gable-right.md#front-gable-right-roof #2efe577 The plan orders `[apex, rightFoot, ridgeFront]` from `GABLE_CORNERS`; both gable builders consume the same apex and ridge-front values, so this east face meets the west face there.
 * @evidence principles/core/source-units.md#source-scope-preservation The function emits the right gable face alone, taking valley corners and thickness from junctions without moving the shared ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The function returns one east gable part and reads its valley/ridge corners and depth from `junctions.ts`; it does not move the shared ridge or construct the stair window.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab materializes the triangular roof mesh under gable(x), and part assigns its stable right-face identity.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `slopedSlab` combines the right triangular plan, `gable(x)` top and `ROOF_THICKNESS`; `part` emits the resulting mesh as `roof-front-gable-right`.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-gable parent supplies the valley-to-eave triangle and roof depth; the mesh needed no extra stair-window or roof-edge decision.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `front-gable-right-roof` assigns the east slope and stair-window overlap check; `roof-profile-datums` fixes F and its underside, while this builder uses `GABLE_CORNERS` and `roofFreeEdge` without choosing a new window or valley.
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

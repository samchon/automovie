/**
 * `roof.front-gable.left`: the west face of the front gable.
 *
 * Design owner: `docs/spaces/roof/front-gable-left.md#front-gable-left-roof`.
 * The exposed face is the triangle from the left valley foot on the front
 * eave, up the left valley to the apex where both valleys meet the gable
 * ridge, and back along the ridge X = -3.775 to the eave; its height is
 * F(X) = 6.30 + (9/12)(X − a), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { gable, GABLE_CORNERS, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the gable's west face.
 * @evidence spaces/roof/front-gable-left.md This export builds the left front-gable roof part from shared valley corners.
 * @evidenceReview spaces/roof/front-gable-left.md #b1e1054 `buildFrontGableLeftRoof` returns the -X gable face as `roof-front-gable-left`, using the shared left valley foot, apex and front ridge endpoint.
 * @evidence spaces/roof/front-gable-left.md#front-gable-left-roof Its triangular plan joins leftFoot, apex, and ridgeFront; gable(x) raises the weather face over that plan.
 * @evidenceReview spaces/roof/front-gable-left.md#front-gable-left-roof #7d12780 The plan is `[leftFoot, apex, ridgeFront]` from `GABLE_CORNERS`; `gable(x)` raises the weather face along the west slope and leaves the valley edge at the shared vertices.
 * @evidence principles/core/source-units.md#source-scope-preservation The returned part has only the left gable face and takes its corners and thickness from junctions instead of inventing another roof edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This builder chooses no local valley coordinate: `GABLE_CORNERS` supplies the triangle, `ROOF_THICKNESS` supplies depth, and only the left gable part is returned.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab turns the three plan vertices, gable height, and roof thickness into an actual mesh part with a stable id.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `slopedSlab` forms the left triangle with `gable(x)` top, shared thickness and `roofFreeEdge`; `part` assigns the mesh id `roof-front-gable-left`.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-gable-left-roof uses GABLE_CORNERS' left foot, ridge front, and apex to follow the authored valley triangle at ROOF_THICKNESS below its weather face.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `front-gable-left-roof` assigns the west face and shared valley, while `roof-profile-datums` sets its F height and 0.24 m underside; `GABLE_CORNERS` and `ROOF_THICKNESS` realize those parents without a new edge.
 */
export const buildFrontGableLeftRoof = (): IHousePart[] => {
  const { leftFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part(
      "roof-front-gable-left",
      "roof/front-gable-left.ts",
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: [leftFoot, apex, ridgeFront],
        top: (x) => gable(x),
        thickness: ROOF_THICKNESS,
        freeEdge: roofFreeEdge,
      }),
    ),
  ];
};

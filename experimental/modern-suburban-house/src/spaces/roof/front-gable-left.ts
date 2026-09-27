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
 * @evidenceReview spaces/roof/front-gable-left.md #b1e1054 front-gable-left.ts:23-39 returns one part roof-front-gable-left built by slopedSlab over GABLE_CORNERS leftFoot/apex/ridgeFront (:24,:32); front-gable-left.md:25 assigns the -X gable face and its valley to this owner. Delta is only import reflow and the dropped part() flag.
 * @evidence spaces/roof/front-gable-left.md#front-gable-left-roof Its triangular plan joins leftFoot, apex, and ridgeFront; gable(x) raises the weather face over that plan.
 * @evidenceReview spaces/roof/front-gable-left.md#front-gable-left-roof #7d12780 plan [leftFoot, apex, ridgeFront] front-gable-left.ts:32, top gable(x) :33; front-gable-left-roof body :25 takes height F and the back contour from the shared valley, right edge the gable ridge, front the overhang.
 * @evidence principles/core/source-units.md#source-scope-preservation The returned part has only the left gable face and takes its corners and thickness from junctions instead of inventing another roof edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 One part() :26-37; corners from GABLE_CORNERS, thickness ROOF_THICKNESS, freeEdge roofFreeEdge (:13,:24,:34-35); no local edge coordinates. Removed openSharedEdges flag is not mentioned by the row.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab turns the three plan vertices, gable height, and roof thickness into an actual mesh part with a stable id.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slopedSlab (solids.ts:512-557) builds top/bottom/side faces from the 3 plan points, gable top and ROOF_THICKNESS; part id roof-front-gable-left :27.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-gable-left-roof uses GABLE_CORNERS' left foot, ridge front, and apex to follow the authored valley triangle at ROOF_THICKNESS below its weather face.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: host consumes leftFoot/apex/ridgeFront :24,:32 and ROOF_THICKNESS :34. B: front-gable-left-roof :25 names the -X face of the gable centre bounded by the shared valley (back), gable ridge (right) and front overhang, height F linked to roof-profile-datums whose underside is 0.24 m lower (00-junctions.md:64). Real parent + host-specific facts.
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

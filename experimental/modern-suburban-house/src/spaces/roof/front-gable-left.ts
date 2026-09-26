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
import { part, slopedSlab, type IHousePart } from "../solids";
import { roofFreeEdge } from "./edges";
import { gable, GABLE_CORNERS, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the gable's west face.
 * @evidence spaces/roof/front-gable-left.md This export builds the left front-gable roof part from shared valley corners.
 * @evidence spaces/roof/front-gable-left.md#front-gable-left-roof Its triangular plan joins leftFoot, apex, and ridgeFront; gable(x) raises the weather face over that plan.
 * @evidence principles/core/source-units.md#source-scope-preservation The returned part has only the left gable face and takes its corners and thickness from junctions instead of inventing another roof edge.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab turns the three plan vertices, gable height, and roof thickness into an actual mesh part with a stable id.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The left-gable parent fixes the triangular valley boundary and thickness; this construction used those coordinates without an additional junction decision.
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

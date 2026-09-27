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
 * @evidenceReview spaces/roof/front-gable-right.md #c98ac2b front-gable-right.ts:23-39 emits roof-front-gable-right; front-gable-right.md:25 the +X face of the gable centre, :27 the stair window it descends toward.
 * @evidence spaces/roof/front-gable-right.md#front-gable-right-roof Its plan runs from apex through rightFoot to ridgeFront, so the eastern valley shares the computed apex with the western face.
 * @evidenceReview spaces/roof/front-gable-right.md#front-gable-right-roof #ea66047 plan [apex, rightFoot, ridgeFront] front-gable-right.ts:32; apex is the same GABLE_CORNERS.apex used by the left face (front-gable-left.ts:32); body :25 동일 골짜기.
 * @evidence principles/core/source-units.md#source-scope-preservation The function emits the right gable face alone, taking valley corners and thickness from junctions without moving the shared ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Single part :26-37; corners from GABLE_CORNERS and ROOF_THICKNESS from junctions (:13,:24,:34); ridge X (GABLE.center via apex/ridgeFront) untouched.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab materializes the triangular roof mesh under gable(x), and part assigns its stable right-face identity.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slopedSlab with top gable(x) front-gable-right.ts:31-36; part id roof-front-gable-right :27.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-gable parent supplies the valley-to-eave triangle and roof depth; the mesh needed no extra stair-window or roof-edge decision.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Old-template wording (notes §3) but names the unique right-gable H2 and host-specific facts. front-gable-right-roof :25 supplies F's right slope, underside and shared valley/ridge/front-rake boundaries; :27 only asks to inspect stair-window cover. Host makes no window/edge choice: plan from GABLE_CORNERS, roofFreeEdge (:24,:32-35).
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

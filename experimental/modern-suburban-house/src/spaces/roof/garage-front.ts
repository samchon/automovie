/**
 * `roof.garage.front`: the front face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-front.md#garage-front-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [ridge −3.50, front eave −0.30 + 0.35] under
 * Gfront(Z) = 2.95 − (5/12)(Z + 0.30), underside 0.24 m lower; the west edge
 * meets the shared wall's outer face X = 5.75 with no overhang (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { GARAGE_RIDGE_Z, gFront, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage front face.
 * @evidence spaces/roof/garage-front.md This export builds the driveway-facing half of the low garage roof.
 * @evidenceReview spaces/roof/garage-front.md `buildGarageFrontRoof` returns `roof-garage-front`, the pitched garage slab between `GARAGE_RIDGE_Z` and the driveway-facing front eave.
 * @evidence spaces/roof/garage-front.md#garage-front-roof Its rectangle starts at the shared wall and GARAGE_RIDGE_Z, reaches the garage front overhang, and follows gFront toward the eave.
 * @evidenceReview spaces/roof/garage-front.md#garage-front-roof The plan begins at `GARAGE.inner.x[0]` on the shared wall and `GARAGE_RIDGE_Z`, extends by `OVERHANG.garage` at the free east and front edges, and takes `gFront(z)` as its top.
 * @evidence principles/core/source-units.md#source-scope-preservation The west edge uses GARAGE.inner.x[0] with no added overhang; the function leaves the rear slope to its separate owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation The west bound is `GARAGE.inner.x[0]` with no overhang term; this function uses `gFront` only, leaving the rear garage face to `buildGarageBackRoof`.
 * @evidence principles/core/source-units.md#source-substantive-completion The front rectangle becomes a slopedSlab of ROOF_THICKNESS and a named roof-garage-front mesh part.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `slopedSlab` turns this front rectangle and `gFront` height into `roof-garage-front` with `ROOF_THICKNESS` and explicit `roofFreeEdge` treatment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-roof runs from the main/garage shared-wall line to the garage right eave and from its front 0.35 m overhang to GARAGE_RIDGE_Z, using the 5/12 weather profile.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `garage-front-roof` assigns the shared-wall stop, front eave and ridge, while `roof-profile-datums` fixes `gFront`, 5/12 slope and 0.35 m free reach; this plan consumes those inputs without a new garage roof extent.
 */
export const buildGarageFrontRoof = (): IHousePart[] => [
  part(
    "roof-garage-front",
    "roof/garage-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect(
        [GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage],
        [GARAGE_RIDGE_Z, GARAGE.outer.z[1] + OVERHANG.garage],
      ),
      top: (_x, z) => gFront(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];

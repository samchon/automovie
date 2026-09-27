/**
 * Wall-head wedges: the top of a front or rear wall across its thickness.
 *
 * Design owner: `docs/spaces/roof/00-junctions.md#roof-wall-head-junctions`.
 * Where one roof slope covers the whole thickness of a front or rear wall, the
 * inner line is higher than the outer line by slope × thickness (main 8/12,
 * right 7/12, garage 5/12). A wall panel is extruded straight through its
 * thickness, so its outline stops at the outer-line underside and this wedge
 * rises from there to the underside function across the thickness. Neither
 * the outer height is pushed inward nor the inner height pushed outward.
 *
 * Consumers: `front.ts`, `rear.ts`, and the garage walls. A helper; the calling
 * elevation owns the emitted body.
 */
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { ROOF_THICKNESS } from "../roof/junctions";

/** One wedge over X = `x`, across Z = `z`, under the roof function `roof`. */
/**
 * @evidence spaces/roof/00-junctions.md wallHead forms a wedge under the roof across a front or rear wall's full thickness.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd wallHead spans the caller's X and Z wall-thickness rectangle and returns a sloped solid; front.ts and rear.ts call it for the front and rear wall-head contacts described by the roof junction design.
 * @evidence spaces/roof/00-junctions.md#roof-wall-head-junctions Its top samples the roof underside at each Z while the floor stays at the panel's outer-line underside.
 * @evidenceReview spaces/roof/00-junctions.md#roof-wall-head-junctions #0de3b07 The slopedSlab top samples props.roof(z) minus ROOF_THICKNESS through the wall, while its floor stays at the same underside evaluated at outerZ; it closes the higher inner contact without raising the outer line.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper returns the calling elevation's wall part and imports ROOF_THICKNESS; it does not claim the roof surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallHead passes the caller's id and owner to a wall part and reads the shared ROOF_THICKNESS only for the contact top; it emits no second roof surface.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab closes the varying-height gap, giving the wall a solid roof contact instead of a floating top.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slopedSlab receives a complete plan, varying roof-underside top and fixed outer-line floor, so the helper returns actual wall geometry for the gap instead of a height-only record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The wall-head parent supplies slope-across-thickness and the outer reference line; no extra wall-height datum was introduced.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Roof-wall-head-junctions specifies the roof underside across wall thickness and the outer-line reference; wallHead evaluates the caller's roof function at that outer line and through Z without inventing another wall datum.
 */
export const wallHead = (props: {
  id: string;
  owner: string;
  x: readonly [number, number];
  z: readonly [number, number];
  /** Weather surface of the roof slope that covers this span. */
  roof: (z: number) => number;
  /** The wall face whose underside height the panel already reaches. */
  outerZ: number;
}): IHousePart =>
  part(
    props.id,
    props.owner,
    "wall",
    PALETTE.siding,
    slopedSlab({
      plan: rect(props.x, props.z),
      top: (_x, z) => props.roof(z) - ROOF_THICKNESS,
      floor: props.roof(props.outerZ) - ROOF_THICKNESS,
    }),
  );

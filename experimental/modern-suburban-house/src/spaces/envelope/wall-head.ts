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
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { ROOF_THICKNESS } from "../roof/junctions";

/** One wedge over X = `x`, across Z = `z`, under the roof function `roof`. */
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

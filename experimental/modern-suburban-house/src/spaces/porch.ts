/**
 * `front-porch`: the raised open porch, its three risers, three columns, front
 * beam and low sloped roof.
 *
 * Design owner: `docs/spaces/porch.md`. Floor X = [-5.75, 2.20], Z = [0, 2.20] m
 * at Y = 0 (01 ground-threshold-datums); its platform body reaches the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 * Stair width 1.50 m centred on the front door X = 0.90: three 0.15 m risers
 * from −0.45 m and two 0.30 m treads, derived backwards from the porch edge
 * Z = 2.20; the lower flat waiting belongs to the front walk.
 * Columns at X = -5.40 + 3.65 k (k = 0..2), Z = 1.975 m: base 0.35 m square
 * Y = [0, 0.15], shaft 0.25 m square Y = [0.15, 2.33], head 0.35 m square
 * Y = [2.33, 2.45]. Beam X = [-5.75, 2.20], Z = [1.85, 2.10], Y = [2.45, 2.70].
 * Roof weather surface P(Z) = 3.50 − Z/4 over X = [-6.10, 2.55], Z = [0, 2.35],
 * underside 0.22 m lower; the packer between the beam top and that underside
 * is derived from their gap so the roof does not float on the beam.
 */
import { PALETTE } from "./palette";
import { type IHousePart, block, part, rect, slopedSlab } from "./solids";
import { STOREYS } from "./storeys";
import { FRONT_DOOR } from "./rooms/entry";
import type { IExteriorZone, ISiteBuild } from "./site/zone";

const OWNER = "porch.ts";
const PLATFORM_BOTTOM = STOREYS.frontWalk - 0.12;
/**
 * @evidence spaces/porch.md PORCH_STEP_CENTRE_X is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/porch.md#porch-platform-access The PORCH_STEP_CENTRE_X measurement follows the reviewed porch step geometry.
 * @evidence principles/core/source-units.md#source-scope-preservation PORCH_STEP_CENTRE_X shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import PORCH_STEP_CENTRE_X for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed PORCH_STEP_CENTRE_X owner fixes this measurement; its consumers add no independent value.
 */
export const PORCH_STEP_CENTRE_X = (FRONT_DOOR.from + FRONT_DOOR.to) / 2;
/**
 * @evidence spaces/porch.md PORCH_STEP_RISE is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/porch.md#porch-platform-access The PORCH_STEP_RISE measurement follows the reviewed porch step geometry.
 * @evidence principles/core/source-units.md#source-scope-preservation PORCH_STEP_RISE shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import PORCH_STEP_RISE for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed PORCH_STEP_RISE owner fixes this measurement; its consumers add no independent value.
 */
export const PORCH_STEP_RISE = (STOREYS.porchFloor - STOREYS.frontWalk) / 3;
/**
 * @evidence spaces/porch.md PORCH_STEP_BACK_Z is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/porch.md#porch-platform-access The PORCH_STEP_BACK_Z measurement follows the reviewed porch step geometry.
 * @evidence principles/core/source-units.md#source-scope-preservation PORCH_STEP_BACK_Z shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import PORCH_STEP_BACK_Z for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed PORCH_STEP_BACK_Z owner fixes this measurement; its consumers add no independent value.
 */
export const PORCH_STEP_BACK_Z = 2.2;
/**
 * @evidence spaces/porch.md PORCH_STEP_FRONT_Z is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/porch.md#porch-platform-access The PORCH_STEP_FRONT_Z measurement follows the reviewed porch step geometry.
 * @evidence principles/core/source-units.md#source-scope-preservation PORCH_STEP_FRONT_Z shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import PORCH_STEP_FRONT_Z for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed PORCH_STEP_FRONT_Z owner fixes this measurement; its consumers add no independent value.
 */
export const PORCH_STEP_FRONT_Z = PORCH_STEP_BACK_Z + 2 * 0.3;
const porchRoof = (z: number): number => 3.5 - z / 4;

/** Emit the porch platform, steps, columns, beam, packer and roof. */
/**
 * @evidence spaces/porch.md This builder owns the complete raised entry porch, its access steps, columns, beam, packer, roof, and zone.
 * @evidence spaces/porch.md#porch-platform-access The platform at Y=0 joins three 0.15 m risers to the front-walk level and names the front-porch standing zone.
 * @evidence spaces/porch.md#porch-roof-columns Three repeated column stacks carry a front beam and a sloped roof whose packer closes the beam-to-underside gap.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder leaves the lower waiting pad to front-walk and uses the imported STOREYS datums for platform height.
 * @evidence principles/core/source-units.md#source-substantive-completion Blocks, a sloped roof mesh, and the zone record are emitted in a fixed loop and part order.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Both porch parent units give step, column, beam, roof, and waiting-pad bounds; their geometry needed no additional access decision.
 */
export const buildPorch = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part("porch-platform", OWNER, "porch", PALETTE.porchFloor, block([-5.75, PLATFORM_BOTTOM, 0], [2.2, STOREYS.porchFloor, 2.2])),
  ];
  // Steps: tread k (k = 1, 2) lies k × 0.30 m in front of the porch edge at k risers below it.
  const [sx0, sx1] = [PORCH_STEP_CENTRE_X - 0.75, PORCH_STEP_CENTRE_X + 0.75];
  for (let k = 1; k <= 2; ++k) {
    const edge = PORCH_STEP_BACK_Z + 0.3 * (k - 1);
    parts.push(part(`porch-step-${k}`, OWNER, "porch", PALETTE.porchFloor, block([sx0, PLATFORM_BOTTOM, edge], [sx1, STOREYS.porchFloor - PORCH_STEP_RISE * k, edge + 0.3])));
  }
  for (let c = 0; c < 3; ++c) {
    const x = -5.4 + 3.65 * c;
    const z = 1.975;
    parts.push(
      part(`porch-column-${c}-base`, OWNER, "porch", PALETTE.trim, block([x - 0.175, 0, z - 0.175], [x + 0.175, 0.15, z + 0.175])),
      part(`porch-column-${c}-shaft`, OWNER, "porch", PALETTE.trim, block([x - 0.125, 0.15, z - 0.125], [x + 0.125, 2.33, z + 0.125])),
      part(`porch-column-${c}-head`, OWNER, "porch", PALETTE.trim, block([x - 0.175, 2.33, z - 0.175], [x + 0.175, 2.45, z + 0.175])),
    );
  }
  parts.push(
    part("porch-beam", OWNER, "porch", PALETTE.trim, block([-5.75, 2.45, 1.85], [2.2, 2.7, 2.1])),
    part("porch-beam-packer", OWNER, "porch", PALETTE.trim, slopedSlab({ plan: rect([-5.75, 2.2], [1.85, 2.1]), top: (_x, z) => porchRoof(z) - 0.22, floor: 2.7 })),
    part("porch-roof", OWNER, "roof", PALETTE.roof, slopedSlab({ plan: rect([-6.1, 2.55], [0, 2.35]), top: (_x, z) => porchRoof(z), thickness: 0.22 })),
  );
  // The front-porch zone is the platform the entry door opens on (porch-platform-access).
  const zone: IExteriorZone = {
    id: "front-porch",
    owner: OWNER,
    outline: rect([-5.75, 2.2], [0, 2.2]),
    anchor: { x: PORCH_STEP_CENTRE_X, y: STOREYS.porchFloor, z: 1.1 },
    rampTo: null,
  };
  return { zones: [zone], parts };
};

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
import type { IExteriorZone, ISiteBuild } from "./site/zone";

const OWNER = "porch.ts";
const PLATFORM_BOTTOM = STOREYS.frontWalk - 0.12;
const porchRoof = (z: number): number => 3.5 - z / 4;

/** Emit the porch platform, steps, columns, beam, packer and roof. */
export const buildPorch = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part("porch-platform", OWNER, "porch", PALETTE.porchFloor, block([-5.75, PLATFORM_BOTTOM, 0], [2.2, STOREYS.porchFloor, 2.2])),
  ];
  // Steps: tread k (k = 1, 2) lies k × 0.30 m in front of the porch edge at k risers below it.
  const [sx0, sx1] = [0.9 - 0.75, 0.9 + 0.75];
  for (let k = 1; k <= 2; ++k) {
    const edge = 2.2 + 0.3 * (k - 1);
    parts.push(part(`porch-step-${k}`, OWNER, "porch", PALETTE.porchFloor, block([sx0, PLATFORM_BOTTOM, edge], [sx1, STOREYS.porchFloor - 0.15 * k, edge + 0.3])));
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
    anchor: { x: 0.9, y: STOREYS.porchFloor, z: 1.1 },
    rampTo: null,
  };
  return { zones: [zone], parts };
};

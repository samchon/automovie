/**
 * Bind the space owners' emitted role and blocking colour to their reviewed
 * material finish. The pair is a surface address, not a material colour: the
 * finish's own sRGB swatch and optical response remain with its design owner.
 * Composite roof, wall and stair solids are partitioned by the viewer before
 * lookup so weather, interior, soffit and riser faces can differ.
 */
import { PALETTE } from "../spaces/palette";
import type { HousePartRole } from "../spaces/solid-records";
import { brick } from "./exterior/brick";
import { fence } from "./exterior/fence";
import { frames } from "./exterior/frames";
import { paving, porchFloor } from "./exterior/paving";
import { shingle } from "./exterior/shingle";
import { siding } from "./exterior/siding";
import { trim } from "./exterior/trim";
import type { HouseFinish } from "./finish";
import { interiorCeilings } from "./interior/ceilings";
import {
  carpet,
  garageConcrete,
  laundryFloor,
  oakFloor,
} from "./interior/floors";
import { blackMetal } from "./interior/metal";
import { handrail, stairTread } from "./interior/stair";
import { floorTile } from "./interior/tile";
import { interiorTrim } from "./interior/trim";
import { interiorWalls } from "./interior/walls";

type Binding = readonly [HousePartRole, number, HouseFinish];
const bindings: readonly Binding[] = [
  ["wall", PALETTE.siding, siding],
  ["wall", PALETTE.brick, brick],
  ["wall", PALETTE.interiorWall, interiorWalls],
  ["partition", PALETTE.interiorWall, interiorWalls],
  ["roof", PALETTE.roof, shingle],
  ["chimney", PALETTE.brick, brick],
  ["chimney", PALETTE.railing, frames],
  ["porch", PALETTE.trim, trim],
  ["porch", PALETTE.porchFloor, porchFloor],
  ["paving", PALETTE.paving, paving],
  ["paving", PALETTE.concrete, paving],
  ["fence", PALETTE.fenceWood, fence],
  ["floor", PALETTE.concrete, garageConcrete],
  ["floor", PALETTE.woodFloor, oakFloor],
  ["floor", PALETTE.tile, floorTile],
  ["floor", PALETTE.utility, laundryFloor],
  ["floor", PALETTE.carpet, carpet],
  ["floor", PALETTE.interiorWall, interiorWalls],
  ["ceiling", PALETTE.ceiling, interiorCeilings],
  ["stair", PALETTE.stairWood, stairTread],
  ["guard", PALETTE.stairWood, handrail],
  ["guard", PALETTE.railing, blackMetal],
  ["guard", PALETTE.trim, interiorTrim],
];

/** Refuse any unreviewed or ambiguous space finish instead of guessing. */
export const buildingSpaceFinish = (
  role: HousePartRole,
  color: number,
): HouseFinish => {
  const matches = bindings.filter(
    ([boundRole, boundColor]) => boundRole === role && boundColor === color,
  );
  if (matches.length !== 1)
    throw new Error(
      `expected one space finish for ${role}/${color.toString(16)}, found ${matches.length}`,
    );
  return matches[0]![2];
};

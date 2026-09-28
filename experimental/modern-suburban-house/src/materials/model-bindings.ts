/**
 * Building model face binding. The model id qualifies reused face names such as
 * leaf-panel: the front leaf, garage panel, and yard gate have different
 * finishes. Every emitted part must resolve to exactly one authored finish.
 */
import { brick } from "./exterior/brick";
import { frontDoor, garageDoor } from "./exterior/doors";
import { fence } from "./exterior/fence";
import { frames } from "./exterior/frames";
import { clearGlass, obscureGlass } from "./exterior/glass";
import { paving, porchFloor } from "./exterior/paving";
import { shingle } from "./exterior/shingle";
import { siding } from "./exterior/siding";
import { trim } from "./exterior/trim";
import type { HouseFinish } from "./finish";
import { stainlessSteel } from "./furnishings/appliances";
import { greigeCabinet, lightCountertop, storedCloth } from "./furnishings/cabinetry";
import { mirrorSilver, sanitaryCeramic } from "./furnishings/sanitary";
import { furnitureWood } from "./furnishings/wood";
import {fixtureDiffuser,fixtureGlass,fixtureShade,fireboxBlack,mantelWood} from "./furnishings/fixtures";
import { interiorCeilings } from "./interior/ceilings";
import {
  carpet,
  garageConcrete,
  laundryFloor,
  oakFloor,
} from "./interior/floors";
import { blackMetal } from "./interior/metal";
import { handrail, stairTread } from "./interior/stair";
import { floorTile, wallTile } from "./interior/tile";
import { interiorTrim } from "./interior/trim";
import { interiorWalls } from "./interior/walls";

/** The building material catalogue, without furnishings or mask-only colours. */
export const buildingFinishes: readonly HouseFinish[] = [
  siding,
  trim,
  shingle,
  brick,
  frames,
  clearGlass,
  obscureGlass,
  frontDoor,
  garageDoor,
  porchFloor,
  paving,
  fence,
  stainlessSteel,
  greigeCabinet,
  lightCountertop,
  sanitaryCeramic,
  mirrorSilver,
  furnitureWood,
  storedCloth,
  fixtureDiffuser,fixtureGlass,fixtureShade,fireboxBlack,mantelWood,
  interiorWalls,
  interiorCeilings,
  interiorTrim,
  oakFloor,
  carpet,
  laundryFloor,
  garageConcrete,
  stairTread,
  handrail,
  blackMetal,
  floorTile,
  wallTile,
];

/** Resolve an emitted model face, refusing omissions and ambiguous bindings. */
export const buildingModelFinish = (
  modelId: string,
  faceId: string,
): HouseFinish => {
  const matches = buildingFinishes.filter(
    (finish) =>
      finish.modelBindings?.some(
        (binding) =>
          (/[:/\-]$/.test(binding.model)
            ? modelId.startsWith(binding.model)
            : modelId === binding.model) && binding.faces.includes(faceId),
      ) ?? false,
  );
  if (matches.length !== 1)
    throw new Error(
      `expected one finish for ${modelId}/${faceId}, found ${matches.length}`,
    );
  return matches[0]!;
};

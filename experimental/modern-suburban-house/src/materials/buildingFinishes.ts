import { brick } from "./exterior/brick";
import { frontDoor } from "./exterior/frontDoor";
import { fence } from "./exterior/fence";
import { frames } from "./exterior/frames";
import { garageDoor } from "./exterior/garageDoor";
import { clearGlass } from "./exterior/clearGlass";
import { obscureGlass } from "./exterior/obscureGlass";
import { paving } from "./exterior/paving";
import { porchFloor } from "./exterior/porchFloor";
import { shingle } from "./exterior/shingle";
import { siding } from "./exterior/siding";
import { trim } from "./exterior/trim";
import type { HouseFinish } from "./HouseFinish";
import { stainlessSteel } from "./furnishings/stainlessSteel";
import { greigeCabinet } from "./furnishings/greigeCabinet";
import { fireboxBlack } from "./furnishings/fireboxBlack";
import { fixtureDiffuser } from "./furnishings/fixtureDiffuser";
import { fixtureGlass } from "./furnishings/fixtureGlass";
import { fixtureShade } from "./furnishings/fixtureShade";
import { lightCountertop } from "./furnishings/lightCountertop";
import { mantelWood } from "./furnishings/mantelWood";
import { mirrorSilver } from "./furnishings/mirrorSilver";
import { sanitaryCeramic } from "./furnishings/sanitaryCeramic";
import { storedCloth } from "./furnishings/storedCloth";
import { furnitureWood } from "./furnishings/furnitureWood";
import { carpet } from "./interior/carpet";
import { interiorCeilings } from "./interior/interiorCeilings";
import { oakFloor } from "./interior/oakFloor";
import { garageConcrete } from "./interior/garageConcrete";
import { handrail } from "./interior/handrail";
import { laundryFloor } from "./interior/laundryFloor";
import { blackMetal } from "./interior/blackMetal";
import { stairTread } from "./interior/stairTread";
import { floorTile } from "./interior/floorTile";
import { interiorTrim } from "./interior/interiorTrim";
import { interiorWalls } from "./interior/interiorWalls";
import { wallTile } from "./interior/wallTile";

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
  fixtureDiffuser, fixtureGlass, fixtureShade, fireboxBlack, mantelWood,
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

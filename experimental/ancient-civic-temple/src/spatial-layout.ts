/**
 * Pure assembly entry evaluating the reviewed space owners once.
 * Resolves the roof envelope first, then uses that same result for entrance,
 * sanctuary and colonnade cells. Returns geometry inputs for the space-source
 * draft rather than a complete BuiltEnvironment. Floors return actual meshes
 * and supports; wall/opening solids, connectors, exterior ground and renderer
 * binding remain outside this entry. Viewer and measurement consumers share
 * these inputs instead of authoring separate coordinates or cells.
 */
import { createTempleFloors } from "./floors";
import { templeSpaceHierarchy } from "./spaces/building";
import { templeDoorPassages, templeClerestories } from "./spaces/openings";
import { templeRoofEnvelope } from "./spaces/roofs/assembly";
import { templeAdministration } from "./spaces/rooms/administration";
import { templeColonnade } from "./spaces/rooms/colonnade";
import { templeCourtyard, templeFountainInputs } from "./spaces/rooms/courtyard";
import { templeEntrance } from "./spaces/rooms/entrance";
import { templeOffering } from "./spaces/rooms/offering";
import { templeRecords } from "./spaces/rooms/records";
import { templeSanctuary } from "./spaces/rooms/sanctuary";
import { templeServiceYard } from "./spaces/rooms/service-yard";
import { templeStorage } from "./spaces/rooms/storage";

export const createTempleSpatialLayout = () => {
  const roof = templeRoofEnvelope();
  return {
    roof,
    floors: createTempleFloors(),
    spaces: templeSpaceHierarchy([
      templeEntrance(roof), templeCourtyard(), templeColonnade(roof),
      templeSanctuary(roof), templeOffering(), templeAdministration(),
      templeRecords(), templeStorage(), templeServiceYard(),
    ]),
    doors: templeDoorPassages,
    clerestories: templeClerestories(),
    fountainInputs: templeFountainInputs(),
  };
};

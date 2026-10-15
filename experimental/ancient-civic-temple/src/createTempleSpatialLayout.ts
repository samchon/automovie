import { createTempleFloors } from "./createTempleFloors";
import { templeSpaceHierarchy } from "./spaces/templeSpaceHierarchy";
import { templeClerestories } from "./spaces/templeClerestories";
import { templeDoorPassages } from "./spaces/templeDoorPassages";
import { templeRoofEnvelope } from "./spaces/roofs/templeRoofEnvelope";
import { templeAdministration } from "./spaces/rooms/templeAdministration";
import { templeColonnade } from "./spaces/rooms/templeColonnade";
import { templeCourtyard } from "./spaces/rooms/templeCourtyard";
import { templeFountainInputs } from "./spaces/rooms/templeFountainInputs";
import { templeEntrance } from "./spaces/rooms/templeEntrance";
import { templeOffering } from "./spaces/rooms/templeOffering";
import { templeRecords } from "./spaces/rooms/templeRecords";
import { templeSanctuary } from "./spaces/rooms/templeSanctuary";
import { templeServiceYard } from "./spaces/rooms/templeServiceYard";
import { templeStorage } from "./spaces/rooms/templeStorage";

/**
 * Pure assembly entry evaluating the reviewed space owners once.
 * Resolves the roof envelope first, then uses that same result for entrance,
 * sanctuary and colonnade cells. Returns geometry inputs for the space-source
 * draft rather than a complete BuiltEnvironment. Floors return actual meshes
 * and supports; wall/opening solids, connectors, exterior ground and renderer
 * binding remain outside this entry. Viewer and measurement consumers share
 * these inputs instead of authoring separate coordinates or cells.
 */
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

import type { AutoMovieHumanBodyPartId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyPartId";

import type { IHumanBodyPartSourceInventoryFile } from "./IHumanBodyPartSourceInventoryFile";

/** Source-derived part membership; a missing file does not stop other parts. @author Samchon */
export interface IHumanBodyPartSourceInventoryPart {
  id: AutoMovieHumanBodyPartId;
  family: "bone" | "skeletal-muscle" | "connective" | "adipose";
  actualAcquiredFiles?: IHumanBodyPartSourceInventoryFile[];
}

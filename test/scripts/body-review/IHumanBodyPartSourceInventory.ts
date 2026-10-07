import type { IHumanBodyPartSourceInventoryPart } from "./IHumanBodyPartSourceInventoryPart";

/** Acquired source inventory emitted from the actual declared part population. @author Samchon */
export interface IHumanBodyPartSourceInventory {
  populationOwner: string;
  parts: IHumanBodyPartSourceInventoryPart[];
}

import { Finish } from "./Finish";
import { templeSpaceFinishes } from "./templeSpaceFinishes";

/** Finish of a space surface identity; throws for a surface without one. */
export const templeSpaceFinish: (id: string) => Finish = (id: string): Finish => {
  if (!Object.hasOwn(templeSpaceFinishes, id))
    throw new Error(`${id}: no space finish`);
  return templeSpaceFinishes[id]!;
};

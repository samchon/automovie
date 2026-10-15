import { Finish } from "./Finish";
import { templeSpaceFinishes } from "./templeSpaceFinishes";

export const templeSpaceFinish: (id: string) => Finish = (id: string): Finish => {
  if (!Object.hasOwn(templeSpaceFinishes, id))
    throw new Error(`${id}: no space finish`);
  return templeSpaceFinishes[id]!;
};

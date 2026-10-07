import type { BodyContactBones } from "./BodyContactBones";
import type { IBodyContactPlane } from "./IBodyContactPlane";
import type { IChosenBodyPlane } from "./IChosenBodyPlane";
import { bisectorPlane } from "./bisectorPlane";
import { contactPlane } from "./contactPlane";
import { depthOfPlane } from "./depthOfPlane";

/**
 * The plane that asks the crossing patches for the least movement once it is
 * centred between the deepest corner of each side: the fold plane of an
 * adjacent pair or the contact plane between the two bones, whichever costs
 * less; null when neither exists. The cost is the summed shortfall of every
 * crossed corner from its own side, so a plane that already separates most
 * corners wins over one that cuts across the contact. A side with no crossed
 * corner makes both planes cost infinity and the first is returned.
 */
export function chooseContactPlane(
  bones: BodyContactBones,
  positions: number[],
  hitA: Iterable<number>,
  hitB: Iterable<number>,
  part: string,
  other: string,
): IChosenBodyPlane | null {
  const candidates: IChosenBodyPlane[] = [];
  const fold = bisectorPlane(bones, part, other);
  if (fold !== null) candidates.push({ plane: fold, kind: "fold" });
  const contact = contactPlane(bones, part, other);
  if (contact !== null) candidates.push({ plane: contact, kind: "contact" });
  if (candidates.length === 0) return null;
  const listA = [...hitA];
  const listB = [...hitB];
  const cost = (plane: IBodyContactPlane): number => {
    if (listA.length === 0 || listB.length === 0) return Infinity;
    const shift =
      (Math.min(...listA.map((v) => depthOfPlane(plane, positions, v))) +
        Math.max(...listB.map((v) => depthOfPlane(plane, positions, v)))) /
      2;
    return (
      listA.reduce(
        (sum, v) =>
          sum + Math.max(0, shift - depthOfPlane(plane, positions, v)),
        0,
      ) +
      listB.reduce(
        (sum, v) =>
          sum + Math.max(0, depthOfPlane(plane, positions, v) - shift),
        0,
      )
    );
  };
  return candidates.reduce((best, one) =>
    cost(one.plane) < cost(best.plane) ? one : best,
  );
}

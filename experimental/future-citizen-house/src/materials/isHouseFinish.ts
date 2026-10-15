import { solid } from "./solid";
import { textured } from "./textured";
import { HouseFinishId } from "./HouseFinishId";

export function isHouseFinish(id: string): id is HouseFinishId {
  return (
    id in textured ||
    id in solid ||
    /^wood-end\/oak-(floor|joinery|furniture|stair)$/.test(id)
  );
}

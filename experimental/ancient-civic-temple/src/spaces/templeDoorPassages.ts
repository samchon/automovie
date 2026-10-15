import type { DoorPassage } from "../geometry/DoorPassage";
import { templePlan as p } from "./templePlan";

export const templeDoorPassages: readonly DoorPassage[] = [
  {
    id: "door-entry", boundary: "boundary-entry", room: "entrance",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.entranceBack, wallHigh: p.entranceFront,
    width: 1.8, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double"
  },
  {
    id: "door-sanctuary", boundary: "boundary-sanctuary-south", room: "sanctuary",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.sanctuaryFront, wallHigh: p.northRing,
    width: 1.4, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double"
  },
  {
    id: "door-offering", boundary: "boundary-west-spine.colonnade", room: "offering",
    adjacent: "colonnade", axis: "z", center: 2.175,
    wallLow: p.westRoom, wallHigh: p.westRing,
    width: 1.2, height: 2.3, frame: 0.06, leafThickness: 0.05, swing: "room-north"
  },
  {
    id: "door-administration", boundary: "boundary-east-spine.administration", room: "administration",
    adjacent: "colonnade", axis: "z", center: 7.65,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south"
  },
  {
    id: "door-records", boundary: "boundary-east-spine.records", room: "records",
    adjacent: "colonnade", axis: "z", center: 3.725,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south"
  },
  {
    id: "door-storage", boundary: "boundary-east-spine.storage", room: "storage",
    adjacent: "colonnade", axis: "z", center: -0.3,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south"
  },
  {
    id: "door-yard", boundary: "boundary-east-spine.yard", room: "service-yard",
    adjacent: "colonnade", axis: "z", center: -3.15,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north"
  },
  {
    id: "door-service-exterior", boundary: "boundary-east.service-yard", room: "service-yard",
    adjacent: "exterior", axis: "z", center: -6.4,
    wallLow: p.eastInner, wallHigh: p.eastOuter,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north"
  },
];

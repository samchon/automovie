import { templePlan as p } from "../templePlan";
import { templeLevels as y } from "../templeLevels";
import { templeEntranceSteps } from "./templeEntranceSteps";

/**
 * The second tread and landing share one level face without an extra riser.
 */
export const templeEntranceFloors = () => {
  const half = templeEntranceSteps.width / 2;
  const firstBack = p.southOuter - templeEntranceSteps.tread;
  return [
    {
      id: "first-tread", west: -half, east: half, north: firstBack, south: p.southOuter,
      floor: y.publicRoad + templeEntranceSteps.rise
    },
    {
      id: "upper-landing", west: -half, east: half, north: p.entranceFront, south: firstBack,
      floor: y.floor
    },
    {
      id: "west-support", west: p.westPorchInner, east: -half,
      north: p.entranceFront, south: p.southOuter, floor: y.floor
    },
    {
      id: "east-support", west: half, east: p.eastPorchInner,
      north: p.entranceFront, south: p.southOuter, floor: y.floor
    },
  ];
};

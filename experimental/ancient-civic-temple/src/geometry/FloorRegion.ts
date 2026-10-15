import type { PlanRectangle } from "./PlanRectangle";


export interface FloorRegion extends PlanRectangle {
  id: string;
  floor: number;
}

import { FloorRegion } from "./FloorRegion";


export interface FloorSlab extends FloorRegion {
  bottom: number;
  opening: string | null;
}


export interface DoorPassage {
  id: string;
  boundary: string;
  room: string;
  adjacent: string;
  axis: "x" | "z";
  center: number;
  wallLow: number;
  wallHigh: number;
  width: number;
  height: number;
  frame: number;
  leafThickness: number;
  swing: "room-double" | "room-north" | "room-south";
}

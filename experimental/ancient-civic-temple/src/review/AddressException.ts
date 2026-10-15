
export interface AddressException {
  wall: string;
  face: number;
  axis: "x" | "z";
  from: number;
  to: number;
  minY?: number;
  lowerEdge?: { untilZ: number; atZ: number; atY: number; rise: number; };
  observation: string;
}

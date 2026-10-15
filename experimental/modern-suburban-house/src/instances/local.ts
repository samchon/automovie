import { dot } from "./dot";
import { minus } from "./minus";
import { Frame } from "./Frame";
import { Point } from "./Point";
import { Vec } from "./Vec";


/** Facade-local `[u, v]` of a world point. */
export const local = (frame: Frame, p: Vec): Point => {
  const d = minus(p, frame.origin);
  return [dot(d, frame.u), dot(d, frame.v)];
};

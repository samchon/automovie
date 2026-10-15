import { times } from "./times";
import { Frame } from "./Frame";
import { Vec } from "./Vec";
import { plus } from "./plus";

/** World point at frame-local `x, y`. */
export const world = (frame: Frame, x: number, y: number): Vec => plus(frame.origin, plus(times(frame.u, x), times(frame.v, y)));

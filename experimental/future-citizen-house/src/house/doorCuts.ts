import { Frame } from "./Frame";
import { localCut } from "./localCut";
import { portals } from "./portals";

/**
 * Wall-local cuts for every portal in the wall, each 0.06 m wider on both sides and above for its
 * frame.
 */
export const doorCuts = (f: Frame) => portals.filter((p) => p.wall === f.id).map((p) => localCut(f, p.id, p.center - p.width / 2 - 0.06, p.center + p.width / 2 + 0.06, f.floor, f.floor + p.height + 0.06));

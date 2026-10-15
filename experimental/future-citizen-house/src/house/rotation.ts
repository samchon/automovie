import { Frame } from "./Frame";
import { yaw } from "./yaw";

/**
 * Yaw that turns a wall-local frame, +X along the run and +Z outward, into the wall's world
 * orientation.
 */
export const rotation = (f: Frame) => yaw(f.along === "x" ? (f.normal === 1 ? 0 : Math.PI) : f.normal * Math.PI / 2);

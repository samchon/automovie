import { Frame } from "./Frame";
import { yaw } from "./yaw";

export const rotation = (f: Frame) => yaw(f.along === "x" ? (f.normal === 1 ? 0 : Math.PI) : f.normal * Math.PI / 2);

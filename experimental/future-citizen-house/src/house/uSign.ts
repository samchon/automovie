import { Frame } from "./Frame";

export const uSign = (f: Frame) => f.along === "x" ? f.normal : -f.normal;

import { Frame } from "./Frame";

/** Sign that maps the wall's world run direction onto its local +X axis. */
export const uSign = (f: Frame) => f.along === "x" ? f.normal : -f.normal;

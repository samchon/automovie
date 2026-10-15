import { Vec } from "./Vec";


/** Vector scaled by `s`. */
export const times = (v: Vec, s: number): Vec => [v[0] * s, v[1] * s, v[2] * s];

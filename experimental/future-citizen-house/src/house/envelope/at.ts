import type { Frame } from "../Frame";
import { position } from "../position";


/** World point at wall-local `u, y`, `n` metres outward from the facade plane. */
export const at = (f: Frame, u: number, y: number, n: number) => position(f, u, y, n * f.normal);

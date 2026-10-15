import type { Frame } from "../Frame";
import { position } from "../position";


export const at = (f: Frame, u: number, y: number, n: number) => position(f, u, y, n * f.normal);

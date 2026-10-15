import { Frame } from "./Frame";
import { uSign } from "./uSign";

export const localU = (f: Frame, u: number) => (u - (f.a + f.b) / 2) * uSign(f);

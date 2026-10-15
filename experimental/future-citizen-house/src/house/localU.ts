import { Frame } from "./Frame";
import { uSign } from "./uSign";

/**
 * Wall-local horizontal coordinate of world run position `u`, measured from the wall's centre in
 * its facing direction.
 */
export const localU = (f: Frame, u: number) => (u - (f.a + f.b) / 2) * uSign(f);

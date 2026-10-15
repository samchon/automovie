import { Assembly } from "../house/Assembly";
import { stair } from "../house/circulation/stair";
import { ground } from "../house/storeys/ground";
import { upper } from "../house/storeys/upper";
import { topology } from "../house/topology";

/** Realize the clear cells, shared boundaries, floors and one stair together.
 */
export function structure(a: Assembly): void {
  topology(a);
  ground(a);
  upper(a);
  stair(a);
}

import { Assembly } from "../Assembly";
import { lights } from "./lights";
import { lining } from "./lining";
export function corridor(a: Assembly): void {
  lining(a, "upper-corridor");
  // The additional points bisect the existing gaps; append them so the first
  // three fixture addresses remain stable for the current viewer and census.
  lights(a, "upper-corridor", [[-1.4, -0.95], [-1.4, 0.6], [-1.4, 1.9], [-1.4, -0.175], [-1.4, 1.25]]);
}

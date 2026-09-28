import { Assembly } from "../assembly";
import { lining, lights } from "./interior";
export function corridor(a: Assembly): void {
  lining(a, "upper-corridor");
  lights(a, "upper-corridor", [[-1.4, -0.95], [-1.4, 0.6], [-1.4, 1.9]]);
}

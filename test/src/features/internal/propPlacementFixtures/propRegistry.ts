import type { IAutoMoviePropSpec } from "@automovie/interface";
import { table } from "./table";
import { lamp } from "./lamp";
import { sconce } from "./sconce";
import { charger } from "./charger";
import { pendant } from "./pendant";
import { chime } from "./chime";
import { cabinet } from "./cabinet";
import { door } from "./door";
import { crate } from "./crate";
import { sculpture } from "./sculpture";

/**
 * The whole furnished room, in a stable declaration order.
 *
 * Behavior: Constructs all ten original furnished prop specs in the stable order used by addressed placement assertions.
 * Expectation basis: The individual authored factories define inputs and slot identities rather than expected validator output; each caller supplies its own literal success/refusal requirements.
 * Cases: Preserves table, lamp, sconce, charger, pendant, chime, cabinet, door, crate and sculpture order; duplicate/reversed/empty mutations remain in owning entries.
 * Execution: The existing owning entries call propRegistry during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function propRegistry(): IAutoMoviePropSpec[] { return [
  table(),
  lamp(),
  sconce(),
  charger(),
  pendant(),
  chime(),
  cabinet(),
  door(),
  crate(),
  sculpture(),
]; }

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

/** The whole furnished room, in a stable declaration order. */
export const propRegistry = (): IAutoMoviePropSpec[] => [
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
];

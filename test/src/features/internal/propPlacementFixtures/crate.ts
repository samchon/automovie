import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** A prop in the cell-less annex: located by name, not by geometry. */
export const crate = (): IAutoMoviePropSpec => ({
  ...boxProp("crate"),
  placement: { relations: [inSpace("annex")], footprint: null, clearance: [] },
});

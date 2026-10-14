import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Every member of the closed `AutoMovieGuidePass` union, in declaration order, as the runtime list a requested pass name is checked against.
 *
 * The `interface` package holds only types, so the value list lives here.
 *
 * The six lowercase names enumerate the current closed guide-pass union in deterministic declaration order; the readonly element type rejects a value outside that union. This registry supplies pass admission and default capture ordering without putting runtime values in the pure-type interface, and names rendering modes rather than authored scenes or consumer-specific entries.
 *
 * The fixed registry chooses no processing algorithm. Pass validators and output planners share this module-owned array for the process lifetime; it retains six names without a renderer or captured frame.
 *
 * @author Samchon
 */
export const AUTOMOVIE_GUIDE_PASSES: readonly AutoMovieGuidePass[] = [
  "beauty",
  "depth",
  "mask",
  "normal",
  "outline",
  "pose",
];

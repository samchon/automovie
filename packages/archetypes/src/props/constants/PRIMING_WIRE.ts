import { AutoMovieArchetypeUnits } from "../../core";

/**
 * The read wire, ring and stems, metres, and the garrison wire's weight,
 * kilograms.
 */
const WIRE: number = 0.175 * AutoMovieArchetypeUnits.INCH;
const RING: number = 2 * AutoMovieArchetypeUnits.INCH;
const FIELD: number = 8 * AutoMovieArchetypeUnits.INCH;
const GARRISON: number = 14 * AutoMovieArchetypeUnits.INCH;
const GARRISON_MASS: number = 0.08 * AutoMovieArchetypeUnits.POUND;

/**
 * The length of wire in the ring, metres: its circumference at the wire's
 * centre line.
 */
const RING_WIRE: number = Math.PI * (RING - WIRE);

/**
 * A field gun's priming wire as the 1862 Ordnance Manual gives it (p. 134,
 * https://archive.org/details/ordnancemanualfo00unitrich): "iron wire 0.175
 * inch diameter, formed with a ring 2 inches diameter at the head, and pointed;
 * length of stem, for siege and garrison guns, 14 inches; length for
 * field-guns, 8 inches. Weight 0.08 lb. for garrison guns." Its `mass` is the
 * field wire's, a derivation: the garrison wire's weight scaled by the length
 * of wire in each, ring and stem. Read as `createTool.PRIMING_WIRE` and by the
 * tool's bands.
 */
export const PRIMING_WIRE: Readonly<
  Record<"wire" | "ring" | "field" | "mass", number>
> = {
  wire: WIRE,
  ring: RING,
  field: FIELD,
  mass: (GARRISON_MASS * (FIELD + RING_WIRE)) / (GARRISON + RING_WIRE),
};

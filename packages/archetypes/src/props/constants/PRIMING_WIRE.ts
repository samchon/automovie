import "../../core";
import { PrimingWireData } from "./internal/PrimingWireData";

/*
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
  wire: PrimingWireData.WIRE,
  ring: PrimingWireData.RING,
  field: PrimingWireData.FIELD,
  mass: (PrimingWireData.GARRISON_MASS * (PrimingWireData.FIELD + PrimingWireData.RING_WIRE)) / (PrimingWireData.GARRISON + PrimingWireData.RING_WIRE),
};

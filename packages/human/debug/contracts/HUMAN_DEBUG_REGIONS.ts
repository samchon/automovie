/**
 * The anatomical regions of the part view and the chain globs that make each one.
 *
 * A glob matches whole chain names of a calibration (`AutoMovieHumanBodyLaw.calibrate(...).body.chains`).
 * The region pieces and the batch render come from this record; `piece=region:<name>` lofts the
 * region's chains alone. A chain no region names is listed in the region piece's provenance, so a
 * new chain shows where it falls.
 */
export const HUMAN_DEBUG_REGIONS: {
  readonly head: readonly string[];
  readonly neck: readonly string[];
  readonly trunk: readonly string[];
  readonly shoulder: readonly string[];
  readonly arm: readonly string[];
  readonly hand: readonly string[];
  readonly leg: readonly string[];
  readonly foot: readonly string[];
} = {
  head: ["head", "head.*", "ear.*"],
  neck: ["neck", "neck.*"],
  trunk: ["trunk", "trunk.*", "upper", "upper.*"],
  shoulder: ["shoulder.*", "deltoid.*"],
  arm: ["arm.*"],
  hand: ["hand.*", "finger.*", "thumb.*"],
  leg: ["leg.*"],
  foot: ["foot.*", "toe.*"],
};

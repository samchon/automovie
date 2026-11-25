import type { IAutoMovieDesignReference } from "./IAutoMovieDesignReference";

/** Data and callback contracts shared by the ValidateDesignReference operations. */
export namespace IAutoMovieValidateDesignReference {
  /**
   * Validate one observed design reference as evidence.
   *
   * The record is checked as a self-consistent observation, never as a design:
   * a frame states how its own units are read, a primitive states what was on
   * the sheet, a candidate states one proposed meaning, and an issue states
   * what is still undecided. The validator's whole job is to keep those four
   * layers from collapsing into each other, because the moment an observation
   * is allowed to carry a conclusion, the design source of truth has been
   * silently replaced.
   *
   * So it refuses a candidate that cites a primitive nobody saw, an issue about
   * nothing, an analysis that claims `observed` while producing no reading, and
   * a non-observed analysis without a non-blank reason. Extra runtime
   * properties on non-observed analysis objects are not inspected. It also
   * refuses a settled scale that names no recorded candidate: an unknown scale
   * is a fact about the drawing, and inventing one is how a plan image turns
   * into metres nobody measured.
   *
   * The same principle binds an analysis to the one frame it says it read: a
   * candidate built from marks on another sheet was not produced by this
   * reading, and filing it here would let a section's geometry inherit a plan's
   * scale. Correlating two sheets is the authored building's job, through
   * evidence that may cite any candidate of any document.
   *
   * Observed points are in frame units and must lie within the frame's `bounds`
   * (0 to width, 0 to height); each primitive family has its own point-count
   * bounds, and only `text` and `level-marker` carry literal text. Frames are
   * judged by {@link validateDesignSourceFrame}. Every id is unique and
   * non-blank, the digest is a lowercase `sha256:` hex digest, and the media is
   * a supported type. Findings are returned with `$input` paths and nothing
   * throws; the asset bytes behind `digest` are not read here.
   */
  export type IProps = {
    /** Observed design reference to validate. */
    reference: IAutoMovieDesignReference;
  };
}

import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitLine } from "../IAutoMovieHumanDigitLine";
import type { IAutoMovieHumanDigitSection } from "../IAutoMovieHumanDigitSection";
import type { IAutoMovieHumanDigitProfile } from "./IAutoMovieHumanDigitProfile";

/** A digit standing on its bones, in the left frame, millimetres.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A digit standing on its bones, in the left frame, millimetres.
 * @evidence contracts/development/design.md#principled-representation `joints`: Its joints from its MCP: MCP, PIP and DIP for a finger, MCP and IP for the thumb. `points`: Centre line from its start, one point every {@link IAutoMovieHumanHandFinger.step} of its length. `step`: Spacing of the points along the line.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFingerBones.of, AutoMovieHumanHandDigitBones.onBones, AutoMovieHumanHandFingers.digitsOf. Read by AutoMovieHumanHandDigitChain.fingerOf, AutoMovieHumanHandSolve.knuckleSection. Also types AutoMovieHumanFingerBones.out, AutoMovieHumanHandConstruction.fingers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `joints`, `points`, `step`, `line`, `shape`, `ring`, `first`, `cap`, `pole`, `external`, `windows`, `nail`; callers supply the complete record.
 */
export interface IAutoMovieHumanHandFinger {
  /** Its joints from its MCP: MCP, PIP and DIP for a finger, MCP and IP for the thumb. */
  joints: AutoMovieVector3Tuple[];

  /** Centre line from its start, one point every {@link IAutoMovieHumanHandFinger.step} of its length. */
  points: AutoMovieVector3Tuple[];

  /** Spacing of the points along the line. */
  step: number;

  /** The centre line on its bones. */
  line: IAutoMovieHumanDigitLine.ILine;

  /**
   * Section at a length along the line: its shape in its own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Section at a length along the line: its shape in its own frame.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanHandDigitBones owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHandFinger.shape declares the invocation boundary only; AutoMovieHumanHandDigitBones and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanHandFinger.shape must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanHandFinger.shape owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanHandDigitBones and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanHandDigitBones producer or caller supplying the callback owns captured state and its lifetime.
   */
  shape: (s: number) => IAutoMovieHumanDigitSection.IShape;

  /**
   * Section points in the left frame at a length, one per control point in phase order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Section points in the left frame at a length, one per control point in phase order.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanHandDigitBones owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHandFinger.ring declares the invocation boundary only; AutoMovieHumanHandDigitBones and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanHandFinger.ring must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanHandFinger.ring owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanHandDigitBones and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanHandDigitBones producer or caller supplying the callback owns captured state and its lifetime.
   */
  ring: (s: number) => AutoMovieVector3Tuple[];

  /** Length of its first own section, past its webs. */
  first: number;

  /** Length where its rounded tip starts. */
  cap: number;

  /** The tip's apex. */
  pole: AutoMovieVector3Tuple;

  /** Its length from its web to its tip. */
  external: number;

  /** The windows of its narrow reliefs along the line, which its stations resolve. */
  windows: readonly IAutoMovieHumanDigitProfile.IWindow[];

  /**
   * Its nail plate along the line: the root and free edge lengths, the
   * plate's width, and the unit dorsal direction at the root, left frame.
   */
  nail: {
    /** Proximal nail-plate station along the digit's centre line, millimetres. */
    root: number;
    /** Free nail edge at the distal cap's start, millimetres along the digit's centre line. */
    edge: number;
    /** Nail plate's full transverse width, millimetres. */
    width: number;
    /** Dimensionless direction in the containing record's registered source frame; geometric consumers apply the documented normalization rule. */
    dorsal: AutoMovieVector3Tuple;
  };
}

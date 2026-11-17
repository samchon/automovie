import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";
import type { IAutoMovieHumanSkeletonMath } from "./IAutoMovieHumanSkeletonMath";

/**
 * Bind-derived neutral joint placements, world turns and clinical segment frames.
 *
 * The interface package owns these declarations; AutoMovieHumanNeutral in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bind-derived neutral joint placements, world turns and clinical segment frames. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput, IFrame, ISource, OfSource declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput, IFrame, ISource, OfSource separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanNeutral exchanges the named IOutput, IFrame, ISource, OfSource contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanNeutral {
  /** A body's neutral.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body's neutral.
   * @evidence contracts/development/design.md#principled-representation `joints`: The skeleton standing at neutral, in the bind's order, mm. `turns`: Each bone's world turn from bind to neutral: the achieved offset, inverted. `resting`: Each upper arm's and thigh's resting abduction from the plumb line, degrees, by bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutral.of, AutoMovieHumanNeutral.derive. Read by AutoMovieHumanJointTurn.derive, AutoMovieHumanPreparedKinematics.prepare. Also types AutoMovieHumanBindingInputs.neutral, AutoMovieHumanNeutral.CACHE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `joints`, `turns`, `resting`, `forearms`; callers supply the complete record.
   */
  export interface IOutput {
    /** The skeleton standing at neutral, in the bind's order, mm. */
    joints: IAutoMovieHumanJointCentres.IJoint[];

    /** Each bone's world turn from bind to neutral: the achieved offset, inverted. */
    turns: Map<string, AutoMovieQuaternionTuple>;

    /** Each upper arm's and thigh's resting abduction from the plumb line, degrees, by bone. */
    resting: Map<string, number>;

    /** Each forearm's achieved pronation from thumbs forward, degrees. */
    forearms: Map<string, number>;
  }

  /** One bone's segment frame at neutral.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One bone's segment frame at neutral.
   * @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `parent`: Parent bone, or null for the root. `centre`: Joint centre, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutral.frames.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `parent`, `centre`, `end`, `axes`; callers supply the complete record.
   */
  export interface IFrame {
    /** Bone id. */
    bone: string;

    /** Parent bone, or null for the root. */
    parent: string | null;

    /** Joint centre, mm. */
    centre: AutoMovieVector3Tuple;

    /** End of the segment: the child's centre or the leaf's tip, mm. */
    end: AutoMovieVector3Tuple;

    /** The bone's clinical axes; `twist` runs along the segment. */
    axes: IAutoMovieHumanSkeletonMath.IAxes;
  }

  /** What a body's neutral is derived from: its skin's rings and its bind skeleton.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a body's neutral is derived from: its skin's rings and its bind skeleton.
   * @evidence contracts/development/design.md#principled-representation `rings`: The skin as rings; at least the chains {@link READS} names. `joints`: The bind skeleton.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanNeutral.of. Also types AutoMovieHumanNeutral.read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `rings`, `joints`; callers supply the complete record.
   */
  export interface ISource {
    /** The skin as rings; at least the chains {@link READS} names. */
    rings: readonly IAutoMovieHumanChainRings[];

    /** The bind skeleton. */
    joints: readonly IAutoMovieHumanJointCentres.IJoint[];
  }

  /** The source argument of AutoMovieHumanNeutral.of. One calibrated body's neutral, derived at its first request and shared by
  every later one.
  The neutral reads only the chains {@link READS} names, by name, and the
  bind skeleton, which is a function of the calibration alone, so every
  caller's source gives the same neutral and the first one's is kept.
  @param calibration The body.
  @param source Its rings and bind skeleton, read only on the first request.
  @returns The neutral; callers read it and do not change it.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One calibrated body's neutral, derived at its first request and shared by every later one.
 * @evidence contracts/development/design.md#principled-representation One calibrated body's neutral, derived at its first request and shared by every later one. The callable takes  and returns ISource.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanNeutral.OfSource is the canonical exchange used by AutoMovieHumanNeutral.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanNeutral.of for one calibrated body's neutral, derived at its first request and shared by every later one.
 */
  export type OfSource = () => ISource;
}

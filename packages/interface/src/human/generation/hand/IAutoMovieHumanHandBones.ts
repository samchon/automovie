import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";

/** Type contracts exchanged by AutoMovieHumanHandBones; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandBones {
  /**
   * Actual joints and material frame: of creates the canonical left side,
   * and sided reflects the complete source for the right.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the same joint/frame definition with an independent public crease and the packing-derived breadth centre.
   * @evidence contracts/common.md#clear-and-simple-design All hand consumers read one explicit source record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared knuckle is the actual middle-MCP tuple, not a second estimate from a skin or bent segment.
   * @evidence contracts/common.md#meaningful-documentation States side/reflection ownership, material units and the independent crease/packing definitions.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The output type owns no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source factory determines record identity and sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous definition owns the returned bounded joint manifest.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual joints and material frame: of creates the canonical left side, and sided reflects the complete source for the right.
   * @evidence contracts/development/design.md#principled-representation `frame`: The actual generating material frame, carried with these same joints. `radialCenter`: Palm breadth-centre offset from MCP3 along this hand's radial/across direction, mm; derived from the same conventional MCP packing. `fingers`: Four fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandBones.of, AutoMovieHumanHandBones.sided. Read by AutoMovieHumanHandBones.sided. Also types AutoMovieHumanLimbRest.hand, AutoMovieHumanSkeletonLaw.hand.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `radialCenter`, `fingers`, `thumb`, `knuckle`, `crease`; callers supply the complete record.
   */
  export interface IOutput {
    /** The actual generating material frame, carried with these same joints. */
    frame: IAutoMovieHumanHandFrame;

    /** Palm breadth-centre offset from MCP3 along this hand's radial/across direction, mm; derived from the same conventional MCP packing. */
    radialCenter: number;

    /** Four fingers. */
    fingers: Record<Finger, IDigit>;

    /** The opposed thumb. */
    thumb: IDigit;

    /** Third MCP, the distal centre of the arm-owned palm. */
    knuckle: AutoMovieVector3Tuple;

    /** Public palm-length crease locus on the middle proximal phalanx's measuring course. */
    crease: AutoMovieVector3Tuple;
  }

  /**
   * Anatomical name used by the skeleton.
   *
   * @evidence contracts/common.md#principled-implementation Enumerates the four non-thumb digits in the existing skeletal vocabulary.
   * @evidence contracts/common.md#clear-and-simple-design One closed union keys the four source records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person-dependent alias or fallback digit.
   * @evidence contracts/common.md#meaningful-documentation States that the names belong to the skeleton and excludes the separately represented thumb.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A name union has no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no runtime resource.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Anatomical name used by the skeleton.
   * @evidence contracts/development/design.md#principled-representation Anatomical name used by the skeleton. The closed alternatives are "Index", "Middle", "Ring", "Little".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHandBones.fingers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandBones.fingers, NAMES for anatomical name used by the skeleton.
   */
  export type Finger = "Index" | "Middle" | "Ring" | "Little";

  /**
   * One digit's actual generating joint centres and terminal soft-tissue
   * point, mm, with the same hand's material dorsal direction.
   *
   * @evidence contracts/common.md#principled-implementation Separates a terminal skin apex from the three generating joints and retains the original material direction.
   * @evidence contracts/common.md#clear-and-simple-design A four-point list and one direction serve both skeleton and source curves.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not recover a direction from flexed bones or label the terminal skin point as another bony joint.
   * @evidence contracts/common.md#meaningful-documentation Gives finger/thumb point ordering, calibration units and the material-direction owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generating owner shares the record by reference.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The hand definition caller owns its finite point list and direction.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One digit's actual generating joint centres and terminal soft-tissue point, mm, with the same hand's material dorsal direction.
   * @evidence contracts/development/design.md#principled-representation `centres`: MCP, PIP, DIP and tip for a finger; CMC, MCP, IP and tip for the thumb. `dorsal`: Shared bind dorsal direction, projected by the digit's own generating frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanArmSources.source, AutoMovieHumanHandBones.fingers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centres`, `dorsal`; callers supply the complete record.
   */
  export interface IDigit {
    /** MCP, PIP, DIP and tip for a finger; CMC, MCP, IP and tip for the thumb. */
    centres: AutoMovieVector3Tuple[];

    /** Shared bind dorsal direction, projected by the digit's own generating frame. */
    dorsal: AutoMovieVector3Tuple;
  }
}

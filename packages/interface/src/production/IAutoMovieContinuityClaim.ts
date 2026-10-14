import { IAutoMovieContinuityProof } from "./IAutoMovieContinuityProof";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One canon fact with an explicitly selected proof family and owner. Scene citations provide traceability; the exact proof selector establishes whether the claim is discharged.
 *
 * @evidence contracts/common.md#principled-implementation Claim identity connects screenplay citations to one intended geometry, frame-review or acceptance proof. The surviving screenplay shape retains these declarations, but its production cross-record resolver is retired; matching attribution and current passing evidence remain explicit host obligations.
 * @evidence contracts/common.md#clear-and-simple-design Text, verification family, proof selector and scene scope separate the human fact from the machine-addressable evidence allowed to establish it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A generic scene citation or equal outcome id in another shot cannot discharge the claim, and a different verification family cannot borrow authority from the selected one.
 * @evidence contracts/common.md#meaningful-documentation Gives stable claim identity, human canon meaning, exclusive verification authority, claim-specific proof and scene scope, distinct from traceability alone.
 * @author Samchon
 */
export interface IAutoMovieContinuityClaim {
  /** Stable claim identity cited by downstream evidence. */
  id: string;

  /** Human-readable canon fact, such as handedness or persistent weather. */
  text: string;

  /** Evidence family that alone can discharge this claim. */
  verification: "frame-review" | "geometry" | "acceptance";

  /** Exact claim-specific evidence selected inside that family. */
  proof: IAutoMovieContinuityProof;

  /** Authored scenes in which the canon fact must hold. */
  evidence: IAutoMovieSceneEvidence[];
}

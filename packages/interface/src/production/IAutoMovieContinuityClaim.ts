import { IAutoMovieContinuityProof } from "./IAutoMovieContinuityProof";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/** One canon fact and the only evidence family allowed to prove it. */
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

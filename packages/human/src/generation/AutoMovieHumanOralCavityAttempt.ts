import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import { AutoMovieHumanOralCavity } from "./AutoMovieHumanOralCavity";

/**
 * The mouth's interior as an optional piece: built by
 * `AutoMovieHumanOralCavity`, or, when its rim is not one closed loop, left
 * out with the broken contract recorded. The mouth then stays closed (the
 * seam's lips meet) and the figure is still made.
 */
export namespace AutoMovieHumanOralCavityAttempt {
  /**
   * The interior of one mouth, or none with the broken contract recorded.
   *
   * @param skin The cut skin in calibration mm, its `mouth` rim open.
   * @param mouth The person's mouth.
   * @param aperture The `mouth` aperture that cut the rim.
   * @param scale Metres per calibration millimetre.
   * @param diagnostics The list a broken contract is recorded in.
   * @returns The interior, or null when its rim broke the contract.
   */
  export function attempt(
    skin: AutoMovieHumanLoftMesh.IContext,
    mouth: AutoMovieHumanMouth.IMouth,
    aperture: IAutoMovieHumanLoftAperture,
    scale: number,
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[],
  ): AutoMovieHumanOralCavity.IOutput | null {
    try {
      return AutoMovieHumanOralCavity.generate(skin, mouth, aperture, scale);
    } catch (error) {
      diagnostics.push({
        producer: "human.mouth",
        level: 5,
        contract: "the mouth aperture leaves one closed rim loop",
        detail: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

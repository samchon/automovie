import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import { AutoMovieHumanOralCavity } from "./AutoMovieHumanOralCavity";

/**
 * The mouth's interior as an optional piece: built by
 * `AutoMovieHumanOralCavity` from the mouth's rim on its base chain, or, when
 * the skin closed no `mouth` trim loop, left out with the broken contract
 * recorded. The mouth then stays closed and the figure is still made.
 */
export namespace AutoMovieHumanOralCavityAttempt {
  /**
   * The interior of one mouth, or none with the broken contract recorded.
   *
   * @param rim The `mouth` opening's rim on its base chain in calibration mm, or undefined when the skin closed none.
   * @param mouth The person's mouth.
   * @param scale Metres per calibration millimetre.
   * @param diagnostics The list a broken contract is recorded in.
   * @returns The interior, or null when its rim broke the contract.
   */
  export function attempt(
    rim: readonly [number, number, number][] | undefined,
    mouth: AutoMovieHumanMouth.IMouth,
    scale: number,
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[],
  ): AutoMovieHumanOralCavity.IOutput | null {
    try {
      if (rim === undefined || rim.length < 3) throw new Error("The skin closed no mouth trim loop");
      return AutoMovieHumanOralCavity.generate(rim, mouth, scale);
    } catch (error) {
      diagnostics.push({
        producer: "human.mouth",
        level: 5,
        contract: "the mouth opening is one trim loop on its base chain",
        detail: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

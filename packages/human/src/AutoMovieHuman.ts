import type { IAutoMovieHumanGenerated } from "./structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "./structures/IAutoMovieHumanParameters";

/** Public Human generator contract; geometric generation remains unimplemented. */
export class AutoMovieHuman {
  /** Accept the complete typed input; always throws until generation is implemented. */
  public static generate(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanGenerated {
    void params;
    throw new Error("Not implemented.");
  }
}

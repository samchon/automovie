import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { IAutoMovieHumanEyeHairHost } from "../junction/IAutoMovieHumanEyeHairHost";
import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";

/**
 * One generator per skin part: the set a person is built from.
 *
 * @author Samchon
 */
export type IAutoMovieHumanPartGenerators = {
  readonly [Part in AutoMovieHumanPart]: IAutoMovieHumanPartGenerator<Part>;
} & {
  /** The selected head may expose the eye-hair attachment capability it actually generates. */
  readonly head: IAutoMovieHumanPartGenerator<"head"> & {
    /** Resolve that head's live lid owner for these person inputs; absent means unsupported eye-hair appearance. */
    eyeHairHost?: (
      props: IAutoMovieHumanPartGenerator.IProps<"head">,
    ) => IAutoMovieHumanEyeHairHost;
  };
};

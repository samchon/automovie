import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * One secant pass's head before its chains are cut: the landmark skeleton the
 * pass was built from, the skin it cuts sections of, the two ears placed on
 * it and the depth at which the globes sit behind the nasion's skin. The next
 * pass reads the measures an input names on this skin and builds again.
 */
export interface IAutoMovieHumanHeadBuilt {
  /** The landmark skeleton of the pass, with the jaw built from its skin. */
  plan: IAutoMovieHumanHeadLayout;

  /** The skin of the pass, its sections cut once each by station. */
  surface: IAutoMovieHumanHeadSurface;

  /** The left ear placed on the head. */
  left: AutoMovieHumanEarConstruction.IEar;

  /** The right ear placed on the head: the left's reflection of its own measures. */
  right: AutoMovieHumanEarConstruction.IEar;

  /** Forward place of the globes' seat behind the nasion's skin, calibration millimetres. */
  seat: number;
}

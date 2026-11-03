import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadEarFree } from "./AutoMovieHumanHeadEarFree";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";

/**
 * The helix with the ear's attached plate: the middle of the auricle between
 * the upper attachment (otobasion superius) and the pocket's split, where the
 * rim leaves the head and a pit deepens in the anterior face behind the helix
 * and closes under it into the pocket. Its loops are the free path rising off
 * the head with the ear's height, the pocket's run dented into them as the pit
 * deepens from the top of this span.
 *
 * Reads the ear's sampler (its free loop, the rise off the head and the
 * pocket's oval). Publishes the helix's layers, 16 of them from the upper
 * attachment to the split.
 */
export namespace AutoMovieHumanHeadEarHelix {
  /**
   * The helix's layers in the left frame, bottom first.
   *
   * @param sampler The ear's fixed input.
   * @returns One loop per height.
   */
  export function layers(sampler: IAutoMovieHumanHeadEarSampler): IAutoMovieHumanHeadLoopLayer[] {
    const ear: IAutoMovieHumanHeadEarSampler["ear"] = sampler.ear;
    const pit: number = Math.floor(AutoMovieHumanHeadEarFree.LOOP * AutoMovieHumanHeadEarFree.PIT);
    return AutoMovieHumanHeadMath.uniform(ear.upper, ear.split, LAYERS).map(
      (y: number): IAutoMovieHumanHeadLoopLayer => {
        const l: AutoMovieHumanEarConstruction.P2[] = sampler.free(y, sampler.rise(y), 1);
        const k: number = AutoMovieHumanHeadMath.smooth(
          (y - ear.upper) / (ear.split - ear.upper) / AutoMovieHumanHeadEarFree.PIT_FROM -
            1 / AutoMovieHumanHeadEarFree.PIT_FROM +
            1,
        );
        const pocket: AutoMovieHumanEarConstruction.P2[] = sampler.pocketOval(ear.split);
        return { y, loop: AutoMovieHumanEarConstruction.pitted(l, pit, pocket, k) };
      },
    );
  }

  /** Layers of the helix between the upper attachment and the split. */
  export const LAYERS: number = 16;
}

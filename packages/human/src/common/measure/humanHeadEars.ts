import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";

/**
 * The head view triangles of both named ear areas (`ear-right`, `ear-left`),
 * the set a face-skin search leaves out; a missing area refuses by name
 * (`humanHeadEar`).
 *
 * @author Samchon
 */
export function humanHeadEars(head: IAutoMovieHumanHeadSkin): Set<number> {
  return new Set([
    ...humanHeadEar(head, "ear-right").triangles,
    ...humanHeadEar(head, "ear-left").triangles,
  ]);
}

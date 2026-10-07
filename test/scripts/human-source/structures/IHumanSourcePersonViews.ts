import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";

/**
 * The two published files of a person generation: the head partition view
 * and the body partition view, each carrying the generation id first.
 *
 * @author Samchon
 */
export interface IHumanSourcePersonViews {
  head: IAutoMovieHumanPersonHeadView;
  body: IAutoMovieHumanPersonBodyView;
}

import { type IAutoMovieInspectionKindStyle, type IAutoMovieResolveInspectionColorsProps } from "@automovie/interface";
import { resolveAutoMovieInspectionColors as resolveAutoMovieInspectionColorsImplementation } from "./internal/resolveAutoMovieInspectionColors.js";

/** Public operations for Auto Movie Render Inspection Material. */
export namespace AutoMovieRenderInspectionMaterial {
  /**
   * Decide the legend text and colour of every mark kind drawn in one picture,
   * and refuse a picture whose colours would be ambiguous.
   *
   * A kind takes the label and colour its marks carry, or the colour of the last
   * `recolor` entry whose pattern matches the kind under the path grammar. Two
   * marks of one kind that disagree on either throw, because one kind is then two
   * things. Two kinds that end up in one colour throw naming both, and so does a
   * kind whose colour is one of `reserved`, such as the flag colour or a shade's
   * surface colour, naming the kind and the reserved use. Kinds come in the order
   * their first mark appears.
   */
  export function resolveColors(props: IAutoMovieResolveInspectionColorsProps): Map<string, IAutoMovieInspectionKindStyle> {
    return resolveAutoMovieInspectionColorsImplementation(props);
  }
}

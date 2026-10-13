import { AutoMovieFaceParameterName } from "@automovie/interface";

/**
 * One present leaf of an {@link IAutoMovieFace}, projected onto its morph
 * target: the flat `parameter` name the template carries, the dotted `path` the
 * document spells it at (for violation messages), and the weight.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceTrait {
  /** Morph-target name the trait drives. */
  parameter: AutoMovieFaceParameterName;

  /** Dotted document path of the leaf, e.g. `"jaw.chin.length"`. */
  path: string;

  /** The signed effective weight on this side. */
  weight: number;
}

import type { IAutoMovieAssemblyHost } from "../architecture/IAutoMovieAssemblyHost";
import type { IAutoMovieMaterialAssembly } from "./IAutoMovieMaterialAssembly";
import type { IAutoMovieMaterialSubstance } from "./IAutoMovieMaterialSubstance";

/**
 * Data and callback contracts shared by the ValidateMaterialAssembly
 * operations.
 */
export namespace IAutoMovieValidateMaterialAssembly {
  /**
   * Judge one layered build-up: its layers, its finishes, and its total.
   *
   * The checks fall into three groups the requirement names separately. Layer
   * conflicts are contradictions inside a layer: a cavity that carries a
   * substance, a solid with no thickness, a substance id that resolves to
   * nothing. Finish defects are contradictions between the stack and the faces
   * it presents: an exposed face with nothing finishing it, a finish laid over
   * another finish, a finish buried where it will never be seen, a finish spent
   * on a concealed face. Dimension conflicts are contradictions with the host:
   * a build-up whose layers do not sum to the thickness the host was drawn at.
   *
   * A single-layer stack presents both faces with the same layer, so its finish
   * answers for whichever of them is exposed rather than being demanded twice.
   *
   * A wrapping layer must belong to the run of wrapping layers starting at one
   * face; one behind a non-wrapping layer is refused. Ids must be non-blank and
   * unique within the assembly, the axis, sense, exposures and substances must
   * be known words, the offset finite, and at least one layer present. Every
   * finding is reported at once with a `$input` path, and none throws. With
   * `host`, the summed thickness must equal the host's within 1e-9 m; with
   * `substances`, every non-cavity layer's material must name one of them by
   * id.
   */
  export type IProps = {
    /** Layered build-up to judge. */
    assembly: IAutoMovieMaterialAssembly;

    /** Substances the layers may cite; omitted skips reference resolution. */
    substances?: readonly IAutoMovieMaterialSubstance[];

    /** Host dimension the layers must sum to; omitted skips the comparison. */
    host?: IAutoMovieAssemblyHost;
  };
}

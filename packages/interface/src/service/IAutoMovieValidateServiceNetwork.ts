import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * Typed service graph and served building used for structural
 * distribution-network admission.
 */
export namespace IAutoMovieValidateServiceNetwork {
  /**
   * Typed service graph and served building used for structural
   * distribution-network admission.
   *
   * Logical-space containment is sampled at route vertices rather than
   * continuously along each leg. Shared-endpoint run pairs are entirely exempt
   * from clash comparison, so a second overlap along those same runs is
   * currently omitted. Sleeve fit uses the authored boundary face when present;
   * missing geometry is outside that fit check's applicability rather than a
   * reconstructed wall.
   */
  export type IProps = {
    /**
     * Borrowed typed network; structural and scalar defects become ordered
     * violations rather than repaired declarations.
     */
    network: IAutoMovieServiceNetwork;

    /**
     * Borrowed served building with admitted typed geometry; its id and
     * declarations resolve network references without revalidating the
     * building.
     */
    environment: IAutoMovieBuiltEnvironment;
  };
}

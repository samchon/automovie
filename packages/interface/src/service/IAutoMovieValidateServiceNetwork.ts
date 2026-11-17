import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * Typed service graph and served building used for structural distribution-network admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Typed service graph and served building used for structural distribution-network admission. The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This gate assumes typed record structure and separately admitted building geometry; wet-zone obligations use validateWetZones, and hydraulic or electrical performance is not certified.
 * @evidence contracts/development/design.md#principled-representation The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork borrows IAutoMovieServiceNetwork and IAutoMovieBuiltEnvironment; lowerServiceNetwork refuses its failed result before drawing runs.
 */
export namespace IAutoMovieValidateServiceNetwork {
  /**
   * Typed service graph and served building used for structural distribution-network admission.
   *
   * Logical-space containment is sampled at route vertices rather than continuously
   * along each leg. Shared-endpoint run pairs are entirely exempt from clash
   * comparison, so a second overlap along those same runs is currently omitted.
   * Sleeve fit uses the authored boundary face when present; missing geometry is
   * outside that fit check's applicability rather than a reconstructed wall.
   *
   * @evidence contracts/development/design.md#principled-representation The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork borrows IAutoMovieServiceNetwork and IAutoMovieBuiltEnvironment; lowerServiceNetwork refuses its failed result before drawing runs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This gate assumes typed record structure and separately admitted building geometry; wet-zone obligations use validateWetZones, and hydraulic or electrical performance is not certified.
   * @evidence contracts/development/common.md#meaningful-documentation Typed service graph and served building used for structural distribution-network admission. The validator checks version 1, metre units, the environment id, references, port/system units, scalar ranges, capacity and conservative interference; violations retain authored values.
   */
  export type IProps = {
    /** Borrowed typed network; structural and scalar defects become ordered violations rather than repaired declarations. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed served building with admitted typed geometry; its id and declarations resolve network references without revalidating the building. */
    environment: IAutoMovieBuiltEnvironment;
  };
}

import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieFluidDomain } from "./IAutoMovieFluidDomain";
import type { IAutoMovieWaterFeature } from "./IAutoMovieWaterFeature";

/** Architecture and fluid records joined by water-feature admission. */
export namespace IAutoMovieValidateWaterFeatures {
  /**
   * Borrowed records for validating bindings between fluid domains and building water features.
   *
   * Joins a feature's environment, space, rim and domain ids without adding architecture fields to fluid domains. The supplied environment must already be structurally admitted; space and boundary maps resolve duplicate ids last-wins without validating those environment identities here. Rim membership uses the boundary's spaces list, and material checks reject blank ids without resolving a material catalogue.
   *
   * Every supplied domain is validated with validateFluidDomain, cited or not, and violations are re-pathed to $input.domains[i]. Duplicate domain ids are refused; features resolve both domain and validation verdict from the last record with that id.
   *
   * A volume-less root basin and a domain rejected by validateFluidDomain skip geometry. Other bindings test cell centres at origin.y + bed against the root/descendant spaces using builtSpaceContainsPoint's numerical tolerances. The test does not measure the full cell footprint or water height.
   *
   * Every bed point is checked in row-major order, including in convex basins: arbitrary interior bed elevations need not lie in the corners' convex hull. This initial bed-centre check does not certify future solved surfaces fit the basin.
   *
   * Inputs remain unchanged. Empty features skip binding checks but do not skip supplied-domain admission; returned violations may retain offending input values. Malformed typed containers may throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States reference resolution, nested admission, empty-list behavior, ownership and the bed-centre-only geometry scope.
   * @evidence contracts/development/design.md#principled-representation Separate canonical records express identity joins without adding architecture to fluid domains; runtime checks own id membership and world-metre containment.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateWaterFeatures consumes exactly the environment, feature bindings and fluid catalogue needed for its cross-record report.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The request does not pretend typed references establish valid joins, material existence, complete basin enclosure or environment admission.
   */
  export type IProps = {
    /** Previously admitted building whose id, spaces and boundaries resolve feature references; not itself validated here. */
    environment: IAutoMovieBuiltEnvironment;

    /** Feature bindings in diagnostic order; an empty list requests no binding or bed-containment checks. */
    features: IAutoMovieWaterFeature[];

    /** All candidate domains, each validated even when unused; duplicate ids are reported and lookup uses the last entry. */
    domains: IAutoMovieFluidDomain[];
  };
}

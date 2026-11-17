import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * Service and building declarations used to report which checks have applicable geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Service and building declarations used to report which checks have applicable geometry. System disciplines, logical-space volumes and boundary-face presence select capability rows; serviceAnalysisSupport performs no validation and measures no performance quantities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Supported means an implemented check exists, not that it ran or passed; missing solver rows remain explicit and one located space does not prove every space is geometric.
 * @evidence contracts/development/design.md#principled-representation System disciplines, logical-space volumes and boundary-face presence select capability rows; serviceAnalysisSupport performs no validation and measures no performance quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The capability report borrows existing network and environment records and allocates new rows; topology tests currently exercise this public query.
 */
export namespace IAutoMovieServiceAnalysisSupport {
  /**
   * Service and building declarations used to report which checks have applicable geometry.
   *
   * A record existing is not an analysis, and the honest way to say so is to say
   * so. The structural rules below are the ones the engine really performs; the
   * per-discipline entries are the quantitative questions nothing here solves,
   * listed once for each discipline the network actually declares so a report
   * names the missing solver rather than implying a pass.
   *
   * The building is required rather than optional because the geometric answers
   * depend on it. A crossing is read off logical space volumes, so a building
   * whose partitions are names with no cells cannot be asked where a run left a
   * room; a sleeve is placed on its boundary's own face, so a boundary written
   * before faces existed cannot be asked where its holes are. Saying `supported`
   * in either case would be the dressing-up this report exists to prevent.
   * This is capability metadata, not a record that validation ran. No current
   * production report consumes these rows; topology tests exercise their wording.
   *
   * @evidence contracts/development/design.md#principled-representation System disciplines, logical-space volumes and boundary-face presence select capability rows; serviceAnalysisSupport performs no validation and measures no performance quantities.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The capability report borrows existing network and environment records and allocates new rows; topology tests currently exercise this public query.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Supported means an implemented check exists, not that it ran or passed; missing solver rows remain explicit and one located space does not prove every space is geometric.
   * @evidence contracts/development/common.md#meaningful-documentation Service and building declarations used to report which checks have applicable geometry. System disciplines, logical-space volumes and boundary-face presence select capability rows; serviceAnalysisSupport performs no validation and measures no performance quantities.
   */
  export type IProps = {
    /** Borrowed disciplines and penetration references used to select capability explanations; no network validation runs. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed building whose stated space volumes and sleeve-host faces determine geometric applicability. */
    environment: IAutoMovieBuiltEnvironment;
  };
}

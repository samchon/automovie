import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "../../body/structures/IHumanBodyPreparedBuild";

/**
 * Prepared garment authority and unchanged body before final Person placement.
 * @evidence contracts/common.md#principled-implementation Prepared coverage and completed Body are passed as their actual owning records.
 * @evidence contracts/common.md#clear-and-simple-design Two fields separate immutable garment authority from performed output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No mesh or state is inferred from an identifier.
 * @evidence contracts/common.md#meaningful-documentation Describes the prepared and completed records separately.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Composition owns parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Prepared document owns controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries records without emission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Transports records without coordinate conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Partition computes boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers observe output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no new anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source owners admit values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no input.
 * @author Samchon
 */
export interface IHumanPersonBodyDressInput {
  /** The admitted document's compiled rest coverage authority. */
  prepared: IHumanBodyPreparedBuild;

  /** Completed Body whose original source parts still await Person placement. */
  body: IAutoMovieHumanBodyBuild;
}

import typia, { type IValidation } from "typia";
import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";

import { productionPublicationDigestValue } from "./productionPublicationDigestValue";
import { assertProductionPublicationSemantics } from "./assertProductionPublicationSemantics";

/**
 * Shape-check and recompute a stored publication identity without acquiring its media.
 *
 * @evidence contracts/common.md#principled-implementation Exact typia schema admission precedes semantic metadata checks and canonical basis digest comparison; successful data is returned by reference.
 * @evidence contracts/common.md#clear-and-simple-design Project publication commits and final-delivery currentness use this same stored-identity parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A well-formed self-consistent claim alone does not prove current render inputs or actual bytes; current-plan comparison belongs to the next owner. Semantic Error context is string-wrapped without preserving its original cause.
 * @evidence contracts/common.md#meaningful-documentation Defines exact schema, semantic/digest refusal and borrowed successful object ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes shape traversal, declared-chunk semantic checks, capture/tier validation and complete canonical basis serialization/hash; typia error formatting scales with reported errors.
 * @evidence contracts/performance.md#reuse-equivalent-work The shape-validated data feeds both semantic admission and fingerprint recomputation without a retained parsed-object cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation/error arrays and canonical buffers expire after return/refusal; successful data remains caller-owned and no host resources are acquired.
 */
export const parseProductionRenderPublicationIdentity: (value: unknown) => IAutoMovieProductionPublicationIdentity = (value: unknown): IAutoMovieProductionPublicationIdentity => {
    const validation: IValidation<IAutoMovieProductionPublicationIdentity> = typia.validateEquals<IAutoMovieProductionPublicationIdentity>(value);
    if (validation.success === false)
        throw new Error(`Invalid production publication identity: ${validation.errors
            .map((error: IValidation.IError): string => `${error.path} expects ${error.expected}`)
            .join("; ")}.`);
    try {
        assertProductionPublicationSemantics(validation.data);
    }
    catch (error) {
        throw new Error(`Invalid production publication identity: ${(error as Error).message}`);
    }
    const { fingerprint, ...basis }: IAutoMovieProductionPublicationIdentity = validation.data;
    if (fingerprint !== productionPublicationDigestValue(basis))
        throw new Error("Production publication identity fingerprint does not match its canonical structured basis.");
    return validation.data;
};

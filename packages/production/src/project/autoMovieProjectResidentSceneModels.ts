import { isRecord } from "../validators/primitives";
import { autoMovieProjectAsArray } from "./autoMovieProjectAsArray";

/**
 *
 * @evidence contracts/common.md#principled-implementation Record nodes with string model fields are deduplicated in observed order.
 * @evidence contracts/common.md#clear-and-simple-design Supplies only the model-id placeholders needed by stored scene admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Model identity is self-derived, not authenticated catalogue or skeleton content.
 * @evidence contracts/common.md#meaningful-documentation States string-only projection and actual registry limitation.
 * @evidence contracts/performance.md#efficient-algorithms Visits N nodes and retains up to N model ids plus intermediate arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One set removes repeated ids for this scene pass; no cross-scene cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned ids transfer; local projections expire.
 */
export const autoMovieProjectResidentSceneModels: (value: unknown) => string[] = (value: unknown): string[] => {
    if (!isRecord(value))
        return [];
    return [
        ...new Set(autoMovieProjectAsArray(value.nodes)
            .filter(isRecord)
            .map((node: Record<string, unknown>): unknown => node.model)
            .filter((model: unknown): model is string => typeof model === "string")),
    ];
};

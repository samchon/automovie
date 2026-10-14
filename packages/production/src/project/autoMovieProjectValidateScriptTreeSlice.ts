import { validateScriptTree } from "@automovie/engine";
import { IAutoMovieBeat, IAutoMovieConstraintViolation, IAutoMovieScriptNode } from "@automovie/interface";
import { appendValidation, pushViolation, validateArrayArtifact, validateNonEmptyId, validateObjectArtifact } from "../validators/primitives";
import { autoMovieProjectValidateNullableId } from "./autoMovieProjectValidateNullableId";
import { autoMovieProjectValidateScriptTreePayload } from "./autoMovieProjectValidateScriptTreePayload";

/**
 * Append raw tree-node findings before invoking the engine's contextual script-tree validator. Undefined or null means no tree; a present tree reaches graph validation only when this pass adds no shape findings and beats, logline and theme have the required container/scalar types. Nodes and text are borrowed without rewriting or prose-quality grading.
 *
 * @evidence contracts/common.md#principled-implementation Optional trees pass raw node/payload shape before engine validation with the actual beats/logline/theme.
 * @evidence contracts/common.md#clear-and-simple-design Separates raw persisted admission from graph coherence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Engine calls occur only after this tree pass adds no shape findings and beats/text context is admitted.
 * @evidence contracts/common.md#meaningful-documentation States nullable tree and contextual graph admission gate.
 * @evidence contracts/performance.md#efficient-algorithms For T nodes/B beats/X interaction edges/D dialogue rows, raw admission and iterative engine graph checks cost O(T+B+X+D) operations plus inspected text and findings, with O(T+B) indices.
 * @evidence contracts/performance.md#reuse-equivalent-work The same admitted tree/context feeds the engine rather than reconstructing payloads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned findings persist; no handle or graph cache is retained.
 */
export const autoMovieProjectValidateScriptTreeSlice: (tree: unknown, beats: unknown, logline: unknown, theme: unknown, violations: IAutoMovieConstraintViolation[]) => void = (tree: unknown, beats: unknown, logline: unknown, theme: unknown, violations: IAutoMovieConstraintViolation[]): void => {
    if (tree === undefined || tree === null)
        return;
    const before: number = violations.length;
    if (!validateArrayArtifact(tree, "$input.tree", "script tree", violations))
        return;
    tree.forEach((node: unknown, index: number): void => {
        const path: string = `$input.tree[${index}]`;
        if (!validateObjectArtifact(node, path, "script tree node", violations))
            return;
        validateNonEmptyId(node.id, `${path}.id`, "script tree node id", violations);
        if (node.kind !== "intent" &&
            node.kind !== "act" &&
            node.kind !== "scene" &&
            node.kind !== "group" &&
            node.kind !== "beat")
            pushViolation(violations, "type", `${path}.kind`, 'script tree node kind must be one of "intent", "act", "scene", "group", or "beat"', node.kind);
        autoMovieProjectValidateNullableId(node.parent, `${path}.parent`, "script tree node parent", violations);
        autoMovieProjectValidateNullableId(node.temporal, `${path}.temporal`, "script tree node temporal predecessor", violations);
        if (validateArrayArtifact(node.interactsWith, `${path}.interactsWith`, "script tree interactions", violations))
            node.interactsWith.forEach((other: unknown, otherIndex: number): void => validateNonEmptyId(other, `${path}.interactsWith[${otherIndex}]`, "script tree interaction target", violations));
        if (!validateObjectArtifact(node.payload, `${path}.payload`, "script tree payload", violations))
            return;
        autoMovieProjectValidateScriptTreePayload(node.kind, node.payload, path, violations);
    });
    if (violations.length !== before ||
        !Array.isArray(beats) ||
        typeof logline !== "string" ||
        typeof theme !== "string")
        return;
    appendValidation(violations, validateScriptTree({
        tree: tree as IAutoMovieScriptNode[],
        beats: beats as IAutoMovieBeat[],
        logline,
        theme,
    }));
};

import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";

/**
 *
 * @evidence contracts/common.md#principled-implementation One common JSON rendering feeds the fenced atomic writer.
 * @evidence contracts/common.md#clear-and-simple-design Keeps textual representation identical for manifest and revision publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization failure precedes file mutation; later publication retains the writer's partial effects.
 * @evidence contracts/common.md#meaningful-documentation States pretty JSON/trailing newline and atomic-leaf scope.
 * @evidence contracts/performance.md#efficient-algorithms Includes full value serialization and B-byte write/fence costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Rendered text is passed directly to the writer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Writer owns temporary cleanup; no new retained resource is acquired here.
 */
export const autoMovieProjectWriteJsonAtomic: (file: string, value: unknown, assertNamespace: () => void) => void = (file: string, value: unknown, assertNamespace: () => void): void => autoMovieProjectWriteAtomic(file, autoMovieProjectSerializeJson(value), assertNamespace);

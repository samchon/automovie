import { IAutoMovieFilmTimeline, IAutoMovieGeneratedManifest } from "@automovie/interface";
import typia from "typia";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import type { IAutoMovieFilmTimelineArtifact } from "./IAutoMovieFilmTimelineArtifact";

/**
 * Admit generated timeline bytes against the supplied manifest and expected compile identity.
 *
 * @evidence contracts/common.md#principled-implementation The manifest fingerprint and declared film-timeline.json entry precede complete byte digest agreement, strict duplicate-aware JSON and exact typia schema/fingerprint checks, in that order.
 * @evidence contracts/common.md#clear-and-simple-design Owns timeline artifact admission independently of project acquisition; oracle/open-production/final-delivery readers reach it through the project adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No undeclared or stale artifact is parsed as current; matching stored digest and schema do not establish a hostile-writer atomic snapshot or every timeline semantic invariant.
 * @evidence contracts/common.md#meaningful-documentation Defines missing/stale, byte mismatch and invalid-schema refusals, and caller ownership of admitted materialized data.
 * @evidence contracts/performance.md#efficient-algorithms Finds the entry in F manifest files, reads/hashes B bytes, then fully decodes/materializes/validates; ingress number-suffix copying can add quadratic text work and no byte cap is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work One acquired byte population supplies digest and parsing, and one materialized tree supplies schema validation and return; no verdict cache bypasses current reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reader capability owns any native descriptor; bytes/text/parser frames are attempt-local and the complete timeline transfers to the caller.
 */
export function parseAutoMovieFilmTimeline(artifact: IAutoMovieFilmTimelineArtifact): IAutoMovieFilmTimeline {
    const entry: IAutoMovieGeneratedManifest['files'][number] | undefined = artifact.manifest?.files.find((file: IAutoMovieGeneratedManifest['files'][number]): boolean => file.path === "film-timeline.json");
    if (artifact.manifest?.inputFingerprint !== artifact.fingerprint ||
        entry === undefined)
        throw new Error("Canonical film timeline is missing or changed after compilation. Run the scaffold source compile command.");
    const bytes: Uint8Array = artifact.read(entry.path);
    if (digestAutoMovieBytes(bytes) !== entry.digest)
        throw new Error("Canonical film timeline bytes differ from the generated manifest. Run the scaffold source compile command.");
    const validation: typia.IValidation<IAutoMovieFilmTimeline> = typia.validateEquals<IAutoMovieFilmTimeline>(parseAutoMovieStructuredJson({ record: "film-timeline", bytes }));
    if (validation.success === false ||
        validation.data.inputFingerprint !== artifact.fingerprint)
        throw new Error("Canonical film timeline is invalid or stale. Run the scaffold source compile command.");
    return validation.data;
}

import { IAutoMovieBeatEndState, IAutoMovieConstraintViolation, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { validateSequenceArtifact } from "../validators/artifacts";
import { appendValidation } from "../validators/primitives";
import { IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import { autoMovieProjectReadValidatedJson } from "./autoMovieProjectReadValidatedJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Read the current stored slate and admit an optional film sequence against its acquired shots. Missing or parsed-null film returns null; present malformed or inconsistent film throws through the resident reader. The returned collections belong to the caller, and these sequential reads do not establish one atomic filesystem snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Fenced stored-slate acquisition supplies the shot registry used to admit an optional film sequence.
 * @evidence contracts/common.md#clear-and-simple-design Film extends the acquired stored result rather than rebuilding the slate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nested checks preserve read order; film admission uses sequential shot observations rather than a frozen snapshot.
 * @evidence contracts/common.md#meaningful-documentation States nullable film and registry-dependent sequence refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes stored-slate I/O/validation, film bytes and sequence registry/entry scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The acquired shots are reused for film validation; each invocation still reobserves resident files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Nested namespace retirement is attempted before result transfer; native cleanup failure can retain fences under the existing void contract.
 */
export function autoMovieProjectWritableSlate(_project: IAutoMovieProjectState): IAutoMovieLegacyWritableSlate {
    return _project.withRootNamespace((): {
        film: IAutoMovieSequence | null;
        scenes: IAutoMovieScene[];
        shots: IAutoMovieShot[];
        beatEnds: IAutoMovieBeatEndState[];
        script: IAutoMovieScript | null;
        notes: IAutoMovieReviewNote[];
    } => {
        const stored: Omit<IAutoMovieLegacyWritableSlate, "film"> = _project.storedSlate();
        return {
            ...stored,
            film: autoMovieProjectReadValidatedJson<IAutoMovieSequence>(_project.root, _project.slicePath("film.json"), (value: unknown, violations: IAutoMovieConstraintViolation[]): void => appendValidation(violations, validateSequenceArtifact(value as IAutoMovieSequence, stored.shots))),
        };
    });
}

import { IAutoMovieDiagnostic, IAutoMovieFilmEdit, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyFrameTime } from "./productionFilmAssemblyFrameTime";

/**
 * Resolve a schema-admitted cut, fade, or dissolve into timeline frame units. Cuts have no duration; other transitions require a positive exact-grid duration, otherwise diagnostics are appended and null is returned.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant selects the cut representation or delegates duration conversion to the shared exact-grid helper. A zero duration is refused separately from invalid grid membership.
 * @evidence contracts/common.md#clear-and-simple-design Transition normalization produces only kind and durationFrames; adjacency, handles, and film-edge legality remain with video timeline validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored transition kinds are preserved and an invalid duration is never changed into a cut or rounded into a usable effect. Structural schema admission is a caller premise.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies cut omission of duration, frame units, null failure, diagnostic mutation, and the distinction from later video-handle checks.
 * @evidence contracts/performance.md#efficient-algorithms Each transition uses constant scalar work and at most one small returned record, plus the exact-grid helper's diagnostic work.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared frame conversion supplies identical timing rules across tracks; normalized results are used by assembly and adjacency checks in the same build without a cross-build cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A successful transition record belongs to the caller's segment. Failure retains only caller-owned diagnostics, and this helper acquires no persistent state or handles.
 */
export const productionFilmAssemblyNormalizeTransition: (transition: IAutoMovieFilmEdit["tracks"]["video"][number]["transitionIn"], frameRate: IAutoMovieProductionFrameRate, label: string, diagnostics: IAutoMovieDiagnostic[]) => IAutoMovieFilmTimeline["segments"][number]["transitionIn"] | null = (
  transition: IAutoMovieFilmEdit["tracks"]["video"][number]["transitionIn"],
  frameRate: IAutoMovieProductionFrameRate,
  label: string,
  diagnostics: IAutoMovieDiagnostic[],
): IAutoMovieFilmTimeline["segments"][number]["transitionIn"] | null => {
  if (transition.kind === "cut") return { kind: "cut" };
  const durationFrames: number | null = productionFilmAssemblyFrameTime(
    transition.duration,
    frameRate,
    `${label} duration`,
    diagnostics,
  );
  if (durationFrames === null) return null;
  if (durationFrames === 0) {
    diagnostics.push(
      filmDiagnostic(
        "film-transition-invalid",
        `${label} ${transition.kind} duration must be at least one frame.`,
      ),
    );
    return null;
  }
  return { kind: transition.kind, durationFrames };
};

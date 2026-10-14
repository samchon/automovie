import { materializeProductionFilmEffects, productionFilmEffectEditFingerprint, projectProductionShotEffectFilmIntervals, resolveProductionFrameRate } from "@automovie/engine";
import { IAutoMovieCompiledFilmEdit, IAutoMovieCompiledFilmEffect, IAutoMovieCompiledShotSource, IAutoMovieFilmTimeline, IAutoMovieProductionDesign, IAutoMovieWorldDesign } from "@automovie/interface";
import { AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL } from "./productionBuildProtocol";
import { FILM_SOURCE_EXPORT, FILM_SOURCE_PATH, ICompiledFilmDraft } from "./productionFilmAssembly";

/**
 * Seal a film edit, timeline and materialized effect streams before media rendering.
 *
 * The timeline receives builder, source and compile identities; its effect-edit fingerprint and exact rational shot-cue projection feed the engine effect materializer. The returned edit retains the draft edit reference, while timeline fields are shallow-copied; this is no rendered-media or pixel receipt.
 *
 * @evidence contracts/common.md#principled-implementation The engine owners derive frame rate, half-open shot intervals and deterministic effect identities from an admitted draft. This adapter preserves those algorithms and refusals; it performs no independent timeline admission or visual verification.
 * @evidence contracts/common.md#clear-and-simple-design Builder identity sealing stays beside the generated film representation, while frame arithmetic and effect realization remain engine responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed film source path/export and protocol are supported authoring addresses, not fixture exceptions. No failed effect is repaired, and deterministic serialized streams are not presented as observed GPU appearance.
 * @evidence contracts/common.md#meaningful-documentation States builder/source/compile identity, delegated interval arithmetic, borrowed draft fields and the absence of physical media publication.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes complete effect-edit canonical hashing, all projected shot cue/frame intervals and engine effect materialization, plus returned stream records. Effect/shot/channel populations and serialized values drive time and bytes; no constant-size or measured speedup claim excludes delegated work.
 * @evidence contracts/performance.md#reuse-equivalent-work The sealed timeline and its edit fingerprint are reused within this attempt's effect identity; effects are rebuilt when their timeline, shots, world, source or compile identity changes, without a retained cross-attempt cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned records transfer to generated serialization and retain shallow draft references and materialized streams; engine helpers own their synchronous temporary arrays. No encoder, filesystem handle or background task is started.
 */
export function materializeFilmArtifacts(
  draft: ICompiledFilmDraft,
  sourceDigest: string,
  inputFingerprint: string,
  production: IAutoMovieProductionDesign,
  world: IAutoMovieWorldDesign,
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>
): {
  edit: IAutoMovieCompiledFilmEdit;
  timeline: IAutoMovieFilmTimeline;
  effects: IAutoMovieCompiledFilmEffect[];
} {
  const timeline: IAutoMovieFilmTimeline = {
    ...draft.timeline,
    builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
    inputFingerprint,
    sourceDigest,
  };
  const editFingerprint: string = productionFilmEffectEditFingerprint(timeline);
  // Shot cues are projected onto film frames by the same exact rational
  // half-open boundary the effect runtime samples with, so a cue second that
  // sits off the frame grid owns the frame whose interval contains it rather
  // than the frame a float product happens to round to.
  const shotEffects: ReturnType<typeof projectProductionShotEffectFilmIntervals> = projectProductionShotEffectFilmIntervals({
    timeline,
    shots,
  });
  return {
    edit: {
      version: 1,
      builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
      inputFingerprint,
      source: {
        path: FILM_SOURCE_PATH,
        export: FILM_SOURCE_EXPORT,
        digest: sourceDigest,
      },
      edit: draft.edit,
    },
    timeline,
    effects: materializeProductionFilmEffects({
      identity: {
        production: production.id,
        film: timeline.id,
        compileFingerprint: inputFingerprint,
        editFingerprint,
      },
      frameRate: resolveProductionFrameRate(timeline),
      world,
      effects: timeline.tracks.effects,
      shotEffects,
    }),
  };
}

import { type IAutoMovieAudioCue, IAutoMovieAssetProvenance, IAutoMovieDiagnostic, IAutoMovieFilmEdit } from "@automovie/interface";

import { filmDiagnostic } from "../productionFilmAssembly";

/**
 * Compare active audio-cue ledger ownership with the compiled film's exact cue asset references.
 *
 * @evidence contracts/common.md#principled-implementation Builds active ledger and actual cue Maps, then checks both directions for identical consumer/asset binding under the selected production.
 * @evidence contracts/common.md#clear-and-simple-design This compiled reverse gate owns audio references that the earlier design graph deliberately cannot establish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Map last-entry behavior assumes earlier duplicate-use/cue admission; this owner does not authenticate audio decoding or replace missing references with defaults.
 * @evidence contracts/common.md#meaningful-documentation Documents production filtering, bidirectional missing/stale diagnostics and partial-error output.
 * @evidence contracts/performance.md#efficient-algorithms Visits U declared uses and C actual cues with expected constant map lookups and input-length key/message work, retaining O(U+C) references.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses current compiled cue/ledger facts rather than a cached equal-id verdict from another edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned diagnostics transfer to the caller; temporary Maps own only strings and acquire no audio decoder, file or process handle.
 *
 * @author Samchon
 */
export function validateCompiledAssetUses(
  productionId: string,
  records: readonly IAutoMovieAssetProvenance[],
  edit: IAutoMovieFilmEdit,
): IAutoMovieDiagnostic[] {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const audioByConsumer: Map<string, string> = new Map<string, string>();
  for (const asset of records)
    for (const use of asset.uses)
      if (use.production === productionId && use.consumer.kind === "audio-cue")
        audioByConsumer.set(use.consumer.id, asset.path);
  const actual: Map<string, string> = new Map(edit.tracks.audio.map((cue: IAutoMovieAudioCue) : [string, string] => [cue.id, cue.asset]));
  for (const [id, asset] of audioByConsumer)
    if (actual.get(id) !== asset)
      diagnostics.push(
        filmDiagnostic(
          "asset-use-stale",
          `Asset ledger assigns "${asset}" to audio cue "${id}", but the active film does not contain that exact reference. Correct the production use or film cue.`,
        ),
      );
  for (const [id, asset] of actual)
    if (audioByConsumer.get(id) !== asset)
      diagnostics.push(
        filmDiagnostic(
          "asset-use-missing",
          `Audio cue "${id}" consumes "${asset}" without one matching typed use for production "${productionId}". Add the exact production/audio-cue ledger entry.`,
        ),
      );
  return diagnostics;
}

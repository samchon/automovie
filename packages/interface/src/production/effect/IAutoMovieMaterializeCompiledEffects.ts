import type { IAutoMovieShotContract } from "../IAutoMovieShotContract";
import type { IAutoMovieShotEffectCue } from "../IAutoMovieShotEffectCue";
import type { IAutoMovieWorldDesign } from "../IAutoMovieWorldDesign";

/**
 * Owner selection and source data for deterministic effect-stream
 * materialization.
 */
export namespace IAutoMovieMaterializeCompiledEffects {
  /**
   * Materialize effect cues into builder-owned deterministic streams.
   *
   * A shot contract owns shot-local cues and a production and film pair owns
   * film-global cues; each owner derives a domain-separated stream seed from
   * its identity, the cue, and the recipe and zone it activates. The shot
   * protocol `automovie.effect-stream.v1` hashes the shot id with the recipe
   * and zone seeds, and the film protocol `automovie.film-effect-seed.v1`
   * hashes the owner pair with the whole recipe and zone records. The seed is
   * the first 13 hex digits of that SHA-256, a 52-bit safe integer. Domain tags
   * distinguish the serialized inputs; truncation still permits different
   * inputs to share a seed.
   *
   * A cue whose zone or recipe is absent materializes nothing, because the
   * owner's validator reports that refusal. Streams are ordered by code-unit
   * cue id, every stream steps at the caller's `fixedStepSeconds`, and each
   * carries the SHA-256 of its canonical JSON, computed without a Node built-in
   * and equal to the Node builder digest of the same stream. Bounds, recipe and
   * intensity are deep copies, so editing a stream never edits the world or the
   * cue.
   */
  export type IProps = {
    /**
     * Borrowed recipe and zone tables. IDs are resolved by maps, with the last
     * duplicate winning here; owner validation must reject ambiguous
     * declarations. Output bounds and recipes are deep copies.
     */
    world: Pick<IAutoMovieWorldDesign, "effectRecipes" | "effectZones">;
    /**
     * Simulation step in seconds on the cue clock, copied into every stream
     * without numeric validation here. The caller supplies a finite positive
     * step; film materialization uses denominator/numerator seconds.
     */
    fixedStepSeconds: number;
    /**
     * Borrowed cues with start-inclusive, end-exclusive seconds. A copied array
     * is sorted by code-unit cue id; empty input produces no streams and
     * unresolved zone/recipe cues are omitted.
     */
    cues: readonly IAutoMovieShotEffectCue[];
  } & (
    | {
        /**
         * Shot owner whose id seeds shot-local streams; absent only in the
         * film-owner branch.
         */
        contract: IAutoMovieShotContract;
        /**
         * Film seed identity; forbidden in the shot-contract branch. Both
         * strings enter the film seed hash unchanged.
         */
        seedOwner?: never;
      }
    | {
        /**
         * Shot owner whose id seeds shot-local streams; absent only in the
         * film-owner branch.
         */
        contract?: never;
        /**
         * Film seed identity; forbidden in the shot-contract branch. Both
         * strings enter the film seed hash unchanged.
         */
        seedOwner: {
          /**
           * Production identity in the film seed domain; identity admission
           * belongs to materializeProductionFilmEffects.
           */
          production: string;
          /**
           * Film identity within the production, included in the seed
           * independently of the cue id.
           */
          film: string;
        };
      }
  );
}

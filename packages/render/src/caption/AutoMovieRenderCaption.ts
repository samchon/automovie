import type {
  IAutoMovieBeatCaption,
  IAutoMovieCaptionGraphemeRuntime,
  IAutoMovieCaptionLanguageIdentity,
  IAutoMovieCaptionReadabilityProfile,
  IAutoMovieCaptionReadabilityReport,
  IAutoMovieCaptionSidecar,
  IAutoMovieFilmTimeline,
  IAutoMoviePlanCaptionSidecarProps,
  IAutoMovieScript,
} from "@automovie/interface";

import { beatCaptions as internalBeatCaptions } from "./internal/beatCaptions.js";
import { autoMovieCaptionLanguageComparisonKey } from "./internal/autoMovieCaptionLanguageComparisonKey.js";
import { canonicalProductionWebVtt as internalCanonicalProductionWebVtt } from "./internal/canonicalProductionWebVtt.js";
import { canonicalizeAutoMovieCaptionText } from "./internal/canonicalizeAutoMovieCaptionText.js";
import { inspectAutoMovieCaptionReadabilityWithRuntime } from "./internal/inspectAutoMovieCaptionReadabilityWithRuntime.js";
import { isAutoMovieWebVttIdentifier } from "./internal/isAutoMovieWebVttIdentifier.js";
import { parseAutoMovieCaptionLanguage } from "./internal/parseAutoMovieCaptionLanguage.js";
import { planCaptionSidecar } from "./internal/planCaptionSidecar.js";
import { renderCaptionSidecar } from "./internal/renderCaptionSidecar.js";
import { serializeAutoMovieWebVttCueText } from "./internal/serializeAutoMovieWebVttCueText.js";
import { serializeAutoMovieWebVttIdentifier } from "./internal/serializeAutoMovieWebVttIdentifier.js";
import { serializeAutoMovieWebVttSingleLineText } from "./internal/serializeAutoMovieWebVttSingleLineText.js";
import { sliceCaptionSidecar } from "./internal/sliceCaptionSidecar.js";

/** Caption planning, validation, measurement and serialization for Render. */
export namespace AutoMovieRenderCaption {

  /**
   * Index each beat's authored caption and enclosing scene slug by beat id.
   * Scripts without a tree yield an empty map.
   *
   * @param script The screenplay whose beat captions should be indexed.
   * @returns A map from beat id to its caption and scene slug.
   */
  export function beatCaptions(
    script: IAutoMovieScript,
  ): Map<string, IAutoMovieBeatCaption> {
    return internalBeatCaptions(script);
  }

  /**
   * Serialize a film timeline's caption track to its canonical WebVTT text.
   * Cues keep authored text, identifiers, language tags, voice and placement;
   * invalid identifiers, tags, frame intervals or placement still throw.
   *
   * @param timeline The compiled film timeline.
   * @returns Canonical WebVTT text.
   */
  export function canonicalProductionWebVtt(
    timeline: IAutoMovieFilmTimeline,
  ): string {
    return internalCanonicalProductionWebVtt(timeline);
  }

  /**
   * Normalize caption text for readability measurement and WebVTT delivery.
   * Newlines become LF, prohibited controls become spaces, and lines are not
   * reflowed or trimmed.
   *
   * @param value Authored caption text.
   * @returns The canonical presentation text.
   */
  export function canonicalizeText(value: string): string {
    return canonicalizeAutoMovieCaptionText(value);
  }

  /**
   * Measure and judge every caption using the supplied grapheme runtime and
   * language profiles. Unsupported or missing profiles remain `not-run`.
   *
   * @param timeline The compiled film timeline.
   * @param profiles Readability profiles by language.
   * @param runtime The identity-bearing grapheme segmentation runtime.
   * @returns Measurements and outcomes in cue order.
   */
  export function inspectReadabilityWithRuntime(
    timeline: IAutoMovieFilmTimeline,
    profiles: readonly IAutoMovieCaptionReadabilityProfile[],
    runtime: IAutoMovieCaptionGraphemeRuntime,
  ): IAutoMovieCaptionReadabilityReport {
    return inspectAutoMovieCaptionReadabilityWithRuntime(
      timeline,
      profiles,
      runtime,
    );
  }

  /**
   * Check whether text can be written verbatim as a WebVTT identifier.
   *
   * @param value Candidate header text or cue identifier.
   * @returns `true` when nonempty and free of line breaks and `-->`.
   */
  export function isWebVttIdentifier(value: string): boolean {
    return isAutoMovieWebVttIdentifier(value);
  }

  /**
   * Parse a well-formed RFC 5646 language tag without registry lookup.
   *
   * @param value The authored language tag.
   * @returns Its display and comparison identity, or `null` when malformed.
   */
  export function parseLanguage(
    value: string,
  ): IAutoMovieCaptionLanguageIdentity | null {
    return parseAutoMovieCaptionLanguage(value);
  }

  /**
   * Return the ASCII case-folded identity of a well-formed language tag.
   *
   * @param value The authored language tag.
   * @returns Its comparison key, or `null` when malformed.
   */
  export function languageComparisonKey(value: string): string | null {
    return autoMovieCaptionLanguageComparisonKey(value);
  }

  /**
   * Serialize one caption as a WebVTT cue payload, preserving line breaks and
   * escaping authored text after canonicalization.
   *
   * @param value The authored caption.
   * @returns The cue payload.
   */
  export function serializeWebVttCueText(value: string): string {
    return serializeAutoMovieWebVttCueText(value);
  }

  /**
   * Return valid WebVTT header text or a cue identifier verbatim, or throw.
   *
   * @param value The authored identifier.
   * @returns The unchanged identifier.
   */
  export function serializeWebVttIdentifier(value: string): string {
    return serializeAutoMovieWebVttIdentifier(value);
  }

  /**
   * Serialize one-line WebVTT annotation text, replacing controls with spaces
   * and escaping markup characters.
   *
   * @param value The authored annotation.
   * @returns The safe single-line annotation.
   */
  export function serializeWebVttSingleLineText(value: string): string {
    return serializeAutoMovieWebVttSingleLineText(value);
  }

  /**
   * Plan caption spans on the sequence's exact output-frame clock. Transition
   * frames belong to the shot shown most; missing authored captions stay null.
   *
   * @param props The script, sequence, shots and output frame rate.
   * @returns One caption entry per continuous beat span.
   */
  export function planSidecar(
    props: IAutoMoviePlanCaptionSidecarProps,
  ): IAutoMovieCaptionSidecar {
    return planCaptionSidecar(props);
  }

  /**
   * Serialize a caption sidecar as indented JSON followed by one newline.
   *
   * @param sidecar The planned caption sidecar.
   * @returns Its stable JSON representation.
   */
  export function renderSidecar(sidecar: IAutoMovieCaptionSidecar): string {
    return renderCaptionSidecar(sidecar);
  }

  /**
   * Clip a sidecar to a frame window and rebase its entries to chunk-local
   * frame indices. Invalid or uncovered starts still throw.
   *
   * @param sidecar The whole-render caption sidecar.
   * @param frameStart The inclusive start frame.
   * @param frameEnd The exclusive end frame.
   * @returns The clipped sidecar for that chunk.
   */
  export function sliceSidecar(
    sidecar: IAutoMovieCaptionSidecar,
    frameStart: number,
    frameEnd: number,
  ): IAutoMovieCaptionSidecar {
    return sliceCaptionSidecar(sidecar, frameStart, frameEnd);
  }
}

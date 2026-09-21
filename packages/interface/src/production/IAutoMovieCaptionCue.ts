import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * One plain-text caption cue from which renderers may derive WebVTT.
 *
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `IAutoMovieCaptionCue` as the portable data boundary for the delivery caption readability profile requirement.
 * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-text-language Preserves authored line presentation through measurement and selectable delivery.
 * @evidence requirements/delivery-and-accessibility/localization-and-language-versions.md#delivery-language-selection Carries one retained RFC 5646 display form with case-insensitive identity.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `IAutoMovieCaptionCue` for the spec delivery caption readability profile system contract.
 * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-localization Applies one language identity across cue validation, lookup, and serialization.
 */
export interface IAutoMovieCaptionCue {
  /**
   * Stable cue id.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `id` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `id` for the spec delivery caption readability profile system contract.
   */
  id: string;

  /**
   * Non-blank plain text whose authored CR, LF, and CRLF line presentation is
   * preserved canonically by readability and selectable delivery.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `text` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-cue-text-language Keeps legal tab and authored line boundaries while prohibited controls are handled explicitly.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `text` for the spec delivery caption readability profile system contract.
   */
  text: string;

  /**
   * RFC 5646 well-formed language tag in retained display form.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `language` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence requirements/delivery-and-accessibility/localization-and-language-versions.md#delivery-language-selection Keeps case-insensitive language identity separate from authored display spelling.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `language` for the spec delivery caption readability profile system contract.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-localization Uses RFC 5646 syntax without registry canonicalization or inference.
   */
  language: string;

  /**
   * Optional speaker id.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `speaker` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `speaker` for the spec delivery caption readability profile system contract.
   */
  speaker?: string;

  /**
   * Film-global inclusive start.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `start` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `start` for the spec delivery caption readability profile system contract.
   */
  start: AutoMovieFilmTime;

  /**
   * Film-global exclusive end.
   *
   * @evidence requirements/delivery-and-accessibility/captions-subtitles-and-cues.md#delivery-caption-readability-profile Exposes `end` as the portable data boundary for the delivery caption readability profile requirement.
   * @evidence specifications/editorial-render-and-delivery/delivery-audio-text-and-localization.md#spec-delivery-caption-readability-profile Types `end` for the spec delivery caption readability profile system contract.
   */
  end: AutoMovieFilmTime;
}

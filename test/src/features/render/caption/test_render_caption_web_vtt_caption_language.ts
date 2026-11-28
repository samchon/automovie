import {
  webVttCaptionLanguage
} from "../../../../../packages/render/src/caption/internal/webVttCaptionLanguage";
import { TestValidator } from "@nestia/e2e";

/**
 * `webVttCaptionLanguage` returns a well-formed language tag as authored.
 *
 * Scenarios:
 *
 * 1. `en-US` and `ko` come back with their authored case.
 * 2. A tag that is not RFC 5646 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Preserves authored language spelling for valid WebVTT captions and refuses malformed tags.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the caption-language formatter with en-US, ko and a malformed language tag.
 * @evidence contracts/development/testing.md#independent-expectations The two literal outputs require original spelling, and the malformed fixture requires refusal.
 */
export function test_render_caption_web_vtt_caption_language(): void {
  TestValidator.equals("region", webVttCaptionLanguage("en-US"), "en-US");
  TestValidator.equals("language", webVttCaptionLanguage("ko"), "ko");
  TestValidator.error("malformed", (): void => {
    webVttCaptionLanguage("not a tag");
  });
}
import { webVttCaptionLanguage } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `webVttCaptionLanguage` returns a well-formed language tag as authored.
 *
 * Scenarios:
 *
 * 1. `en-US` and `ko` come back with their authored case.
 * 2. A tag that is not RFC 5646 is refused.
 */
export function test_unit_render_caption_web_vtt_caption_language(): void {
  TestValidator.equals("region", webVttCaptionLanguage("en-US"), "en-US");
  TestValidator.equals("language", webVttCaptionLanguage("ko"), "ko");
  TestValidator.error("malformed", (): void => {
    webVttCaptionLanguage("not a tag");
  });
}
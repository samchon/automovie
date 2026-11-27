import {
  escapeWebVttText
} from "../../../../../packages/render/src/caption/internal/escapeWebVttText";
import { TestValidator } from "@nestia/e2e";

/**
 * `escapeWebVttText` escapes `&`, `<` and `>` and nothing else.
 *
 * Scenarios:
 *
 * 1. `a<b>&c` becomes `a&lt;b&gt;&amp;c`.
 * 2. An already escaped entity has its ampersand escaped again, and plain text
 *    is unchanged.
 */
export function test_render_caption_escape_web_vtt_text(): void {
  TestValidator.equals("markup", escapeWebVttText("a<b>&c"), "a&lt;b&gt;&amp;c");
  TestValidator.equals("entity", escapeWebVttText("&lt;"), "&amp;lt;");
  TestValidator.equals("plain", escapeWebVttText("Hi 'x' \"y\""), "Hi 'x' \"y\"");
}
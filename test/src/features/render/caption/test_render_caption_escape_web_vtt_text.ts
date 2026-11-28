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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Escapes WebVTT markup characters in literal text, including ampersands in entity-looking input.
 * @evidence contracts/development/testing.md#behavioral-verification Calls text escaping on markup, an entity-looking string and ordinary text.
 * @evidence contracts/development/testing.md#independent-expectations The literal entity sequence fixes the three escapes and exposes an implementation that silently interprets an existing entity.
 */
export function test_render_caption_escape_web_vtt_text(): void {
  TestValidator.equals("markup", escapeWebVttText("a<b>&c"), "a&lt;b&gt;&amp;c");
  TestValidator.equals("entity", escapeWebVttText("&lt;"), "&amp;lt;");
  TestValidator.equals("plain", escapeWebVttText("Hi 'x' \"y\""), "Hi 'x' \"y\"");
}
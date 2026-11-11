/**
 * How the browser draws a capture: `software` through SwiftShader, the CPU implementation of WebGL that removes GPU driver variation and is used for recorded output, or `gpu` through the machine's graphics driver, which is faster and may differ by machine.
 *
 * @evidence contracts/development/design.md#principled-representation The two backends the campaign decides on, as a closed pair, so a mistyped backend cannot be launched.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `planAutoMovieChromiumLaunch`, which turns it into switches, and by the record through the backend text.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No driver or vendor is named; the renderer the browser reports goes into the record instead.
 * @evidence contracts/development/common.md#meaningful-documentation States what each backend draws with and when each is used.
 */
export type AutoMovieCaptureBackend = "software" | "gpu";

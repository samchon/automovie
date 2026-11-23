/**
 * How the browser draws a capture: `software` through SwiftShader, the CPU
 * implementation of WebGL that removes GPU driver variation and is used for
 * recorded output, or `gpu` through the machine's graphics driver, which is
 * faster and may differ by machine.
 */
export type AutoMovieCaptureBackend = "software" | "gpu";

import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";

/**
 * Rasterize analytic opaque sections independently of recovery and atlas code.
 * Cubic half-axes and translating centres have closed-form support under the
 * supplied orthographic chart; an optional independent interval formula supplies
 * other analytic sections. Box support is a distinct ellipse-family negative.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies real RGB8 pixel populations whose support must be extracted rather than injecting expected observed rows or fitted controls.
 * @evidence contracts/testing.md#independent-expectations Raster inclusion uses analytic ellipse or box support and explicit pixel centres, with no recovery fitter, spline evaluator, atlas generator or renderer import.
 * @evidence contracts/testing.md#distinguishing-cases Parameterized angle, pixel pitch, ellipse/box shape and an optional analytic interval allow scale/chart and distinct section-family controls; admission failures are authored by the calling tests.
 * @evidence contracts/testing.md#execution-ownership This portable fixture owns only small resident typed arrays and deterministic arithmetic; it starts no process, filesystem, browser or GPU.
 */
export function recoveryImageFixture(
  input: {
    kind?: "ellipse" | "box";
    angles?: number[];
    pitchMm?: number;
    profile?: (t: number) => [number, number, number, number];
    support?: (t: number, azimuth: number) => [number, number];
  } = {},
): IAutoMovieRecoveryImageInput {
  const pitch: number = input.pitchMm ?? 0.25;
  const width: number = 256,
    height: number = 480;
  return {
    schema: "automovie-recovery-images-v1",
    objectId: "analytic-section-family",
    frame: "analytic-millimetres",
    rigidity: "asserted-fixed",
    cohort: "analytic",
    background: { rgb: [240, 240, 240], threshold: 20 },
    budget: { maxPixels: 2_000_000, maxViews: 8, maxRows: 4000 },
    views: (input.angles ?? [0, 45, 90]).map(
      (
        degrees: number,
        index: number,
      ): IAutoMovieRecoveryImageInput["views"][number] => {
        const angle: number = (degrees * Math.PI) / 180;
        const c: number = Math.cos(angle),
          s: number = Math.sin(angle);
        const pixels: Uint8Array = new Uint8Array(3 * width * height).fill(240);
        for (let row: number = 0; row < height; row++) {
          const y: number = (440 - row - 0.5) * pitch;
          const t: number = y / 100;
          if (t < 0 || t > 1) continue;
          const profile: [number, number, number, number] = input.profile?.(
            t,
          ) ?? [
            18 + 8 * t - 12 * t * t + 5 * t * t * t,
            10 + 7 * t + 4 * t * t - 3 * t * t * t,
            2 - 4 * t + 2 * t * t,
            -1 + 3 * t - 2 * t * t,
          ];
          const a: number = profile[0],
            b: number = profile[1];
          const centre: number = c * profile[2] + s * profile[3];
          const support: number =
            input.kind === "box"
              ? Math.abs(c) * a + Math.abs(s) * b
              : Math.hypot(c * a, s * b);
          const interval: [number, number] | undefined = input.support?.(
            t,
            angle,
          );
          for (let column: number = 0; column < width; column++)
            if (
              interval
                ? (column + 0.5 - 128) * pitch >= interval[0] &&
                  (column + 0.5 - 128) * pitch <= interval[1]
                : Math.abs((column + 0.5 - 128) * pitch - centre) <= support
            ) {
              const at: number = 3 * (row * width + column);
              pixels[at] = 30;
              pixels[at + 1] = 80;
              pixels[at + 2] = 130;
            }
        }
        return {
          id: `view.${index}`,
          sourceSha256: "a".repeat(64),
          pixelProvenance: "analytic-pixel-centre-raster-v1",
          width,
          height,
          rgb8: pixels,
          camera: {
            type: "horizontal-orthographic",
            calibration: "supplied",
            azimuthRadians: angle,
            pixelPitchMm: pitch,
            principalPointPx: [128, 440],
          },
        };
      },
    ),
  };
}

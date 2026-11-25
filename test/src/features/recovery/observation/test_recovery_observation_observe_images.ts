import type { IAutoMovieRecoveryImageInput } from "@automovie/interface";
import { observeAutoMovieRecoveryImages } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryImageFixture } from "../../internal/recoveryImageFixture";

/** An independently authored malformed pixel or camera input. */
interface RecoveryImageMutation {
  name: string;
  make: (value: IAutoMovieRecoveryImageInput) => void;
  reason: string;
}

/**
 * Fixed-background RGB observation preserves support and refuses unsupported
 * masks.
 *
 * Scenarios:
 *
 * 1. Three calibrated images yield four hundred ordered physical rows per view.
 * 2. Every byte in each RGB channel obeys integral/fractional thresholds,
 *    including exact equality. Empty, clipped, holed and disconnected support
 *    refuse; eight-connected diagonals remain admitted.
 * 3. Unrepresentable pixel charts and exhausted pixel, row and view budgets
 *    refuse.
 * 4. Cancellation and a failing progress observer preserve terminal outcome
 *    semantics.
 */
export function test_recovery_observation_observe_images(): void {
  const input: IAutoMovieRecoveryImageInput = recoveryImageFixture();
  const result: ReturnType<typeof observeAutoMovieRecoveryImages> =
    observeAutoMovieRecoveryImages(input);
  TestValidator.equals(
    "supported image observation completes",
    result.status,
    "complete",
  );
  if (result.status !== "complete" && result.status !== "partial")
    throw new Error(result.diagnostics.join("; "));
  for (const view of result.value.views) {
    TestValidator.equals("every occupied row retained", view.rows.length, 400);
    TestValidator.predicate(
      "row chart preserves physical pixel centres",
      nclose(view.rows[0].yMm, 0.125) && nclose(view.rows.at(-1)!.yMm, 99.875),
    );
    TestValidator.predicate(
      "quantization remains conditional half pitch",
      nclose(view.quantizationMm, 0.125),
    );
  }
  const first: (typeof result.value.views)[number]["rows"][number] =
    result.value.views[0].rows[0];
  const t: number = first.yMm / 100;
  const radius: number = 18 + 8 * t - 12 * t * t + 5 * t * t * t;
  const centre: number = 2 - 4 * t + 2 * t * t;
  TestValidator.predicate(
    "left and right supports locate analytic pixel cells",
    Math.abs(first.lowerMm - (centre - radius)) <= 0.125 &&
      Math.abs(first.upperMm - (centre + radius)) <= 0.125,
  );
  result.value.views[0].camera.principalPointPx[0] = 999;
  TestValidator.equals(
    "result camera metadata does not alias input",
    input.views[0].camera.principalPointPx[0],
    128,
  );
  const threshold: IAutoMovieRecoveryImageInput = recoveryImageFixture();
  threshold.background.threshold = 210;
  TestValidator.equals(
    "foreground includes exact threshold",
    observeAutoMovieRecoveryImages(threshold).status,
    "complete",
  );
  threshold.background.threshold = 211;
  TestValidator.equals(
    "adjacent colour below threshold stays background",
    observeAutoMovieRecoveryImages(threshold).status,
    "refused",
  );
  const diagonal: IAutoMovieRecoveryImageInput = recoveryImageFixture();
  for (const view of diagonal.views) {
    view.rgb8.fill(240);
    for (let row: number = 100; row < 104; row++)
      view.rgb8[3 * (row * view.width + row)] = 0;
  }
  TestValidator.equals(
    "diagonal occupied cells retain eight-connected support",
    observeAutoMovieRecoveryImages(diagonal).status,
    "complete",
  );
  for (const channel of [1, 2]) {
    for (const view of diagonal.views) {
      view.rgb8.fill(240);
      for (let row: number = 100; row < 104; row++)
        view.rgb8[3 * (row * view.width + row) + channel] = 220;
    }
    TestValidator.equals(
      `exact threshold in channel ${channel} establishes foreground`,
      observeAutoMovieRecoveryImages(diagonal).status,
      "complete",
    );
  }
  const tiny: IAutoMovieRecoveryImageInput = {
    ...input,
    background: { rgb: [0, 127, 255], threshold: 20 },
    budget: { maxPixels: 108, maxViews: 3, maxRows: 12 },
    views: input.views.map(
      (view: (typeof input.views)[number]): (typeof input.views)[number] => ({
        ...view,
        width: 6,
        height: 6,
        rgb8: new Uint8Array(108),
        camera: { ...view.camera, principalPointPx: [3, 5] },
      }),
    ),
  };
  for (let channel: number = 0; channel < 3; channel++) {
    for (const view of tiny.views)
      for (let at: number = 0; at < view.rgb8.length; at += 3)
        view.rgb8.set(tiny.background.rgb, at);
    for (const distance of [0.5, 20, 20.5, 255]) {
      tiny.background.threshold = distance;
      for (let value: number = 0; value < 256; value++) {
        for (const view of tiny.views)
          for (let row: number = 1; row <= 4; row++)
            for (let column: number = 1; column <= 4; column++)
              view.rgb8[3 * (row * 6 + column) + channel] = value;
        TestValidator.equals(
          `channel ${channel}, byte ${value}, threshold ${distance} follows the declared distance predicate`,
          observeAutoMovieRecoveryImages(tiny).status,
          Math.abs(value - tiny.background.rgb[channel]) >= distance
            ? "complete"
            : "refused",
        );
      }
    }
  }
  const variants: RecoveryImageMutation[] = [
    {
      name: "empty",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.views[0].rgb8.fill(240);
      },
      reason: "insufficient-support",
    },
    {
      name: "border",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.views[0].rgb8[0] = 0;
      },
      reason: "clipped-foreground",
    },
    {
      name: "hole",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.views[0].rgb8.fill(
          240,
          3 * (100 * 256 + 128),
          3 * (100 * 256 + 129),
        );
      },
      reason: "unsupported-support",
    },
    {
      name: "missing row",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.views[0].rgb8.fill(240, 3 * 100 * 256, 3 * 101 * 256);
      },
      reason: "unsupported-support",
    },
    {
      name: "disconnected consecutive rows",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        const view: (typeof value.views)[number] = value.views[0];
        view.rgb8.fill(240);
        for (let row: number = 100; row < 108; row++) {
          const first: number = row < 104 ? 50 : 180;
          for (let column: number = first; column < first + 20; column++)
            view.rgb8[3 * (row * view.width + column)] = 0;
        }
      },
      reason: "invalid-pixel-support",
    },

    {
      name: "pixel budget",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.budget.maxPixels = 1;
      },
      reason: "budget-exhausted",
    },
    {
      name: "row budget",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.budget.maxRows = 10;
      },
      reason: "budget-exhausted",
    },
    {
      name: "view budget",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.budget.maxViews = 2;
      },
      reason: "invalid-capture",
    },
  ];
  for (const variant of variants) {
    const malformed: IAutoMovieRecoveryImageInput = recoveryImageFixture();
    variant.make(malformed);
    const refusal: ReturnType<typeof observeAutoMovieRecoveryImages> =
      observeAutoMovieRecoveryImages(malformed);
    TestValidator.equals(`${variant.name} refuses`, refusal.status, "refused");
    TestValidator.predicate(
      `${variant.name} retains its cause`,
      refusal.diagnostics.some((message: string): boolean =>
        message.includes(variant.reason),
      ),
    );
  }
  for (const offset of [1e20, Number.MAX_VALUE]) {
    const overflow: IAutoMovieRecoveryImageInput = recoveryImageFixture();
    overflow.views[0].camera.principalPointPx[0] = offset;
    TestValidator.equals(
      "unrepresentable metric chart refuses",
      observeAutoMovieRecoveryImages(overflow).status,
      "refused",
    );
  }
  const underflow: IAutoMovieRecoveryImageInput = recoveryImageFixture();
  underflow.views[0].camera.pixelPitchMm = Number.MIN_VALUE;
  TestValidator.equals(
    "metre pitch underflow refuses",
    observeAutoMovieRecoveryImages(underflow).status,
    "refused",
  );
  const controller: AbortController = new AbortController();
  controller.abort();
  TestValidator.equals(
    "pre-aborted observation is cancelled",
    observeAutoMovieRecoveryImages(input, {
      cancelled: (): boolean => controller.signal.aborted,
    }).status,
    "cancelled",
  );
  TestValidator.equals(
    "progress failure remains failed",
    observeAutoMovieRecoveryImages(input, {
      onProgress: (): void => {
        throw new Error("observer failure");
      },
    }).status,
    "failed",
  );
}

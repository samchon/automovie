import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";
import { observeAutoMovieRecoveryImages } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoveryImageFixture } from "../internal/recoveryImageFixture";

/**
 * Fixed-background RGB observation preserves support and refuses unsupported masks.
 *
 * Scenarios:
 * 1. Three calibrated images yield four hundred ordered physical rows per view.
 * 2. Empty, border-clipped, holed and vertically disconnected foreground refuse.
 * 3. Sparse camera/background/view arrays, wrong byte populations, unrepresentable pixel charts and exhausted budgets refuse.
 * 4. Cancellation and a failing progress observer preserve terminal outcome semantics.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public RGB observer and asserts physical row coordinates, edge limits, cloned camera ownership, explicit rejection reasons and callback/cancellation outcomes rather than source arrangement.
 * @evidence contracts/testing.md#independent-expectations Analytic pixel-centre raster truth fixes the first row at 0.125 mm and the last at 99.875 mm. Ideal measured edge error is at most half the 0.25 mm pitch; refusal follows the supported opaque one-interval contract.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid extent, colour threshold, empty support, horizontal and vertical clipping/connectivity, sparse tuples/populations, exact byte length, pixel/row/view budgets and terminal callbacks. Inverse fit and independent surface generation have separate tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable portable test_recovery_image_observation entry uses resident arrays and caller-owned AbortControllers only, with no process, filesystem, renderer, native artifact or foreign-method replacement.
 */
export function test_recovery_image_observation(): void {
  const input: IAutoMovieRecoveryImageInput = recoveryImageFixture();
  const result: ReturnType<typeof observeAutoMovieRecoveryImages> =
    observeAutoMovieRecoveryImages(input);
  TestValidator.equals(
    "supported image observation completes",
    result.status,
    "complete",
  );
  if (!("value" in result)) throw new Error(result.diagnostics.join("; "));
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
  const variants: {
    name: string;
    make: (value: IAutoMovieRecoveryImageInput) => void;
    reason: string;
  }[] = [
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
      name: "sparse background",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        const channels: number[] = value.background.rgb;
        Reflect.deleteProperty(channels, "1");
      },
      reason: "invalid-background",
    },
    {
      name: "sparse camera",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        const point: number[] = value.views[0].camera.principalPointPx;
        Reflect.deleteProperty(point, "1");
      },
      reason: "invalid-view",
    },
    {
      name: "sparse view",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        Reflect.deleteProperty(value.views, "1");
      },
      reason: "invalid-view",
    },
    {
      name: "short pixels",
      make: (value: IAutoMovieRecoveryImageInput): void => {
        value.views[0].rgb8 = new Uint8Array(3);
      },
      reason: "invalid-pixels",
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
    observeAutoMovieRecoveryImages(input, { signal: controller.signal }).status,
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

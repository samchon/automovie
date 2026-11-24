import { admitAutoMovieFilmOptics } from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * The film optics admit a shutter, a lens and their sample count only together,
 * and refuse each out-of-range value naming the second and the field.
 *
 * Scenarios:
 *
 * 1. `shutter` without `samples`, `lens` without `samples`, and `samples` with
 *    neither each throw, naming the second and `samples`.
 * 2. `samples: 1` and `samples: 2.5` are refused; a shutter angle of 0 and of 361,
 *    and a lens `fNumber` of 0 and `focusDistance` of NaN, are refused naming
 *    their fields.
 * 3. `samples: 16` with a 180-degree shutter, with a lens, and with both, and a
 *    360-degree shutter, are admitted, as are optics with none of the three.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine's admission with each combination and reads the thrown message; a missing pairing rule or range check lets the bad optics through.
 * @evidence contracts/development/testing.md#independent-expectations The pairing rule and ranges are the issue's: samples a safe integer of at least 2, angle within (0, 360], lens values finite and above zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Each unpaired member, each boundary of the angle, an integer and a fractional sample count, and the valid combinations. The planned sample times belong to test_draw_film_shutter_times.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name; no GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with each refused and admitted combination.
 */
export function test_draw_film_accumulation_validation(): void {
  const base: IAutoMovieFilmOptics = { ev100: 10, toneMapping: "none" };
  const shutter: IAutoMovieFilmOptics.IShutter = { angle: 180 };
  const lens: IAutoMovieFilmOptics.ILens = { fNumber: 2, focusDistance: 3 };
  const refuses: (optics: IAutoMovieFilmOptics, field: string) => boolean = (
    optics: IAutoMovieFilmOptics,
    field: string,
  ): boolean =>
    throwsError(
      (): void => admitAutoMovieFilmOptics(optics, 2.5),
      ["2.5 s", field],
    );
  const admits: (optics: IAutoMovieFilmOptics) => boolean = (
    optics: IAutoMovieFilmOptics,
  ): boolean => !throwsError((): void => admitAutoMovieFilmOptics(optics, 2.5));

  TestValidator.equals(
    "unpaired members are refused",
    [
      refuses({ ...base, shutter }, "samples"),
      refuses({ ...base, lens }, "samples"),
      refuses({ ...base, samples: 8 }, "samples"),
    ],
    [true, true, true],
  );
  TestValidator.equals(
    "out-of-range values are refused by field",
    [
      refuses({ ...base, shutter, samples: 1 }, "samples"),
      refuses({ ...base, shutter, samples: 2.5 }, "samples"),
      refuses({ ...base, samples: 4, shutter: { angle: 0 } }, "shutter.angle"),
      refuses(
        { ...base, samples: 4, shutter: { angle: 361 } },
        "shutter.angle",
      ),
      refuses(
        { ...base, samples: 4, lens: { ...lens, fNumber: 0 } },
        "lens.fNumber",
      ),
      refuses(
        { ...base, samples: 4, lens: { ...lens, focusDistance: Number.NaN } },
        "lens.focusDistance",
      ),
    ],
    [true, true, true, true, true, true],
  );
  TestValidator.equals(
    "paired members are admitted",
    [
      admits({ ...base, samples: 16, shutter }),
      admits({ ...base, samples: 16, lens }),
      admits({ ...base, samples: 16, shutter, lens }),
      admits({ ...base, samples: 2, shutter: { angle: 360 } }),
      admits(base),
    ],
    [true, true, true, true, true],
  );
}

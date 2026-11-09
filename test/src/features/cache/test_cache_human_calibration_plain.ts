import { TestValidator } from "@nestia/e2e";

import { decodeAutoMovieArtifactJson } from "../../../../packages/engine/src/cache/decodeAutoMovieArtifactJson";
import { encodeAutoMovieArtifactJson } from "../../../../packages/engine/src/cache/encodeAutoMovieArtifactJson";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { plainAutoMovieHumanCalibration } from "../../../../packages/human/src/generation/plainAutoMovieHumanCalibration";

/**
 * A calibration whose loft layers and caps keep the engine's live source axis references stores as plain data, while the artifact store still refuses any other live value.
 *
 * Scenarios:
 * 1. A chain whose layer holds `frameSource.axis` and whose pole holds `source.axis`, both with `at` and `jet` methods, fails the engine encoder, as master's #3065 calibration did on mount.
 * 2. Its storable form encodes, round-trips, keeps the layer's own `frame`, `frameSlopes` and `y` and the pole's `end` and `point`, has no source record, and leaves the input calibration untouched.
 * 3. A layer without `frameSource` is the same object in the storable form.
 * 4. A live function anywhere else (here on an eye) still fails the encoder after the storable mapping, so the plain-data rule is not weakened.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real plainAutoMovieHumanCalibration and the real engine encoder and decoder on a calibration-shaped value, observing encode failures, decoded members and the unchanged input.
 * @evidence contracts/development/testing.md#independent-expectations Expected members are the literal input numbers; the expected failure is the encoder's documented refusal of non-plain data.
 * @evidence contracts/development/testing.md#distinguishing-cases A layer with and without frameSource, a pole with a source, the raw versus storable form, and a live value outside the engine's source records distinguish removing exactly those records from dropping functions in general.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit: synthetic records, no calibration, store, file, browser or process. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export function test_cache_human_calibration_plain(): void {
  const frame = { origin: [0, 0, 1500], u: [1, 0, 0], v: [0, 1, 0] };
  const axis = { at: (): typeof frame => frame, jet: (): null => null };
  const sourced = { y: 1500, sections: [[0, 1, 2]], frame, frameSlopes: frame, frameSource: { axis, station: 1500, frame, jet: null } };
  const bare = { y: 1600, sections: [[3, 4, 5]] };
  const calibration = {
    stature: 1800,
    chains: [{ name: "head", layers: [sourced, bare], pole: { end: "top", point: [0, 0, 1800], source: { axis, station: 1800 } } }],
    events: [],
    poles: [],
    apertures: [],
    eyes: [{ side: "left", centre: [31, -0, 1620], radius: 12 }],
  } as unknown as IAutoMovieHumanBodyCalibration;

  const refuses = (value: unknown): boolean => {
    try {
      encodeAutoMovieArtifactJson(value);
      return false;
    } catch {
      return true;
    }
  };
  TestValidator.predicate("live frameSource refused", refuses(calibration));

  const plain: IAutoMovieHumanBodyCalibration = plainAutoMovieHumanCalibration(calibration);
  const back: any = decodeAutoMovieArtifactJson(encodeAutoMovieArtifactJson(plain));
  const layer: any = back.chains[0].layers[0];
  TestValidator.equals("layer keeps its plain frame", [layer.y, layer.frame, layer.frameSlopes, "frameSource" in layer], [1500, frame, frame, false]);
  TestValidator.equals("cap keeps its plain point", back.chains[0].pole, { end: "top", point: [0, 0, 1800] });
  TestValidator.predicate("input untouched", (calibration.chains[0]!.layers[0] as any).frameSource.axis === axis);
  TestValidator.predicate("bare layer shared", plain.chains[0]!.layers[1] === (bare as unknown));

  const live = { ...calibration, eyes: [{ side: "left", centre: [0, 0, 0], radius: 12, at: (): number => 0 }] } as unknown as IAutoMovieHumanBodyCalibration;
  TestValidator.predicate("other live values still refused", refuses(plainAutoMovieHumanCalibration(live)));
}

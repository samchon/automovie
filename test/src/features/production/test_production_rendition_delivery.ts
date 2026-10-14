import { assertProductionRenditionClipDelivery } from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";

/**
 * A repaint clip is delivered only when it matches its contract exactly.
 *
 * A rendition arrives from a host diffusion adapter, so nothing about it is
 * trusted: its raster, its rational frame clock, its frame count and its
 * runtime must all equal what the production declared, or the cut would splice
 * a clip that plays at a different size or speed than the timeline believes.
 * The in-memory sample containers establish delivery admission and transport;
 * decoder interoperability is not established by these authored sample bytes.
 *
 * @evidence contracts/testing.md#behavioral-verification Parses authored MP4 bytes through actual rendition delivery admission, then changes each declared raster/count/clock/runtime field separately; successful admission and shot-labelled refusal fragments expose contract drift.
 * @evidence contracts/testing.md#independent-expectations The authored 16-by-16, four-frame, 24-fps container supplies a 4/24-second contract independently of parser output. Sample-table payloads are synthetic transport inputs, so successful parsing proves neither decoded pixels nor codec interoperability.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the exact admitted tuple and five single-field refusing neighbors, including width/height plus two, frame count five, fps thirty and runtime plus one; rational override precedence, malformed containers and full producer playback are owned elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit runs the ISO parser/profile gate on in-memory bytes from the existing sample builder, without a native encoder, browser, filesystem host or dynamic registration.
 *
 * Scenarios:
 *
 * 1. A clip matching its declared raster, clock, frame count and runtime is
 *    delivered without complaint.
 * 2. Each of width, height, frame count, fps and runtime is refused on its own,
 *    with the shot named in the refusal so a multi-shot cut says which one.
 */
export function test_production_rendition_delivery(): void {
  const width: number = 16;
  const height: number = 16;
  const fps: number = 24;
  const frameCount: number = 4;
  const runtimeSeconds: number = frameCount / fps;
  const bytes: Uint8Array = productionSampleMp4({ width, height, fps, frameCount });
  const contract: Parameters<typeof assertProductionRenditionClipDelivery>[0] = {
    bytes,
    shot: "opening",
    width,
    height,
    fps,
    frameCount,
    runtimeSeconds,
  };
  const refused: (overrides: Record<string, number>) => boolean = (overrides: Record<string, number>): boolean =>
    throwsError(
      (): void =>
        assertProductionRenditionClipDelivery({ ...contract, ...overrides }),
      ['Repaint clip "opening"', "raster"],
    );
  TestValidator.equals(
    "a repaint clip is delivered only against its exact contract",
    namedFacts([
      [
        "exactContractIsDelivered",
        (): boolean => {
          assertProductionRenditionClipDelivery(contract);
          return true;
        },
      ],
      ["aWiderRasterIsRefused", (): boolean => refused({ width: width + 2 })],
      ["aTallerRasterIsRefused", (): boolean => refused({ height: height + 2 })],
      ["aDifferentFrameCountIsRefused", (): boolean => refused({ frameCount: 5 })],
      ["aDifferentClockIsRefused", (): boolean => refused({ fps: 30 })],
      [
        "aDifferentRuntimeIsRefused",
        (): boolean => refused({ runtimeSeconds: runtimeSeconds + 1 }),
      ],
    ]),
    {
      exactContractIsDelivered: true,
      aWiderRasterIsRefused: true,
      aTallerRasterIsRefused: true,
      aDifferentFrameCountIsRefused: true,
      aDifferentClockIsRefused: true,
      aDifferentRuntimeIsRefused: true,
    },
  );
}

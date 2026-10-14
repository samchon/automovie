import { throwsError as refused } from "../internal/predicates";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { productionPng } from "../internal/productionMedia/productionPng";

/**
 * A preview and audio-mix PNG are admitted from actual decoded raster bytes, with their media declaration and malformed signature refused.
 *
 * Scenarios:
 *
 * 1. Decode the independently authored 16 by 8 raster as preview and audio evidence.
 * 2. Refuse a conflicting media declaration and non-PNG bytes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production media probe on actual encoder-produced PNG bytes, observing the raster extent and picture declarations for preview and audio evidence; relabeling those bytes or supplying a malformed signature must refuse.
 * @evidence contracts/testing.md#independent-expectations Caller-authored 16-by-8 dimensions and the fixture's RGBA, noninterlaced gamma-tagged encoding determine expected metadata independently of the probe. Successful parsing does not establish visible appearance, audio content or delivery acceptance.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the same valid PNG under preview/audio-mix associations with conflicting JPEG media type and invalid signature; detailed PNG chunk, CRC and picture refusals belong to their separate unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns resident PNG encoding/probing and refusal callbacks through existing fixtures; it opens no file, process, renderer, browser or GPU and installs no production consumer.
 */
export function test_production_media_probe(): void {
  const png: Uint8Array = productionPng(16, 8);
  TestValidator.equals(
    "the PNG probe reports the decoded raster",
    probeProductionMedia({
      kind: "preview",
      mediaType: "image/png",
      bytes: png,
    }),
    {
      kind: "png",
      width: 16,
      height: 8,
      picture: {
        width: 16,
        height: 8,
        bitDepth: 8,
        color: "rgba",
        alpha: "straight",
        interlace: "none",
        colorSpace: "srgb",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
    },
  );
  TestValidator.predicate(
    "a preview cannot relabel PNG bytes",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "preview",
          mediaType: "image/jpeg",
          bytes: png,
        }),
      "requires image/png",
    ),
  );
  TestValidator.predicate(
    "a malformed PNG is refused by name before any decoder speaks",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "preview",
          mediaType: "image/png",
          bytes: Buffer.from("not a png"),
        }),
      "PNG datastream lacks the required signature",
    ),
  );
  TestValidator.equals(
    "audio-mix PNG evidence is decoded as a raster",
    probeProductionMedia({
      kind: "audio-mix",
      mediaType: "image/png",
      bytes: png,
    }),
    {
      kind: "png",
      width: 16,
      height: 8,
      picture: {
        width: 16,
        height: 8,
        bitDepth: 8,
        color: "rgba",
        alpha: "straight",
        interlace: "none",
        colorSpace: "srgb",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
    },
  );
}

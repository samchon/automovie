import type { IPortraitHairShape } from "./IPortraitHairShape";

/**
 * Admit a complete normalized curl pattern independently of groom population.
 * Geometry and texture construction call the same admission, so an empty groom
 * cannot conceal an invalid optional profile until strands are added later.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Rejects invalid complete curl profiles without clamping or mutating the authored values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Applies finite inclusive curl-pattern envelopes before either geometry or texture construction.
 */
export function assertPortraitHairFibreCurl(
  curl: NonNullable<IPortraitHairShape["fibreCurl"]>,
): void {
  if (
    curl === null ||
    typeof curl !== "object" ||
    !Number.isFinite(curl.amplitude) ||
    curl.amplitude < 0 ||
    curl.amplitude > 0.5 ||
    !Number.isFinite(curl.cycles) ||
    curl.cycles < 0 ||
    curl.cycles > 16 ||
    !Number.isFinite(curl.aspectRatio) ||
    curl.aspectRatio < 0.01 ||
    curl.aspectRatio > 100
  )
    throw new Error(
      "Hair curl needs finite amplitude [0,0.5], cycles [0,16] and aspect ratio [0.01,100].",
    );
}

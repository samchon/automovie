import type { IPortraitHairShape } from "./IPortraitHairShape";

/**
 * Admit a complete normalized curl pattern independently of groom population. Geometry and texture construction call the same admission, so an empty groom cannot conceal an invalid optional profile until strands are added later.
 *
 * @evidence contracts/common.md#principled-implementation Complete curl profiles are checked for finite amplitude, frequency and aspect ratio independently of population count.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and texture callers share this same normalized-pattern admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numeric limits constrain legacy procedural appearance and carry no biological curvature claim.
 * @evidence contracts/common.md#meaningful-documentation Invalid empty-groom curl profiles still throw; this function neither generates nor modifies fibres.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar range checks take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both card and raster construction reuse this admission instead of distinct curl policies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed curl record is unchanged and no texture or geometry allocation survives admission.
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

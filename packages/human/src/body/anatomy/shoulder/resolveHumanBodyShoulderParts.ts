import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's clavicle, scapula, deltoid and rotator cuff muscles.
 *
 * The connected source's clavicle, scapula and shoulder points are rig joint
 * cubes; it registers no acromion, coracoid, scapular spine, angles or
 * clavicular ends, so the clavicle and scapula are `missing-bone-landmark`.
 * The thorax-relative shoulder goal and the scapulohumeral couplings move
 * the skin, not an independent scapula. The one exterior skin holds no
 * muscle boundary, so the deltoid, supraspinatus, infraspinatus, teres minor
 * and subscapularis are `missing-tissue-boundary`; the rotator cuff is their
 * group, not a fifth part. An observed value in a part's request refuses it
 * as `acquisition-not-registered`. The biacromial breadth belongs to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyShoulderParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle = "missing-tissue-boundary" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const shoulder = input.targets?.[`${side}UpperLimb`]?.shoulder;
    const cuff = shoulder?.rotatorCuff;
    return [
      humanBodyUnavailablePart(
        `${side}Clavicle` as const,
        shoulder?.clavicle,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Scapula` as const,
        shoulder?.scapula,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Deltoid` as const,
        shoulder?.deltoid,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Supraspinatus` as const,
        cuff?.supraspinatus,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Infraspinatus` as const,
        cuff?.infraspinatus,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}TeresMinor` as const,
        cuff?.teresMinor,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Subscapularis` as const,
        cuff?.subscapularis,
        muscle,
      ),
    ];
  });
}

import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer the trunk's vertebrae, sternum, ribs, costal cartilages, trunk
 * muscles, external oblique aponeuroses and abdominal visceral adipose.
 *
 * The connected source carries spine and neck joint cubes for its rig, not
 * vertebral bodies, processes, the sternal notch, xiphoid or any rib; every
 * cervical, thoracic and lumbar vertebra, the sternum and each rib are
 * `missing-bone-landmark`. The one exterior skin holds no boundary for
 * cartilage, muscle, aponeurosis or visceral fat, so those are
 * `missing-tissue-boundary`. The spine's kyphosis and lordosis angles and the
 * cage's transverse breadth and sternal depth condition every vertebra or the
 * whole cage, so they enter each of those parts' requests. Breast tissue is
 * a subregion of the whole-body subcutaneous adipose, which this region does
 * not answer: no duplicate fat solid exists for it. An observed value in a
 * part's request refuses it as `acquisition-not-registered`. Bust and waist
 * girths belong to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyTrunkParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const trunk = input.targets?.trunk;
  const spine = trunk?.spine;
  const cage = trunk?.thoracicCage;
  const curvature = [spine?.thoracicKyphosis, spine?.lumbarLordosis];
  const whole = [cage?.maximumTransverseBreadth, cage?.sternalAngleDepth];
  const bone = "missing-bone-landmark" as const;
  const tissue = "missing-tissue-boundary" as const;
  const sides = ["left", "right"] as const;
  const ribs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
  return [
    ...([1, 2, 3, 4, 5, 6, 7] as const).map((n) =>
      humanBodyUnavailablePart(
        `c${n}` as const,
        [spine?.cervical?.[`c${n}`], curvature],
        bone,
      ),
    ),
    ...ribs.map((n) =>
      humanBodyUnavailablePart(
        `t${n}` as const,
        [spine?.thoracic?.[`t${n}`], curvature],
        bone,
      ),
    ),
    ...([1, 2, 3, 4, 5] as const).map((n) =>
      humanBodyUnavailablePart(
        `l${n}` as const,
        [spine?.lumbar?.[`l${n}`], curvature],
        bone,
      ),
    ),
    humanBodyUnavailablePart("sternum", [cage?.sternum, whole], bone),
    ...sides.flatMap((side) => {
      const muscles = trunk?.[`${side}Muscles`];
      return [
        ...ribs.map((n) =>
          humanBodyUnavailablePart(
            `${side}Rib${n}` as const,
            [cage?.[`${side}Ribs`]?.[`rib${n}`], whole],
            bone,
          ),
        ),
        humanBodyUnavailablePart(
          `${side}CostalCartilages` as const,
          cage?.[`${side}CostalCartilages`],
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}PectoralisMajor` as const,
          muscles?.pectoralisMajor,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}RectusAbdominis` as const,
          muscles?.rectusAbdominis,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}ExternalOblique` as const,
          muscles?.externalOblique,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}InternalOblique` as const,
          muscles?.internalOblique,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}LatissimusDorsi` as const,
          muscles?.latissimusDorsi,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}Trapezius` as const,
          muscles?.trapezius,
          tissue,
        ),
        humanBodyUnavailablePart(
          `${side}ExternalObliqueAponeurosis` as const,
          muscles?.externalObliqueAponeurosis,
          tissue,
        ),
      ];
    }),
    humanBodyUnavailablePart(
      "abdominalVisceralAdipose",
      trunk?.abdominalAdipose,
      tissue,
    ),
  ];
}

import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyTrunkMeasurements } from "./IAutoMovieHumanBodyTrunkMeasurements";
import type { IAutoMovieHumanBodySpineMeasurements } from "./IAutoMovieHumanBodySpineMeasurements";
import type { IAutoMovieHumanBodyThoracicCageMeasurements } from "./IAutoMovieHumanBodyThoracicCageMeasurements";
import type { IAutoMovieHumanBodyTrunkMusclesMeasurements } from "./IAutoMovieHumanBodyTrunkMusclesMeasurements";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer the trunk's vertebrae, sternum, ribs, costal cartilages, trunk muscles, external oblique aponeuroses and abdominal visceral adipose.
 *
 * No qualified internal trunk generator is registered in this resolver. Its fixed landmark/tissue causes describe that limitation: the supplied basis is not inspected and source absence is not established. Spinal curvatures enter each vertebral request and cage breadth/depth enter sternum/rib requests, so observed values in those shared conditions receive acquisition precedence. Cartilage, six trunk muscle bellies and external-oblique aponeurosis are separately named on each side. The visceral-adipose result receives the whole abdominal-adipose subtree; breast and subcutaneous-fat outputs are outside this list. Bust/waist skin dimensions cannot resolve these internal parts.
 *
 * @evidence contracts/common.md#principled-implementation Fixed named unavailable results preserve vertebral/rib/component identities and request-local observed-acquisition precedence while qualified trunk generation remains unregistered.
 * @evidence contracts/common.md#clear-and-simple-design Numbered bone collections and bilateral tissue mapping share the unavailable-part helper instead of duplicating acquisition detection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis is unread, so fixed missing-landmark/tissue causes cannot certify source absence; skin girths supply no substitute internal geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose states shared curvature/cage conditioning, unused basis, excluded breast/subcutaneous outputs and the whole adipose subtree passed to the visceral result.
 * @evidence contracts/performance.md#efficient-algorithms Anatomical output population is fixed; repeated observation scans cover part subtrees and shared curvature/cage requests without traversing or rebuilding basis geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Curvature and cage tuples are reused for relevant bones, and one bilateral mapping serves both sides; no generated tissue result exists for cross-call reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local request arrays and flatMap intermediates expire with the call; fixed-size unavailable records escape without retaining the supplied basis.
 * @author Samchon
 */
export function resolveHumanBodyTrunkParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const trunk: IAutoMovieHumanBodyTrunkMeasurements | undefined = input.targets?.trunk;
  const spine: IAutoMovieHumanBodySpineMeasurements | undefined = trunk?.spine;
  const cage: IAutoMovieHumanBodyThoracicCageMeasurements | undefined = trunk?.thoracicCage;
  const curvature: readonly unknown[] = [spine?.thoracicKyphosis, spine?.lumbarLordosis];
  const whole: readonly unknown[] = [cage?.maximumTransverseBreadth, cage?.sternalAngleDepth];
  const bone: AutoMovieHumanBodyAnatomicalUnavailableReason = "missing-bone-landmark";
  const tissue: AutoMovieHumanBodyAnatomicalUnavailableReason = "missing-tissue-boundary";
  const sides: readonly ["left", "right"] = ["left", "right"];
  const ribs: readonly [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return [
    ...([1, 2, 3, 4, 5, 6, 7] as const).map((n: 1 | 2 | 3 | 4 | 5 | 6 | 7): IAutoMovieHumanBodyPartResolution =>
      humanBodyUnavailablePart(
        `c${n}` as const,
        [spine?.cervical?.[`c${n}`], curvature],
        bone,
      ),
    ),
    ...ribs.map((n: typeof ribs[number]): IAutoMovieHumanBodyPartResolution =>
      humanBodyUnavailablePart(
        `t${n}` as const,
        [spine?.thoracic?.[`t${n}`], curvature],
        bone,
      ),
    ),
    ...([1, 2, 3, 4, 5] as const).map((n: 1 | 2 | 3 | 4 | 5): IAutoMovieHumanBodyPartResolution =>
      humanBodyUnavailablePart(
        `l${n}` as const,
        [spine?.lumbar?.[`l${n}`], curvature],
        bone,
      ),
    ),
    humanBodyUnavailablePart("sternum", [cage?.sternum, whole], bone),
    ...sides.flatMap((side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
      const muscles: IAutoMovieHumanBodyTrunkMusclesMeasurements | undefined = trunk?.[`${side}Muscles`];
      return [
        ...ribs.map((n: typeof ribs[number]): IAutoMovieHumanBodyPartResolution =>
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

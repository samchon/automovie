import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's femur, quadriceps, hamstrings, adductor magnus and
 * iliotibial tract.
 *
 * The connected source's hip and knee points are rig joint centres, not
 * femoral landmarks (trochanters, condyles), so each femur is
 * `missing-bone-landmark`; a femoral-head radius conditions the femur but the
 * articular inspection, not this report, draws its candidate sphere. The one
 * exterior skin holds no muscle or fascia boundary, so every thigh muscle and
 * the iliotibial tract are `missing-tissue-boundary`. An observed value in a
 * part's request refuses it as `acquisition-not-registered`. Thigh girth and
 * length belong to the exterior skin, not to these parts.
 *
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior source lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied targets never produce a thigh part without a generator.
 * @evidence contracts/common.md#meaningful-documentation States each reason and the femoral-head distinction.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's femur, four quadriceps heads, four hamstrings, adductor magnus and iliotibial tract; the groups are not separate parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the answers.
 * @evidence contracts/anatomy.md#anatomical-source The reasons state what the source lacks; no anatomical value is asserted.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse with their cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function resolveHumanBodyThighParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left = input.targets?.leftLowerLimb?.thigh;
  const right = input.targets?.rightLowerLimb?.thigh;
  const muscle = "missing-tissue-boundary" as const;
  return [
    humanBodyUnavailablePart("leftFemur", left?.femur, "missing-bone-landmark"),
    humanBodyUnavailablePart("rightFemur", right?.femur, "missing-bone-landmark"),
    humanBodyUnavailablePart("leftRectusFemoris", left?.quadriceps?.rectusFemoris, muscle),
    humanBodyUnavailablePart("rightRectusFemoris", right?.quadriceps?.rectusFemoris, muscle),
    humanBodyUnavailablePart("leftVastusLateralis", left?.quadriceps?.vastusLateralis, muscle),
    humanBodyUnavailablePart("rightVastusLateralis", right?.quadriceps?.vastusLateralis, muscle),
    humanBodyUnavailablePart("leftVastusMedialis", left?.quadriceps?.vastusMedialis, muscle),
    humanBodyUnavailablePart("rightVastusMedialis", right?.quadriceps?.vastusMedialis, muscle),
    humanBodyUnavailablePart("leftVastusIntermedius", left?.quadriceps?.vastusIntermedius, muscle),
    humanBodyUnavailablePart("rightVastusIntermedius", right?.quadriceps?.vastusIntermedius, muscle),
    humanBodyUnavailablePart("leftBicepsFemorisLongHead", left?.hamstrings?.bicepsFemorisLongHead, muscle),
    humanBodyUnavailablePart("rightBicepsFemorisLongHead", right?.hamstrings?.bicepsFemorisLongHead, muscle),
    humanBodyUnavailablePart("leftBicepsFemorisShortHead", left?.hamstrings?.bicepsFemorisShortHead, muscle),
    humanBodyUnavailablePart("rightBicepsFemorisShortHead", right?.hamstrings?.bicepsFemorisShortHead, muscle),
    humanBodyUnavailablePart("leftSemitendinosus", left?.hamstrings?.semitendinosus, muscle),
    humanBodyUnavailablePart("rightSemitendinosus", right?.hamstrings?.semitendinosus, muscle),
    humanBodyUnavailablePart("leftSemimembranosus", left?.hamstrings?.semimembranosus, muscle),
    humanBodyUnavailablePart("rightSemimembranosus", right?.hamstrings?.semimembranosus, muscle),
    humanBodyUnavailablePart("leftAdductorMagnus", left?.adductorMagnus, muscle),
    humanBodyUnavailablePart("rightAdductorMagnus", right?.adductorMagnus, muscle),
    humanBodyUnavailablePart("leftIliotibialTract", left?.iliotibialTract, muscle),
    humanBodyUnavailablePart("rightIliotibialTract", right?.iliotibialTract, muscle),
  ];
}

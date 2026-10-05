import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's talus and calcaneus.
 *
 * The connected source moves the whole foot on one ankle joint centre and
 * registers no talar or calcaneal landmark, so both bones are
 * `missing-bone-landmark`; the talocrural and subtalar joints are not
 * separated in the source rig. The mortise surfaces of the tibia and fibula
 * belong to the leg region and the midfoot to the forefoot region. An
 * observed bone volume refuses its bone as `acquisition-not-registered`.
 *
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior source lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One foot transform is not read as two anatomical joints.
 * @evidence contracts/common.md#meaningful-documentation States each reason and the neighbouring ownership.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's talus and calcaneus only.
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
export function resolveHumanBodyHindfootParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left = input.targets?.leftLowerLimb?.foot;
  const right = input.targets?.rightLowerLimb?.foot;
  return [
    humanBodyUnavailablePart("leftTalus", left?.talus, "missing-bone-landmark"),
    humanBodyUnavailablePart("rightTalus", right?.talus, "missing-bone-landmark"),
    humanBodyUnavailablePart("leftCalcaneus", left?.calcaneus, "missing-bone-landmark"),
    humanBodyUnavailablePart("rightCalcaneus", right?.calcaneus, "missing-bone-landmark"),
  ];
}

import typia from "typia";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairTraits } from "../../structures/IAutoMovieHumanFaceHairTraits";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { expandHumanFaceHairGather } from "./expandHumanFaceHairGather";

/**
 * Apply sparse named styling to owned copies of existing hair populations.
 * Unknown identities or absent populations refuse even for an empty edit.
 * Unselected legacy directions, root envelopes, guide policy and numerical
 * settings retain their exact values. A selected sagittal part retains its
 * existing bias and envelope while replacing the named part traits; a new part
 * has no extra bias or envelope. Existing admission runs before generation.
 *
 * @evidence contracts/common.md#principled-implementation A sparse overlay replaces only selected named traits and converts their units once, preserving legacy representation without an approximate migration.
 * @evidence contracts/common.md#clear-and-simple-design One pure expansion owns sparse compatibility; existing runtime owns generation and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No existing count, root, hidden numerical setting or untouched field changes.
 * @evidence contracts/common.md#meaningful-documentation States identity refusals, copying, part preservation and actual consumer.
 * @evidence contracts/modeling.md#parameter-channels Omission retains each existing trait independently; explicit null removes only the selected optional operation.
 * @evidence contracts/modeling.md#spatial-conventions Named mm and degrees convert to head-frame metres and radians; sagittal part offset uses the shared chart origin.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing layers own population identities.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The expansion emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing growth-domain and contact owners construct attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The coupled builder observes realised styling.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Trait records own their authored qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing numerical hair admission owns limits.
 * @evidence contracts/anatomy.md#parametric-authority Named traits and closed choices enter; legacy vectors and envelopes are preserved as compatibility data rather than new sculpt inputs.
 */
export function expandHumanFaceHairTraits(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceHair | null | undefined,
  edits: Record<string, IAutoMovieHumanFaceHairTraits>,
): IAutoMovieHumanFaceHair {
  const traits = typia.assertEquals<Record<string, IAutoMovieHumanFaceHairTraits>>(edits);
  if (input === undefined || input === null)
    throw new Error("Named hair traits require an existing numerical hairstyle.");
  const result = structuredClone(input);
  for (const id of Object.keys(traits).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
    const layer = result.layers.find((candidate) => candidate.id === id);
    if (layer === undefined) throw new Error("Named hair traits require a resident population: " + id);
    const value = traits[id];
    if (value.lengths !== undefined) {
      const l = value.lengths;
      layer.lengthAxes = [l.leftMm / 1000, l.rightMm / 1000, l.crownMm / 1000,
        l.napeMm / 1000, l.frontMm / 1000, l.backMm / 1000];
    }
    if (value.hairline !== undefined) {
      const h = value.hairline;
      layer.hairline = { front: h.frontDegrees * Math.PI / 180,
        left: h.leftDegrees * Math.PI / 180, right: h.rightDegrees * Math.PI / 180,
        back: h.backDegrees * Math.PI / 180 };
    }
    if (value.comb !== undefined) layer.flow = value.comb === "back" ? [0, 0, -1] :
      value.comb === "front" ? [0, 0, 1] : value.comb === "left" ? [1, 0, 0] :
      value.comb === "right" ? [-1, 0, 0] : [0, -1, 0];
    if (value.fringeScale !== undefined) layer.frontScale = value.fringeScale;
    if (value.lengthVariation !== undefined) layer.lengthVariation = value.lengthVariation;
    if (value.liftStrength !== undefined) layer.lift.strength = value.liftStrength;
    if (value.liftHoldMm !== undefined) layer.lift.reach = value.liftHoldMm / 1000;
    if (value.fallHoldMm === null) delete layer.fall;
    else if (value.fallHoldMm !== undefined) layer.fall = { reach: value.fallHoldMm / 1000 };
    if (value.part === null) delete layer.part;
    else if (value.part !== undefined) {
      const p = value.part;
      const domain = basis.surfaces.find((s) => s.id === layer.surface)?.hairDomains?.find((d) => d.id === layer.domain);
      if (domain === undefined) throw new Error("Named hair part requires its shared growth chart: " + id);
      if (!Number.isFinite(p.offsetMm) || p.offsetMm < 0 || (p.side === "center" && p.offsetMm !== 0))
        throw new Error("A named scalp part needs nonnegative offset; center requires zero.");
      layer.part = { ...layer.part, normal: [1, 0, 0],
        offset: domain.origin[0] + (p.side === "left" ? 1 : p.side === "right" ? -1 : 0) * p.offsetMm / 1000,
        transitionWidth: p.transitionMm / 1000, bias: layer.part?.bias ?? [0, 0, 0],
        strength: p.strength, reach: p.holdMm / 1000 };
    }
    if (value.curl !== undefined) layer.curl = { mode: value.curl.mode,
      angle: value.curl.angleDegrees * Math.PI / 180,
      wavelength: value.curl.wavelengthMm / 1000, reach: value.curl.onsetMm / 1000 };
    if (value.gather === null) delete layer.gather;
    else if (value.gather !== undefined) layer.gather = expandHumanFaceHairGather(value.gather);
    if (value.tipWidth !== undefined) layer.taper.tipWidth = value.tipWidth;
    if (value.taperStart !== undefined) layer.taper.start = value.taperStart;
    if (value.finish !== undefined) layer.finish = structuredClone(value.finish);
  }
  assertHumanFaceHair(result);
  return result;
}

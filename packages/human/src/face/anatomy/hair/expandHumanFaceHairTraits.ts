import type { Layer as ImportedLayer } from "../../structures/IAutoMovieHumanFaceHair/Layer";
import type { IAutoMovieHumanFaceHairLengths as ImportedIAutoMovieHumanFaceHairLengths, IAutoMovieHumanFaceHairlineAngles as ImportedIAutoMovieHumanFaceHairlineAngles, IAutoMovieHumanFaceHairPart as ImportedIAutoMovieHumanFaceHairPart, IAutoMovieHumanFaceHairDomain as ImportedIAutoMovieHumanFaceHairDomain, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairTraits } from "../../structures/IAutoMovieHumanFaceHairTraits";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { expandHumanFaceHairGather } from "./expandHumanFaceHairGather";

/**
 * Apply sparse named styling to owned copies of existing hair populations. Unknown identities or absent populations refuse even for an empty edit. Unselected legacy directions, root envelopes, guide policy and numerical settings retain their exact values. A selected sagittal part retains its existing bias and envelope while replacing the named part traits; a new part has no extra bias or envelope. Existing admission runs before generation.
 *
 * @evidence contracts/common.md#principled-implementation Sparse named edits apply in sorted identity order to a cloned existing numerical hairstyle.
 * @evidence contracts/common.md#clear-and-simple-design Only selected fields change before existing complete hair admission runs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent populations, unknown ids and unsupported part charts refuse even for empty edits; unselected legacy numerical fields are preserved.
 * @evidence contracts/common.md#meaningful-documentation Named lengths and angles convert once, null removes optional styling, and new parts add no hidden bias/envelope.
 * @evidence contracts/performance.md#efficient-algorithms Sorting costs O(edits log edits), while resident layer and domain searches are linear in their populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Gather conversion and complete admission reuse existing owners rather than edit-specific generation policies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cloned result arrays and edited finish records are owned; licensed basis and original hairstyle remain borrowed.
 */
export function expandHumanFaceHairTraits(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceHair | null | undefined,
  edits: Record<string, IAutoMovieHumanFaceHairTraits>,
): IAutoMovieHumanFaceHair {
  const traits: { [x: string]: IAutoMovieHumanFaceHairTraits; } =
    typia.assertEquals<Record<string, IAutoMovieHumanFaceHairTraits>>(edits);
  if (input === undefined || input === null)
    throw new Error(
      "Named hair traits require an existing numerical hairstyle.",
    );
  const result: IAutoMovieHumanFaceHair = structuredClone(input);
  for (const id of Object.keys(traits).sort((a: string, b: string): 0 | 1 | -1 =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    const layer: ImportedLayer | undefined = result.layers.find((candidate: ImportedLayer): boolean => candidate.id === id);
    if (layer === undefined)
      throw new Error("Named hair traits require a resident population: " + id);
    const value: IAutoMovieHumanFaceHairTraits = traits[id];
    if (value.lengths !== undefined) {
      const l: ImportedIAutoMovieHumanFaceHairLengths = value.lengths;
      layer.lengthAxes = [
        l.leftMm / 1000,
        l.rightMm / 1000,
        l.crownMm / 1000,
        l.napeMm / 1000,
        l.frontMm / 1000,
        l.backMm / 1000,
      ];
    }
    if (value.hairline !== undefined) {
      const h: ImportedIAutoMovieHumanFaceHairlineAngles = value.hairline;
      layer.hairline = {
        front: (h.frontDegrees * Math.PI) / 180,
        left: (h.leftDegrees * Math.PI) / 180,
        right: (h.rightDegrees * Math.PI) / 180,
        back: (h.backDegrees * Math.PI) / 180,
      };
    }
    if (value.comb !== undefined)
      layer.flow =
        value.comb === "back"
          ? [0, 0, -1]
          : value.comb === "front"
            ? [0, 0, 1]
            : value.comb === "left"
              ? [1, 0, 0]
              : value.comb === "right"
                ? [-1, 0, 0]
                : [0, -1, 0];
    if (value.fringeScale !== undefined) layer.frontScale = value.fringeScale;
    if (value.lengthVariation !== undefined)
      layer.lengthVariation = value.lengthVariation;
    if (value.liftStrength !== undefined)
      layer.lift.strength = value.liftStrength;
    if (value.liftHoldMm !== undefined)
      layer.lift.reach = value.liftHoldMm / 1000;
    if (value.fallHoldMm === null) delete layer.fall;
    else if (value.fallHoldMm !== undefined)
      layer.fall = { reach: value.fallHoldMm / 1000 };
    if (value.part === null) delete layer.part;
    else if (value.part !== undefined) {
      const p: ImportedIAutoMovieHumanFaceHairPart = value.part;
      const domain: ImportedIAutoMovieHumanFaceHairDomain | undefined = basis.surfaces
        .find((s: ImportedIAutoMovieHumanFaceBasisSurface): boolean => s.id === layer.surface)
        ?.hairDomains?.find((d: ImportedIAutoMovieHumanFaceHairDomain): boolean => d.id === layer.domain);
      if (domain === undefined)
        throw new Error(
          "Named hair part requires its shared growth chart: " + id,
        );
      if (
        !Number.isFinite(p.offsetMm) ||
        p.offsetMm < 0 ||
        (p.side === "center" && p.offsetMm !== 0)
      )
        throw new Error(
          "A named scalp part needs nonnegative offset; center requires zero.",
        );
      layer.part = {
        ...layer.part,
        normal: [1, 0, 0],
        offset:
          domain.origin[0] +
          ((p.side === "left" ? 1 : p.side === "right" ? -1 : 0) * p.offsetMm) /
            1000,
        transitionWidth: p.transitionMm / 1000,
        bias: layer.part?.bias ?? [0, 0, 0],
        strength: p.strength,
        reach: p.holdMm / 1000,
      };
    }
    if (value.curl !== undefined)
      layer.curl = {
        mode: value.curl.mode,
        angle: (value.curl.angleDegrees * Math.PI) / 180,
        wavelength: value.curl.wavelengthMm / 1000,
        reach: value.curl.onsetMm / 1000,
      };
    if (value.gather === null) delete layer.gather;
    else if (value.gather !== undefined)
      layer.gather = expandHumanFaceHairGather(value.gather);
    if (value.tipWidth !== undefined) layer.taper.tipWidth = value.tipWidth;
    if (value.taperStart !== undefined) layer.taper.start = value.taperStart;
    if (value.finish !== undefined)
      layer.finish = structuredClone(value.finish);
  }
  assertHumanFaceHair(result);
  return result;
}

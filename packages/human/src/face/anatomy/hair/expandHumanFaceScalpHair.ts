import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceScalpHair } from "../../structures/IAutoMovieHumanFaceScalpHair";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { expandHumanFaceHairGather } from "./expandHumanFaceHairGather";

/**
 * Compile coordinate-free regional styling into the established hair consumer.
 * This pure document expansion retains population identity, requested count,
 * root boundary, appearance and contact clearance. Named millimetres convert
 * once to metres and polar degrees once to radians. Closed comb choices map to
 * unit head axes; sagittal parts use the shared domain's own chart midline.
 * No default population, hidden density change or geometry is introduced.
 * Existing runtime admission follows expansion before allocation. The input and
 * licensed basis remain unchanged, so save/reload preserves the authored record.
 */
export function expandHumanFaceScalpHair(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceScalpHair,
): IAutoMovieHumanFaceHair {
  const source = typia.assertEquals<IAutoMovieHumanFaceScalpHair>(input);
  const result: IAutoMovieHumanFaceHair = {
    layers: source.layers.map((layer) => {
      const surface = basis.surfaces.find(
        (candidate) => candidate.id === layer.surface,
      );
      const domain = surface?.hairDomains?.find(
        (candidate) => candidate.id === layer.domain,
      );
      if (domain === undefined)
        throw new Error(
          "Named scalp styling needs a resident shared growth domain: " +
            layer.domain,
        );
      const lengths = layer.lengths;
      const part = layer.part;
      if (
        part !== undefined &&
        (!Number.isFinite(part.offsetMm) ||
          part.offsetMm < 0 ||
          (part.side === "center" && part.offsetMm !== 0))
      )
        throw new Error(
          "A named scalp part needs a nonnegative lateral offset; center requires zero.",
        );
      const flow: [number, number, number] =
        layer.comb === "back"
          ? [0, 0, -1]
          : layer.comb === "front"
            ? [0, 0, 1]
            : layer.comb === "left"
              ? [1, 0, 0]
              : layer.comb === "right"
                ? [-1, 0, 0]
                : [0, -1, 0];
      return {
        id: layer.id,
        surface: layer.surface,
        domain: layer.domain,
        count: layer.count,
        seed: layer.seed,
        hairline: {
          front: (layer.hairline.frontDegrees * Math.PI) / 180,
          left: (layer.hairline.leftDegrees * Math.PI) / 180,
          right: (layer.hairline.rightDegrees * Math.PI) / 180,
          back: (layer.hairline.backDegrees * Math.PI) / 180,
        },
        lengthAxes: [
          lengths.leftMm / 1000,
          lengths.rightMm / 1000,
          lengths.crownMm / 1000,
          lengths.napeMm / 1000,
          lengths.frontMm / 1000,
          lengths.backMm / 1000,
        ],
        frontScale: layer.fringeScale,
        lengthVariation: layer.lengthVariation,
        samplingStep: layer.samplingStepMm / 1000,
        clearance: layer.clearanceMm / 1000,
        flow,
        lift: { strength: layer.liftStrength, reach: layer.liftHoldMm / 1000 },
        gather:
          layer.gather === undefined
            ? undefined
            : expandHumanFaceHairGather(layer.gather),
        fall:
          layer.fallHoldMm === undefined
            ? undefined
            : { reach: layer.fallHoldMm / 1000 },
        part:
          part === undefined
            ? undefined
            : {
                normal: [1, 0, 0],
                offset:
                  domain.origin[0] +
                  ((part.side === "left" ? 1 : part.side === "right" ? -1 : 0) *
                    part.offsetMm) /
                    1000,
                transitionWidth: part.transitionMm / 1000,
                bias: [0, 0, 0],
                strength: part.strength,
                reach: part.holdMm / 1000,
              },
        curl: {
          mode: layer.curl.mode,
          angle: (layer.curl.angleDegrees * Math.PI) / 180,
          wavelength: layer.curl.wavelengthMm / 1000,
          reach: layer.curl.onsetMm / 1000,
        },
        taper: { tipWidth: layer.tipWidth, start: layer.taperStart },
        finish: structuredClone(layer.finish),
      };
    }),
  };
  assertHumanFaceHair(result);
  return result;
}

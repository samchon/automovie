import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanFaceHairDomain as ImportedIAutoMovieHumanFaceHairDomain,
  IAutoMovieHumanFaceHairFinish as ImportedIAutoMovieHumanFaceHairFinish,
  IAutoMovieHumanFaceHairLengths as ImportedIAutoMovieHumanFaceHairLengths,
  IAutoMovieHumanFaceHairPart as ImportedIAutoMovieHumanFaceHairPart,
  IAutoMovieHumanFaceScalpHairLayer as ImportedIAutoMovieHumanFaceScalpHairLayer,
} from "@automovie/human";
import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceScalpHair } from "../../structures/IAutoMovieHumanFaceScalpHair";
import type { IHumanFaceHairLayerGather as ImportedIHumanFaceHairLayerGather } from "../../structures/IHumanFaceHairLayerGather";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { expandHumanFaceHairGather } from "./expandHumanFaceHairGather";

/**
 * Compile coordinate-free regional styling into the established hair consumer. This pure document expansion retains population identity, requested count, root boundary, appearance and contact clearance. Named millimetres convert once to metres and polar degrees once to radians. Closed comb choices map to unit head axes; sagittal parts use the shared domain's own chart midline. No default population, hidden density change or geometry is introduced. Existing runtime admission follows expansion before allocation. The input and licensed basis remain unchanged, so save/reload preserves the authored record.
 *
 * @evidence contracts/common.md#principled-implementation Coordinate-free regional styling maps admitted named layers to the established numerical-hair consumer.
 * @evidence contracts/common.md#clear-and-simple-design Shared domain origins anchor sagittal parts while closed comb choices map to head axes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default population or hidden density/geometry is added; unsupported charts and inconsistent centre-part offsets refuse.
 * @evidence contracts/common.md#meaningful-documentation Millimetres/degrees convert once to metres/radians while identity, count, boundary, clearance and appearance survive.
 * @evidence contracts/performance.md#efficient-algorithms Each layer performs resident surface/domain searches and fixed conversions before complete hair admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Gather expansion and numerical admission are shared with sparse named trait editing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned layer records are owned and caller named source/basis data are not mutated.
 */
export function expandHumanFaceScalpHair(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceScalpHair,
): IAutoMovieHumanFaceHair {
  const source: IAutoMovieHumanFaceScalpHair =
    typia.assertEquals<IAutoMovieHumanFaceScalpHair>(input);
  const result: IAutoMovieHumanFaceHair = {
    layers: source.layers.map(
      (
        layer: ImportedIAutoMovieHumanFaceScalpHairLayer,
      ): {
        id: string;
        surface: string;
        domain: string;
        count: number;
        seed: number;
        hairline: { front: number; left: number; right: number; back: number };
        lengthAxes: [number, number, number, number, number, number];
        frontScale: number | undefined;
        lengthVariation: number;
        samplingStep: number;
        clearance: number;
        flow: [number, number, number];
        lift: { strength: number; reach: number };
        gather: ImportedIHumanFaceHairLayerGather | undefined;
        fall: { reach: number } | undefined;
        part:
          | {
              normal: [number, number, number];
              offset: number;
              transitionWidth: number;
              bias: [number, number, number];
              strength: number;
              reach: number;
            }
          | undefined;
        curl: {
          mode: "wave" | "helix";
          angle: number;
          wavelength: number;
          reach: number;
        };
        taper: { tipWidth: number; start: number };
        finish: ImportedIAutoMovieHumanFaceHairFinish;
      } => {
        const surface: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
          basis.surfaces.find(
            (candidate: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
              candidate.id === layer.surface,
          );
        const domain: ImportedIAutoMovieHumanFaceHairDomain | undefined =
          surface?.hairDomains?.find(
            (candidate: ImportedIAutoMovieHumanFaceHairDomain): boolean =>
              candidate.id === layer.domain,
          );
        if (domain === undefined)
          throw new Error(
            "Named scalp styling needs a resident shared growth domain: " +
              layer.domain,
          );
        const lengths: ImportedIAutoMovieHumanFaceHairLengths = layer.lengths;
        const part: ImportedIAutoMovieHumanFaceHairPart | undefined =
          layer.part;
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
          lift: {
            strength: layer.liftStrength,
            reach: layer.liftHoldMm / 1000,
          },
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
                    ((part.side === "left"
                      ? 1
                      : part.side === "right"
                        ? -1
                        : 0) *
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
      },
    ),
  };
  assertHumanFaceHair(result);
  return result;
}

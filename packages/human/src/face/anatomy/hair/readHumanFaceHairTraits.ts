import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairTraits } from "../../structures/IAutoMovieHumanFaceHairTraits";

/**
 * Read named editable styling from an existing numerical population.
 * This is a view of current traits, not a replacement document: unsuited legacy
 * comb vectors remain absent rather than rounded to a closed direction. A part
 * is read only when its normalized plane points along +X and its source chart
 * is available. Private bias, root envelope and guides remain compatibility
 * data outside this view. Editing one displayed trait preserves that data.
 */
export function readHumanFaceHairTraits(
  basis: IAutoMovieHumanFaceBasis,
  layer: IAutoMovieHumanFaceHair.Layer,
): IAutoMovieHumanFaceHairTraits {
  const l = layer.lengthAxes;
  const result: IAutoMovieHumanFaceHairTraits = {
    lengths: {
      leftMm: l[0] * 1000,
      rightMm: l[1] * 1000,
      crownMm: l[2] * 1000,
      napeMm: l[3] * 1000,
      frontMm: l[4] * 1000,
      backMm: l[5] * 1000,
    },
    hairline: {
      frontDegrees: (layer.hairline.front * 180) / Math.PI,
      leftDegrees: (layer.hairline.left * 180) / Math.PI,
      rightDegrees: (layer.hairline.right * 180) / Math.PI,
      backDegrees: (layer.hairline.back * 180) / Math.PI,
    },
    fringeScale: layer.frontScale ?? 1,
    lengthVariation: layer.lengthVariation,
    liftStrength: layer.lift.strength,
    liftHoldMm: layer.lift.reach * 1000,
    fallHoldMm: layer.fall === undefined ? null : layer.fall.reach * 1000,
    curl: {
      mode: layer.curl.mode,
      angleDegrees: (layer.curl.angle * 180) / Math.PI,
      wavelengthMm: layer.curl.wavelength * 1000,
      onsetMm: layer.curl.reach * 1000,
    },
    tipWidth: layer.taper.tipWidth,
    taperStart: layer.taper.start,
    finish: structuredClone(layer.finish),
  };
  result.comb = choice(layer.flow);
  if (layer.gather === undefined) result.gather = null;
  else {
    const gather = layer.gather;
    const tailDirection = choice(gather.tail.direction);
    if (tailDirection !== undefined)
      result.gather = {
        polarDegrees: (gather.anchor.polar * 180) / Math.PI,
        azimuthDegrees: (gather.anchor.azimuth * 180) / Math.PI,
        radiusMm: gather.radius * 1000,
        strength: gather.strength,
        tailDirection,
        spreadRadiusMm:
          gather.tail.spread?.radius === undefined
            ? undefined
            : gather.tail.spread.radius * 1000,
        spreadReachMm:
          gather.tail.spread?.reach === undefined
            ? undefined
            : gather.tail.spread.reach * 1000,
      };
  }
  const part = layer.part;
  if (part === undefined) result.part = null;
  else {
    const domain = basis.surfaces
      .find((surface) => surface.id === layer.surface)
      ?.hairDomains?.find((candidate) => candidate.id === layer.domain);
    if (
      domain !== undefined &&
      part.normal[0] > 0 &&
      part.normal[1] === 0 &&
      part.normal[2] === 0
    ) {
      const offset = part.offset - domain.origin[0];
      result.part = {
        side: offset === 0 ? "center" : offset > 0 ? "left" : "right",
        offsetMm: Math.abs(offset) * 1000,
        transitionMm: part.transitionWidth * 1000,
        strength: part.strength,
        holdMm: part.reach * 1000,
      };
    }
  }
  return result;
}

/** Exact unit-axis view; an oblique legacy field is deliberately unselected. */
function choice(
  direction: readonly number[],
): IAutoMovieHumanFaceHairTraits["comb"] {
  const [x, y, z] = direction;
  if (x === 0 && y === 0 && z === -1) return "back";
  if (x === 0 && y === 0 && z === 1) return "front";
  if (x === 1 && y === 0 && z === 0) return "left";
  if (x === -1 && y === 0 && z === 0) return "right";
  if (x === 0 && y === -1 && z === 0) return "down";
  return undefined;
}

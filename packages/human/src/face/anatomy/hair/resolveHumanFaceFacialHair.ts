import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceFacialHair } from "../../structures/IAutoMovieHumanFaceFacialHair";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { assertHumanFaceFacialHair } from "./assertHumanFaceFacialHair";
import { assertHumanFaceHair } from "./assertHumanFaceHair";

/**
 * Resolve named terminal populations onto immutable registered native growth.
 * All seven sites use the existing root/guide/current-host pipeline. Count is
 * authored, not inferred from donor follicular units. Millimetres and
 * micrometres convert once; the named head-frontal styling angle converts from
 * degrees to radians before the existing source-reference field transports it.
 * Inactive curl, taper and painted-fibre coefficients express an untapered,
 * uniformly pigmented authored shaft, not a clinical population estimate.
 *
 * @evidence contracts/common.md#principled-implementation A positive site resolves exactly one basis-owned tagged native domain before allocation; missing or ambiguous registration refuses.
 * @evidence contracts/common.md#clear-and-simple-design One expander feeds the existing hair producer without a second root sampler or personal geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangles and target counts are neither cropped nor reduced to fit a request.
 * @evidence contracts/common.md#meaningful-documentation Separates authoring targets, unit conversion, inactive styling conventions and source registration.
 * @evidence contracts/modeling.md#spatial-conventions Length and step millimetres become metres; shaft micrometres become metres; zero flow angle is inferior and positive turns anatomical left in the head frontal plane.
 * @evidence contracts/anatomy.md#parametric-authority Named site controls contain no per-strand vertex, curve, world vector or private groom.
 * @author Samchon
 */
export function resolveHumanFaceFacialHair(
  input: IAutoMovieHumanFaceFacialHair,
  basis: IAutoMovieHumanFaceBasis,
): IAutoMovieHumanFaceHair {
  assertHumanFaceFacialHair(input);
  const layers: IAutoMovieHumanFaceHair.Layer[] = [];
  for (const [site, profile] of Object.entries(input.sites)) {
    if (profile === undefined || profile.count === 0 || profile.lengthMm === 0) continue;
    const matches = basis.surfaces.flatMap((surface) =>
      (surface.hairDomains ?? []).filter((domain) => domain.facialHairSite === site)
        .map((domain) => ({ surface, domain })),
    );
    if (matches.length !== 1)
      throw new Error("Facial terminal shafts require exactly one registered native growth domain for " + site + ".");
    const { surface, domain } = matches[0];
    const length = profile.lengthMm * 0.001;
    const step = profile.samplingStepMm * 0.001;
    const diameter = profile.diameterMicrometres * 0.000001;
    const angle = profile.flowAngleDegrees * Math.PI / 180;
    layers.push({
      id: "facial-hair:" + site,
      surface: surface.id,
      domain: domain.id,
      count: profile.count,
      seed: profile.seed,
      hairline: { front: Math.PI, back: Math.PI, left: Math.PI, right: Math.PI },
      lengthAxes: [length, length, length, length, length, length],
      lengthVariation: 0,
      samplingStep: step,
      clearance: 0,
      terminalShaftDiameter: diameter,
      emergenceAngleDegrees: profile.emergenceAngleDegrees,
      flow: [Math.sin(angle), -Math.cos(angle), 0],
      lift: { strength: 0, reach: length },
      curl: { mode: "wave", angle: 0, wavelength: 8 * step, reach: length },
      taper: { tipWidth: 1, start: 0 },
      finish: {
        color: [profile.finish.red, profile.finish.green, profile.finish.blue],
        roughness: profile.finish.roughness,
        fibres: 1, coverage: 1, normal: 0, shade: 0,
      },
    });
  }
  const result = { layers };
  assertHumanFaceHair(result);
  return result;
}

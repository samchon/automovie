import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanFaceHairDomain as ImportedIAutoMovieHumanFaceHairDomain,
} from "@automovie/human";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceFacialHair } from "../../structures/IAutoMovieHumanFaceFacialHair";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { Layer as ImportedLayer } from "../../structures/IAutoMovieHumanFaceHair/Layer";
import { assertHumanFaceFacialHair } from "./assertHumanFaceFacialHair";
import { assertHumanFaceHair } from "./assertHumanFaceHair";

/**
 * Resolve named terminal populations onto immutable registered native growth. All seven sites use the existing root/guide/current-host pipeline. Count is authored, not inferred from donor follicular units. Millimetres and micrometres convert once; the named head-frontal styling angle converts from degrees to radians before the existing source-reference field transports it. Inactive curl, taper and painted-fibre coefficients express an untapered, uniformly pigmented authored shaft, not a clinical population estimate.
 *
 * @evidence contracts/common.md#principled-implementation Named active site profiles find exactly one registered growth domain and lower authored shaft dimensions into numerical layers.
 * @evidence contracts/common.md#clear-and-simple-design Terminal shafts use the existing root/contact pipeline with untapered uniform diameter and inactive procedural curl.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero count or length emits no layer and unsupported active sites refuse; donor follicular density is not inferred.
 * @evidence contracts/common.md#meaningful-documentation Millimetres/micrometres and degrees convert once, while requested elevation and count remain authored values.
 * @evidence contracts/performance.md#efficient-algorithms Each active site scans resident surfaces/domains before fixed scalar lowering and complete hair admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Named profile validation and the existing numerical-hair admission are reused before allocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its lowered records and site inputs/basis remain unchanged; no generated shaft geometry is cached here.
 *
 * @author Samchon
 */
export function resolveHumanFaceFacialHair(
  input: IAutoMovieHumanFaceFacialHair,
  basis: IAutoMovieHumanFaceBasis,
): IAutoMovieHumanFaceHair {
  assertHumanFaceFacialHair(input);
  const layers: IAutoMovieHumanFaceHair.Layer[] = [];
  for (const [site, profile] of Object.entries(input.sites)) {
    if (profile === undefined || profile.count === 0 || profile.lengthMm === 0)
      continue;
    const matches: {
      surface: ImportedIAutoMovieHumanFaceBasisSurface;
      domain: ImportedIAutoMovieHumanFaceHairDomain;
    }[] = basis.surfaces.flatMap(
      (
        surface: ImportedIAutoMovieHumanFaceBasisSurface,
      ): {
        surface: ImportedIAutoMovieHumanFaceBasisSurface;
        domain: ImportedIAutoMovieHumanFaceHairDomain;
      }[] =>
        (surface.hairDomains ?? [])
          .filter(
            (domain: ImportedIAutoMovieHumanFaceHairDomain): boolean =>
              domain.facialHairSite === site,
          )
          .map(
            (
              domain: ImportedIAutoMovieHumanFaceHairDomain,
            ): {
              surface: ImportedIAutoMovieHumanFaceBasisSurface;
              domain: ImportedIAutoMovieHumanFaceHairDomain;
            } => ({ surface, domain }),
          ),
    );
    if (matches.length !== 1)
      throw new Error(
        "Facial terminal shafts require exactly one registered native growth domain for " +
          site +
          ".",
      );
    const {
      surface,
      domain,
    }: {
      surface: ImportedIAutoMovieHumanFaceBasisSurface;
      domain: ImportedIAutoMovieHumanFaceHairDomain;
    } = matches[0];
    const length: number = profile.lengthMm * 0.001;
    const step: number = profile.samplingStepMm * 0.001;
    const diameter: number = profile.diameterMicrometres * 0.000001;
    const angle: number = (profile.flowAngleDegrees * Math.PI) / 180;
    layers.push({
      id: "facial-hair:" + site,
      surface: surface.id,
      domain: domain.id,
      count: profile.count,
      seed: profile.seed,
      hairline: {
        front: Math.PI,
        back: Math.PI,
        left: Math.PI,
        right: Math.PI,
      },
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
        fibres: 1,
        coverage: 1,
        normal: 0,
        shade: 0,
      },
    });
  }
  const result: { layers: ImportedLayer[] } = { layers };
  assertHumanFaceHair(result);
  return result;
}

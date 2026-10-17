import type { V3 } from "../geometry/V3.ts";
import type { FeatureLoop } from "../schema/FeatureLoop.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { EyeAnnulus } from "./EyeAnnulus.ts";
import type { EyeRadial } from "./EyeRadial.ts";
import { eyeSectionAngle } from "./eyeSectionAngle.ts";
import { sampleEyeArc } from "./sampleEyeArc.ts";

/**
 * Builds one eye's annular observations from saved radial skin-plane cuts.
 * The caller supplies physical row and probe stations and a shared exterior collar.
 * Probe rows derive from the same paths and carry no independent validation claim.
 *
 * @evidence contracts/common.md#principled-implementation Removes exact consecutive coincident samples without changing the polyline locus, then integrates Euclidean section arclength and evaluates each requested row on that path; eyeSectionAngle admits explicit angle units, including the declared legacy format.
 * @evidence contracts/common.md#clear-and-simple-design One eye owns one aperture and radial family; one collar value controls its consumer boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not import source triangles, infer clinical canthi or close missing angular observations.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes physical section distance, conventional collar layout, derived probes and analytic seam responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Sorting k sections costs O(k log k); scanning n path points and sampling r rows costs O(n r) with the current validating sampler. Output storage follows the input paths plus k r observed intersections.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes each radial cumulative arclength once and reuses it across requested rows and probes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns arrays owned by the caller without caching inputs or acquiring external handles.
 */
export function buildEyeAnnulus(
  source: RegionFile,
  side: "l" | "r",
  rowsMm: number[],
  probeRowsMm: number[],
  outerCollarArcMm: number,
): EyeAnnulus {
  const aperture: FeatureLoop | undefined = source.loops.find(
    (loop: FeatureLoop): boolean => loop.id === `face-eyes.${side}.aperture`,
  );
  if (
    !aperture ||
    !aperture.closed ||
    aperture.pose !== "native-A" ||
    source.units !== "mm"
  )
    throw new Error("Native millimetre aperture observation is required");
  if (
    !(outerCollarArcMm > 0) ||
    !Number.isFinite(outerCollarArcMm) ||
    !rowsMm.includes(0) ||
    !rowsMm.includes(outerCollarArcMm)
  )
    throw new Error("Physical rows must include aperture and outer collar");
  if (
    [...rowsMm, ...probeRowsMm].some(
      (value: number): boolean => value < 0 || !Number.isFinite(value),
    )
  )
    throw new Error("Physical eye rows must be finite and nonnegative");
  const sections: Section[] = source.sections.filter(
    (section: Section): boolean =>
      section.family === `face-eyes.${side}.radial`,
  );
  sections.sort(
    (a: Section, b: Section): number => eyeSectionAngle(a) - eyeSectionAngle(b),
  );
  const radials: EyeRadial[] = sections.map((section: Section): EyeRadial => {
    if (
      section.pose !== "native-A" ||
      !Number.isFinite(section.station.fraction) ||
      section.station.fraction < 0 ||
      section.station.fraction >= 1 ||
      section.loops.length !== 1 ||
      section.loops[0].closed
    )
      throw new Error("One outward native radial skin arc is required");
    const points: V3[] = [];
    for (const point of section.loops[0].points) {
      const previous: V3 | undefined = points[points.length - 1];
      if (
        !previous ||
        point.some(
          (coordinate: number, index: number): boolean =>
            coordinate !== previous[index],
        )
      )
        points.push(point);
    }
    const arcMm: number[] = [0];
    for (let index: number = 1; index < points.length; index++)
      arcMm.push(
        arcMm[arcMm.length - 1] +
          Math.hypot(
            ...points[index].map(
              (value: number, coordinate: number): number =>
                value - points[index - 1][coordinate],
            ),
          ),
      );
    return {
      sourceSection: section.id,
      phaseDeg: eyeSectionAngle(section),
      points,
      arcMm,
      removedCoincidentSamples: section.loops[0].points.length - points.length,
    };
  });
  const rings: EyeAnnulus["rings"] = [...rowsMm, ...probeRowsMm].map(
    (arcMm: number): EyeAnnulus["rings"][number] => {
      const missingPhases: number[] = [];
      const observations: EyeAnnulus["rings"][number]["observations"] =
        radials.map(
          (
            radial: EyeRadial,
          ): EyeAnnulus["rings"][number]["observations"][number] => {
            const sample: ReturnType<typeof sampleEyeArc> = sampleEyeArc(
              radial,
              arcMm,
            );
            if (!sample) missingPhases.push(radial.phaseDeg);
            return {
              phaseDeg: radial.phaseDeg,
              sourceSection: radial.sourceSection,
              ...(sample ?? {}),
            };
          },
        );
      return { arcMm, observations, missingPhases };
    },
  );
  return {
    side,
    frame: aperture.frame,
    phase:
      "0 inferior (-v), 90 +u, 180 superior (+v), 270 -u; increasing phase is CCW in (u,v)",
    radialCoordinate:
      "Cumulative 3D arclength along the outward skin-plane section from the auxiliary-globe aperture crossing, mm; not shortest-path geodesic distance",
    aperture: {
      protocol:
        "Saved linear-distance-field skin/auxiliary-globe contour; clinical fissure correspondence unresolved",
      points: aperture.points,
    },
    radials,
    rings: rings.slice(0, rowsMm.length),
    interpolatedProbeRings: rings.slice(rowsMm.length),
    outerCollarArcMm,
    derivativePolicy:
      "Incoming/outgoing are reference PL dP/d(arcMm). Neighboring patches consume one exact fitted boundary and its analytic transverse derivative. Source tangents do not certify C1 continuity.",
    missingPhaseDeg: Array.from(
      { length: 48 },
      (_value: unknown, index: number): number => index * 7.5,
    ).filter(
      (phase: number): boolean =>
        !radials.some(
          (radial: EyeRadial): boolean =>
            Math.abs(radial.phaseDeg - phase) < 1e-6,
        ),
    ),
  };
}

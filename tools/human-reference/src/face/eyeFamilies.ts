import { faceTypes } from "./faceTypes.ts";

type Point = faceTypes.Point;
interface Radial {
  sourceSection: string;
  phaseDeg: number;
  points: Point[];
  arcMm: number[];
}
interface Eye {
  side: string;
  radials: Radial[];
  outerCollarArcMm: number;
  missingPhaseDeg: number[];
  rings: { arcMm: number; missingPhases: number[] }[];
}
interface Input {
  schema: string;
  rowsMm: number[];
  eyes: Eye[];
  limits: string[];
}

/**
 * Truncates each measured radial skin path at its owner's physical collar and preserves increasing phase.
 * Interpolating the containing source segment retains the polyline locus; missing phases or insufficient
 * collar coverage throw. Intermediate probes on these fitted paths are explicitly correlated evidence.
 *
 * @evidence contracts/common.md#principled-implementation Physical polyline arclength supplies a common radial coordinate and exact collar endpoints; phase ordering remains the producer's observation.
 * @evidence contracts/common.md#clear-and-simple-design One adapter owns the annular input schema and emits the generic section-family contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same physical truncation applies to both eyes and every body; no reference mesh topology is consumed.
 * @evidence contracts/common.md#meaningful-documentation States collar interpolation, missing-data failure and the lack of independent validation from resampled probes.
 * @evidence contracts/performance.md#efficient-algorithms Each radial point is visited at most once until the collar, taking linear time and retained point storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied cumulative arclength is reused rather than recomputed, and calls share no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned section arrays retain only truncated observations and shared immutable limits; no handles or cross-call state exist.
 */
export function eyeFamilies(
  input: Input,
  phaseStride: number = 1,
): faceTypes.Family[] {
  if (input.schema !== "reference-eye-annular-v1")
    throw new Error("Unsupported annular eye observations");
  if (![1, 2].includes(phaseStride))
    throw new Error(
      "Declared all-phase or alternating-phase experiment required",
    );
  return input.eyes.map((eye: Eye): faceTypes.Family => {
    if (
      eye.missingPhaseDeg.length ||
      eye.rings.some(
        (ring: Eye["rings"][number]): boolean => ring.missingPhases.length > 0,
      )
    )
      throw new Error(`Incomplete annular eye family: ${eye.side}`);
    const collar: number = eye.outerCollarArcMm;
    if (!(collar > 0)) throw new Error("Positive physical eye collar required");
    const sections: faceTypes.Section[] = eye.radials.map(
      (radial: Radial): faceTypes.Section => {
        if (
          radial.points.length !== radial.arcMm.length ||
          radial.arcMm[0] !== 0 ||
          radial.arcMm.at(-1)! < collar
        )
          throw new Error("Eye radial arclength coverage missing");
        const points: Point[] = [];
        for (let i: number = 0; i < radial.points.length; i++) {
          if (radial.arcMm[i] < collar - 1e-10) {
            points.push(radial.points[i]);
            continue;
          }
          const previous: number = Math.max(0, i - 1),
            width: number = radial.arcMm[i] - radial.arcMm[previous];
          const fraction: number =
            width > 0 ? (collar - radial.arcMm[previous]) / width : 0;
          points.push(
            radial.points[previous].map(
              (v: number, d: number): number =>
                v + (radial.points[i][d] - v) * fraction,
            ) as Point,
          );
          break;
        }
        return { id: radial.sourceSection, station: radial.phaseDeg, points };
      },
    );
    return {
      id: `face.eye.${eye.side}`,
      owner: "eyes",
      periodic: true,
      period: 360,
      sections: sections.filter(
        (_: faceTypes.Section, i: number): boolean => i % phaseStride === 0,
      ),
      ...(phaseStride === 2
        ? {
            heldOutSections: sections.filter(
              (_: faceTypes.Section, i: number): boolean =>
                i % phaseStride !== 0,
            ),
          }
        : {}),
      knots: input.rowsMm
        .filter((arc: number): boolean => arc <= collar)
        .map((arc: number): number => arc / collar),
      knotLabels: input.rowsMm
        .filter((arc: number): boolean => arc <= collar)
        .map((arc: number): string => `skin-arc-${arc}mm`),
      boundaryMeaning: `The aperture is the declared source distance-field observation; the ${collar} mm exterior collar is a shared patch layout convention measured along each radial skin section.`,
      limits: [
        ...input.limits.filter(
          (limit: string): boolean =>
            !limit.startsWith("Held-out radial stations are not fit inputs"),
        ),
        "Intermediate ring observations on fitted radial paths are correlated resampling, not independent held-out validation. Independent angular sections or oblique source cuts remain required.",
      ],
    };
  });
}

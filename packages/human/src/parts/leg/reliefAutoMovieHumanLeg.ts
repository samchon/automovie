import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanLimbPlan } from "../IAutoMovieHumanLimbPlan";
import { traceAutoMovieHumanLimbRelief } from "../traceAutoMovieHumanLimbRelief";
import { AUTOMOVIE_HUMAN_LEG_RELIEF } from "./AUTOMOVIE_HUMAN_LEG_RELIEF";
import { IAutoMovieHumanLegRelief } from "./IAutoMovieHumanLegRelief";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";

/**
 * Fat thickness, millimetres, over which a muscle or bone's relief halves: subcutaneous fat fills the hollows between bellies, so the same muscle reads sharply under a thin layer and is a smooth swell under a thick one. Grade: conventional.
 */
const RELIEF_FAT_HALF: number = 20;

/**
 * Gain of a fat pad on the square of the fat thickness over the mean radius. Fat pads grow faster than the layer under them: a thin layer lies evenly, while a thick one gathers where the fascia lets it, over the medial knee and the inner and outer thigh. The square sets the sex difference the reference legs show, soft padded knees in women and almost none in lean men, from the fat thickness alone. Grade: conventional, set on renders against the reference boards.
 */
const FAT_PAD_GAIN: number = 4;

/**
 * Appendicular lean mass index, kilograms per square metre, at which muscle relief takes its tabulated height: the midpoint of the NHANES medians at 20 years, 6.81 for women and 8.87 for men (Kelly et al. 2009, PLoS ONE 4(9):e7038). Relief grows with the index to the power 1.5, so lean mass shows as definition more than as bulk, which the girths already carry. Grade: derived.
 */
const LEAN_REFERENCE: number = 7.84;

/**
 * Trace the leg's superficial forms, `AUTOMOVIE_HUMAN_LEG_RELIEF`, over its stations as the relief of its loft.
 *
 * Each form runs along its segment from `bottom` to `top`, rising to its fullest at `peak` by a smoothstep on each side, its crest turning linearly from `angleBottom` to `angleTop` and its profile across the limb a Gaussian of `width` degrees at the local mean radius. Its height is its amplitude times the local mean radius, the station girth over 2π interpolated along the segment, after its tissue scaling: muscle relief grows with the appendicular lean mass index to the power 1.5; muscle and bone relief both soften under fat, halving at 20 mm; fat pads grow with the square of the fat thickness over the mean radius. The angle runs from anterior toward the medial side, counterclockwise about the distal axis on the left leg and clockwise on the right.
 *
 * @param props.stations The leg's stations, from the mid thigh ring to the ankle ring
 * @param props.leanIndex The person's appendicular lean mass index, kilograms per square metre
 * @param props.side Which leg
 * @returns The relief of every form that reaches the leg
 */
export function reliefAutoMovieHumanLeg(props: {
  stations: IAutoMovieHumanLegStation[];
  leanIndex: number;
  side: AutoMovieHumanSide;
}): IAutoMovieHumanLimbPlan.IRelief[] {
  const { stations } = props;
  const mirror: number = props.side === "left" ? 1 : -1;
  const muscle: number = Math.pow(props.leanIndex / LEAN_REFERENCE, 1.5);
  return AUTOMOVIE_HUMAN_LEG_RELIEF.map(
    (r: IAutoMovieHumanLegRelief): IAutoMovieHumanLimbPlan.IRelief | null => {
      const levels: number[] = stations.map(
        (s: IAutoMovieHumanLegStation): number =>
          r.segment === "thigh" ? s.thigh : s.shank,
      );
      const along =
        (read: (s: IAutoMovieHumanLegStation) => number) =>
        (level: number): number =>
          interpolate(
            levels.map((l: number, i: number): [number, number] => [
              l,
              read(stations[i]!),
            ]),
            level,
          );
      const mean = along(
        (s: IAutoMovieHumanLegStation): number => s.girth / (2 * Math.PI),
      );
      const fat = along((s: IAutoMovieHumanLegStation): number => s.fat);
      const crest = (level: number): number =>
        r.angleBottom +
        ((r.angleTop - r.angleBottom) * (level - r.bottom)) /
          (r.top - r.bottom);
      return traceAutoMovieHumanLimbRelief({
        name: r.name,
        levels,
        from: r.bottom,
        peak: r.peak,
        to: r.top,
        angle: (level: number): number =>
          (mirror * crest(level) * Math.PI) / 180,
        height: (level: number): number => {
          const rise: number =
            level <= r.bottom || level >= r.top
              ? 0
              : level < r.peak
                ? (level - r.bottom) / (r.peak - r.bottom)
                : (r.top - level) / (r.top - r.peak);
          const radius: number = mean(level);
          const thickness: number = fat(level);
          const scale: number =
            r.tissue === "muscle"
              ? (muscle * RELIEF_FAT_HALF) / (RELIEF_FAT_HALF + thickness)
              : r.tissue === "bone"
                ? RELIEF_FAT_HALF / (RELIEF_FAT_HALF + thickness)
                : FAT_PAD_GAIN * (thickness / radius) ** 2;
          return r.amplitude * scale * rise * rise * (3 - 2 * rise) * radius;
        },
        spread:
          ((r.width * Math.PI) / 180) *
          mean(
            Math.min(Math.max(...levels), Math.max(Math.min(...levels), r.peak)),
          ),
      });
    },
  ).filter(
    (
      r: IAutoMovieHumanLimbPlan.IRelief | null,
    ): r is IAutoMovieHumanLimbPlan.IRelief => r !== null,
  );
}

/** Piecewise linear interpolation over knots in either order, held beyond the ends. */
const interpolate = (knots: Array<[number, number]>, x: number): number => {
  const sorted: Array<[number, number]> = [...knots].sort(
    (a: [number, number], b: [number, number]): number => a[0] - b[0],
  );
  if (x <= sorted[0]![0]) return sorted[0]![1];
  for (let i: number = 1; i < sorted.length; ++i) {
    const [x1, y1]: [number, number] = sorted[i]!;
    if (x <= x1) {
      const [x0, y0]: [number, number] = sorted[i - 1]!;
      return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return sorted[sorted.length - 1]![1];
};

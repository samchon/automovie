import { AUTOMOVIE_HUMAN_LEG_RELIEF } from "./AUTOMOVIE_HUMAN_LEG_RELIEF";
import { IAutoMovieHumanLegRelief } from "./IAutoMovieHumanLegRelief";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";

/**
 * Fat thickness, millimetres, over which a muscle or bone's relief halves: subcutaneous fat fills the hollows between bellies, so the same muscle reads sharply under a thin layer and is a smooth swell under a thick one. Grade: conventional.
 */
const RELIEF_FAT_HALF: number = 10;

/**
 * Appendicular lean mass index, kilograms per square metre, at which muscle relief takes its tabulated height: the midpoint of the NHANES medians at 20 years, 6.81 for women and 8.87 for men (Kelly et al. 2009, PLoS ONE 4(9):e7038). Relief grows in proportion to the index above and below it. Grade: derived.
 */
const LEAN_REFERENCE: number = 7.84;

/**
 * Radial distance of the skin from the bone axis at one station and one angle, before the station's girth is fitted.
 *
 * The base is an ellipse of the station's aspect whose four half axes differ, so its centre sits behind and lateral to the bone axis by the station's offsets. The relief of every superficial form then adds its height, a Gaussian around the limb times a smooth rise and fall along it, as a fraction of the station's mean radius. Muscle relief grows with the appendicular lean mass index; muscle and bone relief both soften under fat, halving at {@link RELIEF_FAT_HALF} millimetres; fat pads grow with the fat thickness at the station.
 *
 * @param station The station, with its girth, base shape and fat
 * @param angle Angle around the limb from the anterior direction toward the medial one, radians
 * @param leanIndex The person's appendicular lean mass index, kilograms per square metre
 * @returns Distance from the station's origin, millimetres, at the girth the base alone would have
 */
export function shapeAutoMovieHumanLegSection(
  station: IAutoMovieHumanLegStation,
  angle: number,
  leanIndex: number,
): number {
  const mean: number = station.girth / (2 * Math.PI);
  const depth: number = mean / Math.sqrt(station.aspect);
  const breadth: number = mean * Math.sqrt(station.aspect);
  const forward: number = Math.cos(angle);
  const inward: number = Math.sin(angle);
  const radial: number =
    forward >= 0
      ? depth * (1 - station.posterior)
      : depth * (1 + station.posterior);
  const transverse: number =
    inward >= 0 ? breadth - station.lateral : breadth + station.lateral;
  const base: number =
    1 /
    Math.sqrt(
      (forward / radial) * (forward / radial) +
        (inward / transverse) * (inward / transverse),
    );

  const softening: number = RELIEF_FAT_HALF / (RELIEF_FAT_HALF + station.fat);
  const muscle: number = leanIndex / LEAN_REFERENCE;
  let relief: number = 0;
  for (const r of AUTOMOVIE_HUMAN_LEG_RELIEF) {
    const level: number = r.segment === "thigh" ? station.thigh : station.shank;
    if (level <= r.bottom || level >= r.top) continue;
    const rise: number =
      level < r.peak
        ? (level - r.bottom) / (r.peak - r.bottom)
        : (r.top - level) / (r.top - r.peak);
    const along: number = rise * rise * (3 - 2 * rise);
    const crest: number =
      ((r.angleBottom +
        ((r.angleTop - r.angleBottom) * (level - r.bottom)) /
          (r.top - r.bottom)) *
        Math.PI) /
      180;
    const apart: number = wrap(angle - crest) / ((r.width * Math.PI) / 180);
    const around: number = Math.exp(-0.5 * apart * apart);
    relief += height(r, softening, muscle, station.fat / mean) * along * around;
  }
  return base + relief * mean;
}

/** Height of one relief as a fraction of the mean radius, after its tissue scaling. */
const height = (
  relief: IAutoMovieHumanLegRelief,
  softening: number,
  muscle: number,
  fat: number,
): number =>
  relief.tissue === "muscle"
    ? relief.amplitude * muscle * softening
    : relief.tissue === "bone"
      ? relief.amplitude * softening
      : relief.amplitude * fat;

/** An angle wrapped into -π to π. */
const wrap = (radians: number): number =>
  Math.atan2(Math.sin(radians), Math.cos(radians));

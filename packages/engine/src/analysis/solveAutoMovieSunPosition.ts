import type {
  IAutoMovieSolveSunPosition,
  IAutoMovieSunPosition,
} from "@automovie/interface";

/** Degrees to radians. */
const RADIAN: number = Math.PI / 180;

/**
 * Unrefracted elevation in degrees below which refraction is not applied: the
 * sun's apparent radius, 0.26667 degrees, plus the 0.5667-degree refraction at
 * the horizon (Reda and Andreas 2004, NREL/TP-560-34302, section 3.14).
 */
const REFRACTION_FLOOR: number = -(0.26667 + 0.5667);

/** Equatorial radius of the Earth in metres (Reda and Andreas 2004, eq. 28). */
const EARTH_RADIUS: number = 6378140;

/** One minus the Earth's flattening, `b / a` (Reda and Andreas 2004, eq. 27). */
const POLAR_RATIO: number = 0.99664719;

/**
 * Solve the topocentric position of the sun for a site and a UTC instant.
 *
 * Solar coordinates follow the low-accuracy method of Meeus, "Astronomical
 * Algorithms" (2nd ed., 1998), chapter 25: geometric mean longitude, mean
 * anomaly and equation of centre, corrected for aberration and for the
 * principal nutation term in `Ω`, with the obliquity of equation 22.2 corrected
 * by the same term. Greenwich apparent sidereal time is chapter 12's mean
 * sidereal time (equation 12.4) plus the equation of the equinoxes from that
 * nutation term. The Julian Day is chapter 7's, for the proleptic Gregorian
 * calendar.
 *
 * Both the sidereal time and the solar longitude read UTC. Sidereal time is
 * defined on universal time, and leaving the solar longitude on UTC rather than
 * terrestrial time moves the sun by less than 0.001 degrees.
 *
 * The parallax of the sun at the observer's height (Reda and Andreas 2004,
 * "Solar position algorithm for solar radiation applications",
 * NREL/TP-560-34302, equations 26 to 37) makes the position topocentric; it
 * shifts the sun by at most 0.0025 degrees. Refraction follows the same
 * report's equation 42 and is applied only when the unrefracted elevation is at
 * or above -0.8333 degrees.
 *
 * Meeus states the low-accuracy coordinates to 0.01 degrees within a few
 * centuries of 2000; the Reda and Andreas example site is reproduced within
 * 0.01 degrees. The calendar must lie at or after -4712, where the Julian Day
 * formula holds.
 *
 * @param props Site, instant and atmosphere.
 * @returns Zenith, azimuth eastward from north, and refracted elevation, in
 *   degrees.
 * @throws Error naming the field when an input is out of its domain.
 */
export const solveAutoMovieSunPosition: (
  props: IAutoMovieSolveSunPosition.IProps,
) => IAutoMovieSunPosition = (
  props: IAutoMovieSolveSunPosition.IProps,
): IAutoMovieSunPosition => {
  const height: number = props.elevation ?? 0;
  const pressure: number = props.pressure ?? 1013.25;
  const temperature: number = props.temperature ?? 10;
  assertSite(props, height, pressure, temperature);

  const jd: number = julianDay(props.utc);
  const t: number = (jd - 2451545) / 36525;

  // Meeus chapter 25: the sun's geometric longitude and distance.
  const meanLongitude: number = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const meanAnomaly: number = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const eccentricity: number =
    0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;
  const centre: number =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) *
      Math.sin(meanAnomaly * RADIAN) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * meanAnomaly * RADIAN) +
    0.000289 * Math.sin(3 * meanAnomaly * RADIAN);
  const trueAnomaly: number = meanAnomaly + centre;
  const radius: number =
    (1.000001018 * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly * RADIAN));

  // The principal nutation term, 17.20 arcseconds in sin Ω, corrects both the
  // apparent longitude and the sidereal time; 0.00569 degrees is aberration.
  const node: number = 125.04 - 1934.136 * t;
  const nutation: number = -0.00478 * Math.sin(node * RADIAN);
  const longitude: number = meanLongitude + centre - 0.00569 + nutation;
  const obliquity: number =
    23 +
    26 / 60 +
    (21.448 - 46.815 * t - 0.00059 * t * t + 0.001813 * t * t * t) / 3600 +
    0.00256 * Math.cos(node * RADIAN);
  const rightAscension: number = Math.atan2(
    Math.cos(obliquity * RADIAN) * Math.sin(longitude * RADIAN),
    Math.cos(longitude * RADIAN),
  );
  const declination: number = Math.asin(
    Math.sin(obliquity * RADIAN) * Math.sin(longitude * RADIAN),
  );

  // Meeus equation 12.4 plus the equation of the equinoxes.
  const sidereal: number =
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * t * t -
    (t * t * t) / 38710000 +
    nutation * Math.cos(obliquity * RADIAN);
  const hourAngle: number =
    (sidereal + props.longitude) * RADIAN - rightAscension;

  // Reda and Andreas equations 26 to 37: parallax at the observer.
  const latitude: number = props.latitude * RADIAN;
  const parallax: number = (8.794 / (3600 * radius)) * RADIAN;
  const reduced: number = Math.atan(POLAR_RATIO * Math.tan(latitude));
  const x: number =
    Math.cos(reduced) + (height / EARTH_RADIUS) * Math.cos(latitude);
  const y: number =
    POLAR_RATIO * Math.sin(reduced) +
    (height / EARTH_RADIUS) * Math.sin(latitude);
  const denominator: number =
    Math.cos(declination) - x * Math.sin(parallax) * Math.cos(hourAngle);
  const shift: number = Math.atan2(
    -x * Math.sin(parallax) * Math.sin(hourAngle),
    denominator,
  );
  const topocentricDeclination: number = Math.atan2(
    (Math.sin(declination) - y * Math.sin(parallax)) * Math.cos(shift),
    denominator,
  );
  const topocentricHour: number = hourAngle - shift;

  const geometric: number =
    Math.asin(
      Math.sin(latitude) * Math.sin(topocentricDeclination) +
        Math.cos(latitude) *
          Math.cos(topocentricDeclination) *
          Math.cos(topocentricHour),
    ) / RADIAN;
  const refraction: number =
    geometric >= REFRACTION_FLOOR
      ? ((pressure / 1010) * (283 / (273 + temperature)) * 1.02) /
        (60 * Math.tan((geometric + 10.3 / (geometric + 5.11)) * RADIAN))
      : 0;
  const elevation: number = geometric + refraction;

  // Reda and Andreas equations 44 to 46: the astronomers' azimuth, measured
  // westward from south, turned to the navigators' bearing from north.
  const astronomers: number =
    Math.atan2(
      Math.sin(topocentricHour),
      Math.cos(topocentricHour) * Math.sin(latitude) -
        Math.tan(topocentricDeclination) * Math.cos(latitude),
    ) / RADIAN;
  const azimuth: number = (((astronomers + 180) % 360) + 360) % 360;
  return { zenith: 90 - elevation, azimuth, elevation };
};

/**
 * Julian Day of a proleptic Gregorian UTC instant (Meeus 1998, equation 7.1),
 * including the fraction of the day.
 */
const julianDay: (utc: IAutoMovieSolveSunPosition.IUtc) => number = (
  utc: IAutoMovieSolveSunPosition.IUtc,
): number => {
  const late: boolean = utc.month > 2;
  const year: number = late ? utc.year : utc.year - 1;
  const month: number = late ? utc.month : utc.month + 12;
  const century: number = Math.floor(year / 100);
  const gregorian: number = 2 - century + Math.floor(century / 4);
  const day: number =
    utc.day + (utc.hour + (utc.minute + utc.second / 60) / 60) / 24;
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    gregorian -
    1524.5
  );
};

/**
 * Refuse a site, instant or atmosphere outside the solver's domain, naming the
 * field.
 */
const assertSite: (
  props: IAutoMovieSolveSunPosition.IProps,
  height: number,
  pressure: number,
  temperature: number,
) => void = (
  props: IAutoMovieSolveSunPosition.IProps,
  height: number,
  pressure: number,
  temperature: number,
): void => {
  const utc: IAutoMovieSolveSunPosition.IUtc = props.utc;
  const leap: boolean =
    (utc.year % 4 === 0 && utc.year % 100 !== 0) || utc.year % 400 === 0;
  const length: number =
    utc.month === 2
      ? leap
        ? 29
        : 28
      : [4, 6, 9, 11].includes(utc.month)
        ? 30
        : 31;
  const checks: [boolean, string][] = [
    [
      Number.isFinite(props.latitude) && Math.abs(props.latitude) <= 90,
      "latitude must be finite within [-90, 90] degrees",
    ],
    [Number.isFinite(props.longitude), "longitude must be finite"],
    [Number.isFinite(height), "elevation must be finite"],
    [
      Number.isFinite(pressure) && pressure > 0,
      "pressure must be finite and above zero",
    ],
    [
      Number.isFinite(temperature) && temperature > -273.15,
      "temperature must be finite and above -273.15",
    ],
    [
      Number.isSafeInteger(utc.year) && utc.year >= -4712,
      "utc.year must be an integer at or above -4712",
    ],
    [integerWithin(utc.month, 1, 12), "utc.month must be an integer 1 to 12"],
    [
      integerWithin(utc.month, 1, 12) && integerWithin(utc.day, 1, length),
      "utc.day must be an integer within the month",
    ],
    [integerWithin(utc.hour, 0, 23), "utc.hour must be an integer 0 to 23"],
    [integerWithin(utc.minute, 0, 59), "utc.minute must be an integer 0 to 59"],
    [
      Number.isFinite(utc.second) && utc.second >= 0 && utc.second <= 60,
      "utc.second must be finite within [0, 60]",
    ],
  ];
  for (const [valid, message] of checks)
    if (!valid) throw new Error(`solveAutoMovieSunPosition: ${message}.`);
};

/** Whether a value is an integer within `[low, high]`. */
const integerWithin: (value: number, low: number, high: number) => boolean = (
  value: number,
  low: number,
  high: number,
): boolean => Number.isInteger(value) && value >= low && value <= high;

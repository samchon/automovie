import {
  type IFaceSkinColorimetry,
  faceSkinSpectrumRgb,
} from "./faceSkinSpectrumRgb";
import type { XlsxCell } from "./readXlsxSheet";

/** One integrated reading of one body site of one subject. */
export interface IFaceSkinReading {
  ethnicity: string;
  sex: string | null;
  /** Identifies the subject: the archive's origin and subject columns. */
  subject: string;
  /** The archive's body location code (2 cheek, 3 cheek bone, 4 chin, 5 ear lobe, 6 forehead, 8 neck, 9 nose tip). */
  site: number;
  rgb: [number, number, number];
}

/** Number of wavelength columns the archive lays out, from column N. */
const BANDS = 39;
const FIRST_BAND = 13;

/**
 * Integrate every reading of the wanted body sites in the International Skin
 * Spectra Archive sheet (Lu et al., Sci Data 2025;12:487) into linear sRGB.
 *
 * The sheet's row 2 holds the wavelengths and rows 3 to 6 the CIE 1931 2
 * degree colour matching functions and the D65 illuminant, each in the
 * wavelength's own column; readings start at row 13, one per row, as percent
 * reflectance in the wavelength's own column whatever range the instrument
 * covered. Columns: 1 origin, 2 subject, 4 ethnic group, 5 sex, 7 body
 * location. A row without a first cell, a site not asked for, or a reading
 * too short to weigh is skipped. The sheet is the caller's to fetch (CC BY
 * 4.0 figshare `doi:10.6084/m9.figshare.28228571.v4`) and is refused if its
 * tables are not numeric. Pure.
 */
export function readFaceSkinReadings(
  rows: readonly (readonly XlsxCell[])[],
  sites: ReadonlySet<number>,
): IFaceSkinReading[] {
  const table = (index: number): number[] => {
    const values = (rows[index] ?? []).slice(FIRST_BAND, FIRST_BAND + BANDS);
    if (
      values.length !== BANDS ||
      values.some((value) => typeof value !== "number")
    )
      throw new Error(`Sheet row ${index + 1} is not a numeric band table.`);
    return values as number[];
  };
  const colorimetry: IFaceSkinColorimetry = {
    x: table(2),
    y: table(3),
    z: table(4),
    illuminant: table(5),
  };
  const readings: IFaceSkinReading[] = [];
  for (const row of rows.slice(12)) {
    if (row[0] === undefined || row[0] === null || !sites.has(row[6] as number))
      continue;
    const reflectance = Array.from({ length: BANDS }, (_, band) => {
      const value = row[FIRST_BAND + band];
      return typeof value === "number" ? value / 100 : null;
    });
    const rgb = faceSkinSpectrumRgb(colorimetry, reflectance);
    if (rgb === null) continue;
    readings.push({
      ethnicity: String(row[3]),
      sex: row[4] === null || row[4] === undefined ? null : String(row[4]),
      subject: JSON.stringify([row[1], row[2]]),
      site: row[6] as number,
      rgb,
    });
  }
  return readings;
}

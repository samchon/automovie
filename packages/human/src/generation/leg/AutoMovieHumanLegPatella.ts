import type { IAutoMovieLoftRelief } from "@automovie/engine";

/**
 * The patella's skin relief on the leg's lofted surface: an engine relief
 * (`IAutoMovieLoftRelief`, a cubic B-spline height field that vanishes with
 * its slope and curvature at the window's edge) over the knee's front,
 * centred at mid-patella on the anterior guide, raising the skin along the
 * femur's anterior axis.
 *
 * Footprint: the patella's bony height and width in a measured female and
 * male sample (Bangladeshi adults' dry patellae: women 36.16 x 36.94 mm, men
 * 42.10 x 42.87 mm, maximum height and width; banglajol.info, read at
 * abstract level; a population different from f1's, recorded). The relief
 * relief is a soft dome, not a disc: 13 x 13 controls whose 7 x 7 inner
 * ones follow the bell {@link BELL} in each direction (a cubic B-spline over
 * a smooth control bell keeps the height's slope and curvature small at the
 * foot, so the knee's own curvature carries through), over a window 2.5
 * times the bone's extent each way, so the dome's crest covers the bone and
 * its foot fades over the skin around it.
 *
 * Height: the skin's protrusion over the knee's conic envelope is not the
 * bone's 18.7 mm thickness (the patella sits in the trochlear groove under
 * prepatellar tissue). No published prepatellar protrusion or soft-tissue
 * thickness in millimetres was found (searched: prepatellar subcutaneous fat
 * thickness MRI, patellar morphometry, anterior knee ultrasound), so the
 * height is debt: {@link HEIGHT}.
 */
export namespace AutoMovieHumanLegPatella {
  /** Patellar maximum height and width, mm, women and men (dry bone). */
  export const BONE: { female: [number, number]; male: [number, number] } = { female: [36.16, 36.94], male: [42.1, 42.87] };

  /** Debt: the skin bump's height over the conic envelope, mm (unsourced). */
  export const HEIGHT: number = 5;

  /** Window over the bone's extent. */
  export const WINDOW: number = 2.5;

  /** The dome's control bell across the 7 inner controls of each direction, peak 1 (declared smooth profile). */
  export const BELL: readonly number[] = [0.15, 0.45, 0.85, 1, 0.85, 0.45, 0.15];

  /** The relief. */
  export function relief(input: {
    /** Course station of mid-patella, mm. */
    station: number;
    /** Chain phase of the anterior guide, radians. */
    phase: number;
    /** The knee section's anterior radius there, mm (to read the width as phase). */
    radius: number;
    /** Unit world anterior direction of the femur. */
    axis: [number, number, number];
    /** Sex control; positive selects the women's row. */
    sex: number;
    /** Calibration mm per world mm. */
    scale: number;
  }): IAutoMovieLoftRelief {
    const [height, width]: [number, number] = input.sex > 0 ? BONE.female : BONE.male;
    const halfStations: number = (WINDOW * height * input.scale) / 2;
    const halfPhase: number = (WINDOW * width * input.scale) / 2 / input.radius;
    const rows: number = 13;
    const columns: number = 13;
    const heights: number[] = Array.from({ length: rows * columns }, (_: unknown, k: number): number => {
      const i: number = Math.floor(k / columns);
      const j: number = k % columns;
      return i >= 3 && i <= 9 && j >= 3 && j <= 9 ? HEIGHT * input.scale * BELL[i - 3]! * BELL[j - 3]! : 0;
    });
    return {
      name: "patella",
      stations: [input.station - halfStations, input.station + halfStations],
      phases: [input.phase - halfPhase, input.phase + halfPhase],
      axis: input.axis,
      rows,
      columns,
      heights,
    };
  }
}

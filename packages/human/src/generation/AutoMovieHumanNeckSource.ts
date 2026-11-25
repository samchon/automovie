import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadInputs,
  IAutoMovieHumanHeadNeck,
  IAutoMovieHumanNeckSource,
} from "@automovie/interface";

import { AutoMovieHumanHeadMassPart } from "./head/AutoMovieHumanHeadMassPart";

/**
 * The neck's registered coordinate frame and circular section study from the
 * person's own tapes and landmarks.
 */
export namespace AutoMovieHumanNeckSource {
  /**
   * Resolve one neck from the supplied circumference and ISO 8559-1:2017
   * §3.1.6–8 and §5.3.2–3 (https://www.iso.org/standard/61686.html). The normal
   * tape is circular by estimate because the inputs give circumference without
   * a cross-sectional depth or breadth. The tape's lowest point is halfway from
   * the front base to the lower of the other two base landmarks. Its highest
   * point is the higher landmark. This placement estimates an unavailable
   * infrathyroid height while the separate base owner measures its own course
   * through all three sites.
   *
   * @param inputs Neck and base girths and base landmarks in world mm.
   * @param scale Calibration mm per world mm.
   * @returns The common C7 datum, axis, sample rows and head-mass overlap.
   */
  export function of(
    inputs: Pick<IAutoMovieHumanHeadInputs, "neck" | "neckBase" | "sex">,
    scale: number,
  ): IAutoMovieHumanNeckSource.IOutput {
    const { neck, neckBase } = inputs;
    const cervicaleX: number = neckBase.cervicaleOrigin * scale;
    const cervicale: number = neckBase.cervicaleHeight * scale;
    const side: number = neckBase.sideNeckPointHeight * scale;
    const front: number = neckBase.suprasternaleHeight * scale;
    const radius: number = (neck * scale) / (2 * Math.PI);
    const baseRadius: number = (neckBase.girth * scale) / (2 * Math.PI);
    if (
      ![scale, cervicaleX, cervicale, side, front, radius, baseRadius].every(
        Number.isFinite,
      ) ||
      !(
        scale > 0 &&
        radius > 0 &&
        baseRadius > 0 &&
        front < Math.min(cervicale, side)
      )
    )
      throw new Error(
        "A neck source needs finite positive tapes and increasing front-to-back base heights",
      );

    // The angle of the normal section follows from the vertical half span
    // of a tilted circle. Its horizontal sections have depth radius r / cos.
    const lower: number = (front + Math.min(cervicale, side)) / 2;
    const upper: number = Math.max(cervicale, side);
    const level: number = (upper + lower) / 2;
    const sine: number = (upper - lower) / (2 * radius);
    if (!(sine < 1))
      throw new Error(
        "The neck tape cannot span its named base heights as a normal circle",
      );
    const cosine: number = Math.sqrt((1 - sine) * (1 + sine));
    const slope: number = sine / cosine;

    // Align the horizontal section's back wall at the adopted C7 point.
    const localCervicale: number =
      slope * (cervicale - level) - radius / cosine;
    const x: number = cervicaleX - localCervicale;
    const registration: NonNullable<IAutoMovieHumanHeadNeck["registration"]> = {
      priorCervicaleX: localCervicale,
      cervicaleX,
      mappedCervicaleX: localCervicale + x,
      translationX: x,
    };

    // Estimate the internal overlap using one base radius below the lowest landmark.
    // Keep the four descriptor stations while the actual mass reads its own
    // shared quintic scalar curves and closes its nonplanar base tape.
    const first: number = front - baseRadius;
    const rows: IAutoMovieHumanNeckSource.IRow[] = Array.from(
      { length: 4 },
      (_: unknown, k: number): IAutoMovieHumanNeckSource.IRow => {
        const t: number = k / 3;
        const station: number = first + (level - first) * t;
        const share: number = t ** 3 * (10 - 15 * t + 6 * t * t);
        const r: number = (1 - share) * baseRadius + share * radius;
        return {
          origin: [x + slope * (station - level), station, 0],
          width: r,
          depth: r * cosine,
          scale,
          ring: { x: [0, 1], y: [0, (-r * sine) / scale], z: [1] },
        };
      },
    );
    return {
      rows,
      scale,
      order: AutoMovieHumanHeadMassPart.ORDER,
      samples: AutoMovieHumanHeadMassPart.SAMPLES,
      bottom: [...rows[0]!.origin],
      registration,
      head: {
        level,
        x,
        radius,
        back: cervicaleX,
        backLevel: cervicale,
        backSlope: slope,
        normalBandUpper: upper,
        registration,
      },
    };
  }

  /**
   * Evaluate the declared section coordinates at a phase in radians, returning
   * calibration mm.
   */
  export function point(
    row: IAutoMovieHumanNeckSource.IRow,
    phase: number,
  ): AutoMovieVector3Tuple {
    const even = (series: readonly number[]): number =>
      series.reduce(
        (sum: number, x: number, k: number): number =>
          sum + x * Math.cos(k * phase),
        0,
      );
    const lateral: number = row.ring.z.reduce(
      (sum: number, z: number, k: number): number =>
        sum + z * Math.sin((k + 1) * phase),
      0,
    );
    return [
      row.origin[0] + row.depth * even(row.ring.x),
      row.origin[1] + row.scale * even(row.ring.y),
      row.origin[2] + row.width * lateral,
    ];
  }
}

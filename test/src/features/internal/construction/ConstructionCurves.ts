import type {
  IAutoMovieConstructionCurve,
  IAutoMovieSolidSurface,
} from "@automovie/engine";

/**
 * Readings and expectations of a construction curve sampling, and the stub
 * surface a sampling test evaluates.
 *
 * A sampling is compared as rows, one per curve, so a failure names the curve
 * whose identity, flag or size differs.
 */
export namespace ConstructionCurves {
  /** Identity and size of one curve: its id, kind, closure, flag and number of points. */
  export type Row = [
    string,
    IAutoMovieConstructionCurve.Kind,
    boolean,
    boolean,
    number,
  ];

  /** Layer ordinals of a nine-station part. */
  export const LAYERS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  /** The four guide quarters. */
  export const QUARTERS: number[] = [0, 1, 2, 3];

  /**
   * Identity and size of every curve, in the order returned.
   *
   * @param curves A sampling.
   * @returns One row per curve.
   */
  export function rows(curves: IAutoMovieConstructionCurve[]): Row[] {
    return curves.map(
      (curve: IAutoMovieConstructionCurve): Row => [
        curve.id,
        curve.kind,
        curve.closed,
        curve.flagged,
        curve.points.length / 3,
      ],
    );
  }

  /**
   * The rows documented for one part: its sections, then its guides, then its
   * axis.
   *
   * @param part The chain's name.
   * @param sections Per expected section, its layer ordinal, point count and
   *   flag.
   * @param guides Per expected guide, its quarter, point count and flag.
   * @param axis The axis's point count and flag, or null when no axis is
   *   expected.
   * @returns The expected rows in the documented order.
   */
  export function table(
    part: string,
    sections: [number, number, boolean][],
    guides: [number, number, boolean][],
    axis: [number, boolean] | null,
  ): Row[] {
    /** The axis row, when one is expected. */
    const last: Row[] =
      axis === null ? [] : [[`${part}/axis`, "axis", false, axis[1], axis[0]]];
    return [
      ...sections.map(
        ([ordinal, count, flagged]: [number, number, boolean]): Row => [
          `${part}/section/${ordinal}`,
          "section",
          true,
          flagged,
          count,
        ],
      ),
      ...guides.map(
        ([quarter, count, flagged]: [number, number, boolean]): Row => [
          `${part}/guide/${quarter}`,
          "guide",
          false,
          flagged,
          count,
        ],
      ),
      ...last,
    ];
  }

  /**
   * The rows of a nine-layer part whose every curve is present with one flag.
   *
   * @param part The chain's name.
   * @param flagged The flag every curve carries.
   * @param ring Points per section, 48 at the default phases.
   * @param rail Points per guide and axis, 65 at the default steps over eight
   *   intervals.
   * @returns The fourteen expected rows.
   */
  export function whole(
    part: string,
    flagged: boolean,
    ring: number = 48,
    rail: number = 65,
  ): Row[] {
    return table(
      part,
      LAYERS.map((ordinal: number): [number, number, boolean] => [
        ordinal,
        ring,
        flagged,
      ]),
      QUARTERS.map((quarter: number): [number, number, boolean] => [
        quarter,
        rail,
        flagged,
      ]),
      [rail, flagged],
    );
  }

  /**
   * A hand-written cylinder surface in kernel millimetres, `(radius cos v,
   * radius sin v, -u)`, the map a realized tube along -z has at its own
   * radius.
   *
   * Its jet reader throws, so a sampling that returns has read it through
   * `point` alone.
   *
   * @param name The surface's name.
   * @param radius Its radius, mm.
   * @param spoiled Chart points whose x component is returned as NaN.
   * @param domain Its owned station range, mm, or null for a surface that names
   *   none.
   * @param visited Receives the station of every evaluation.
   * @returns The surface.
   */
  export function cylinder(
    name: string,
    radius: number,
    spoiled: (u: number, v: number) => boolean,
    domain: [number, number] | null,
    visited: number[],
  ): IAutoMovieSolidSurface {
    return {
      name,
      orientation: 1,
      period: 2 * Math.PI,
      ...(domain === null ? {} : { domain }),
      point: (u: number, v: number): [number, number, number] => {
        visited.push(u);
        return [
          spoiled(u, v) ? Number.NaN : radius * Math.cos(v),
          radius * Math.sin(v),
          -u,
        ];
      },
      jet: (): IAutoMovieSolidSurface.IJet => {
        throw new Error(
          "a surface with a point reader was read through its jet",
        );
      },
    };
  }

  /**
   * Whether every point of a curve passes a check.
   *
   * @param curve The curve.
   * @param check Receives a point's components in metres and its ordinal in the
   *   curve.
   * @returns True when no point fails.
   */
  export function everyPoint(
    curve: IAutoMovieConstructionCurve,
    check: (x: number, y: number, z: number, at: number) => boolean,
  ): boolean {
    for (let at: number = 0; 3 * at < curve.points.length; ++at)
      if (
        !check(
          curve.points[3 * at]!,
          curve.points[3 * at + 1]!,
          curve.points[3 * at + 2]!,
          at,
        )
      )
        return false;
    return true;
  }

  /**
   * The curves of one kind, in the order returned.
   *
   * @param curves A sampling.
   * @param kind The kind to keep.
   * @returns Its curves of that kind.
   */
  export function ofKind(
    curves: IAutoMovieConstructionCurve[],
    kind: IAutoMovieConstructionCurve.Kind,
  ): IAutoMovieConstructionCurve[] {
    return curves.filter(
      (curve: IAutoMovieConstructionCurve): boolean => curve.kind === kind,
    );
  }
}

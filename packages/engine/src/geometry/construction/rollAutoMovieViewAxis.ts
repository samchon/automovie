import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewOutline,
} from "@automovie/interface";

import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Apply one explicitly requested C2 material rotation to an admitted base axis.
 *
 * Input stations are millimetres. At `to`, the target's normal-plane components
 * determine the shortest signed angle from base u towards v, with positive pi
 * for the exact half turn. The shared scalar source's two knots have zero
 * normalized first/second jets, giving the quintic 10t^3-15t^4+6t^5 without
 * another interpolator. Before from the base frame is returned unchanged; after
 * to its constant material rotation is transported by that same base axis.
 * Origin and normal plane are preserved throughout.
 *
 * Direction admission reuses the jointed initial-up policy: relative normal
 * projection must exceed 1e-9, limiting projection condition number to below
 * 1e9. This rejects some finite nonparallel directions. For endpoint components
 * (c,s), their first-order angle perturbation is bounded by
 * hypot(dc,ds)/hypot(c,s); a small projected norm amplifies input, frame and
 * dot-product error. This numerical conditioning policy is not an anatomical
 * tolerance, an exact-zero test or a universal absolute angle-accuracy
 * guarantee. The supplied base must already be an admitted orthonormal C2 axis.
 * Its analytic-jet support, when present, is carried through the same rotation
 * in station or a requested pole coordinate; this wrapper does not repair the
 * base centreline. Queries use finite stations.
 *
 * @param base Admitted C2 orthonormal frame function.
 * @param from Finite transition start station, mm.
 * @param to Finite transition end station, mm, strictly greater than from.
 * @param up Signed endpoint target in the construction frame; direction only.
 * @returns Rotated axis or the named station/target/source admission failure.
 */
export function rollAutoMovieViewAxis(
  base: IAutoMovieViewAxis.IAxis,
  from: number,
  to: number,
  up: AutoMovieVector3Tuple,
): IAutoMovieViewAxis.IAxis | string {
  if (!(to > from))
    return "material roll needs finite increasing stations with finite positive separation";
  if (up.length !== 3)
    return "material roll target is not a finite three-component direction";
  const scale: number = Math.max(...up.map(Math.abs));
  if (!(scale > 0)) return "material roll target is zero";
  const target: AutoMovieVector3Tuple = up.map(
    (value: number): number => value / scale,
  ) as AutoMovieVector3Tuple;
  const end: IAutoMovieLoftSectionFrame = base.at(to);
  if (end.u.length !== 3 || end.v.length !== 3)
    return "material roll endpoint has no finite base normal plane";
  const cosine: number = end.u.reduce(
    (sum: number, value: number, i: number): number => sum + value * target[i]!,
    0,
  );
  const sine: number = end.v.reduce(
    (sum: number, value: number, i: number): number => sum + value * target[i]!,
    0,
  );
  const projection: number = Math.hypot(cosine, sine);
  const targetNorm: number = Math.hypot(...target);
  if (!(projection > MINIMUM_RELATIVE_NORMAL * targetNorm))
    return `material roll target relative normal projection ${projection / targetNorm} must exceed ${MINIMUM_RELATIVE_NORMAL} for direction conditioning`;
  const measured: number = Math.atan2(sine, cosine);
  const angle: number = measured === -Math.PI ? Math.PI : measured;
  if (angle === 0) return base;
  const source:
    | IAutoMovieViewOutline.IOutline
    | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
    knots: [
      {
        site: "material roll start",
        station: from,
        value: 0,
        jet: { first: 0, second: 0 },
      },
      {
        site: "material roll end",
        station: to,
        value: angle,
        jet: { first: 0, second: 0 },
      },
    ],
  });
  if ("contract" in source)
    return `material roll ${source.contract}: ${source.detail}`;

  /**
   * Preserve the base origin/normal plane while reading the prepared rotation
   * at a finite station.
   */
  const at: (station: number) => IAutoMovieLoftSectionFrame = (
    station: number,
  ): IAutoMovieLoftSectionFrame => {
    const frame: IAutoMovieLoftSectionFrame = base.at(station);
    if (station <= from) return frame;
    const rotation: number | string =
      station >= to ? angle : AutoMovieViewOutline.value(source, station);
    if (typeof rotation === "string")
      throw new Error(`material roll source: ${rotation}`);
    const c: number = Math.cos(rotation);
    const s: number = Math.sin(rotation);
    return {
      origin: frame.origin,
      u: frame.u.map(
        (value: number, i: number): number => c * value + s * frame.v[i]!,
      ) as AutoMovieVector3Tuple,
      v: frame.v.map(
        (value: number, i: number): number => c * value - s * frame.u[i]!,
      ) as AutoMovieVector3Tuple,
    };
  };
  return {
    at,
    ...(base.jet === undefined
      ? {}
      : {
          jet: (
            station: number,
            parameter?: IAutoMovieConstructionOutlineParameter,
          ): IAutoMovieViewAxisJet.IJet | null => {
            const frame: IAutoMovieViewAxisJet.IJet | null = base.jet!(
              station,
              parameter,
            );
            if (frame === null) return null;
            const reading: IAutoMovieViewOutline.IReading | string =
              AutoMovieViewOutline.at(
                source,
                Math.min(to, Math.max(from, station)),
              );
            if (typeof reading === "string")
              throw new Error(`material roll source: ${reading}`);
            if (reading.stationJet === null) return null;
            const inverse: [number, number] | null =
              AutoMovieViewParameter.inverseJet(parameter, station);
            if (inverse === null) return null;
            const active: boolean = station > from && station < to;
            const rate: number = active
              ? reading.stationJet[0] * inverse[0]
              : 0;
            const curvature: number = active
              ? reading.stationJet[1] * inverse[0] * inverse[0] +
                reading.stationJet[0] * inverse[1]
              : 0;
            const rotation: number =
              station <= from ? 0 : station >= to ? angle : reading.value;
            const c: number = Math.cos(rotation);
            const s: number = Math.sin(rotation);
            const value: IAutoMovieLoftSectionFrame =
              station <= from
                ? frame.value
                : {
                    origin: frame.value.origin,
                    u: frame.value.u.map(
                      (component: number, k: number): number =>
                        c * component + s * frame.value.v[k]!,
                    ) as AutoMovieVector3Tuple,
                    v: frame.value.v.map(
                      (component: number, k: number): number =>
                        c * component - s * frame.value.u[k]!,
                    ) as AutoMovieVector3Tuple,
                  };
            const first: IAutoMovieLoftSectionFrame = {
              origin: [...frame.first.origin],
              u: [0, 0, 0],
              v: [0, 0, 0],
            };
            const second: IAutoMovieLoftSectionFrame = {
              origin: [...frame.second.origin],
              u: [0, 0, 0],
              v: [0, 0, 0],
            };

            // Differentiate uR=c*u+s*v and vR=c*v-s*u using the same scalar roll.
            for (let k: number = 0; k < 3; k++) {
              const du: number = c * frame.first.u[k]! + s * frame.first.v[k]!;
              const dv: number = c * frame.first.v[k]! - s * frame.first.u[k]!;
              first.u[k] = du + rate * value.v[k]!;
              first.v[k] = dv - rate * value.u[k]!;
              second.u[k] =
                c * frame.second.u[k]! +
                s * frame.second.v[k]! +
                2 * rate * dv +
                curvature * value.v[k]! -
                rate * rate * value.u[k]!;
              second.v[k] =
                c * frame.second.v[k]! -
                s * frame.second.u[k]! -
                2 * rate * du -
                curvature * value.u[k]! -
                rate * rate * value.v[k]!;
            }
            return { value, first, second };
          },
        }),
  };
}

/**
 * Existing jointed initial-up conditioning policy: projected direction length
 * must exceed this share of the target length. This is a numerical admission
 * limit, not geometric parallelism or an anatomical constant.
 */
const MINIMUM_RELATIVE_NORMAL: number = 1e-9;

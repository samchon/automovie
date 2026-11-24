import {
  AutoMovieHumanNativeScaleCentre as Centre,
} from "./AutoMovieHumanNativeScaleCentre";
import {
  AutoMovieHumanNativeScaleProfile as Profile,
} from "./AutoMovieHumanNativeScaleProfile";
import {
  AutoMovieHumanNativeSourceAuthority as A,
} from "./AutoMovieHumanNativeSourceAuthority";
import {
  AutoMovieLoftContract,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieLoftRelief,
  IAutoMovieViewAxis,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * One directional native source definition from complete native source controls, under a constant scale or a station-varying one.
 *
 * Constant scale: coordinate functions scale exactly. A changed tangent-angle law is a native shared-jet quintic through the transformed
 * original knots and any independently measured interior junction, with its actual derivatives there. Uniform scale
 * retains the original angle/fullness functions.
 *
 * Station-varying scale (a profile that carries its jet and is not constant): the scale applies to the source function, not to the
 * family's knots. Each coordinate becomes c(s)·f(s) with c the scale of its direction, and its 2-jet follows the product rule from the
 * scale's own jet. Each tangent angle becomes atan2(b(s) sin θ(s), a(s) cos θ(s)) with the chain rule through a, b and θ. Shoulders are
 * affine invariants and stay the original's. Every original knot keeps its site, and each break of the scale law inside the domain
 * becomes a knot of its own, so the law's C2 joins are represented exactly and a site junction reads the same value and jets as this
 * source to binary64 rounding.
 *
 * Scaling centre (optional): the scale acts about the line e(s) the consumer passes, not about the course point. Each coordinate becomes
 * e(s) + c(s)·(f(s) - e(s)) along its own chart direction (AutoMovieHumanNativeScaleCentre.apply, with all three jets in the outline's
 * parameter), for the four extremes, the touch offsets and every piece point; the line's breaks become knots like the scale's. A tangent
 * angle is a direction, which a translation leaves alone, so its transform is the same about any centre, and shoulders stay the
 * original's. A constant ratio about a centre is still a station function and takes this path; a ratio of exactly 1 returns the original
 * outlines, and no centre is the law above, number for number. The source must carry touch offsets, and at a closing pole, where every
 * radial coordinate is 0, the centre must stand on the course or the ratio be 1: both are refused otherwise.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Affine coordinate scaling carries every extreme, touch and split point. atan2(b*sin(theta),a*cos(theta)) with analytic first/second chain rules defines the new tangent knots and preserves the original winding branch. A varying scale uses the product rule g' = c'f + cf', g'' = c''f + 2c'f' + cf'' in the outline's own parameter, with the station chain rule c_x = c' s_x, c_xx = c'' s_x^2 + c' s_xx.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One complete-source pass retains actual scalar parameters, cap/domain and shared feature definitions; no loft or boundary rediscovery occurs. Constant and varying scales share the outline selection and differ only in the per-outline law.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All native pieces are transformed, not four extremes; malformed or unavailable original angle parameter2 is refused rather than replaced with zero. A requested range under a varying scale is refused rather than given an unproven bound; no finite difference is taken.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes exact coordinate scaling, new native angle interpolation, the varying law's product rule and break knots, actual cap/domain and fixed feature ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear coordinate-control passes and one native scalar preparation per changed outline use O(n) retained storage plus O(log n) scalar reads per knot.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unit coordinate factors and uniform-scale angle/shoulder owners are borrowed exactly; a constant profile takes the constant path; the supplied feature list is shared with the emitted source.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned definition owns changed scalar controls and borrows immutable originals/features for its invocation lifetime without a global cache.
 */
export function AutoMovieHumanNativeSourceLaw(
  original: IAutoMovieViewPart,
  axis: IAutoMovieViewAxis.IAxis,
  scale: AutoMovieVector2Tuple | Profile.IScale,
  features: IAutoMovieLoftRelief[],
  centre?: Profile.ICentre,
  measuredAt?: number,
): IAutoMovieViewPart {
  if (measuredAt !== undefined && !Number.isFinite(measuredAt)) throw new Error("the measured target station is not finite");
  if (!Array.isArray(scale) && scale.constant === null)
    return varying(original, axis, scale, features, centre);
  const [a, b]: AutoMovieVector2Tuple = Array.isArray(scale) ? scale : scale.constant!;

  // A constant ratio about a centre line is still a station function, e(s)·(1 - c) + c·f(s), unless the ratio is exactly 1.
  if (centre !== undefined && !(a === 1 && b === 1))
    return varying(
      original,
      axis,
      Array.isArray(scale) ? Profile.constant(scale) : scale,
      features,
      centre,
    );
  if (![a, b].every(Number.isFinite) || !(a > 0 && b > 0))
    throw new Error("native root calipers require positive finite factors");
  const coordinate = (
    source: IAutoMovieViewPart.IOutline,
    factor: number,
  ): IAutoMovieViewPart.IOutline =>
    factor === 1
      ? source
      : {
          ...source,
          knots: source.knots.map(
            (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
              ...k,
              value: k.value * factor,
              ...(k.jet === undefined
                ? {}
                : {
                    jet: {
                      first: k.jet.first === null ? null : k.jet.first * factor,
                      second:
                        k.jet.second === null ? null : k.jet.second * factor,
                    },
                  }),
            }),
          ),
          ...(source.range === undefined
            ? {}
            : {
                range: {
                  minimum:
                    source.range.minimum === null
                      ? null
                      : source.range.minimum * factor,
                  maximum:
                    source.range.maximum === null
                      ? null
                      : source.range.maximum * factor,
                },
              }),
        };
  const angle = (
    source: IAutoMovieViewPart.IOutline,
  ): IAutoMovieViewPart.IOutline => {
    if (a === b) return source;
    const prepared = AutoMovieViewOutline.create(source);
    if ("contract" in prepared) throw new Error(prepared.detail);
    const span: number = prepared.spline.xs.at(-1)! - prepared.spline.xs[0]!;
    const knots: IAutoMovieViewPart.IKnot[] = [...source.knots];
    if (measuredAt !== undefined && measuredAt > prepared.domain[0] && measuredAt < prepared.domain[1] &&
        !knots.some((k: IAutoMovieViewPart.IKnot): boolean => k.station === measuredAt)) {
      const gap: number = AutoMovieLoftContract.splineGap(prepared.domain);
      if (knots.some((k: IAutoMovieViewPart.IKnot): boolean => Math.abs(k.station - measuredAt) < gap))
        throw new Error("the independently measured station is within the scalar knot gap at " + measuredAt);
      const at: number = knots.findIndex((k: IAutoMovieViewPart.IKnot): boolean => k.station > measuredAt);
      knots.splice(at, 0, { site: "junction." + measuredAt, station: measuredAt, value: NaN });
    }
    const transform = (theta: number): number => {
      const raw: number = Math.atan2(b * Math.sin(theta), a * Math.cos(theta));
      return raw + 2 * Math.PI * Math.round((theta - raw) / (2 * Math.PI));
    };
    return {
      ...source,
      knots: knots.map(
        (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
          const read = AutoMovieViewOutline.at(prepared, k.station);
          if (typeof read === "string") throw new Error(read);
          const theta: number = read.value;
          const [c, s] = [Math.cos(theta), Math.sin(theta)];
          const denominator: number = a * a * c * c + b * b * s * s;
          const first: number = (a * b) / denominator;
          const second: number =
            (2 * a * b * (a * a - b * b) * s * c) / (denominator * denominator);
          const value: number = transform(theta);
          const d1: number = first * read.parameterJet[0] * span;
          const d2: number =
            (second * read.parameterJet[0] ** 2 +
              first * read.parameterJet[1]) *
            span *
            span;
          if (![value, d1, d2].every(Number.isFinite))
            throw new Error("native transformed angle2 is not representable");
          return { ...k, value, jet: { first: d1, second: d2 } };
        },
      ),
      ...(source.range === undefined
        ? {}
        : {
            range: {
              minimum:
                source.range.minimum === null
                  ? null
                  : transform(source.range.minimum),
              maximum:
                source.range.maximum === null
                  ? null
                  : transform(source.range.maximum),
            },
          }),
    };
  };
  const quarters = <T>(
    items: IAutoMovieViewPart.IQuarters<T>,
    map: (item: T, k: number) => T,
  ): IAutoMovieViewPart.IQuarters<T> =>
    items.map(map) as IAutoMovieViewPart.IQuarters<T>;
  if (original.fullness.kind !== "top")
    throw new Error(
      "native F1 root controls require the actual complete top source",
    );
  const top: IAutoMovieViewPart.ITop = original.fullness;
  const split = (
    part: IAutoMovieViewPart.ISplit,
  ): IAutoMovieViewPart.ISplit => ({
    u: coordinate(part.u, a),
    v: coordinate(part.v, b),
    angle: angle(part.angle),
    shoulder: part.shoulder,
  });
  return {
    ...original,
    axis,
    front: {
      positive: coordinate(original.front.positive, a),
      negative: coordinate(original.front.negative, a),
    },
    side: {
      positive: coordinate(original.side.positive, b),
      negative: coordinate(original.side.negative, b),
    },
    fullness: {
      ...top,
      ...(top.touch === undefined
        ? {}
        : {
            touch: quarters(top.touch, (item, q) =>
              coordinate(item, q % 2 === 0 ? b : a),
            ),
          }),
      ...(top.splits === undefined
        ? {}
        : { splits: quarters(top.splits, (item) => split(item)) }),
      ...(top.pieces === undefined
        ? {}
        : { pieces: quarters(top.pieces, (items) => items.map(split)) }),
    },
    ...(features.length === 0 ? { reliefs: undefined } : { reliefs: features }),
  };
}

/** A value and its first and second derivatives in one outline's own parameter. */
type IJet3 = [number, number, number];

/** The scale's value and its first two derivatives in an outline's own parameter, per direction (depth, breadth). */
interface IScaleJet {
  value: AutoMovieVector2Tuple;
  first: AutoMovieVector2Tuple;
  second: AutoMovieVector2Tuple;
}

/**
 * The source under a station-varying scale: every coordinate c(s)·f(s), every tangent angle through the scaled tangent, every shoulder
 * unchanged, with the scale law's breaks added as knots.
 */
function varying(
  original: IAutoMovieViewPart,
  axis: IAutoMovieViewAxis.IAxis,
  scale: Profile.IScale,
  features: IAutoMovieLoftRelief[],
  centre?: Profile.ICentre,
): IAutoMovieViewPart {
  if (original.fullness.kind !== "top")
    throw new Error(
      "native F1 root controls require the actual complete top source",
    );
  const top: IAutoMovieViewPart.ITop = original.fullness;
  if (centre !== undefined && top.touch === undefined)
    throw new Error(
      "a scaling centre needs the source's touch offsets: a guide moved off its axis line has nowhere to stand without them",
    );

  // A radial outline closes at the part's poles, and the engine reads it in the pole's root or angle parameter; the scaled knots are
  // read and written in that same parameter. Angles and shoulders are not radial and stay open.
  const radial: IAutoMovieViewOutline.IEnds = A.ends(original);

  // Without a centre the coordinate is c·f about the course point. With one it is e + c·(f - e), e the centre's coordinate along the
  // same chart direction with its jet in the same parameter (AutoMovieHumanNativeScaleCentre.apply).
  const coordinate =
    (k: 0 | 1) =>
    ([f, fx, fxx]: IJet3, c: IScaleJet, e: IScaleJet | null): IJet3 =>
      e === null
        ? [
            c.value[k] * f,
            c.first[k] * f + c.value[k] * fx,
            c.second[k] * f + 2 * c.first[k] * fx + c.value[k] * fxx,
          ]
        : [
            ...Centre.apply(
              [c.value[k], c.first[k], c.second[k]],
              [f, fx, fxx],
              [e.value[k], e.first[k], e.second[k]],
            ),
          ];

  // T = atan2(v, u) with u = a cos θ and v = b sin θ; T' = (u v' - v u') / r² and
  // T'' = (u v'' - v u'') / r² - 2 (u u' + v v')(u v' - v u') / r⁴, r² = u² + v².
  const angle = ([t, tx, txx]: IJet3, c: IScaleJet): IJet3 => {
    const [a, b]: AutoMovieVector2Tuple = c.value;
    const [ax, bx]: AutoMovieVector2Tuple = c.first;
    const [axx, bxx]: AutoMovieVector2Tuple = c.second;
    const cos: number = Math.cos(t);
    const sin: number = Math.sin(t);
    const u: number = a * cos;
    const v: number = b * sin;
    const ux: number = ax * cos - a * sin * tx;
    const vx: number = bx * sin + b * cos * tx;
    const uxx: number =
      axx * cos - 2 * ax * sin * tx - a * cos * tx * tx - a * sin * txx;
    const vxx: number =
      bxx * sin + 2 * bx * cos * tx - b * sin * tx * tx + b * cos * txx;
    const r2: number = u * u + v * v;
    const turn: number = u * vx - v * ux;
    const raw: number = Math.atan2(v, u);
    return [
      raw + 2 * Math.PI * Math.round((t - raw) / (2 * Math.PI)),
      turn / r2,
      (u * vxx - v * uxx) / r2 - (2 * (u * ux + v * vx) * turn) / (r2 * r2),
    ];
  };
  const lineBreaks: readonly number[] = [
    ...scale.breaks,
    ...(centre?.breaks ?? []),
  ];
  const rebuild = (
    source: IAutoMovieViewPart.IOutline,
    ends: IAutoMovieViewOutline.IEnds,
    law: (f: IJet3, c: IScaleJet, e: IScaleJet | null) => IJet3,
  ): IAutoMovieViewPart.IOutline => {
    if (source.range !== undefined)
      throw new Error(
        "a requested scalar range has no proven bound under a station-varying native scale",
      );
    const prepared:
      | IAutoMovieViewOutline.IOutline
      | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      source,
      ends,
    );
    if ("contract" in prepared) throw new Error(prepared.detail);
    const span: number =
      prepared.spline.xs.at(-1)! - prepared.spline.xs[0]!;
    const [from, to]: readonly [number, number] = prepared.domain;
    const gap: number = AutoMovieLoftContract.splineGap([from, to]);

    // Each break of the scale or of the centre line strictly inside the domain and clear of every knot (and of the breaks already
    // taken) by the engine's spline gap becomes a knot of its own.
    const breaks: IAutoMovieViewPart.IKnot[] = [];
    for (const s of lineBreaks)
      if (
        s - from >= gap &&
        to - s >= gap &&
        [...source.knots, ...breaks].every(
          (k: IAutoMovieViewPart.IKnot): boolean =>
            Math.abs(k.station - s) >= gap,
        )
      )
        breaks.push({ site: "scale." + s, station: s, value: NaN });
    const knots: IAutoMovieViewPart.IKnot[] = [...source.knots, ...breaks]
      .sort(
        (x: IAutoMovieViewPart.IKnot, y: IAutoMovieViewPart.IKnot): number =>
          x.station - y.station,
      )
      .map((knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
        const read: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(prepared, knot.station);
        const inverse: [number, number] | null =
          AutoMovieViewParameter.inverseJet(prepared.parameter, knot.station);
        if (typeof read === "string" || inverse === null)
          throw new Error(
            "native scaled source parameter2 unavailable at " + knot.station,
          );
        const [sx, sxx]: [number, number] = inverse;
        // A station jet in the outline's own parameter x: g_x = g' s_x and g_xx = g'' s_x^2 + g' s_xx.
        const own = (g: Profile.IJet): IScaleJet => ({
          value: g.value,
          first: [g.first[0] * sx, g.first[1] * sx],
          second: [
            g.second[0] * sx * sx + g.first[0] * sxx,
            g.second[1] * sx * sx + g.first[1] * sxx,
          ],
        });
        const [value, first, second]: IJet3 = law(
          [read.value, read.parameterJet[0], read.parameterJet[1]],
          own(scale.jet(knot.station)),
          centre === undefined ? null : own(centre.jet(knot.station)),
        );

        // A radial outline is 0 at its closing pole, so the scaled one must be too: e·(1 - c) there.
        if (
          (knot.station === ends.bottom || knot.station === ends.top) &&
          value !== 0
        )
          throw new Error(
            `a scaling centre must stand on the course, or its ratio be 1, at the closing pole ${knot.station}: the scaled radial coordinate reads ${value} there`,
          );
        const jet: { first: number; second: number } = {
          first: first * span,
          second: second * span * span,
        };
        if (![value, jet.first, jet.second].every(Number.isFinite))
          throw new Error(
            "native scaled source2 is not representable at " + knot.station,
          );
        return { site: knot.site, station: knot.station, value, jet };
      });
    return { ...source, knots };
  };
  const split = (part: IAutoMovieViewPart.ISplit): IAutoMovieViewPart.ISplit => ({
    u: rebuild(part.u, radial, coordinate(0)),
    v: rebuild(part.v, radial, coordinate(1)),
    angle: rebuild(part.angle, {}, angle),
    shoulder: part.shoulder,
  });
  return {
    ...original,
    axis,
    front: {
      positive: rebuild(original.front.positive, radial, coordinate(0)),
      negative: rebuild(original.front.negative, radial, coordinate(0)),
    },
    side: {
      positive: rebuild(original.side.positive, radial, coordinate(1)),
      negative: rebuild(original.side.negative, radial, coordinate(1)),
    },
    fullness: {
      ...top,
      ...(top.touch === undefined
        ? {}
        : {
            touch: top.touch.map((item, q) =>
              rebuild(item, radial, coordinate(q % 2 === 0 ? 1 : 0)),
            ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>,
          }),
      ...(top.splits === undefined
        ? {}
        : {
            splits: top.splits.map(
              split,
            ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit>,
          }),
      ...(top.pieces === undefined
        ? {}
        : {
            pieces: top.pieces.map((items) =>
              items.map(split),
            ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit[]>,
          }),
    },
    ...(features.length === 0 ? { reliefs: undefined } : { reliefs: features }),
  };
}

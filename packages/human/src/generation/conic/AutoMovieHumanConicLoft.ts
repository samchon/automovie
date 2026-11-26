import { AutoMovieHumanLoftStations } from "../../lofting/AutoMovieHumanLoftStations";
import { AutoMovieHumanConicRecentre } from "./AutoMovieHumanConicRecentre";
import { AutoMovieHumanConicSection } from "./AutoMovieHumanConicSection";
import {
  AutoMovieLoftChain,
  AutoMovieNaturalSpline,
  AutoMovieViewAxis,
  AutoMovieViewAxisJet,
  AutoMovieViewLoft,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSectionFrame,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * A conic family as it is authored, and its generation through the engine's
 * view loft.
 *
 * A family is one part's tape wall: along a jointed course every section is
 * an `AutoMovieHumanConicSection` whose fields are natural cubics through
 * their values at a few shared station knots. Reliefs carry what lies inside
 * that wall. Nothing else defines the part's surface.
 */
export namespace AutoMovieHumanConicLoft {

  /**
   * The eased roll's angle and its first two derivatives along the station (`IRoll.eases`).
   *
   * @evidence contracts/development/implementation.md#principled-implementation On a stretch the slope is `m S(x / a)` over the first ease, `m` between, `m S((L - x) / b)` over the last, `S` the quintic smoothstep whose integral over its window is half the window, so the angle is the closed-form integral and reaches the second value exactly with `m = d / (L - (a + b) / 2)`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stretch search and one polynomial per read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Eases longer than their stretch, negative eases and mismatched counts are refused; a stretch of equal values returns that value with no arithmetic on it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the knot count per read; no solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The admission runs once at creation and the closure serves every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure borrows the roll's three arrays.
   * @evidence contracts/development/common.md#meaningful-documentation States the law, its units and each refusal.
   */
  export function eased(roll: IAutoMovieHumanConicLoft.IRoll): (station: number) => [number, number, number] {
    const { knots, values }: IAutoMovieHumanConicLoft.IRoll = roll;
    const eases: number[] | undefined = roll.eases;
    if (eases === undefined || eases.length !== knots.length || values.length !== knots.length || knots.length < 2) throw new Error("roll: an eased roll needs one value and one ease per knot, at least two knots");
    for (let i: number = 0; i + 1 < knots.length; ++i) {
      if (!(knots[i + 1]! > knots[i]!)) throw new Error("roll: the knots must increase");
      if (!(eases[i]! >= 0 && eases[i + 1]! >= 0 && eases[i]! + eases[i + 1]! <= knots[i + 1]! - knots[i]!)) throw new Error("roll: the eases of the stretch from " + knots[i] + " to " + knots[i + 1] + " mm are negative or longer than it");
    }
    // The quintic smoothstep, its integral from 0 and its derivative, at a share of its window.
    const step = (t: number): number => t * t * t * (10 + t * (-15 + 6 * t));
    const lift = (t: number): number => t * t * t * t * (2.5 + t * (-3 + t));
    const rate = (t: number): number => 30 * t * t * (1 - t) * (1 - t);
    return (station: number): [number, number, number] => {
      if (station <= knots[0]!) return [values[0]!, 0, 0];
      if (station >= knots.at(-1)!) return [values.at(-1)!, 0, 0];
      let i: number = 0;
      while (station > knots[i + 1]!) ++i;
      const [from, to]: [number, number] = [values[i]!, values[i + 1]!];
      if (from === to) return [from, 0, 0];
      const [L, a, b]: [number, number, number] = [knots[i + 1]! - knots[i]!, eases[i]!, eases[i + 1]!];
      const m: number = (to - from) / (L - (a + b) / 2);
      const x: number = station - knots[i]!;
      if (x < a) return [from + m * a * lift(x / a), m * step(x / a), (m * rate(x / a)) / a];
      if (x <= L - b) return [from + m * (x - a / 2), m, 0];
      const t: number = (L - x) / b;
      return [to - m * b * lift(t), m * step(t), (-m * rate(t)) / b];
    };
  }

  /** Share of a cap's first section's size under which a coordinate keeps the shared factor (`ITip.own`). */
  const OWN_LEAST: number = 0.05;

  /**
   * Knots of a cap between its end section and its tip, besides those two. Where the tube's taper meets the cap's law the outlines' natural
   * cubics ripple, and the ripple falls by about 0.27 per knot; twelve leave 1e-7 of it at the pole, where a section is small enough for any
   * coordinate out of proportion to break its chain.
   */
  const CAP_KNOTS: number = 12;

  /**
   * Bounds of a cap's taper `q` (`ITip`): below 1 the tip stands upright, and at 0 the cap leaves a wall that still widens toward its tip
   * level instead of widening on. Allowed to widen on (to -0.5), the nose's cap swelled 14 % past its bulb and the nostrils' cuts came out
   * through its sides: a cap that widens on extrapolates past the skin the wall was fitted to.
   */
  const TAPER: { least: number; most: number } = { least: 0, most: 0.95 };

  /**
   * When a station is added midway between two: the model's section there stands off the mean of the two by more than `length` mm in a point's
   * coordinate or by more than `share` in a tangent's angle, rad, or a shoulder. No interval is cut below `least` mm. At a tenth of these
   * tolerances nearly every interval was cut whatever spacing was asked for, and the body's skin held 580,000 triangles at any setting.
   */
  const REFINE: { length: number; share: number; least: number } = {
    length: 0.5,
    share: 0.05,
    least: 0.25,
  };

  /**
   * Maximum mean distance between adjacent phases at the widest section, in
   * millimetres. Use the body pitch and retain the minimum angular resolution.
   */
  const PHASE_MM: number = AutoMovieHumanLoftStations.BODY_PITCH_MM;

  /**
   * The part's course as the engine reads it, its chart turned by the part's roll and its origin on the part's origin line.
   *
   * The origin line is applied last, in the rolled chart the section values are written in. Absent, or with every shift zero, the result
   * is the course's own axis object, so a family without a line reads exactly as before the line existed.
   */
  export function axis(
    family: Pick<IAutoMovieHumanConicLoft.IFamily, "centres" | "halves" | "up" | "roll" | "native"> &
      Partial<Pick<IAutoMovieHumanConicLoft.IFamily, "origin" | "knots">>,
  ): IAutoMovieViewAxis.IAxis {
    if (family.native !== undefined) return family.native.axis;
    const base: IAutoMovieViewAxis.IAxis = carried(family);
    const line: IAutoMovieHumanConicRecentre.ILine | undefined = family.origin;
    if (
      line === undefined ||
      (line.u.every((x: number): boolean => x === 0) &&
        line.v.every((x: number): boolean => x === 0))
    )
      return base;
    if (family.knots === undefined)
      throw new Error("course: an origin line needs the family's knots");
    return AutoMovieHumanConicRecentre.axis(base, family.knots, line);
  }

  /** The course through the centres with its chart turned by the roll: the line the origin line is measured from. */
  function carried(
    family: Pick<IAutoMovieHumanConicLoft.IFamily, "centres" | "halves" | "up" | "roll">,
  ): IAutoMovieViewAxis.IAxis {
    const made: IAutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
      family.centres,
      family.halves,
      family.up,
    );
    if (typeof made === "string") throw new Error("course: " + made);
    if (family.roll === undefined) return made;
    const base: IAutoMovieViewAxis.IAxis = made;
    const read: (station: number) => [number, number, number] =
      family.roll.eases !== undefined
        ? eased(family.roll)
        : ((spline: IAutoMovieNaturalCubicSpline) =>
            (station: number): [number, number, number] =>
              AutoMovieNaturalSpline.read(spline, station))(
            AutoMovieNaturalSpline.create(family.roll.knots, family.roll.values),
          );
    // With c = cos(a) and s = sin(a): u' = c u + s v and v' = c v - s u, so with the angle's derivatives a' and a'' along the station,
    // u'_1 = c u_1 + s v_1 + a' v', v'_1 = c v_1 - s u_1 - a' u', and
    // u'_2 = c u_2 + s v_2 + 2 a' (c v_1 - s u_1) + a'' v' - a'^2 u', v'_2 = c v_2 - s u_2 - 2 a' (c u_1 + s v_1) - a'' u' - a'^2 v'.
    const turn = (
      u: readonly number[],
      v: readonly number[],
      c: number,
      s: number,
    ): [AutoMovieVector3Tuple, AutoMovieVector3Tuple] => [
      [0, 1, 2].map((k: number): number => c * u[k]! + s * v[k]!) as AutoMovieVector3Tuple,
      [0, 1, 2].map((k: number): number => c * v[k]! - s * u[k]!) as AutoMovieVector3Tuple,
    ];
    return {
      at: (station: number): IAutoMovieLoftSectionFrame => {
        const frame: IAutoMovieLoftSectionFrame = base.at(station);
        const angle: number = read(station)[0];
        const [u, v]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = turn(
          frame.u,
          frame.v,
          Math.cos(angle),
          Math.sin(angle),
        );
        return { origin: frame.origin, u, v };
      },
      ...(base.jet === undefined
        ? {}
        : {
            jet: (
              station: number,
              parameter?: IAutoMovieConstructionOutlineParameter,
            ): IAutoMovieViewAxisJet.IJet | null => {
              const jet: IAutoMovieViewAxisJet.IJet | null = base.jet!(station);
              if (jet === null) return null;
              const [a, a1, a2]: [number, number, number] = read(station);
              const [c, s]: [number, number] = [Math.cos(a), Math.sin(a)];
              const [u, v]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = turn(jet.value.u, jet.value.v, c, s);
              const [u1, v1]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = turn(jet.first.u, jet.first.v, c, s);
              const [u2, v2]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = turn(jet.second.u, jet.second.v, c, s);
              const rolled: IAutoMovieViewAxisJet.IJet = {
                value: { origin: jet.value.origin, u, v },
                first: {
                  origin: jet.first.origin,
                  u: [0, 1, 2].map(
                    (k: number): number => u1[k]! + a1 * v[k]!,
                  ) as AutoMovieVector3Tuple,
                  v: [0, 1, 2].map(
                    (k: number): number => v1[k]! - a1 * u[k]!,
                  ) as AutoMovieVector3Tuple,
                },
                second: {
                  origin: jet.second.origin,
                  u: [0, 1, 2].map(
                    (k: number): number =>
                      u2[k]! + 2 * a1 * v1[k]! + a2 * v[k]! - a1 * a1 * u[k]!,
                  ) as AutoMovieVector3Tuple,
                  v: [0, 1, 2].map(
                    (k: number): number =>
                      v2[k]! - 2 * a1 * u1[k]! - a2 * u[k]! - a1 * a1 * v[k]!,
                  ) as AutoMovieVector3Tuple,
                },
              };
              return AutoMovieViewAxisJet.parameter(rolled, parameter, station);
            },
          }),
    };
  }

  /** The family's field vector at one station. */
  export function reader(
    family: Pick<IAutoMovieHumanConicLoft.IFamily, "knots" | "values">,
  ): (s: number) => number[] {
    const splines: IAutoMovieNaturalCubicSpline[] = family.values.map(
      (field: number[]): IAutoMovieNaturalCubicSpline =>
        AutoMovieNaturalSpline.create(family.knots, field),
    );
    return (s: number): number[] =>
      splines.map((spline: IAutoMovieNaturalCubicSpline): number =>
        AutoMovieNaturalSpline.evaluate(spline, s),
      );
  }

  /**
   * Read complete controls in the caller's actual cap/relief scope before lofting.
   * Native requests share the canonical source owner. Ordinary requests use the
   * existing source producer with turn-density sampling absent; scalar functions
   * retain the caller's explicit station grid and actual caps.
   */
  export function source(
    family: IAutoMovieHumanConicLoft.IFamily,
    requested: number[] = family.knots,
  ): IAutoMovieViewPart {
    return family.native === undefined
      ? part({ ...family, turn: undefined }, requested)
      : family.native.source(family);
  }
  /**
   * The engine's view part of a family.
   *
   * The engine reads a section as four guides on its box with conic pieces
   * between them. Those guide coordinates, touch offsets, piece points,
   * tangent angles and shoulders are not authored: at every requested
   * station they are resolved from the family's fields through
   * `AutoMovieHumanConicSection.resolve` and handed over as derived outlines
   * with one knot per station.
   *
   * @param family The authored definition.
   * @param stations Stations of the emitted layers and of the derived outlines, mm, increasing.
   */
  export function part(
    family: IAutoMovieHumanConicLoft.IFamily,
    requested: number[],
  ): IAutoMovieViewPart {
    if (family.native !== undefined)
      return family.native.part(family, requested);
    const read: (s: number) => number[] = reader(family);
    const [bottom, top]: [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null] = family.tips ?? [
      null,
      null,
    ];

    // The fields own the stations between the caps; each cap starts on a station of its own.
    const owned: number[] = [
      ...(bottom === null ? [] : [bottom.from]),
      ...requested.filter(
        (s: number): boolean =>
          (bottom === null || s > bottom.from) &&
          (top === null || s < top.from),
      ),
      ...(top === null ? [] : [top.from]),
    ];

    // The engine reads every derived number between two stations by its own spline, not through the section model, so where the model's
    // section turns faster than that reading follows, the engine's chain loses an arc though the model's never does. Wherever the model's
    // section midway between two stations stands off the mean of their two by more than the tolerances, the midway station is added.
    const resolved: Map<number, IAutoMovieHumanConicSection.IChain> = new Map();
    const at = (s: number): IAutoMovieHumanConicSection.IChain => {
      let chain: IAutoMovieHumanConicSection.IChain | undefined =
        resolved.get(s);
      if (chain === undefined)
        resolved.set(
          s,
          (chain = AutoMovieHumanConicSection.resolve(read(s), family.layout)),
        );
      return chain;
    };
    const between = (a: number, b: number): number[] => {
      if (b - a <= 2 * REFINE.least) return [];
      const middle: number = (a + b) / 2;
      const [low, mid, high]: IAutoMovieHumanConicSection.IChain[] = [
        at(a),
        at(middle),
        at(b),
      ];
      const off: boolean = mid!.input.points.some(
        (p: AutoMovieVector2Tuple, k: number): boolean => {
          const turn = (t: AutoMovieVector2Tuple): number =>
            Math.atan2(t[1], t[0]);
          const swing: number =
            turn(high!.input.tangents[k]!) - turn(low!.input.tangents[k]!);
          const lean: number =
            turn(mid!.input.tangents[k]!) -
            turn(low!.input.tangents[k]!) -
            (swing - 2 * Math.PI * Math.round(swing / (2 * Math.PI))) / 2;
          return (
            Math.abs(
              p[0] - (low!.input.points[k]![0] + high!.input.points[k]![0]) / 2,
            ) > REFINE.length ||
            Math.abs(
              p[1] - (low!.input.points[k]![1] + high!.input.points[k]![1]) / 2,
            ) > REFINE.length ||
            Math.abs(lean - 2 * Math.PI * Math.round(lean / (2 * Math.PI))) >
              REFINE.share ||
            Math.abs(
              mid!.input.shoulders[k]! -
                (low!.input.shoulders[k]! + high!.input.shoulders[k]!) / 2,
            ) > REFINE.share
          );
        },
      );
      return off ? [...between(a, middle), middle, ...between(middle, b)] : [];
    };
    const stations: number[] = owned.flatMap(
      (s: number, i: number): number[] =>
        i === 0 ? [s] : [...between(owned[i - 1]!, s), s],
    );
    const chains: IAutoMovieHumanConicSection.IChain[] = stations.map(at);
    const count: number = chains[0]!.input.points.length;
    const guides: number[] = chains[0]!.guides;
    if (guides.length !== 4)
      throw new Error(
        "the layout names " + guides.length + " engine guides instead of four",
      );

    // The wall's taper at a cap's first section: the relative growth of the mean of its four extents over a millimetre away from the tip,
    // times the cap's length, held to [TAPER.least, TAPER.most].
    const size = (s: number): number => {
      const chain: IAutoMovieHumanConicSection.IChain =
        AutoMovieHumanConicSection.resolve(read(s), family.layout);
      return chain.guides.reduce(
        (sum: number, g: number, q: number): number =>
          sum + Math.abs(chain.input.points[g]![q % 2]),
        0,
      );
    };
    const taper = (end: IAutoMovieHumanConicLoft.ITip): number => {
      const inward: number = Math.sign(end.from - end.tip);
      return Math.min(
        TAPER.most,
        Math.max(
          TAPER.least,
          (size(end.from + inward) / size(end.from) - 1) *
            Math.abs(end.from - end.tip),
        ),
      );
    };

    // The wall's bend at a cap's first section in the cap's own measure: the second difference of the mean extent over millimetres away from
    // the tip, relative to the extent, times the square of the cap's length.
    const bend = (end: IAutoMovieHumanConicLoft.ITip): number => {
      const inward: number = Math.sign(end.from - end.tip);
      const [s0, s1, s2]: number[] = [0, 1, 2].map((k: number): number =>
        size(end.from + k * inward),
      );
      return ((s2! - 2 * s1! + s0!) / s0!) * (end.from - end.tip) ** 2;
    };

    // The cap's knots and its rings both stand at equal steps of the root of the distance to the tip, the engine's pole parameter.
    const capShares: number[] = Array.from(
      { length: CAP_KNOTS + 1 },
      (_: unknown, k: number): number => k / (CAP_KNOTS + 1),
    );

    // A coordinate is zero at a tip; an angle or a shoulder keeps the cap's first section's value there. Each cap knot is that section scaled
    // by the tip's factor (`ITip`).
    // A coordinate along chart axis `along` gathers about the end's `centre` while it shrinks (`ITip.centre`).
    // With `own`, a coordinate that stands clear of its centre takes the taper and the bend of its own outline (`ITip.own`), from its values
    // one and two millimetres away from the tip.
    const cap = (
      end: IAutoMovieHumanConicLoft.ITip,
      value: number,
      along: 0 | 1 | null,
      site: string,
      pick?: (chain: IAutoMovieHumanConicSection.IChain) => number,
    ): IAutoMovieViewPart.IKnot[] => {
      const middle: number = along === null ? 0 : (end.centre?.[along] ?? 0);
      const inward: number = Math.sign(end.from - end.tip);
      const length: number = Math.abs(end.from - end.tip);
      const [x1, x2]: number[] =
        end.own === true && along !== null && pick !== undefined
          ? [1, 2].map((k: number): number =>
              pick(
                AutoMovieHumanConicSection.resolve(
                  read(end.from + k * inward),
                  family.layout,
                ),
              ),
            )
          : [NaN, NaN];
      const x0: number = value;
      const own: boolean =
        Number.isFinite(x1) && Math.abs(x0) > OWN_LEAST * size(end.from);
      const q: number = own
        ? Math.min(TAPER.most, Math.max(TAPER.least, (x1! / x0 - 1) * length))
        : taper(end);
      const c: number =
        end.covered === true
          ? 0
          : Math.max(
              0,
              (1 - q) ** 2 +
                (own ? ((x2! - 2 * x1! + x0) / x0) * length ** 2 : bend(end)),
            );
      const b: number = 2 * q - 1 - 2 * c;
      const a: number = 1 - b - c;
      return capShares.map((x: number, k: number): IAutoMovieViewPart.IKnot => {
        const t: number = x * x;
        const g: number = Math.sqrt(t * (a + t * (b + t * c)));
        return {
          site: site + "." + k,
          station: end.tip + (end.from - end.tip) * t,
          value:
            along === null ? value : value * g + 2 * middle * g * (1 - g) ** 2,
        };
      });
    };

    // The cap's rings: without them the engine meshed a cap from its first section straight to its pole, a cone ending in a flat disc.
    const rings = (end: IAutoMovieHumanConicLoft.ITip): number[] =>
      (end.rings === undefined
        ? capShares
        : Array.from(
            { length: end.rings + 1 },
            (_: unknown, k: number): number => k / (end.rings! + 1),
          )
      )
        .slice(1)
        .map((x: number): number => end.tip + (end.from - end.tip) * x * x);
    const closing = (
      pick: (chain: IAutoMovieHumanConicSection.IChain) => number,
      along: 0 | 1 | null,
    ): IAutoMovieViewPart.IOutline => ({
      knots: [
        ...(bottom === null
          ? []
          : cap(bottom, pick(chains[0]!), along, "tip.bottom", pick)),
        ...stations.map(
          (station: number, i: number): IAutoMovieViewPart.IKnot => ({
            site: "s" + i,
            station,
            value: pick(chains[i]!),
          }),
        ),
        ...(top === null
          ? []
          : cap(top, pick(chains.at(-1)!), along, "tip.top", pick).reverse()),
      ],
    });
    const outline = (
      pick: (chain: IAutoMovieHumanConicSection.IChain) => number,
      along: 0 | 1,
    ): IAutoMovieViewPart.IOutline => closing(pick, along);
    const share = (
      pick: (chain: IAutoMovieHumanConicSection.IChain) => number,
    ): IAutoMovieViewPart.IOutline => closing(pick, null);
    const quarters = <X>(
      make: (q: number) => X,
    ): IAutoMovieViewPart.IQuarters<X> => [make(0), make(1), make(2), make(3)];

    // A tangent angle is kept on one branch along the station so its outline never jumps by a turn.
    const angle = (at: number): IAutoMovieViewPart.IOutline => {
      let previous: number = NaN;
      return share((chain: IAutoMovieHumanConicSection.IChain): number => {
        let value: number = Math.atan2(
          chain.input.tangents[at]![1],
          chain.input.tangents[at]![0],
        );
        if (Number.isFinite(previous))
          value += 2 * Math.PI * Math.round((previous - value) / (2 * Math.PI));
        previous = value;
        return value;
      });
    };
    const pieces = (q: number): IAutoMovieViewPart.ISplit[] => {
      const out: IAutoMovieViewPart.ISplit[] = [];
      for (
        let at: number = (guides[q]! + 1) % count;
        at !== guides[(q + 1) % 4]!;
        at = (at + 1) % count
      ) {
        const index: number = at;
        out.push({
          u: outline(
            (chain: IAutoMovieHumanConicSection.IChain): number =>
              chain.input.points[index]![0],
            0,
          ),
          v: outline(
            (chain: IAutoMovieHumanConicSection.IChain): number =>
              chain.input.points[index]![1],
            1,
          ),
          angle: angle(index),
          shoulder: share(
            (chain: IAutoMovieHumanConicSection.IChain): number =>
              chain.input.shoulders[index]!,
          ),
        });
      }
      return out;
    };
    const coordinate = (
      q: number,
      axisIndex: 0 | 1,
    ): IAutoMovieViewPart.IOutline =>
      outline(
        (chain: IAutoMovieHumanConicSection.IChain): number =>
          chain.input.points[guides[q]!]![axisIndex],
        axisIndex,
      );

    // Phases round the part: its widest section's girth, as the ellipse on its half extents (Ramanujan's perimeter), at `PHASE_MM` apart.
    const girth: number = Math.max(
      ...chains.map((chain: IAutoMovieHumanConicSection.IChain): number => {
        const [a, b]: number[] = [0, 1].map(
          (c: number): number =>
            (Math.max(
              ...chain.input.points.map(
                (p: AutoMovieVector2Tuple): number => p[c]!,
              ),
            ) -
              Math.min(
                ...chain.input.points.map(
                  (p: AutoMovieVector2Tuple): number => p[c]!,
                ),
              )) /
            2,
        );
        return (
          Math.PI * (3 * (a! + b!) - Math.sqrt((3 * a! + b!) * (a! + 3 * b!)))
        );
      }),
    );

    // And no farther apart than the finest relief net's columns, as the layers are cut to its rows: a net shows only what the rings sample.
    const made: IAutoMovieViewPart = {
      name: family.name,
      axis: axis(family),
      stations: [
        ...(bottom === null ? [] : [bottom.tip, ...rings(bottom)]),
        ...stations,
        ...(top === null ? [] : [...rings(top).reverse(), top.tip]),
      ],
      ...(bottom === null && top === null
        ? {}
        : {
            pole:
              bottom === null
                ? ("top" as const)
                : top === null
                  ? ("bottom" as const)
                  : ("both" as const),
          }),
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: {
        kind: "top",
        shoulders: quarters(
          (q: number): IAutoMovieViewPart.IOutline =>
            share(
              (chain: IAutoMovieHumanConicSection.IChain): number =>
                chain.input.shoulders[guides[q]!]!,
            ),
        ),
        touch: quarters(
          (q: number): IAutoMovieViewPart.IOutline =>
            coordinate(q, q % 2 === 0 ? 1 : 0),
        ),
        pieces: quarters(pieces),
      },
      order: 32,
      samples: phaseCount(family, girth),
      ...(family.reliefs === undefined || family.reliefs.length === 0
        ? {}
        : { reliefs: family.reliefs }),
    };
    return sampled(family, made, stations);
  }

  /**
   * Existing phase-density count, independent of scalar-source construction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the original minimum48 and multiple8 rule from actual girth, pitch, phase and the finest relief columns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ordinary and invocation-owned sources call one phase-count formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sampling inputs change only sampling, never scalar controls or source domains.
   * @evidence contracts/development/common.md#meaningful-documentation Girth/pitch use physical mm and phase windows use radians.
   * @evidence contracts/development/implementation.md#efficient-algorithms One linear relief-window pass, with no family or loft reconstruction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure count has no work across calls to coordinate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function phaseCount(
    family: Pick<IAutoMovieHumanConicLoft.IFamily, "pitch" | "phase" | "reliefs">,
    girth: number,
  ): number {
    const finest: number = Math.min(
      family.phase ?? Infinity,
      ...(family.reliefs ?? []).map(
        (relief: IAutoMovieLoftRelief): number =>
          (relief.phases[1] - relief.phases[0]) / (relief.columns - 3),
      ),
    );
    return Math.max(
      48,
      8 *
        Math.ceil(
          Math.max(girth / (family.pitch ?? PHASE_MM), (2 * Math.PI) / finest) /
            8,
        ),
    );
  }

  /**
   * Apply the existing phase-turn density rule to the actual original part.
   * The supplied stations are regular wall rings, including cap starts and
   * excluding collapsed poles/cap interiors. All emitted cap layers remain
   * in the supplied part's own stations.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses the existing native loft/spacing owner on the supplied source, with the caller's pitch/phase/turn and real relief windows; scalar source generation is separate from mesh density.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ordinary and invocation-owned part factories call this one existing sampling rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A sampling request never replaces the source's scalar controls; a failed spacing loft retains the original part as the existing rule does, leaving actual admission to its consumer.
   * @evidence contracts/development/common.md#meaningful-documentation Names scalar-source separation and the actual caller sampling inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains spaced's station-by-phase cost only when turn spacing is requested; the ordinary path returns immediately.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both original and native-generated sources share the same phase-density implementation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary raw chain belongs to this synchronous sampling call and only its bounded phase list survives with the part.
   */
  export function sampled(
    family: Pick<IAutoMovieHumanConicLoft.IFamily, "turn" | "pitch" | "phase" | "reliefs">,
    made: IAutoMovieViewPart,
    stations: readonly number[],
  ): IAutoMovieViewPart {
    if (family.turn === undefined) return made;

    // Phases spaced by turn: read on the part's own lofted chain, whose phase is its sections' B-spline parameter, not their conics' polar
    // angle. Read on the conics, the phases of a flat section 40 by 5 mm clustered where its conics turn and its rings still turned by
    // 0.46 rad between two of them, against 0.1 asked.
    const loft: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(made);
    if (loft.chain === null) return made;
    const finest: number = Math.min(
      family.phase ?? Infinity,
      ...(family.reliefs ?? []).map(
        (relief: IAutoMovieLoftRelief): number =>
          (relief.phases[1] - relief.phases[0]) / (relief.columns - 3),
      ),
    );
    const phases: number[] = spaced(
      loft.chain,
      stations,
      family.pitch ?? PHASE_MM,
      family.turn,
      finest,
    );
    return { ...made, samples: phases.length, phases };
  }

  /** Phases round a ring that `spaced` reads its length and turn on. */
  const SPACING_SAMPLES: number = 1024;

  /**
   * A part's ring phases spaced by its rings' length and turn (`IFamily.turn`).
   *
   * Every station's ring of the lofted chain is read at `SPACING_SAMPLES` phases. Over each step between two of them the density is the
   * largest any ring asks for: its chord over `pitch`, its turn there over `turn`, or the step over `finest`, the finest relief net's
   * column. The phases stand at equal shares of that density's integral from phase 0, a multiple of 8 of them and at least 48, as the
   * uniform rule's count is.
   *
   * @param chain The part lofted on uniform phases.
   * @param stations The stations its fields own, mm.
   * @param pitch Largest distance between neighbouring phases, mm.
   * @param turn Largest turn between neighbouring phases, radians.
   * @param finest Finest relief net's column, radians.
   */
  function spaced(
    chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]>,
    stations: readonly number[],
    pitch: number,
    turn: number,
    finest: number,
  ): number[] {
    const M: number = SPACING_SAMPLES;
    const step: number = (2 * Math.PI) / M;
    const density: number[] = new Array<number>(M).fill(step / finest);
    const unit = (a: readonly number[], b: readonly number[]): number[] => {
      const d: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
      const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      return d.map((x: number): number => x / l);
    };
    for (const s of stations) {
      const at: (t: number) => number[] = AutoMovieLoftChain.sampler(chain, s);
      const ring: number[][] = Array.from(
        { length: M },
        (_: unknown, j: number): number[] => at(j * step),
      );
      if (ring.some((p: number[]): boolean => !p.every(Number.isFinite)))
        continue;
      // Over the step from sample j to j + 1: its chord, and the larger of the turns at its two ends.
      const turns: number[] = ring.map((b: number[], j: number): number => {
        const [u, w]: number[][] = [
          unit(ring[(j + M - 1) % M]!, b),
          unit(b, ring[(j + 1) % M]!),
        ];
        return Math.acos(
          Math.max(
            -1,
            Math.min(1, u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!),
          ),
        );
      });
      for (let j: number = 0; j < M; ++j) {
        const [b, c]: number[][] = [ring[j]!, ring[(j + 1) % M]!];
        const chord: number = Math.hypot(
          c[0]! - b[0]!,
          c[1]! - b[1]!,
          c[2]! - b[2]!,
        );
        density[j] = Math.max(
          density[j]!,
          chord / pitch,
          Math.max(turns[j]!, turns[(j + 1) % M]!) / turn,
        );
      }
    }
    const total: number = density.reduce(
      (sum: number, x: number): number => sum + x,
      0,
    );
    const count: number = Math.max(48, 8 * Math.ceil(total / 8));
    const phases: number[] = [];
    let below: number = 0;
    for (let j: number = 0, k: number = 0; j < M && k < count; ++j) {
      // The phases whose share of the integral falls in this step, read linearly within it.
      while (k < count && (total * k) / count <= below + density[j]! + 1e-12) {
        phases.push((j + ((total * k) / count - below) / density[j]!) * step);
        ++k;
      }
      below += density[j]!;
    }
    return phases;
  }

  /**
   * The family's twin across the median plane `z = 0`, as a family of its own.
   *
   * The course and the chart seed are reflected, and the roll negated. A course's chart is `v = u x t`, so the reflected course charts the
   * reflected section with `v` negated, which also reverses its travel: the twin's anchors are the original's in reverse
   * order from the first, each extreme with its `v` negated, and the arc after the twin's anchor `j` is the original's arc
   * before its anchor `K - j`. A feature point is read again on the twin's frame from the reflected section at every knot. An inflection's neighbours swap, so its share is `1 - t` and its turn `-d`, and the twin's
   * dependent anchors keep the original's order of resolution. A relief keeps its stations and heights and takes the
   * negated phase window, the reflected axis and its columns in reverse.
   *
   * @param family A family whose layout is not itself a mirror layout.
   * @param name The twin's chain name.
   */
  export function mirror(family: IAutoMovieHumanConicLoft.IFamily, name: string): IAutoMovieHumanConicLoft.IFamily {
    if (family.native !== undefined) return family.native.mirror(family, name);
    const anchors: IAutoMovieHumanConicSection.IAnchor[] = family.layout.anchors;
    const K: number = anchors.length;
    if (family.layout.mirror)
      throw new Error(
        "mirror: the layout of " + family.name + " cannot be reflected",
      );
    const { at, shoulders }: { at: number[]; shoulders: number } =
      AutoMovieHumanConicSection.offsets(family.layout);

    // Dependent anchors of one level are resolved in index order, each on the nearest anchors already resolved, so a groove's second
    // inflection stands on its first one's chord. Reversed, the twin would resolve them the other way round; it keeps the original's order
    // by a tie-break under one level.
    const order: number[] = AutoMovieHumanConicSection.dependents(
      family.layout,
    );
    const resolved = (
      anchor: IAutoMovieHumanConicSection.IAnchor,
      k: number,
    ): IAutoMovieHumanConicSection.IAnchor =>
      anchor.kind === "m" || anchor.kind === "i"
        ? {
            ...anchor,
            level: (anchor.level ?? 1) + order.indexOf(k) / (2 * order.length),
          }
        : anchor;
    const values: number[][] = [];
    for (let j: number = 0; j < K; ++j) {
      const k: number = (K - j) % K;
      const anchor: IAutoMovieHumanConicSection.IAnchor = anchors[k]!;
      // An inflection stands on its neighbours' chord, and the reversed order swaps its neighbours: its share is read from the other end
      // (`1 - t`), and its turn from the chord, reflected and travelled the other way, changes sign.
      if (anchor.kind === "i") {
        values.push(
          family.values[at[k]!]!.map((t: number): number => 1 - t),
          family.values[at[k]! + 1]!.map((d: number): number => -d),
        );
        continue;
      }
      // A feature point stands on its frame's chord (`AutoMovieHumanConicSection.frame`), and reversed, a run's features stand on other
      // frames (the last one first, on the chord to the next extreme): its numbers are read again below, knot by knot, on the twin's frames.
      if (anchor.kind === "f") {
        values.push(
          family.values[at[k]!]!.map((): number => 0),
          family.values[at[k]! + 1]!.map((): number => 0),
          family.values[at[k]! + 2]!.map((): number => 0),
        );
        continue;
      }
      values.push([...family.values[at[k]!]!]);
      if (anchor.kind !== "m" && anchor.mid !== true)
        values.push(family.values[at[k]! + 1]!.map((v: number): number => -v));
    }
    for (let j: number = 0; j < K; ++j)
      values.push([...family.values[shoulders + (K - j - 1)]!]);
    // Each feature's numbers on the twin: at every knot the original section is resolved, its points reflected (`v` negated) and its
    // tangents reflected and travelled the other way, and each feature is read on its twin frame's chord (`unplace`): the reflected point
    // and direction, so the twin's section at every knot is the original's reflection.
    const twinLayout: IAutoMovieHumanConicSection.ILayout = {
      mirror: false,
      anchors: anchors.map(
        (
          _: IAutoMovieHumanConicSection.IAnchor,
          j: number,
        ): IAutoMovieHumanConicSection.IAnchor => anchors[(K - j) % K]!,
      ),
    };
    const twinAt: number[] = AutoMovieHumanConicSection.offsets(twinLayout).at;
    if (
      anchors.some(
        (anchor: IAutoMovieHumanConicSection.IAnchor): boolean =>
          anchor.kind === "f",
      )
    )
      family.knots.forEach((_: number, m: number): void => {
        const input = AutoMovieHumanConicSection.resolve(
          family.values.map((field: number[]): number => field[m]!),
          family.layout,
        ).input;
        const points: AutoMovieVector2Tuple[] = Array.from(
          { length: K },
          (__: unknown, j: number): AutoMovieVector2Tuple => {
            const p = input.points[(K - j) % K]!;
            return [p[0], -p[1]];
          },
        );
        let previous: number = 0;
        for (let j: number = 0; j < K; ++j) {
          if (anchors[(K - j) % K]!.kind !== "f") continue;
          if (j === 0 || anchors[(K - j + 1) % K]!.kind !== "f") previous = 0;
          const t = input.tangents[(K - j) % K]!;
          const [before, after]: [number, number] =
            AutoMovieHumanConicSection.frame(j, twinLayout);
          const read: { values: [number, number, number]; t: number } =
            AutoMovieHumanConicSection.unplace(
              points[before]!,
              points[after]!,
              points[j]!,
              Math.atan2(t[1], -t[0]),
              previous,
            );
          previous = read.t;
          values[twinAt[j]!]![m] = read.values[0];
          values[twinAt[j]! + 1]![m] = read.values[1];
          values[twinAt[j]! + 2]![m] = read.values[2];
        }
      });
    const flip = (v: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [v[0], v[1], -v[2]];
    return {
      name,
      centres: family.centres.map(flip),
      halves: [...family.halves],
      up: flip(family.up),
      // The reflected chart's `v` is the reflection's negated, so a turn from `u` toward `v` is the reflected turn negated.
      ...(family.roll === undefined
        ? {}
        : {
            roll: {
              knots: [...family.roll.knots],
              values: family.roll.values.map((angle: number): number => -angle),
              ...(family.roll.eases === undefined ? {} : { eases: [...family.roll.eases] }),
            },
          }),
      // The reflected chart keeps `u` and negates `v`, so the twin's origin line is the original's with its `v` shifts negated.
      ...(family.origin === undefined
        ? {}
        : {
            origin: {
              u: [...family.origin.u],
              v: family.origin.v.map((x: number): number =>
                x === 0 ? 0 : -x,
              ),
            },
          }),
      // The twin's anchor `j` is the original's `(K - j) % K`, so its arc `j`, from anchor `j` to `j + 1`, is the original's arc `K - 1 - j`
      // run backwards, and a least per arc is read in that order.
      layout: {
        mirror: false,
        anchors: anchors.map(
          (
            _: IAutoMovieHumanConicSection.IAnchor,
            j: number,
          ): IAutoMovieHumanConicSection.IAnchor =>
            resolved(anchors[(K - j) % K]!, (K - j) % K),
        ),
        ...(family.layout.least === undefined
          ? {}
          : {
              least:
                typeof family.layout.least === "number"
                  ? family.layout.least
                  : anchors.map(
                      (
                        _: IAutoMovieHumanConicSection.IAnchor,
                        j: number,
                      ): number =>
                        AutoMovieHumanConicSection.leastOf(
                          family.layout,
                          K - 1 - j,
                        )!,
                    ),
            }),
      },
      knots: [...family.knots],
      values,
      // A cap's centre lies in the chart, whose `v` the twin negates.
      ...(family.tips === undefined
        ? {}
        : {
            tips: family.tips.map((tip: IAutoMovieHumanConicLoft.ITip | null): IAutoMovieHumanConicLoft.ITip | null =>
              tip === null || tip.centre === undefined
                ? tip
                : { ...tip, centre: [tip.centre[0], -tip.centre[1]] },
            ) as [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null],
          }),
      ...(family.pitch === undefined ? {} : { pitch: family.pitch }),
      ...(family.turn === undefined ? {} : { turn: family.turn }),
      ...(family.reliefs === undefined
        ? {}
        : {
            reliefs: family.reliefs.map(
              (relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
                const turn: number = relief.phases[1] > 0 ? 2 * Math.PI : 0;
                const reverse = (net: number[]): number[] =>
                  net.map(
                    (_: number, i: number): number =>
                      net[
                        i -
                          (i % relief.columns) +
                          relief.columns -
                          1 -
                          (i % relief.columns)
                      ]!,
                  );
                return {
                  ...relief,
                  name: relief.name + ".mirror",
                  phases: [turn - relief.phases[1], turn - relief.phases[0]],
                  axis: flip(relief.axis),
                  heights: reverse(relief.heights),
                  ...(relief.shift === undefined
                    ? {}
                    : { shift: reverse(relief.shift) }),
                  // The twin's phases run the other way, so its turning direction is the reflected one negated.
                  ...(relief.turn === undefined
                    ? {}
                    : {
                        turn: flip(relief.turn).map(
                          (x: number): number => -x,
                        ) as [number, number, number],
                      }),
                };
              },
            ),
          }),
    };
  }

  /** Loft a family through the engine. */
  export function create(
    family: IAutoMovieHumanConicLoft.IFamily,
    stations: number[],
  ): IAutoMovieViewLoft.IResult {
    return AutoMovieViewLoft.create(part(family, stations));
  }
}

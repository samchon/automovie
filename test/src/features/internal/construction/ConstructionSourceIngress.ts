import type {
  AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { ConstructionConicFieldOracle } from "./ConstructionConicFieldOracle";

/** World millimetres or derivatives in their named chart coordinates. */
type Vec3 = [number, number, number];

/** The actually available analytic frame jet exposed by the public axis contract. */
type AxisJet = NonNullable<
  ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
>;

/** A shared original parent and its child, before any engine lofting. */
interface Family {
  /** The actual parent owns the nonpolynomial origin function. */
  parent: IAutoMovieViewPart;

  /** The child consumes that parent callback and adds its own quintic border. */
  child: IAutoMovieViewPart;
}

/** Analytic source fixtures and closed expectations for source-leaf realization. */
export namespace ConstructionSourceIngress {
  /** Five principal samples miss the parent's complete sine course between them. */
  export function family(amplitude: number, variableFullness: boolean): Family {
    const a: IAutoMovieViewPart.IOutline = outline(2, amplitude, 1);
    const b: IAutoMovieViewPart.IOutline = variableFullness
      ? a
      : outline(3, amplitude / 4, 1);
    const axis: AutoMovieViewAxis.IAxis = {
      at: (s: number): AutoMovieLoftFrame.IFrame =>
        frame([amplitude * Math.sin((Math.PI * s) / 5), s, 0], true),
      jet: (
        s: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AxisJet | null => {
        if (parameter !== undefined) return null;
        const k: number = Math.PI / 5;
        return {
          value: axis.at(s),
          first: frame([amplitude * k * Math.cos(k * s), 1, 0], false),
          second: frame([-amplitude * k * k * Math.sin(k * s), 0, 0], false),
        };
      },
    };
    const parent: IAutoMovieViewPart = {
      name: "parent",
      axis,
      stations: [0, 10, 20, 30, 40],
      front: { positive: a, negative: outline(2, amplitude, -1) },
      side: {
        positive: b,
        negative: variableFullness
          ? outline(2, amplitude, -1)
          : outline(3, amplitude / 4, -1),
      },
      fullness: {
        kind: "shoulder",
        shoulder: variableFullness
          ? outline(0.35, 0.01 * amplitude, 1)
          : outline(Math.SQRT2 - 1, 0, 1),
      },
      order: 16,
      samples: 16,
    };
    const childAxis: AutoMovieViewAxis.IAxis = {
      at: (s: number): AutoMovieLoftFrame.IFrame => {
        const f: AutoMovieLoftFrame.IFrame = parent.axis.at(s);
        return { ...f, origin: [f.origin[0] + 0.25 * (s / 40) ** 5, s, 0] };
      },
      jet: (
        s: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AxisJet | null => {
        const j: AxisJet | null = parent.axis.jet!(s, parameter);
        if (j === null) return null;
        const q: number = s / 40;
        return {
          value: childAxis.at(s),
          first: frame([j.first.origin[0] + (1.25 * q ** 4) / 40, 1, 0], false),
          second: frame(
            [j.second.origin[0] + (5 * q ** 3) / 1600, 0, 0],
            false,
          ),
        };
      },
    };
    return { parent, child: { ...parent, name: "child", axis: childAxis } };
  }

  /** Closed world jets: the ellipse guide, or the square-conic diagonal. */
  export function expected(
    amplitude: number,
    s: number,
    variableFullness: boolean,
  ): AutoMovieLoftJet.IJet {
    const q: number = s / 40;
    const k: number = Math.PI / 5;
    const f: number = amplitude * Math.sin(k * s) + 0.25 * q ** 5;
    const fs: number = amplitude * k * Math.cos(k * s) + (1.25 * q ** 4) / 40;
    const fss: number =
      -amplitude * k * k * Math.sin(k * s) + (5 * q ** 3) / 1600;
    const a: readonly [number, number, number] = [
      2 + amplitude * q ** 5,
      (5 * amplitude * q ** 4) / 40,
      (20 * amplitude * q ** 3) / 1600,
    ];
    if (!variableFullness) {
      const b: number = 3 + (amplitude * q ** 5) / 4;
      return {
        p: [f + a[0], s, 0],
        s: [fs + a[1], 1, 0],
        t: [0, 0, a[0]],
        ss: [fss + a[2], 0, 0],
        st: [0, 0, a[1]],
        tt: [-(a[0] ** 3) / (b * b), 0, 0],
      };
    }
    const r: readonly [number, number, number] = [
      0.35 + 0.01 * amplitude * q ** 5,
      (0.05 * amplitude * q ** 4) / 40,
      (0.2 * amplitude * q ** 3) / 1600,
    ];
    const radial: readonly number[] = ConstructionConicFieldOracle.square(a, r);
    const c: number = Math.SQRT1_2;
    return {
      p: [f + c * radial[0]!, s, c * radial[0]!],
      s: [fs + c * radial[1]!, 1, c * radial[1]!],
      t: [-c * radial[0]!, 0, c * radial[0]!],
      ss: [fss + c * radial[3]!, 0, c * radial[3]!],
      st: [-c * radial[1]!, 0, c * radial[1]!],
      tt: [c * (radial[5]! - radial[0]!), 0, c * (radial[5]! - radial[0]!)],
    };
  }
}

/** Exact quintic source values and endpoint jets in normalized q=s/40. */
function outline(
  base: number,
  gain: number,
  sign: 1 | -1,
): IAutoMovieViewPart.IOutline {
  return {
    knots: [
      {
        site: "first",
        station: 0,
        value: sign * base,
        jet: { first: 0, second: 0 },
      },
      {
        site: "last",
        station: 40,
        value: sign * (base + gain),
        jet: { first: sign * 5 * gain, second: sign * 20 * gain },
      },
    ],
  };
}

/** Exact fixed-basis frame value or a derivative with constant axes differentiated. */
function frame(origin: Vec3, value: boolean): AutoMovieLoftFrame.IFrame {
  return {
    origin,
    u: value ? [1, 0, 0] : [0, 0, 0],
    v: value ? [0, 0, 1] : [0, 0, 0],
  };
}

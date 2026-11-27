import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";

/*
 * Explicit complete native ownership, material sampling bounds and source scope.
 */
export namespace AutoMovieHumanNativeSourceAuthority {
  /** Axis-origin speed bound and material breaks; neither is a surface-chord bound. */
  export interface ISampling {
    /** Finite positive world millimetres per material millimetre. */
    maximumSpeed: number;
    /** Finite ordered source-native course breaks, in material millimetres. */
    materialBreaks: readonly number[];
  }

  /** Both named sides use their own complete source and axis, without canonical reconstruction. */
  export interface ISpec {
    /** Invocation-owned complete sources, including each actual reflected name. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Nonidentity course sampling only; absence preserves the requested/cap grid. */
    sampling?: ISampling;
  }
  /*
   * A right-handed reflected chart reverses its local v as well as phase.
   */
  export function reflected(axis: IAutoMovieViewAxis.IAxis): IAutoMovieViewAxis.IAxis {
    const flip = (
      p: readonly number[],
      sign: number,
    ): [number, number, number] => [sign * p[0]!, sign * p[1]!, -sign * p[2]!];
    const frame = (
      f: IAutoMovieLoftSectionFrame,
    ): IAutoMovieLoftSectionFrame => ({
      origin: flip(f.origin, 1),
      u: flip(f.u, 1),
      v: flip(f.v, -1),
    });
    return {
      at: (s: number): IAutoMovieLoftSectionFrame => frame(axis.at(s)),
      jet: (s: number, p: Parameters<NonNullable<IAutoMovieViewAxis.IAxis["jet"]>>[1]): IAutoMovieViewAxisJet.IJet | null => {
        const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(s, p) ?? null;
        return jet === null
          ? null
          : {
              value: frame(jet.value),
              first: frame(jet.first),
              second: frame(jet.second),
            };
      },
    };
  }

  /*
   * Actual radial closure ownership for every scalar source.
   */
  export function ends(part: IAutoMovieViewPart): { bottom?: number; top?: number } {
    return {
      ...(part.pole === "bottom" || part.pole === "both"
        ? { bottom: part.stations[0]! }
        : {}),
      ...(part.pole === "top" || part.pole === "both"
        ? { top: part.stations.at(-1)! }
        : {}),
    };
  }

  /*
   * Read an exact named source; a missing twin never borrows the primary.
   */
  export function named(spec: ISpec, name: string): IAutoMovieViewPart {
    const source: IAutoMovieViewPart | undefined = spec.sources.get(name);
    if (source === undefined || source.name !== name)
      throw new Error("native authority named source unavailable: " + name);
    return source;
  }

  /*
   * Numeric family controls form a binding, independently of display density/features.
   */
  export function controls(a: IAutoMovieHumanConicLoft.IFamily, b: IAutoMovieHumanConicLoft.IFamily): boolean {
    return a.values.length === b.values.length &&
      a.values.every((row: number[], f: number): boolean =>
        row.length === b.values[f]!.length && row.every((v: number, k: number): boolean => v === b.values[f]![k])) &&
      a.knots.length === b.knots.length &&
      a.knots.every((s: number, k: number): boolean => s === b.knots[k]) &&
      JSON.stringify(a.layout) === JSON.stringify(b.layout);
  }

  /*
   * Cap shape and material scope are independent of caller pitch, phase and relief visibility.
   */
  export function capEqual(a: IAutoMovieHumanConicLoft.ITip | null | undefined, b: IAutoMovieHumanConicLoft.ITip | null | undefined): boolean {
    return a === b || (a !== null && a !== undefined && b !== null && b !== undefined &&
      a.from === b.from && a.tip === b.tip && a.own === b.own && a.covered === b.covered &&
      a.rings === b.rings && a.centre?.[0] === b.centre?.[0] && a.centre?.[1] === b.centre?.[1]);
  }

  /*
   * Admit the selected source against the invocation's unchanged material/cap binding.
   */
  export function select(spec: ISpec, family: IAutoMovieHumanConicLoft.IFamily, expected: IAutoMovieHumanConicLoft.IFamily,
    originals: ReadonlyMap<string, IAutoMovieViewPart>): IAutoMovieViewPart {
    const source: IAutoMovieViewPart = named(spec, family.name);
    const original: IAutoMovieViewPart | undefined = originals.get(family.name);
    if (!controls(family, expected) ||
      !capEqual(family.tips?.[0], expected.tips?.[0]) ||
      !capEqual(family.tips?.[1], expected.tips?.[1]) || original === undefined ||
      source.pole !== original.pole || source.stations[0] !== original.stations[0] ||
      source.stations.at(-1) !== original.stations.at(-1))
      throw new Error("native authority material/cap binding mismatch: " + family.name);
    return source;
  }

  /*
   * Refine only emitted rows; every original cap row and requested course break survives.
   */
  export function rows(metadata: ISampling | undefined, stations: number[],
    domain: readonly [number, number]): number[] {
    if (metadata === undefined) return stations;
    const speed: number = metadata.maximumSpeed;
    if (!(Number.isFinite(speed) && speed > 0) || metadata.materialBreaks.some(
      (s: number, k: number): boolean => !Number.isFinite(s) || s < domain[0] || s > domain[1] ||
        (k > 0 && s <= metadata.materialBreaks[k - 1]!)))
      throw new Error("native authority sampling bound/breaks unavailable");
    const base: number[] = [...new Set([...stations, ...metadata.materialBreaks])].sort(
      (a: number, b: number): number => a - b);
    if (base.length < 2 || base[0]! < domain[0] || base.at(-1)! > domain[1])
      throw new Error("native authority sampling leaves its material domain");
    const cuts: number = Math.max(1, Math.ceil(speed));
    const result: number[] = [base[0]!];
    for (let k: number = 1; k < base.length; ++k) {
      const from: number = base[k - 1]!, to: number = base[k]!, span: number = to - from;
      if (!(Number.isFinite(span) && span > 0 && Number.isSafeInteger(cuts)))
        throw new Error("native authority sampling interval unavailable");
      for (let j: number = 1; j <= cuts; ++j) {
        const s: number = j === cuts ? to : from + span * j / cuts;
        const previous: number = result.at(-1)!;
        if (!(Number.isFinite(s) && s > previous && s <= to &&
          Number.isFinite(speed * (s - previous)) && speed * (s - previous) <= span))
          throw new Error("native authority sampling row/speed is not representable");
        result.push(s);
      }
    }
    return result;
  }
}

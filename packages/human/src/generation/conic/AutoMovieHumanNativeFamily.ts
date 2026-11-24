import { AutoMovieHumanConicLoft as H } from "./AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection as S } from "./AutoMovieHumanConicSection";
import { AutoMovieHumanNativeControlLaw as N } from "./AutoMovieHumanNativeControlLaw";
import {
  AutoMovieHumanNativeScaleProfile as Profile,
} from "./AutoMovieHumanNativeScaleProfile";
import {
  AutoMovieHumanNativeSourceAuthority as A,
} from "./AutoMovieHumanNativeSourceAuthority";
import { AutoMovieHumanNativeSourceLaw } from "./AutoMovieHumanNativeSourceLaw";
import { AutoMovieLoftViewRead, AutoMovieLoftViewSource } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieViewPart,
  IAutoMovieHumanNativeFamily,
} from "@automovie/interface";

/** A full native source generated from qualified F1 controls, independently of any loft. */
export namespace AutoMovieHumanNativeFamily {
  /** Canonical controls and their prepared scalar reader in one cap scope. */
  interface IPreparedSource {
    source: IAutoMovieViewPart;
    values: ReturnType<typeof AutoMovieLoftViewRead.prepare>["values"];
  }

  /** The bound native source and control inputs for this invocation. */
  export type ISpec = IAutoMovieHumanNativeFamily.ISpec;

  /**
   * Encode every affine original point/tangent back into its unchanged native layout. With a centre off the chart origin each point
   * becomes centre + scale·(point - centre); a section that stands on its median line has no v to move.
   */
  function vector(
    values: readonly number[],
    layout: IAutoMovieHumanConicSection.ILayout,
    scale: AutoMovieVector2Tuple,
    centre: AutoMovieVector2Tuple = [0, 0],
  ): number[] {
    if (scale[0] === 1 && scale[1] === 1) return [...values];
    const moved: boolean = centre[0] !== 0 || centre[1] !== 0;
    if (!moved && scale[0] === scale[1])
      return values.map((value: number, field: number): number =>
        S.units(layout)[field] === "mm" ? value * scale[0] : value,
      );
    if (
      centre[1] !== 0 &&
      scale[1] !== 1 &&
      (layout.mirror ||
        layout.anchors.some((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.mid === true))
    )
      throw new Error(
        "a section on its median line scales about a centre on that line: the centre's v must be 0",
      );
    const chain: IAutoMovieHumanConicSection.IChain = N.section(
      S.resolve(values, layout),
      centre,
      [0, 0],
      scale,
    );
    const result: number[] = [...values];
    const offsets = S.offsets(layout);
    const done: (AutoMovieVector2Tuple | null)[] = layout.anchors.map((): null => null);
    let previous: number = 0;
    layout.anchors.forEach((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): void => {
      const f: number = offsets.at[k]!;
      const p: AutoMovieVector2Tuple = chain.input.points[k]!;
      const t: AutoMovieVector2Tuple = chain.input.tangents[k]!;
      if (anchor.kind === "u" || anchor.kind === "v") {
        result[f] = p[0];
        if (anchor.mid !== true) result[f + 1] = p[1];
        done[k] = p;
      } else if (anchor.kind === "f") {
        if (k === 0 || layout.anchors[k - 1]!.kind !== "f") previous = 0;
        const [before, after]: [number, number] = S.frame(k, layout);
        const read = S.unplace(
          chain.input.points[before]!,
          chain.input.points[after]!,
          p,
          Math.atan2(t[1], t[0]),
          previous,
        );
        result[f] = read.values[0];
        result[f + 1] = read.values[1];
        result[f + 2] =
          read.values[2] +
          2 *
            Math.PI *
            Math.round((values[f + 2]! - read.values[2]) / (2 * Math.PI));
        previous = read.t;
        done[k] = p;
      }
    });
    for (const k of S.dependents(layout)) {
      const anchor: IAutoMovieHumanConicSection.IAnchor = layout.anchors[k]!;
      if (anchor.kind === "i") {
        const [before, after]: [number, number] = S.neighbours(k, done);
        const a: AutoMovieVector2Tuple = chain.input.points[before]!;
        const b: AutoMovieVector2Tuple = chain.input.points[after]!;
        const t: AutoMovieVector2Tuple = chain.input.tangents[k]!;
        const raw: number =
          Math.atan2(t[1], t[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
        result[offsets.at[k]! + 1] =
          raw +
          2 *
            Math.PI *
            Math.round((values[offsets.at[k]! + 1]! - raw) / (2 * Math.PI));
      }
      done[k] = chain.input.points[k]!;
    }
    return result;
  }

  /**
   * Generate complete planar controls, independent fixed-direction features and native source functions together.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Affine invariance carries all planar conic controls; unchanged shares/layout retain their role. Actual derived native outlines own the new interpolants, with original protected scalar2 reproduced by shared-jet quintics and native parameter conversion. A jet-carrying station-varying scale is applied to the source function by the product rule (NativeSourceLaw), so a site junction binds a value the source already holds: to the stored original when the request keeps the generated caps, and to the original controls under the requested caps when it changes them (production drops each limb's distal cap). A plain varying scale keeps the knot-sampled controls, and a junction it disagrees with is refused by the control law under the family's and outline's names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One family owns its axis, source and reflection callbacks; every existing ConicLoft consumer reaches those same definitions before lofting.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no completed child loft to generate a parent boundary and does not replace source leaves after construction. Feature amplitude/window is evaluated once at its site with a fixed invocation axis/turn; it is not ambient-field transport.
   * @evidence contracts/development/common.md#meaningful-documentation Names original/native ownership, material-map limits, fixed feature direction and protected actual scalar derivatives.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear control and net passes precede the existing part generation; each protected scalar needs its bounded union/native preparation. No whole skin is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual accepted source controls/clocks are shared by every native consumer in the invocation; identical directional controls keep their exact scalar owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned family retains one spec and its borrowed immutable original bank for reader lifetime, with no global cache or process.
   */
  export function create(spec: ISpec): IAutoMovieHumanConicLoft.IFamily {
    const prior: IAutoMovieHumanConicLoft.IFamily = spec.original;
    const centreAt = (s: number): AutoMovieVector2Tuple =>
      spec.centre === undefined ? [0, 0] : spec.centre.jet(s).value;
    const columns: number[][] = prior.knots.map(
      (s: number, k: number): number[] =>
        vector(
          prior.values.map((row: number[]): number => row[k]!),
          prior.layout,
          spec.scale(s),
          centreAt(s),
        ),
    );
    const values: number[][] = prior.values.map(
      (_: number[], f: number): number[] =>
        columns.map((column: number[]): number => column[f]!),
    );
    const tip = (end: IAutoMovieHumanConicLoft.ITip | null): IAutoMovieHumanConicLoft.ITip | null =>
      end === null
        ? null
        : {
            ...end,
            from: spec.station(end.from),
            tip: spec.station(end.tip),
            ...(end.centre === undefined
              ? {}
              : {
                  centre: end.centre.map(
                    (x: number, k: number): number =>
                      spec.centre === undefined
                        ? x * spec.scale(end.from)[k]!
                        : centreAt(end.from)[k]! +
                          spec.scale(end.from)[k]! *
                            (x - centreAt(end.from)[k]!),
                  ) as [number, number],
                }),
          };
    const made: IAutoMovieHumanConicLoft.IFamily = {
      ...spec.bone,
      knots: prior.knots.map(spec.station),
      values,
      reliefs: spec.features,
      ...(prior.tips === undefined
        ? {}
        : { tips: [tip(prior.tips[0]), tip(prior.tips[1])] }),
    };
    const original: IAutoMovieViewPart | undefined = spec.originals.get(
      prior.name,
    );
    if (original === undefined)
      throw new Error("native original controls absent for " + prior.name);
    // A scale that carries its jet is applied to the source function itself, a(s)·f(s), when the original source is read in this
    // family's own material stations; knot-sampled controls would leave the wall between knots off the law. Such a scale is uniform
    // only when it is constant by construction: equal samples at the family's knots do not show what it does between them.
    const profile: Profile.IScale | null = Profile.of(spec.scale);
    const firstScale: AutoMovieVector2Tuple = spec.scale(prior.knots[0]!);
    const uniform: boolean =
      (profile === null || profile.constant !== null) &&
      firstScale[0] === firstScale[1] &&
      prior.knots.every(
        (s: number): boolean =>
          spec.scale(s)[0] === firstScale[0] &&
          spec.scale(s)[1] === firstScale[1] &&
          spec.station(s) === s,
      );
    const material: boolean =
      prior.knots.every((s: number): boolean => spec.station(s) === s) &&
      original.stations.every((s: number): boolean => spec.station(s) === s);
    /** The caller cap/scalar scope is prepared once, independently of tessellation. */
    const prepareSource = (family: IAutoMovieHumanConicLoft.IFamily): IPreparedSource => {
      const selected: IAutoMovieViewPart | undefined = spec.authority === undefined ? undefined :
        A.select(spec.authority, family, made, spec.originals);
      const canonical: IAutoMovieViewPart = selected ?? H.part(
        { ...family, native: undefined, reliefs: undefined, turn: undefined },
        original.stations.map(spec.station),
      );
      const sameControls: boolean = A.controls(family, made);
      const sameCaps: boolean =
        A.capEqual(family.tips?.[0], made.tips?.[0]) &&
        A.capEqual(family.tips?.[1], made.tips?.[1]) &&
        canonical.pole === original.pole &&
        canonical.stations[0] === original.stations[0] &&
        canonical.stations.at(-1) === original.stations.at(-1);
      // A request whose caps differ from the generated family's (production drops a limb's distal cap, as its original source does)
      // has its own source function: the original controls under the requested caps, unscaled. A jet-carrying scale applies to that
      // function as it does to the stored original; scaling its knot controls instead would miss the law between the family's knots.
      const uncap = (end: IAutoMovieHumanConicLoft.ITip | null): IAutoMovieHumanConicLoft.ITip | null =>
        end === null || end.centre === undefined
          ? end
          : {
              ...end,
              centre: end.centre.map(
                (x: number, k: number): number =>
                  centreAt(end.from)[k]! +
                  (x - centreAt(end.from)[k]!) / spec.scale(end.from)[k]!,
              ) as [number, number],
            };
      const requested = (): IAutoMovieViewPart =>
        H.part(
          {
            ...family,
            native: undefined,
            reliefs: undefined,
            turn: undefined,
            values: prior.values,
            knots: prior.knots,
            ...(family.tips === undefined
              ? {}
              : { tips: [uncap(family.tips[0]), uncap(family.tips[1])] }),
          },
          original.stations,
        );
      // A scaling centre moves coordinates as a station function even under a constant ratio, so only the function law can carry
      // it; an exact unit ratio leaves every coordinate where it is and keeps the paths below.
      const centred: boolean =
        spec.centre !== undefined &&
        !(
          (uniform || (profile !== null && profile.constant !== null)) &&
          firstScale[0] === 1 &&
          firstScale[1] === 1
        );
      if (
        centred &&
        selected === undefined &&
        !(sameControls && profile !== null && material)
      )
        throw new Error(
          "a scaling centre needs a jet-carrying scale on unchanged controls in the family's own material stations: " +
            family.name,
        );
      const source: IAutoMovieViewPart =
        selected ??
        (sameControls && sameCaps && uniform && !centred
          ? AutoMovieHumanNativeSourceLaw(original, spec.axis, firstScale, [])
          : sameControls && profile !== null && material
            ? AutoMovieHumanNativeSourceLaw(
                sameCaps ? original : requested(),
                spec.axis,
                profile,
                [],
                centred ? spec.centre : undefined,
              )
            : canonical);
      const scalar = (
        next: IAutoMovieViewPart.IOutline,
        select: (part: IAutoMovieViewPart) => IAutoMovieViewPart.IOutline,
        radial: boolean,
        label: string,
      ): IAutoMovieViewPart.IOutline => {
        let result: IAutoMovieViewPart.IOutline = next;
        for (const owner of spec.protection) {
          const target: IAutoMovieViewPart | undefined = owner.sources.get(
            selected === undefined ? prior.name : family.name,
          );
          if (target === undefined)
            throw new Error(
              "native shared boundary source absent: " + prior.name,
            );
          try {
            result = N.outline(
              select(target),
              result,
              owner.requirement,
              radial ? A.ends(target) : {},
              radial ? A.ends(canonical) : {},
            );
          } catch (error: unknown) {
            throw new Error(
              `${family.name} ${label}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
        return result;
      };
      const quarters = <T>(
        items: IAutoMovieViewPart.IQuarters<T>,
        apply: (item: T, k: number) => T,
      ): IAutoMovieViewPart.IQuarters<T> =>
        items.map(apply) as IAutoMovieViewPart.IQuarters<T>;
      const top = (part: IAutoMovieViewPart): IAutoMovieViewPart.ITop => {
        if (part.fullness.kind !== "top")
          throw new Error(
            "native shared control target requires complete top source",
          );
        return part.fullness;
      };
      let fullness: IAutoMovieViewPart.Fullness = source.fullness;
      if (spec.protection.length !== 0) {
        if (fullness.kind !== "top")
          throw new Error(
            "native protected source needs complete top controls",
          );
        const split = (
          item: IAutoMovieViewPart.ISplit,
          select: (part: IAutoMovieViewPart) => IAutoMovieViewPart.ISplit,
          label: string,
        ): IAutoMovieViewPart.ISplit => ({
          u: scalar(item.u, (p) => select(p).u, true, label + ".u"),
          v: scalar(item.v, (p) => select(p).v, true, label + ".v"),
          angle: scalar(
            item.angle,
            (p) => select(p).angle,
            false,
            label + ".angle",
          ),
          shoulder: scalar(
            item.shoulder,
            (p) => select(p).shoulder,
            false,
            label + ".shoulder",
          ),
        });
        fullness = {
          ...fullness,
          shoulders: quarters(fullness.shoulders, (item, q) =>
            scalar(item, (p) => top(p).shoulders[q]!, false, "shoulders." + q),
          ),
          ...(fullness.touch === undefined
            ? {}
            : {
                touch: quarters(fullness.touch, (item, q) =>
                  scalar(item, (p) => top(p).touch![q]!, true, "touch." + q),
                ),
              }),
          ...(fullness.splits === undefined
            ? {}
            : {
                splits: quarters(fullness.splits, (item, q) =>
                  split(item, (p) => top(p).splits![q]!, "splits." + q),
                ),
              }),
          ...(fullness.pieces === undefined
            ? {}
            : {
                pieces: quarters(fullness.pieces, (items, q) =>
                  items.map((item, j) =>
                    split(
                      item,
                      (p) => top(p).pieces![q]![j]!,
                      "pieces." + q + "." + j,
                    ),
                  ),
                ),
              }),
        };
      }
      const resolved: IAutoMovieViewPart = {
        ...source,
        axis: selected?.axis ?? spec.axis,
        front:
          spec.protection.length === 0
            ? source.front
            : {
                positive: scalar(
                  source.front.positive,
                  (p) => p.front.positive,
                  true,
                  "front.positive",
                ),
                negative: scalar(
                  source.front.negative,
                  (p) => p.front.negative,
                  true,
                  "front.negative",
                ),
              },
        side:
          spec.protection.length === 0
            ? source.side
            : {
                positive: scalar(
                  source.side.positive,
                  (p) => p.side.positive,
                  true,
                  "side.positive",
                ),
                negative: scalar(
                  source.side.negative,
                  (p) => p.side.negative,
                  true,
                  "side.negative",
                ),
              },
        fullness,
      };
      const native = AutoMovieLoftViewSource.create(resolved);
      if (native === null || native.source === null)
        throw new Error("native sampling source unavailable: " + family.name);
      return { source: resolved, values: AutoMovieLoftViewRead.prepare(native.source).values };
    };

    /** Carry one canonical field, cap and density estimate through requested layer grids. */
    const preparePart: NonNullable<IAutoMovieHumanConicLoft.INative["preparePart"]> = (family) => {
      const prepared: IPreparedSource = prepareSource(family);
      const girth: number = Math.max(
        ...prepared.source.stations.map((s: number): number => {
          const row = prepared.values(s);
          if (typeof row === "string") throw new Error(row);
          const a: number = (row.extents[0]! + row.extents[2]!) / 2,
            b: number = (row.extents[1]! + row.extents[3]!) / 2;
          return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        }),
      );
      return (requested, sampling): IAutoMovieViewPart => {
        // Layer/refinement requests cannot select another scalar function.
        if (
          requested.length < 2 ||
          requested.some(
            (s: number, k: number): boolean =>
              !Number.isFinite(s) || (k > 0 && s <= requested[k - 1]!),
          )
        )
          throw new Error("native sampling stations must increase");
        const [bottom, top] = family.tips ?? [null, null];
        const stations: number[] = A.rows(spec.authority?.sampling, [
          ...new Set([
            ...prepared.source.stations.filter(
              (s: number): boolean =>
                (bottom !== null && s <= bottom.from) ||
                (top !== null && s >= top.from),
            ),
            ...requested.filter(
              (s: number): boolean =>
                (bottom === null || s > bottom.from) &&
                (top === null || s < top.from),
            ),
          ]),
        ].sort((a: number, b: number): number => a - b),
          [prepared.source.stations[0]!, prepared.source.stations.at(-1)!]);
        const actual: IAutoMovieViewPart = {
          ...prepared.source,
          name: family.name,
          axis: prepared.source.axis,
          stations,
          samples: H.phaseCount(sampling, girth),
          phases: undefined,
          reliefs: sampling.reliefs?.length === 0 ? undefined : sampling.reliefs,
        };
        // Match the ordinary producer's sampling scope: cap starts are
        // regular wall rings, while a collapsed pole has no turning chord.
        const wall: number[] = stations.filter(
          (s: number): boolean =>
            (bottom === null || s >= bottom.from) &&
            (top === null || s <= top.from),
        );
        return H.sampled(sampling, actual, wall);
      };
    };
    made.native = {
      axis: spec.authority === undefined ? spec.axis : A.named(spec.authority, made.name).axis,
      source: (family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieViewPart => ({
        ...prepareSource(family).source,
        name: family.name,
        reliefs: family.reliefs?.length === 0 ? undefined : family.reliefs,
      }),
      part: (family: IAutoMovieHumanConicLoft.IFamily, requested: number[]): IAutoMovieViewPart =>
        preparePart(family)(requested, family),
      preparePart,
      mirror: (family: IAutoMovieHumanConicLoft.IFamily, name: string): IAutoMovieHumanConicLoft.IFamily => {
        if (spec.authority !== undefined) A.select(spec.authority, family, made, spec.originals);
        const mirrored: IAutoMovieHumanConicLoft.IFamily = H.mirror(
          { ...family, native: undefined },
          name,
        );
        // The twin's chart has its v negated (H.mirror), so its scaling centre is the same line with v and its derivatives negated.
        const line: Profile.ICentre | undefined = spec.centre;
        const reflectedFamily: IAutoMovieHumanConicLoft.IFamily = create({
          ...spec,
          ...(line === undefined
            ? {}
            : {
                centre: {
                  breaks: line.breaks,
                  jet: (s: number): Profile.IJet => {
                    const jet: Profile.IJet = line.jet(s);
                    return {
                      value: [jet.value[0], -jet.value[1]],
                      first: [jet.first[0], -jet.first[1]],
                      second: [jet.second[0], -jet.second[1]],
                    };
                  },
                },
              }),
          original: H.mirror(prior, name),
          bone: H.mirror(spec.bone, name),
          axis: spec.authority === undefined ? A.reflected(spec.axis) : A.named(spec.authority, name).axis,
          features: mirrored.reliefs ?? [],
        });
        return {
          ...reflectedFamily,
          ...mirrored,
          ...(spec.authority === undefined ? {} : {
            values: reflectedFamily.values, knots: reflectedFamily.knots,
            layout: reflectedFamily.layout, tips: reflectedFamily.tips,
          }),
          native: reflectedFamily.native,
        };
      },
    };
    return made;
  }
}

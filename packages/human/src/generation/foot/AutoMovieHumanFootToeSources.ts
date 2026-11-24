import { AutoMovieSolidVector as V } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanDigitWalk,
  IAutoMovieHumanFootConnection,
  IAutoMovieHumanFootPart,
  IAutoMovieHumanFootSource,
  IAutoMovieHumanFootToeSources,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanToeVertical,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";
import { AutoMovieHumanFootSource } from "./AutoMovieHumanFootSource";
import { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";
import { AutoMovieHumanToeVertical } from "./AutoMovieHumanToeVertical";

/**
 * Toe inputs from the shared foot scalar/section/frame owner, before any
 * complete parent part exists.
 */
export namespace AutoMovieHumanFootToeSources {
  /**
   * Enumerate the actual toe production names without preparing any geometry.
   *
   * @evidence contracts/common.md#principled-implementation The same FootPlaces.TOES row inventory drives both these names and the attachment producer that consumes them.
   * @evidence contracts/common.md#clear-and-simple-design One naming owner serves production and lazy viewer selection metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No viewer-only count, parallel name table, source preparation or missing-part success is introduced.
   * @evidence contracts/common.md#meaningful-documentation States that these are production identifiers and enumeration performs no geometry work.
   * @evidence contracts/performance.md#efficient-algorithms One O(n) pass over the retained toe rows creates n names, with n currently five.
   * @evidence contracts/performance.md#reuse-equivalent-work Each attachment definition reads this name list once; metadata needs no geometric definition to recover identifiers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the finite string array; no global cache or source context is retained.
   */
  export function names(side: "left" | "right"): readonly string[] {
    return Array.from(
      AutoMovieHumanFootPlaces.TOES.keys(),
      (index: number): string => `toe.${side}.${index + 1}`,
    );
  }

  /**
   * Generate skin attachments from the foot's source support and the canonical
   * phalange input.
   */
  export function create(
    foot: IAutoMovieHumanFootPart.IInput,
    controls: IAutoMovieHumanSiteControls.IOutput,
    phalangealLengthScale: number = 1,
  ): IAutoMovieHumanFootToeSources.ICandidate[] {
    const region:
      | NonNullable<IAutoMovieHumanFootPart.IInput["metatarsal"]>
      | undefined = foot.metatarsal;
    if (region === undefined)
      throw new Error(
        "Toe attachments need the defining foot's metatarsal supports",
      );
    if (!(Number.isFinite(phalangealLengthScale) && phalangealLengthScale > 0))
      throw new Error("Toe phalanx length scale must be finite and positive");
    const sign: number = foot.side === "left" ? 1 : -1;
    const lateral: AutoMovieVector3Tuple = [
      -sign * foot.along[2],
      0,
      sign * foot.along[0],
    ];
    const L: number = foot.length;
    const tips: readonly { tip: number; across: number }[] =
      AutoMovieHumanFootPlaces.TOES;
    const partNames: readonly string[] = names(foot.side);

    // Scale the relative phalanx pattern to the public heel-to-longest-toe length.
    const longest: number = Math.max(
      ...tips.map((tip: { tip: number }): number => tip.tip),
    );
    const transverse: number = region.transverseScale;
    const owner: IAutoMovieHumanFootSource.ISource =
      AutoMovieHumanFootSource.fromControls(controls);
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const expected: readonly [number, number] =
      AutoMovieHumanFootPrior.PRIOR.expected.breadth;
    const nominalBreadth: number = ((expected[0] + expected[1]) * L) / 2;
    const stations: number[] = [
      region.span[1],
      region.span[1] + (cascade[0]! * L) / AutoMovieHumanFootPrior.CASCADE_FOOT,
    ];
    for (const drop of cascade.slice(1))
      stations.push(
        stations.at(-1)! - (drop * L) / AutoMovieHumanFootPrior.CASCADE_FOOT,
      );
    const toes = tips.map(
      (
        t: { tip: number; across: number },
        k: number,
      ): IAutoMovieHumanFootToeSources.ICandidate => {
        const gaps: number[] = [
          k > 0 ? t.across - tips[k - 1]!.across : null,
          k + 1 < tips.length ? tips[k + 1]!.across - t.across : null,
        ].filter((g: number | null): g is number => g !== null);
        const gap: number =
          gaps.reduce((a: number, g: number): number => a + Math.abs(g), 0) /
          gaps.length;
        const breadth: number = gap * transverse;
        const terminal: number = t.tip / longest;

        // Convert nominal across shares with the public ANSUR breadth-to-
        // length midrange before applying the transverse-only measurement.
        // This keeps breadth edits from changing the cap and floor datums.
        const distalDepth: number =
          AutoMovieHumanFootPrior.PRIOR.toes[k]!.depth * gap * nominalBreadth;
        const height: number = distalDepth / 2;
        const at: (along: number, across: number) => AutoMovieVector3Tuple = (
          along: number,
          across: number,
        ): AutoMovieVector3Tuple => [
          foot.heel[0] + foot.along[0] * along + lateral[0] * across,
          height,
          foot.heel[2] + foot.along[2] * along + lateral[2] * across,
        ];
        const rootAcross: number =
          -region.supports.medial +
          AutoMovieHumanFootPrior.PRIOR.toes[k]!.head *
            (region.supports.lateral + region.supports.medial);
        const rootAlong = stations[k]!;
        const nominalAlong = terminal * L;
        const nominalAcross = t.across * transverse;
        const root: AutoMovieVector3Tuple = at(rootAlong, rootAcross);
        const along = nominalAlong - rootAlong;
        const across = nominalAcross - rootAcross;
        if (!(along > distalDepth / 2))
          throw new Error(
            `The ${foot.side} toe ${k + 1} has no shaft before its distal cap`,
          );
        const acrossAt = (
          point: AutoMovieVector3Tuple,
          station: number,
        ): number => {
          const parent: ReturnType<IAutoMovieViewPart["axis"]["at"]> = (
            owner.axis ?? owner.part.axis
          ).at(station);
          return V.dot(V.sub(point, parent.origin), parent.v);
        };
        const slope = (-sign * across) / along;
        const rootChord = AutoMovieHumanFootConnection.chord(
          owner,
          rootAlong,
          acrossAt(root, rootAlong),
          slope,
        );
        // The default skin carries the heel-to-longest tape. An explicit
        // phalanx case changes the supported root-to-apex span. A held parent
        // chord supplies the root height and the distal section owns the pad.
        // Use the same physical length projection as the canonical toe line.
        const plan = Math.hypot(along, across);
        const rise = height - rootChord.centre;
        const advance =
          phalangealLengthScale === 1
            ? 1
            : AutoMovieHumanFootToeLines.planFactor(
                plan,
                phalangealLengthScale * Math.hypot(plan, rise),
                rise,
              );
        const apexAlong =
          phalangealLengthScale === 1
            ? nominalAlong
            : rootAlong + advance * along;
        const apexAcross =
          phalangealLengthScale === 1
            ? nominalAcross
            : rootAcross + advance * across;
        const apex: AutoMovieVector3Tuple = at(apexAlong, apexAcross);

        // The foot-along chart owns the cap reach as well as width.

        // An oblique centreline's arclength would re-interpret that chart.
        const span: number = apexAlong - rootAlong;
        if (!(span > distalDepth / 2))
          throw new Error(
            `The ${foot.side} toe ${k + 1} has no shaft before its distal cap`,
          );
        const tip: AutoMovieVector3Tuple = [
          apex[0] - ((apex[0] - root[0]) * distalDepth) / (2 * span),
          height,
          apex[2] - ((apex[2] - root[2]) * distalDepth) / (2 * span),
        ];
        const mid: AutoMovieVector3Tuple = [
          (root[0] + tip[0]) / 2,
          height,
          (root[2] + tip[2]) / 2,
        ];
        const inside: AutoMovieVector3Tuple = [
          root[0] - (mid[0] - root[0]) / 2,
          height,
          root[2] - (mid[2] - root[2]) / 2,
        ];
        const insideAlong: number = rootAlong - (span - distalDepth / 2) / 4;
        const sourceStations: number[] = [
          0,
          rootAlong - insideAlong,
          (rootAlong + apexAlong - distalDepth / 2) / 2 - insideAlong,
          apexAlong - distalDepth / 2 - insideAlong,
          apexAlong - insideAlong,
        ];
        const hiddenChart: number = acrossAt(inside, insideAlong);
        const hiddenChord: IAutoMovieHumanFootConnection.IChord =
          AutoMovieHumanFootConnection.chord(
            owner,
            insideAlong,
            hiddenChart,
            slope,
          );
        if (!(rootChord.depth > 0 && distalDepth > 0))
          throw new Error(
            `The ${foot.side} toe ${k + 1} needs positive actual parent and distal depths`,
          );
        const vertical: IAutoMovieHumanToeVertical.ISource =
          AutoMovieHumanToeVertical.create(
            sourceStations,
            rootChord,
            hiddenChord,
            distalDepth,
          );
        [inside, root, mid, tip, apex].forEach(
          (point: AutoMovieVector3Tuple, index: number): void => {
            point[1] = vertical.at(sourceStations[index]!)[0];
          },
        );
        const law: (depth: number) => IAutoMovieHumanDigitWalk.ISiteLaw = (
          depth: number,
        ): IAutoMovieHumanDigitWalk.ISiteLaw => ({
          breadth,
          depth,
          dorsal: 0.5,
          shoulder: Math.SQRT2 - 1,
        });
        const near: IAutoMovieHumanDigitWalk.ISiteLaw = law(rootChord.depth);
        const far: IAutoMovieHumanDigitWalk.ISiteLaw = law(distalDepth);
        const profiles: IAutoMovieHumanDigitWalk.IInput =
          AutoMovieHumanDigitInterim.walk(
            partNames[k]!,
            [inside, root, mid, tip],
            [0, 1, 0],
            near,
            far,
          );
        return {
          root,
          apex,
          part: {
            name: profiles.name,
            centres: profiles.centres,
            apex,
            along: foot.along,
            height,
            vertical,
            law: profiles.law,
            ranges: undefined,
            order: profiles.order,
            gap: profiles.gap,
          },
        };
      },
    );
    return pack(foot, toes, lateral);
  }

  /**
   * ESTIMATE: neighbouring sections each own half the space between their
   * actual axes in the observation plane. Both axes are affine in that clock,
   * so the narrower endpoint of their common span bounds the whole span. A
   * closed Bézier hull carries this bound through the skin source. Individual
   * width estimates continue to cap each side independently.
   */
  function pack(
    foot: IAutoMovieHumanFootPart.IInput,
    toes: readonly IAutoMovieHumanFootToeSources.ICandidate[],
    lateral: AutoMovieVector3Tuple,
  ): IAutoMovieHumanFootToeSources.ICandidate[] {
    const axes = toes.map(
      ({
        part,
      }): { first: number; last: number; across: (s: number) => number } => {
        const first = V.sub(part.centres[0]!, foot.heel);
        const last = V.sub(part.apex, foot.heel);
        const start = V.dot(first, foot.along);
        const end = V.dot(last, foot.along);
        const q = V.dot(first, lateral);
        const slope = V.dot(V.sub(last, first), lateral) / (end - start);
        return {
          first: start,
          last: end,
          across: (s: number): number => q + slope * (s - start),
        };
      },
    );
    const limits = axes.slice(0, -1).map((a, k): number => {
      const b = axes[k + 1]!;
      const start = Math.max(a.first, b.first);
      const end = Math.min(a.last, b.last);
      if (start >= end) return Infinity;
      const width =
        0.5 *
        Math.min(
          b.across(start) - a.across(start),
          b.across(end) - a.across(end),
        );
      if (!(width > 0))
        throw new Error(
          `The adjacent toe courses ${toes[k]!.part.name} and ${toes[k + 1]!.part.name} cross in their source span`,
        );
      return width;
    });
    return toes.map(
      ({ root, apex, part }, k): IAutoMovieHumanFootToeSources.ICandidate => {
        const nominal = part.law("base").breadth / 2;
        const inner = Math.min(nominal, limits[k - 1] ?? Infinity);
        const outer = Math.min(nominal, limits[k] ?? Infinity);
        const [positive, negative] =
          foot.side === "left" ? [inner, outer] : [outer, inner];
        const law = part.law;
        return {
          root,
          apex,
          part: {
            ...part,
            law: (site: string): IAutoMovieHumanDigitWalk.ISiteLaw => ({
              ...law(site),
              breadth: positive + negative,
            }),
            halfBreadths: [positive, negative],
            ranges: [
              undefined,
              { minimum: 0, maximum: positive },
              undefined,
              { minimum: -negative, maximum: 0 },
            ],
          },
        };
      },
    );
  }
}

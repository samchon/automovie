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
import { AutoMovieHumanToeVertical } from "./AutoMovieHumanToeVertical";

/** Toe inputs from the shared foot scalar/section/frame owner, before any complete parent part exists. */
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

  /** Generate skin attachments from the identical actual foot input, without a second placement or support solve. */
  export function create(
    foot: IAutoMovieHumanFootPart.IInput,
    controls: IAutoMovieHumanSiteControls.IOutput,
  ): IAutoMovieHumanFootToeSources.ICandidate[] {
    const region:
      | NonNullable<IAutoMovieHumanFootPart.IInput["metatarsal"]>
      | undefined = foot.metatarsal;
    if (region === undefined)
      throw new Error(
        "Toe attachments need the defining foot's metatarsal supports",
      );
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

    // A maximum of population means need not equal the mean's unit maximum.

    // Treat this retained pattern as relative toe lengths, then let public

    // heel-to-longest-toe length own its actual longitudinal support.
    const longest: number = Math.max(
      ...tips.map((tip: { tip: number }): number => tip.tip),
    );
    const transverse: number = region.transverseScale;
    const owner: IAutoMovieHumanFootSource.ISource =
      AutoMovieHumanFootSource.fromControls(controls);
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const stations: number[] = [
      region.span[1],
      region.span[1] + (cascade[0]! * L) / AutoMovieHumanFootPrior.CASCADE_FOOT,
    ];
    for (const drop of cascade.slice(1))
      stations.push(
        stations.at(-1)! - (drop * L) / AutoMovieHumanFootPrior.CASCADE_FOOT,
      );
    return tips.map(
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

        // The original toe pattern is normalized by L. Apply the retained
        // individual aspect before the group's across-only kappa, so changing

        // public B does not move the floor, cap stations or the Y family.

        // This is a source choice, not a recovered individual measurement.
        const distalDepth: number =
          AutoMovieHumanFootPrior.PRIOR.toes[k]!.depth * gap * L;
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
        const root: AutoMovieVector3Tuple = at(stations[k]!, rootAcross);
        const apex: AutoMovieVector3Tuple = at(
          terminal * L,
          t.across * transverse,
        );

        // The observed foot-along chart owns the cap reach as well as width.

        // An oblique centreline's arclength would re-interpret that chart.
        const span: number = terminal * L - stations[k]!;
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
        const insideAlong: number = stations[k]! - (span - distalDepth / 2) / 4;
        const sourceStations: number[] = [
          0,
          stations[k]! - insideAlong,
          (stations[k]! + terminal * L - distalDepth / 2) / 2 - insideAlong,
          terminal * L - distalDepth / 2 - insideAlong,
          terminal * L - insideAlong,
        ];
        const acrossAt: (
          point: AutoMovieVector3Tuple,
          station: number,
        ) => number = (
          point: AutoMovieVector3Tuple,
          station: number,
        ): number => {
          const parent: ReturnType<IAutoMovieViewPart["axis"]["at"]> = (
            owner.axis ?? owner.part.axis
          ).at(station);
          return point.reduce(
            (sum: number, value: number, coordinate: number): number =>
              sum +
              (value - parent.origin[coordinate]!) * parent.v[coordinate]!,
            0,
          );
        };
        const rootChart: number = acrossAt(root, stations[k]!);
        const hiddenChart: number = acrossAt(inside, insideAlong);
        const slope: number = (rootChart - hiddenChart) / sourceStations[1]!;
        const rootChord: IAutoMovieHumanFootConnection.IChord =
          AutoMovieHumanFootConnection.chord(
            owner,
            stations[k]!,
            rootChart,
            slope,
          );
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
  }
}

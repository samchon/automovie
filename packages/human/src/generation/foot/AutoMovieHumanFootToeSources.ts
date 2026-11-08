import type { IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";
import type { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";
import { AutoMovieHumanFootSource } from "./AutoMovieHumanFootSource";
import type { AutoMovieHumanToePart } from "./AutoMovieHumanToePart";
import { AutoMovieHumanToeVertical } from "./AutoMovieHumanToeVertical";

/** Calibration-mm point in the common foot chart/world frame. */
type Vec3 = [number, number, number];

/** Toe inputs from the shared foot scalar/section/frame owner, before any complete parent part exists. */
export namespace AutoMovieHumanFootToeSources {

  /**
   * One generated toe attachment and its defining parallel-plane part, in calibration mm.
   * Root is a skin attachment proxy, and apex combines different retained
   * along/across observations; neither is a measured MTP or 3D tip.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the actual generated attachment and distal proxy beside the parallel-plane source that consumes them.
   * @evidence contracts/common.md#clear-and-simple-design A point pair and its view input expose the skin source without inventing a skeletal landmark.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not label retained normalized placements or loop means as observed joint centres.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, point provenance and the absence of anatomical joint identity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A source record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The owning define operation shares this record; the type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous definition caller owns the points and walk.
   */
  export interface ICandidate {

    /** Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. */
    root: Vec3;

    /** Generated distal proxy, not an independently observed 3D tip, mm. */
    apex: Vec3;

    /** The identical fixed foot-chart definition passed to the production toe builder. */
    part: AutoMovieHumanToePart.IInput;
  }

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
    return Array.from(AutoMovieHumanFootPlaces.TOES.keys(), (index: number): string => `toe.${side}.${index + 1}`);
  }

  /** Generate skin attachments from the identical actual foot input, without a second placement or support solve. */
  export function create(foot: AutoMovieHumanFootPart.IInput, controls: AutoMovieHumanSiteControls.IOutput): ICandidate[] {
    const region: NonNullable<AutoMovieHumanFootPart.IInput["metatarsal"]> | undefined = foot.metatarsal;
    if (region === undefined) throw new Error("Toe attachments need the defining foot's metatarsal supports");
    const sign: number = foot.side === "left" ? 1 : -1;
    const lateral: Vec3 = [-sign * foot.along[2], 0, sign * foot.along[0]];
    const L: number = foot.length;
    const tips: readonly { tip: number; across: number }[] = AutoMovieHumanFootPlaces.TOES;
    const partNames: readonly string[] = names(foot.side);

    // A maximum of population means need not equal the mean's unit maximum.

    // Treat this retained pattern as relative toe lengths, then let public

    // heel-to-longest-toe length own its actual longitudinal support.
    const longest: number = Math.max(...tips.map((tip: { tip: number }): number => tip.tip));
    const transverse: number = region.transverseScale;
    const owner: AutoMovieHumanFootSource.ISource = AutoMovieHumanFootSource.fromControls(controls);
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const stations: number[] = [region.span[1], region.span[1] + cascade[0]! * L / AutoMovieHumanFootPrior.CASCADE_FOOT];
    for (const drop of cascade.slice(1)) stations.push(stations.at(-1)! - drop * L / AutoMovieHumanFootPrior.CASCADE_FOOT);
    return tips.map((t: { tip: number; across: number }, k: number): ICandidate => {
      const gaps: number[] = [k > 0 ? t.across - tips[k - 1]!.across : null, k + 1 < tips.length ? tips[k + 1]!.across - t.across : null].filter((g: number | null): g is number => g !== null);
      const gap: number = gaps.reduce((a: number, g: number): number => a + Math.abs(g), 0) / gaps.length;
      const breadth: number = gap * transverse;
      const terminal: number = t.tip / longest;

      // The original toe pattern is normalized by L. Apply the retained
      // individual aspect before the group's across-only kappa, so changing

      // public B does not move the floor, cap stations or the Y family.

      // This is a source choice, not a recovered individual measurement.
      const distalDepth: number = AutoMovieHumanFootPrior.PRIOR.toes[k]!.depth * gap * L;
      const height: number = distalDepth / 2;
      const at: (along: number, across: number) => Vec3 = (along: number, across: number): Vec3 => [
        foot.heel[0] + foot.along[0] * along + lateral[0] * across,
        height,
        foot.heel[2] + foot.along[2] * along + lateral[2] * across,
      ];
      const rootAcross: number = -region.supports.medial + AutoMovieHumanFootPrior.PRIOR.toes[k]!.head * (region.supports.lateral + region.supports.medial);
      const root: Vec3 = at(stations[k]!, rootAcross);
      const apex: Vec3 = at(terminal * L, t.across * transverse);

      // The observed foot-along chart owns the cap reach as well as width.

      // An oblique centreline's arclength would re-interpret that chart.
      const span: number = terminal * L - stations[k]!;
      if (!(span > distalDepth / 2)) throw new Error(`The ${foot.side} toe ${k + 1} has no shaft before its distal cap`);
      const tip: Vec3 = [apex[0] - (apex[0] - root[0]) * distalDepth / (2 * span), height, apex[2] - (apex[2] - root[2]) * distalDepth / (2 * span)];
      const mid: Vec3 = [(root[0] + tip[0]) / 2, height, (root[2] + tip[2]) / 2];
      const inside: Vec3 = [root[0] - (mid[0] - root[0]) / 2, height, root[2] - (mid[2] - root[2]) / 2];
      const insideAlong: number = stations[k]! - (span - distalDepth / 2) / 4;
      const sourceStations: number[] = [0, stations[k]! - insideAlong, (stations[k]! + terminal * L - distalDepth / 2) / 2 - insideAlong, terminal * L - distalDepth / 2 - insideAlong, terminal * L - insideAlong];
      const acrossAt: (point: Vec3, station: number) => number = (point: Vec3, station: number): number => {
        const parent: ReturnType<IAutoMovieViewPart["axis"]["at"]> = (owner.axis ?? owner.part.axis).at(station);
        return point.reduce((sum: number, value: number, coordinate: number): number => sum + (value - parent.origin[coordinate]!) * parent.v[coordinate]!, 0);
      };
      const rootChart: number = acrossAt(root, stations[k]!);
      const hiddenChart: number = acrossAt(inside, insideAlong);
      const slope: number = (rootChart - hiddenChart) / sourceStations[1]!;
      const rootChord: AutoMovieHumanFootConnection.IChord = AutoMovieHumanFootConnection.chord(owner, stations[k]!, rootChart, slope);
      const hiddenChord: AutoMovieHumanFootConnection.IChord = AutoMovieHumanFootConnection.chord(owner, insideAlong, hiddenChart, slope);
      if (!(rootChord.depth > 0 && distalDepth > 0)) throw new Error(`The ${foot.side} toe ${k + 1} needs positive actual parent and distal depths`);
      const vertical: AutoMovieHumanToeVertical.ISource = AutoMovieHumanToeVertical.create(sourceStations, rootChord, hiddenChord, distalDepth);
      [inside, root, mid, tip, apex].forEach((point: Vec3, index: number): void => { point[1] = vertical.at(sourceStations[index]!)[0]; });
      const law: (depth: number) => AutoMovieHumanDigitWalk.ISiteLaw = (depth: number): AutoMovieHumanDigitWalk.ISiteLaw => ({ breadth, depth, dorsal: 0.5, shoulder: Math.SQRT2 - 1 });
      const near: AutoMovieHumanDigitWalk.ISiteLaw = law(rootChord.depth);
      const far: AutoMovieHumanDigitWalk.ISiteLaw = law(distalDepth);
      const profiles: AutoMovieHumanDigitWalk.IInput = AutoMovieHumanDigitInterim.walk(partNames[k]!, [inside, root, mid, tip], [0, 1, 0], near, far);
      return { root, apex, part: { name: profiles.name, centres: profiles.centres, apex, along: foot.along, height, vertical, law: profiles.law, ranges: undefined, order: profiles.order, gap: profiles.gap } };
    });
  }

}

import {
  AutoMovieConstructionViews,
  AutoMovieViewAxis,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanWalkPart,
  IAutoMovieViewAxis,
} from "@automovie/interface";

import { AutoMovieHumanBendArc } from "./AutoMovieHumanBendArc";
import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

/**
 * A part lofted as one walk over a bone chain (a digit over its phalanges, a
 * toe, the arm and palm, the leg): the engine's jointed axis on the chain's
 * joint centres (`IAutoMovieConstructionJointedAxis`, its station the
 * course's arclength) and the site knots along it
 * (`AutoMovieHumanSiteViewPart`), each site placed on a bone by its share
 * from that bone's proximal centre, so a landmark is a share of its own bone
 * and moves with that bone alone.
 *
 * Ends. The walk's first centre is its proximal end, inside the host it
 * merges onto (the palm, the forefoot, the trunk), where the part stays open
 * because the merge trims it; the distal end is either open (continued by the
 * next part's merge) or closed by a G2 dome at the tip
 * (`IAutoMovieViewPart.pole`, the zero knots the operator requires), the
 * tip standing past the last centre by the caller's distance (a fingertip's
 * pulp beyond the distal phalanx's end).
 */
export namespace AutoMovieHumanWalkPart {
  /**
   * Build and loft the walk.
   *
   * @param input The centres, joints, sites and tip.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(
    input: IAutoMovieHumanWalkPart.IInput,
  ): IAutoMovieHumanSourceRealization {
    const built: IAutoMovieHumanWalkPart.ISource | string = source(input);
    return typeof built === "string"
      ? {
          part: null,
          loft: null,
          view: null,
          diagnostics: [
            {
              producer: `walk.${input.name}`,
              level: 2,
              contract: "axis",
              detail: built,
            },
          ],
        }
      : AutoMovieHumanSiteViewPart.create(built.input);
  }

  /** Prepare the production axis and named source once, without a section or loft. */
  export function source(
    input: IAutoMovieHumanWalkPart.IInput,
  ): IAutoMovieHumanWalkPart.ISource | string {
    const producer: string = `walk.${input.name}`;

    const fail = (detail: string): string => `${producer}: ${detail}`;

    // A tip continues the last bone straight: its point is one more centre,
    // joined to the last bone with no intended turn. Canonical unit
    // conversion may leave a tiny nonzero angle; use the same geometric
    // bend-radius conversion as every other digit joint, rather than
    // reserving a fixed quarter segment for that numerical angle.
    const last: AutoMovieVector3Tuple =
      input.centres[input.centres.length - 1]!;
    const before: AutoMovieVector3Tuple =
      input.centres[input.centres.length - 2]!;
    const length: number = Math.hypot(
      last[0] - before[0],
      last[1] - before[1],
      last[2] - before[2],
    );
    if (!(length > 0))
      return fail(
        `the last bone of ${input.centres.length} centres has no length`,
      );
    const tip: number = input.tip ?? 0;
    const raw: AutoMovieVector3Tuple[] =
      tip > 0
        ? [
            ...input.centres,
            [0, 1, 2].map(
              (c: number): number =>
                last[c]! + ((last[c]! - before[c]!) * tip) / length,
            ) as AutoMovieVector3Tuple,
          ]
        : [...input.centres];
    // The tree's metre record is authoritative for both the runs and the
    // reconstructed axis. A second mm-to-m conversion need not be bit-identical.
    const positions: ReturnType<typeof AutoMovieHumanConstructionView.point>[] =
      raw.map(AutoMovieHumanConstructionView.point);
    const centres: AutoMovieVector3Tuple[] = positions.map(
      AutoMovieConstructionViews.point,
    );
    const metreHalves: number[] = [
      ...input.joints.map((j: { half: number }): number => j.half),
      ...(tip > 0
        ? [
            AutoMovieHumanBendArc.half(
              before,
              last,
              raw.at(-1)!,
              Math.min(tip, length),
            ),
          ]
        : []),
    ].map(
      (half: number): number => half * AutoMovieHumanConstructionView.METRES,
    );
    const halves: number[] = metreHalves.map(
      (half: number): number => half * 1000,
    );
    const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
      centres,
      halves,
    );
    if (typeof runs === "string") return fail(runs);

    // Each site's station from its bone and share, then its edges in the
    // engine's chart.
    const sites: IAutoMovieHumanSectionSite[] = input.sites.map(
      (s: IAutoMovieHumanWalkPart.ISite): IAutoMovieHumanSectionSite => ({
        site: s.site,
        station: station(centres, runs, s.bone, s.share),
        edges: engine(s.edges),
        fullness: s.fullness,
        ...(s.jets === undefined ? {} : { jets: engineJets(s.jets) }),
      }),
    );
    const end: number = runs[input.centres.length - 2]!.end;
    return {
      runs,
      station: (bone: number, share: number): number =>
        station(centres, runs, bone, share),
      input: {
        name: input.name,
        axis: {
          type: "jointed",
          centres: positions,
          halves: metreHalves,
          up: AutoMovieHumanConstructionView.direction(input.u),
          ...(input.roll === undefined
            ? {}
            : {
                roll: {
                  from:
                    station(
                      centres,
                      runs,
                      input.roll.from.bone,
                      input.roll.from.share,
                    ) * AutoMovieHumanConstructionView.METRES,
                  to:
                    station(
                      centres,
                      runs,
                      input.roll.to.bone,
                      input.roll.to.share,
                    ) * AutoMovieHumanConstructionView.METRES,
                  up: AutoMovieHumanConstructionView.direction(input.roll.up),
                },
              }),
        },
        sites,
        ...(input.ranges === undefined
          ? {}
          : { ranges: engineRanges(input.ranges) }),
        ...pole(input, tip > 0 ? runs[runs.length - 1]!.end : end),
        order: input.order,
        samples: input.samples,
        gap: input.gap,
      },
    };
  }

  /*
   * Station adapter: the station of the point a share along a bone, on the
   * engine's jointed course (`AutoMovieViewAxis.runs`). On the bone's straight
   * run it is the run's own station; inside a turn, where the course cuts the
   * corner and no station lies on the bone's line, it is read linearly in the
   * distance along the bones between the turn's two run ends, so the stations
   * keep the bones' order and meet the runs at both ends of the turn.
   * Parameter centres: The course's centres, mm.
   * Parameter runs: Each segment's straight run.
   * Parameter bone: The bone, 0 the first.
   * Parameter share: The share along it from its proximal centre.
   * Returns: The station, mm.
   */
  function station(
    centres: readonly AutoMovieVector3Tuple[],
    runs: readonly IAutoMovieViewAxis.IRun[],
    bone: number,
    share: number,
  ): number {
    const span = (i: number): number => {
      const a: AutoMovieVector3Tuple = centres[i]!;
      const b: AutoMovieVector3Tuple = centres[i + 1]!;
      return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    };
    const run: IAutoMovieViewAxis.IRun = runs[bone]!;
    const x: number = share * span(bone);
    if (x > run.to && bone + 1 < runs.length) {
      const next: IAutoMovieViewAxis.IRun = runs[bone + 1]!;
      return (
        run.end +
        ((x - run.to) * (next.start - run.end)) /
          (span(bone) - run.to + next.from)
      );
    }
    if (x < run.from && bone > 0) {
      const previous: IAutoMovieViewAxis.IRun = runs[bone - 1]!;
      const back: number = span(bone - 1) - previous.to;
      return (
        previous.end +
        ((back + x) * (run.start - previous.end)) / (back + run.from)
      );
    }
    return run.start + (x - run.from);
  }

  /*
   * Side adapter: a box given in the walk's chart (`v = t x u`, the laws'
   * and `AutoMovieHumanSegmentChart`'s) as the engine's (`v = u x t`, so its
   * stations advance along `v x u = t`): the side pair swaps and changes sign.
   * Parameter e: The edges `[+u, +v, -u, -v]` in the walk's chart.
   * Returns: The edges in the engine's chart.
   */
  function engine(
    e: readonly [number, number, number, number],
  ): [number, number, number, number] {
    return [e[0], -e[3], e[2], -e[1]];
  }

  /*
   * Carry derivatives of the same signed edges through the side-pair reflection; their normalized parameter is unchanged.
   */
  function engineJets(
    jets: NonNullable<IAutoMovieHumanWalkPart.ISite["jets"]>,
  ): NonNullable<IAutoMovieHumanSectionSite["jets"]> {
    const neg = (jet: (typeof jets)[number]): (typeof jets)[number] =>
      jet === undefined
        ? undefined
        : {
            first: jet.first === null ? null : -jet.first,
            second: jet.second === null ? null : -jet.second,
          };
    return [jets[0], neg(jets[3]), jets[2], neg(jets[1])];
  }

  /*
   * Negating a side edge exchanges its scalar bounds as well as their signs.
   */
  function engineRanges(
    ranges: NonNullable<IAutoMovieHumanWalkPart.IInput["ranges"]>,
  ): NonNullable<IAutoMovieHumanSectionSource["ranges"]> {
    const neg = (range: (typeof ranges)[number]): (typeof ranges)[number] =>
      range === undefined
        ? undefined
        : {
            minimum: range.maximum === null ? null : -range.maximum,
            maximum: range.minimum === null ? null : -range.minimum,
          };
    return [ranges[0], neg(ranges[3]), ranges[2], neg(ranges[1])];
  }

  /*
   * The walk's closing domes: at the first centre (station 0) for a base
   * inside its host, at the tip past the last centre, or both.
   * Parameter input: The walk.
   * Parameter top: The tip's station, mm: past the last centre by the tip, or the last centre's.
   * Returns: The site part's pole, or nothing for two open ends.
   */
  function pole(
    input: IAutoMovieHumanWalkPart.IInput,
    top: number,
  ): Pick<IAutoMovieHumanSectionSource, "pole"> {
    if (input.base === true && input.tip !== undefined)
      return { pole: { end: "both", bottom: 0, top } };
    if (input.base === true) return { pole: { end: "bottom", station: 0 } };
    if (input.tip !== undefined) return { pole: { end: "top", station: top } };
    return {};
  }
}

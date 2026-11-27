import type {
  AutoMovieLoftViewSourceOutlines,
  AutoMovieLoftViewSourceSplit,
  IAutoMovieLoftViewSource,
  IAutoMovieLoftViewSourceCap,
  IAutoMovieLoftViewSourceFullness,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieViewOutline } from "./AutoMovieViewOutline";

/** Original scalar preparation retained for a direct view-generated field. */
export namespace AutoMovieLoftViewSource {
  /**
   * Prepare direct shoulder/top ownership; null explicitly leaves generic girth
   * unchanged.
   */
  export function create(
    part: IAutoMovieLoftViewSource.IInput,
  ): IAutoMovieLoftViewSource.IResult | null {
    if (part.fullness.kind === "girth") return null;
    const diagnostics: IAutoMovieViewOutline.IFailure[] = [];
    const first: number = part.stations[0] ?? NaN;
    const last: number = part.stations[part.stations.length - 1] ?? NaN;
    if (!(last > first))
      return {
        source: null,
        diagnostics: [
          {
            contract: "outline",
            detail:
              "The view source has no finite increasing declared station interval.",
          },
        ],
      };
    const ends: IAutoMovieViewOutline.IEnds = {};
    if (part.pole === "bottom" || part.pole === "both") ends.bottom = first;
    if (part.pole === "top" || part.pole === "both") ends.top = last;
    const original: IAutoMovieViewPart.IOutline[] = [
      part.front.positive,
      part.side.positive,
      part.front.negative,
      part.side.negative,
    ];
    const lateral: IAutoMovieViewOutline.IOutline | null = curve(
      part.front.positive,
      ends,
      "front positive",
      diagnostics,
    );
    const medial: IAutoMovieViewOutline.IOutline | null = curve(
      part.front.negative,
      ends,
      "front negative",
      diagnostics,
    );
    const ahead: IAutoMovieViewOutline.IOutline | null = curve(
      part.side.positive,
      ends,
      "side positive",
      diagnostics,
    );
    const behind: IAutoMovieViewOutline.IOutline | null = curve(
      part.side.negative,
      ends,
      "side negative",
      diagnostics,
    );
    const extents: AutoMovieLoftViewSourceOutlines | null =
      lateral === null || medial === null || ahead === null || behind === null
        ? null
        : [lateral, ahead, medial, behind];
    const fullness: IAutoMovieViewPart.IShoulder | IAutoMovieViewPart.ITop =
      part.fullness;
    let admitted: IAutoMovieLoftViewSourceFullness | null;
    if (fullness.kind === "top") {
      const shoulders: AutoMovieLoftViewSourceOutlines | null = group(
        fullness.shoulders,
        {},
        "top shoulder",
        diagnostics,
      );
      // A touch offset and a split's point are chart coordinates of the section like the extents, so at a pole they close in the same pole
      // parameter and every coordinate of a cap section falls together; an angle or a shoulder is no length and keeps its own parameter.
      const touch: AutoMovieLoftViewSourceOutlines | null =
        fullness.touch === undefined
          ? null
          : group(fullness.touch, ends, "touch", diagnostics);
      const admit = (
        split: IAutoMovieViewPart.ISplit,
        name: string,
      ): AutoMovieLoftViewSourceSplit | null => {
        const parts: (IAutoMovieViewOutline.IOutline | null)[] = [
          curve(split.u, ends, `${name} u`, diagnostics),
          curve(split.v, ends, `${name} v`, diagnostics),
          curve(split.angle, {}, `${name} angle`, diagnostics),
          curve(split.shoulder, {}, `${name} shoulder`, diagnostics),
        ];
        return parts.some(
          (p: IAutoMovieViewOutline.IOutline | null): boolean => p === null,
        )
          ? null
          : [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
      };
      const splits: (AutoMovieLoftViewSourceSplit | null)[] | null =
        fullness.splits === undefined
          ? null
          : fullness.splits.map(
              (
                split: IAutoMovieViewPart.ISplit,
                q: number,
              ): AutoMovieLoftViewSourceSplit | null =>
                admit(split, `split ${q}`),
            );
      const pieces: (AutoMovieLoftViewSourceSplit | null)[][] | null =
        fullness.pieces === undefined
          ? null
          : fullness.pieces.map(
              (
                list: IAutoMovieViewPart.ISplit[],
                q: number,
              ): (AutoMovieLoftViewSourceSplit | null)[] =>
                list.map(
                  (
                    split: IAutoMovieViewPart.ISplit,
                    j: number,
                  ): AutoMovieLoftViewSourceSplit | null =>
                    admit(split, `quarter ${q} point ${j}`),
                ),
            );
      const both: boolean =
        fullness.splits !== undefined && fullness.pieces !== undefined;
      if (both)
        diagnostics.push({
          contract: "outline",
          detail:
            "A top fullness declares both one split per quarter and a split list per quarter; it declares one of them.",
        });
      const failed: boolean =
        both ||
        shoulders === null ||
        (fullness.touch !== undefined && touch === null) ||
        (splits !== null &&
          splits.some(
            (s: AutoMovieLoftViewSourceSplit | null): boolean => s === null,
          )) ||
        (pieces !== null &&
          (pieces.length !== 4 ||
            pieces.some(
              (list: (AutoMovieLoftViewSourceSplit | null)[]): boolean =>
                list.some(
                  (s: AutoMovieLoftViewSourceSplit | null): boolean =>
                    s === null,
                ),
            )));
      admitted = failed
        ? null
        : {
            kind: "top",
            shoulders: shoulders!,
            touch,
            splits:
              splits === null
                ? null
                : [splits[0]!, splits[1]!, splits[2]!, splits[3]!],
            pieces:
              pieces === null
                ? null
                : [
                    pieces[0] as AutoMovieLoftViewSourceSplit[],
                    pieces[1] as AutoMovieLoftViewSourceSplit[],
                    pieces[2] as AutoMovieLoftViewSourceSplit[],
                    pieces[3] as AutoMovieLoftViewSourceSplit[],
                  ],
          };
    } else {
      const owner: IAutoMovieViewOutline.IOutline | null = curve(
        fullness.shoulder,
        {},
        "shoulder",
        diagnostics,
      );
      const departures: AutoMovieLoftViewSourceOutlines | null =
        fullness.departures === undefined
          ? null
          : group(fullness.departures, {}, "departure", diagnostics);
      admitted =
        owner === null ||
        (fullness.departures !== undefined && departures === null)
          ? null
          : { kind: "shoulder", owner, departures };
    }
    if (extents === null || admitted === null)
      return { source: null, diagnostics };
    const tips: number[] = [ends.bottom, ends.top].flatMap(
      (s: number | undefined): number[] => (s === undefined ? [] : [s]),
    );
    const knots: number[] = original
      .flatMap((o: IAutoMovieViewPart.IOutline): number[] =>
        o.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station),
      )
      .filter((s: number): boolean => !tips.includes(s));
    const caps: IAutoMovieLoftViewSourceCap[] = part.stations.some(
      (s: number): boolean => !tips.includes(s),
    )
      ? tips.map((pole: number): IAutoMovieLoftViewSourceCap => {
          const near: number | null =
            knots.length === 0
              ? null
              : pole === first
                ? Math.min(...knots)
                : Math.max(...knots);
          return {
            pole,
            near,
            span: near === null ? null : Math.abs(near - pole),
          };
        })
      : [];
    return {
      source: {
        kind: "view",
        extents,
        fullness: admitted,
        domain: [first, last],
        caps,
      },
      diagnostics,
    };
  }
}

/*
 * Preserve a curve's existing failure category and attach only its source
 * identity.
 */
function curve(
  outline: IAutoMovieViewPart.IOutline,
  ends: IAutoMovieViewOutline.IEnds,
  name: string,
  diagnostics: IAutoMovieViewOutline.IFailure[],
): IAutoMovieViewOutline.IOutline | null {
  const result: IAutoMovieViewOutline.IResult = AutoMovieViewOutline.create(
    outline,
    ends,
  );
  if ("detail" in result) {
    diagnostics.push({
      contract: result.contract,
      detail: `${name}: ${result.detail}`,
    });
    return null;
  }
  return result;
}

/*
 * Admit every independent quarter even when another quarter already failed.
 */
function group(
  outlines: readonly IAutoMovieViewPart.IOutline[],
  ends: IAutoMovieViewOutline.IEnds,
  name: string,
  diagnostics: IAutoMovieViewOutline.IFailure[],
): AutoMovieLoftViewSourceOutlines | null {
  const values: (IAutoMovieViewOutline.IOutline | null)[] = outlines.map(
    (
      outline: IAutoMovieViewPart.IOutline,
      q: number,
    ): IAutoMovieViewOutline.IOutline | null =>
      curve(outline, ends, `${name} ${q}`, diagnostics),
  );
  if (
    values.length !== 4 ||
    values.some(
      (value: IAutoMovieViewOutline.IOutline | null): boolean => value === null,
    )
  )
    return null;
  return [values[0]!, values[1]!, values[2]!, values[3]!];
}

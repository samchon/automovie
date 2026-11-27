import type {
  AutoMovieViewLoftInputsQuarters,
  AutoMovieViewLoftInputsScalar,
  IAutoMovieLoftViewSource,
  IAutoMovieViewLoftInputsInputs,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieEngineViewOutline } from "../../AutoMovieEngineViewOutline";

/*
 * Prepare ViewLoft's existing value readers, reusing retained direct sources.
 */
export function AutoMovieViewLoftInputs(
  part: IAutoMovieViewPart,
  source: IAutoMovieLoftViewSource.ISource | null,
  report: (contract: string, detail: string) => void,
): IAutoMovieViewLoftInputsInputs | null {
  const reused: Partial<Record<string, IAutoMovieViewOutline.IOutline>> = {};
  if (source !== null) {
    for (const [q, name] of [
      "front positive",
      "side positive",
      "front negative",
      "side negative",
    ].entries())
      reused[name] = source.extents[q]!;
    if (source.fullness.kind === "shoulder") {
      reused.shoulder = source.fullness.owner;
      source.fullness.departures?.forEach(
        (outline: IAutoMovieViewOutline.IOutline, q: number): void => {
          reused[`departure ${q}`] = outline;
        },
      );
    } else
      source.fullness.shoulders.forEach(
        (outline: IAutoMovieViewOutline.IOutline, q: number): void => {
          reused[`top shoulder ${q}`] = outline;
        },
      );
  }
  const ends: IAutoMovieViewOutline.IEnds = {};
  if (part.pole === "bottom" || part.pole === "both")
    ends.bottom = part.stations[0]!;
  if (part.pole === "top" || part.pole === "both")
    ends.top = part.stations[part.stations.length - 1]!;

  /*
   * Preserve source identity and every original admission/read diagnostic.
   */
  const curve: (
    name: string,
    outline: IAutoMovieViewPart.IOutline,
    closing?: boolean,
  ) => AutoMovieViewLoftInputsScalar | null = (
    name: string,
    outline: IAutoMovieViewPart.IOutline,
    closing: boolean = false,
  ): AutoMovieViewLoftInputsScalar | null => {
    const prepared: IAutoMovieViewOutline.IResult =
      reused[name] ?? AutoMovieEngineViewOutline.create(outline, closing ? ends : {});
    if ("detail" in prepared) {
      report(prepared.contract, `${name}: ${prepared.detail}`);
      return null;
    }
    return (station: number): number => {
      const value: number | string = AutoMovieEngineViewOutline.value(
        prepared,
        station,
      );
      if (typeof value === "string") {
        report("outline", `${name}: ${value}`);
        return NaN;
      }
      return value;
    };
  };

  /*
   * An absent departure is the authored constant-zero departure law.
   */
  const quarters: (
    name: string,
    outlines:
      | IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>
      | undefined,
  ) => AutoMovieViewLoftInputsQuarters | null = (
    name: string,
    outlines:
      | IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>
      | undefined,
  ): AutoMovieViewLoftInputsQuarters | null => {
    if (outlines === undefined)
      return (): IAutoMovieViewPart.IQuarters<number> => [0, 0, 0, 0];
    const readers: (AutoMovieViewLoftInputsScalar | null)[] = outlines.map(
      (
        outline: IAutoMovieViewPart.IOutline,
        q: number,
      ): AutoMovieViewLoftInputsScalar | null => curve(`${name} ${q}`, outline),
    );
    if (
      readers.some(
        (reader: AutoMovieViewLoftInputsScalar | null): boolean =>
          reader === null,
      )
    )
      return null;
    return (station: number): IAutoMovieViewPart.IQuarters<number> =>
      readers.map((reader: AutoMovieViewLoftInputsScalar | null): number =>
        reader!(station),
      ) as IAutoMovieViewPart.IQuarters<number>;
  };
  const lateral: AutoMovieViewLoftInputsScalar | null = curve(
    "front positive",
    part.front.positive,
    true,
  );
  const medial: AutoMovieViewLoftInputsScalar | null = curve(
    "front negative",
    part.front.negative,
    true,
  );
  const ahead: AutoMovieViewLoftInputsScalar | null = curve(
    "side positive",
    part.side.positive,
    true,
  );
  const behind: AutoMovieViewLoftInputsScalar | null = curve(
    "side negative",
    part.side.negative,
    true,
  );
  const fullness: IAutoMovieViewPart.Fullness = part.fullness;
  const owner: AutoMovieViewLoftInputsScalar | null =
    fullness.kind === "girth"
      ? curve("girth", fullness.girth, true)
      : fullness.kind === "shoulder"
        ? curve("shoulder", fullness.shoulder)
        : (): number => 0;
  const shoulders: AutoMovieViewLoftInputsQuarters | null =
    fullness.kind === "top"
      ? quarters("top shoulder", fullness.shoulders)
      : quarters("departure", fullness.departures);
  return lateral === null ||
    medial === null ||
    ahead === null ||
    behind === null ||
    owner === null ||
    shoulders === null
    ? null
    : { lateral, medial, ahead, behind, owner, shoulders };
}

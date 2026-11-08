import type { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Existing signed scalar value reader in physical station mm. */
type Scalar = (station: number) => number;

/** Ordered source-quarter values, before the cap owner acts. */
type Quarters = (station: number) => IAutoMovieViewPart.IQuarters<number>;

/** Existing raw scalar readers for source admission and ring density. */
interface Inputs {
  lateral: Scalar;
  medial: Scalar;
  ahead: Scalar;
  behind: Scalar;
  owner: Scalar;
  shoulders: Quarters;
}

/**
 * Prepare ViewLoft's existing value readers, reusing retained direct sources.
 *
 * @evidence contracts/common.md#principled-implementation Reads each original Outline under its declared pole coordinate; direct sources reuse their admitted preparations and generic girth keeps its existing owner.
 * @evidence contracts/common.md#clear-and-simple-design One value-reader factory owns the source closures moved from ViewLoft without changing source or diagnostic identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reinterpolate principal sections, change knots, infer physical derivatives or replace an invalid source.
 * @evidence contracts/common.md#meaningful-documentation These readers are raw signed/fullness inputs before effective caps; report preserves the original contract and source name.
 * @evidence contracts/performance.md#efficient-algorithms Each source is prepared at most once: retained direct data is reused, while source-absent generic girth prepares its original outlines once.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned closures share their prepared scalar sources across all principal and cap-density station reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Preparations and closures belong to the ViewLoft call, without a registry or additional cache.
 */
export function AutoMovieViewLoftInputs(
  part: IAutoMovieViewPart,
  source: AutoMovieLoftViewSource.ISource | null,
  report: (contract: string, detail: string) => void,
): Inputs | null {
  const reused: Partial<Record<string, AutoMovieViewOutline.IOutline>> = {};
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
        (outline: AutoMovieViewOutline.IOutline, q: number): void => {
          reused[`departure ${q}`] = outline;
        },
      );
    } else
      source.fullness.shoulders.forEach(
        (outline: AutoMovieViewOutline.IOutline, q: number): void => {
          reused[`top shoulder ${q}`] = outline;
        },
      );
  }
  const ends: AutoMovieViewOutline.IEnds = {};
  if (part.pole === "bottom" || part.pole === "both")
    ends.bottom = part.stations[0]!;
  if (part.pole === "top" || part.pole === "both")
    ends.top = part.stations[part.stations.length - 1]!;

  /** Preserve source identity and every original admission/read diagnostic. */
  const curve: (
    name: string,
    outline: IAutoMovieViewPart.IOutline,
    closing?: boolean,
  ) => Scalar | null = (
    name: string,
    outline: IAutoMovieViewPart.IOutline,
    closing: boolean = false,
  ): Scalar | null => {
    const prepared:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure =
      reused[name] ?? AutoMovieViewOutline.create(outline, closing ? ends : {});
    if ("detail" in prepared) {
      report(prepared.contract, `${name}: ${prepared.detail}`);
      return null;
    }
    return (station: number): number => {
      const value: number | string = AutoMovieViewOutline.value(
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

  /** An absent departure is the authored constant-zero departure law. */
  const quarters: (
    name: string,
    outlines:
      | IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>
      | undefined,
  ) => Quarters | null = (
    name: string,
    outlines:
      | IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>
      | undefined,
  ): Quarters | null => {
    if (outlines === undefined)
      return (): IAutoMovieViewPart.IQuarters<number> => [0, 0, 0, 0];
    const readers: (Scalar | null)[] = outlines.map(
      (outline: IAutoMovieViewPart.IOutline, q: number): Scalar | null =>
        curve(`${name} ${q}`, outline),
    );
    if (readers.some((reader: Scalar | null): boolean => reader === null))
      return null;
    return (station: number): IAutoMovieViewPart.IQuarters<number> =>
      readers.map((reader: Scalar | null): number =>
        reader!(station),
      ) as IAutoMovieViewPart.IQuarters<number>;
  };
  const lateral: Scalar | null = curve(
    "front positive",
    part.front.positive,
    true,
  );
  const medial: Scalar | null = curve(
    "front negative",
    part.front.negative,
    true,
  );
  const ahead: Scalar | null = curve("side positive", part.side.positive, true);
  const behind: Scalar | null = curve(
    "side negative",
    part.side.negative,
    true,
  );
  const fullness: IAutoMovieViewPart.Fullness = part.fullness;
  const owner: Scalar | null =
    fullness.kind === "girth"
      ? curve("girth", fullness.girth, true)
      : fullness.kind === "shoulder"
        ? curve("shoulder", fullness.shoulder)
        : (): number => 0;
  const shoulders: Quarters | null =
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

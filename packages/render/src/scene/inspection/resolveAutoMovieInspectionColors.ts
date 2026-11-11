import type { IAutoMovieMark } from "@automovie/engine";

/**
 * Decide the legend text and colour of every mark kind drawn in one picture, and refuse a picture whose colours would be ambiguous.
 *
 * A kind takes the label and colour its marks carry. Two marks of one kind that disagree on either throw, because one kind is then two things. Two kinds that end up in one colour throw naming both, and so does a kind whose colour is one of `reserved`, such as the flag colour or a shade's surface colour, naming the kind and the reserved use. Kinds come in the order their first mark appears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where each kind's label and colour come from, the three refusals and what each names, and the order.
 * @evidence contracts/development/implementation.md#principled-implementation A mark is identified in a reduced picture by its colour alone, so a colour may stand for one kind only, and a colour the picture already uses for something else is unavailable.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass collecting each kind's entry, then one pass checking colours against a map from colour to its first owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A clash is refused, never resolved by picking another colour, so the colour a producer documents is the colour drawn.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the marks plus the kinds, with one hashed lookup each.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one picture's marks.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh map and keeps nothing.
 */
export function resolveAutoMovieInspectionColors(props: {
  /** Every mark drawn in the picture. */
  marks: readonly IAutoMovieMark[];

  /** Colours the picture uses for something other than a kind, each with what uses it. */
  reserved: readonly { use: string; color: number }[];
}): Map<string, { label: string; color: number }> {
  const kinds: Map<string, { label: string; color: number }> = new Map<
    string,
    { label: string; color: number }
  >();
  for (const mark of props.marks) {
    const known: { label: string; color: number } | undefined = kinds.get(
      mark.kind,
    );
    if (known === undefined)
      kinds.set(mark.kind, { label: mark.label, color: mark.color });
    else if (known.label !== mark.label || known.color !== mark.color)
      throw new Error(
        `Mark kind ${mark.kind} is given two legend entries, "${known.label}" #${hex(known.color)} and "${mark.label}" #${hex(mark.color)}`,
      );
  }

  const owners: Map<number, string> = new Map<number, string>(
    props.reserved.map(
      (entry: { use: string; color: number }): [number, string] => [
        entry.color,
        entry.use,
      ],
    ),
  );
  for (const [kind, entry] of kinds) {
    const owner: string | undefined = owners.get(entry.color);
    if (owner !== undefined)
      throw new Error(
        `Mark kind ${kind} and ${owner} share the colour #${hex(entry.color)}`,
      );
    owners.set(entry.color, `mark kind ${kind}`);
  }
  return kinds;
}

/** Six-digit hex of an sRGB colour. */
function hex(color: number): string {
  return color.toString(16).padStart(6, "0");
}

import type {
  IAutoMovieInspectionKindStyle,
  IAutoMovieResolveInspectionColorsProps,
} from "@automovie/interface";

import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";

/**
 * Decide the legend text and colour of every mark kind drawn in one picture,
 * and refuse a picture whose colours would be ambiguous.
 *
 * A kind takes the label and colour its marks carry, or the colour of the last
 * `recolor` entry whose pattern matches the kind under the path grammar. Two
 * marks of one kind that disagree on either throw, because one kind is then two
 * things. Two kinds that end up in one colour throw naming both, and so does a
 * kind whose colour is one of `reserved`, such as the flag colour or a shade's
 * surface colour, naming the kind and the reserved use. Kinds come in the order
 * their first mark appears.
 */
export function resolveAutoMovieInspectionColors(
  props: IAutoMovieResolveInspectionColorsProps,
): Map<string, IAutoMovieInspectionKindStyle> {
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

  // The request's colours replace the producers' defaults, the last matching entry winning.
  for (const [kind, entry] of kinds)
    for (const assigned of props.recolor)
      if (matchAutoMovieInspectionPath(kind, assigned.pattern))
        entry.color = assigned.color;

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

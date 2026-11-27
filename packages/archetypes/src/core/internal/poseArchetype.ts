import type { IAutoMovieAffordance } from "@automovie/interface";

import { AutoMovieArchetypeArticulation } from "../AutoMovieArchetypeArticulation";
import { AutoMovieArchetypeSpan } from "../AutoMovieArchetypeSpan";
import type { IAutoMovieArchetypeProps } from "../IAutoMovieArchetypeProps";

/*
 * Resolve one archetype's articulations, flexible geometry and held contact
 * axes.
 * Parameter props: Rest geometry and its original contact/span declarations.
 * Parameter travels: Requested absolute travels, with the producer's units.
 * Returns: Current parts/contact frames and the articulation owner's travels.
 * Through the articulation/span owners for
 * unsupported requests or invalid physical line constraints.
 */
export function poseArchetype<Id extends string>(
  props: Pick<
    IAutoMovieArchetypeProps<Id, string>,
    "archetype" | "parts" | "affordances" | "spans"
  >,
  travels: ReadonlyMap<string, number>,
): Omit<AutoMovieArchetypeArticulation.IResult, "affordances"> & {
  affordances: IAutoMovieAffordance<Id>[];
} {
  const posed: AutoMovieArchetypeArticulation.IResult =
    AutoMovieArchetypeArticulation.pose(
      props.archetype,
      { parts: props.parts, affordances: props.affordances },
      travels,
    );
  const spans: AutoMovieArchetypeSpan.IPose = AutoMovieArchetypeSpan.pose(
    props.archetype,
    props.spans,
    posed.parts,
    posed.affordances,
  );
  // The poses keep the affordances' order, so each posed contact takes back the
  // id its rest declaration carried.
  return {
    ...posed,
    parts: spans.parts,
    affordances: spans.affordances.map(
      (a: IAutoMovieAffordance, i: number): IAutoMovieAffordance<Id> => ({
        ...a,
        id: props.affordances[i]!.id,
      }),
    ),
  };
}

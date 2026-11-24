import { AutoMovieArchetypeArticulation } from "./AutoMovieArchetypeArticulation";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";
import type { IAutoMovieArchetypeProps } from "./IAutoMovieArchetypeProps";

/** The constructor's rest geometry, contacts and flexible-line declarations. */
type Props = Pick<
  IAutoMovieArchetypeProps<string, string>,
  "archetype" | "parts" | "affordances" | "spans"
>;

/**
 * Resolve one archetype's articulations, flexible geometry and held contact
 * axes.
 *
 * @param props Rest geometry and its original contact/span declarations.
 * @param travels Requested absolute travels, with the producer's units.
 * @returns Current parts/contact frames and the articulation owner's travels.
 * @throws {AutoMovieArchetypeRefusal} Through the articulation/span owners for
 *   unsupported requests or invalid physical line constraints.
 */
export function poseArchetype(
  props: Props,
  travels: ReadonlyMap<string, number>,
): AutoMovieArchetypeArticulation.IResult {
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
  return { ...posed, parts: spans.parts, affordances: spans.affordances };
}

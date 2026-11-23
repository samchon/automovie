import { ArchetypePartOwnership } from "./ArchetypePartOwnership";
import { AutoMovieArchetypeArticulation } from "./AutoMovieArchetypeArticulation";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";
import type { IAutoMovieArchetypeProps } from "./IAutoMovieArchetypeProps";

/** The constructor's rest geometry, contacts and flexible-line declarations. */
type Props = Pick<
  IAutoMovieArchetypeProps<string, string>,
  "archetype" | "parts" | "affordances" | "spans"
>;

/** Original runtime methods required for a constructor allocation receipt. */
const ARTICULATE: typeof AutoMovieArchetypeArticulation.pose =
  AutoMovieArchetypeArticulation.pose;
const SPAN: typeof AutoMovieArchetypeSpan.pose = AutoMovieArchetypeSpan.pose;

/**
 * Resolve one archetype's articulations, flexible geometry and held contact axes.
 *
 * @param props Rest geometry and its original contact/span declarations.
 * @param travels Requested absolute travels, with the producer's units.
 * @returns Current parts/contact frames and the articulation owner's travels.
 * @throws {AutoMovieArchetypeRefusal} Through the articulation/span owners for unsupported requests or invalid physical line constraints.
 */
export function poseArchetype(
  props: Props,
  travels: ReadonlyMap<string, number>,
): AutoMovieArchetypeArticulation.IResult {
  if (ArchetypePartOwnership.active()) return observed(props, travels);
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

/** Observe method identities while preserving lookup and argument order. */
function observed(
  props: Props,
  travels: ReadonlyMap<string, number>,
): AutoMovieArchetypeArticulation.IResult {
  const articulate: typeof ARTICULATE = AutoMovieArchetypeArticulation.pose;
  const archetype: string = props.archetype;
  const original: Props["parts"] = props.parts;
  const posed: AutoMovieArchetypeArticulation.IResult = Reflect.apply(
    articulate,
    AutoMovieArchetypeArticulation,
    [archetype, { parts: original, affordances: props.affordances }, travels],
  );
  const span: typeof SPAN = AutoMovieArchetypeSpan.pose;
  const spanOwner: string = props.archetype;
  const declarations: Props["spans"] = props.spans;
  const articulated: AutoMovieArchetypeArticulation.IResult["parts"] =
    posed.parts;
  const spans: AutoMovieArchetypeSpan.IPose = Reflect.apply(
    span,
    AutoMovieArchetypeSpan,
    [spanOwner, declarations, articulated, posed.affordances],
  );
  const result: AutoMovieArchetypeArticulation.IResult = {
    ...posed,
    parts: spans.parts,
    affordances: spans.affordances,
  };
  if (articulate === ARTICULATE && span === SPAN)
    ArchetypePartOwnership.afterNormalization(
      original,
      articulated,
      result.parts,
    );
  return result;
}

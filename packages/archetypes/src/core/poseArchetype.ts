import { ArchetypeArticulation } from "./ArchetypeArticulation";
import { ArchetypePartOwnership } from "./ArchetypePartOwnership";
import { ArchetypeSpan } from "./ArchetypeSpan";
import type { IArchetypeProps } from "./IArchetypeProps";

/** The constructor's actual rest geometry, contacts and flexible-line declarations. */
type Props = Pick<
  IArchetypeProps<string, string>,
  "archetype" | "parts" | "affordances" | "spans"
>;

/** Original runtime methods required for a constructor allocation receipt. */
const ARTICULATE: typeof ArchetypeArticulation.pose =
  ArchetypeArticulation.pose;
const SPAN: typeof ArchetypeSpan.pose = ArchetypeSpan.pose;

/**
 * Resolve one archetype's articulations, flexible geometry and held contact axes.
 *
 * @param props Actual rest geometry and its original contact/span declarations.
 * @param travels Requested absolute travels, with the producer's units.
 * @returns Current parts/contact frames and the articulation owner's travels.
 * @throws {ArchetypeRefusal} Through the articulation/span owners for unsupported requests or invalid physical line constraints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the constructor's complete current-pose normalization, dependency order, original declarations and refusal ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve articulation and its carried contact origins first, then compute flexible lines and their explicitly constrained held axes from that same current pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered composition keeps model construction from duplicating the two owners' current-pose rules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No identity, part, contact semantic record, state or mass property is invented or discarded; held origins are placed before their line directions are derived.
 * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant record composition to the articulation owner's existing propagation cost and the span owner's O(S(P+A)) work for spans, parts and contacts; neither operation is repeated.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The articulation output directly supplies span geometry and contact origins, while its already resolved travel map is retained unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the current pose lists and travel map; only the composed result escapes, with no global cache or external resource.
 */
export function poseArchetype(
  props: Props,
  travels: ReadonlyMap<string, number>,
): ArchetypeArticulation.IResult {
  if (ArchetypePartOwnership.active()) return observed(props, travels);
  const posed: ArchetypeArticulation.IResult = ArchetypeArticulation.pose(
    props.archetype,
    { parts: props.parts, affordances: props.affordances },
    travels,
  );
  const spans: ArchetypeSpan.IPose = ArchetypeSpan.pose(
    props.archetype,
    props.spans,
    posed.parts,
    posed.affordances,
  );
  return { ...posed, parts: spans.parts, affordances: spans.affordances };
}

/** Observe actual method identities while preserving lookup and argument order. */
function observed(
  props: Props,
  travels: ReadonlyMap<string, number>,
): ArchetypeArticulation.IResult {
  const articulate: typeof ARTICULATE = ArchetypeArticulation.pose;
  const archetype: string = props.archetype;
  const original: Props["parts"] = props.parts;
  const posed: ArchetypeArticulation.IResult = Reflect.apply(
    articulate,
    ArchetypeArticulation,
    [archetype, { parts: original, affordances: props.affordances }, travels],
  );
  const span: typeof SPAN = ArchetypeSpan.pose;
  const spanOwner: string = props.archetype;
  const declarations: Props["spans"] = props.spans;
  const articulated: ArchetypeArticulation.IResult["parts"] = posed.parts;
  const spans: ArchetypeSpan.IPose = Reflect.apply(span, ArchetypeSpan, [
    spanOwner,
    declarations,
    articulated,
    posed.affordances,
  ]);
  const result: ArchetypeArticulation.IResult = {
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

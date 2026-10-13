import { IAutoMovieArchetypeRefusal } from "./IAutoMovieArchetypeRefusal";
/**
 * The exact keys one parameter map must carry and may carry.
 *
 * A plan is computed from the parameters themselves because an archetype may
 * take a discriminating parameter whose value decides which other keys are
 * meaningful. The design gate owns the diagnostics; the archetype owns only the
 * facts they are derived from.
 *
 * The gate reports every `required` key the map lacks, every refusal, and every
 * present key that is outside the archetype's `parameters` schema or, when
 * `accepted` is a list, outside that list.
 *
 * @evidence contracts/common.md#principled-implementation Required and accepted keys are computed per map so a discriminating value such as primitive-prop's `shape` can narrow both, while kind and bound checks stay against the static schema the gate reads directly.
 * @evidence contracts/common.md#clear-and-simple-design Three fields answer the gate's three key checks, and `accepted: null` lets an undiscriminated archetype such as stickman defer to its schema instead of restating every key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan reports facts and never formats gate output, and the null sentinel is the documented absence of a narrowing rather than a special case for one archetype.
 * @evidence contracts/common.md#meaningful-documentation The prose explains why a plan depends on the map and lists exactly what the gate reports from it; `accepted` documents what null means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This is the return type of `plan` and runs nothing; the gate builds one `Set` from a non-null `accepted` list, which is costed on the gate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plan answers one recipe's map once per validation, and two recipes share no plan because each map may discriminate differently.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The gate holds a plan only inside one recipe's parameter check and keeps none of its lists afterwards.
 * @author Samchon
 */
export interface IAutoMovieArchetypeParameterPlan {
  /** Keys that must be present. */
  required: readonly string[];

  /** Keys accepted at all, or null when every declared schema key is. */
  accepted: readonly string[] | null;

  /** Archetype-owned refusals, such as an unsupported discriminating value. */
  refusals: readonly IAutoMovieArchetypeRefusal[];
}

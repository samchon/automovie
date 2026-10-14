import { AutoMovieHumanoidBone, IAutoMovieModelRecipe } from "@automovie/interface";
import { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";

/**
 * Read the registered archetype's required bone identities for imported appearance compatibility.
 *
 * @evidence contracts/common.md#principled-implementation The registry definition supplies its exact bones; the existing unknown-archetype case returns an empty list and later design/materialization owners refuse that unknown recipe.
 * @evidence contracts/common.md#clear-and-simple-design Bone requirements stay with the archetype builder rather than a duplicated humanoid name list in asset admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty list binds static appearance under existing policy; this helper does not infer a missing registry entry, skeleton or weighted mapping.
 * @evidence contracts/common.md#meaningful-documentation States borrowed registry bones, skeleton-free interpretation and the separate unknown-archetype refusal owner.
 * @evidence contracts/performance.md#efficient-algorithms One expected constant registry lookup returns its existing list or the fixed empty fallback without building geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows the registered schema list, not a cached answer for changing recipe parameters or asset bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No owned buffer/handle is acquired; the registry/caller controls the borrowed list's lifetime.
 *
 * @author Samchon
 */
export function requiredRecipeBones(
  model: IAutoMovieModelRecipe,
  archetypes: AutoMovieModelArchetypeRegistry,
): readonly AutoMovieHumanoidBone[] { return archetypes.get(model.archetype)?.bones ?? []; }

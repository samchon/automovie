import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";

/**
 * Every archetype one host may build, keyed by the id a recipe names.
 *
 * A host chooses its registered definitions and resolves their exact ids through this read-only map.
 *
 * Keys are exact, case-sensitive ids. A Map with arbitrary string keys and archetype values satisfies this type, so blank-id and duplicate refusals and key-equals-definition-id hold only at registration through `createAutoMovieArchetypeRegistry`.
 *
 * Definitions are borrowed mutable objects; keep their ids, schema and functions unchanged while the registry is used. ReadonlyMap hides map writes from typed consumers without freezing the underlying map or its definitions.
 *
 * @evidence contracts/common.md#principled-implementation ReadonlyMap exposes exact-id lookup and iteration without typed map writes. The factory supplies a native Map with borrowed definitions; neither this alias nor the factory enforces deep immutability or purity.
 * @evidence contracts/common.md#clear-and-simple-design An alias rather than a class keeps the seam to one lookup type every consumer already understands, and the integrity rules live in the single factory instead of a wrapper type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias admits any map, and the comment states that the blank-id, duplicate and key-equals-id guarantees therefore come from the factory instead of claiming the type enforces them.
 * @evidence contracts/common.md#meaningful-documentation Gives exact keys, factory-time integrity checks, borrowed mutable definitions and the stable-definition obligation required after registration.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The alias executes no lookup or construction; the factory supplies a native Map, while a host-supplied ReadonlyMap implementation owns its lookup costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type only names the lookup; each host decides when to construct and share its registry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Whoever builds the map owns it and its references to definitions; the type owns no state of its own.
 * @author Samchon
 */
export type AutoMovieModelArchetypeRegistry = ReadonlyMap<
  string,
  IAutoMovieModelArchetype
>;

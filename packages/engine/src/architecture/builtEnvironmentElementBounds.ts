import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";

/**
 * The world box one named element's placed geometry fills.
 *
 * **This is the engine's one computation of an element's world extent, and
 * every layer above asks it rather than repeating it.** Placement validation
 * resolves an element locator through here, subject description answers "where
 * is this element" through here, and the space fold above measures its elements
 * through the same private placement and tessellation this calls. A fourth
 * spelling of the same box is the defect this sentence exists to prevent: the
 * medieval-residence campaign built its own element-bounds probe by hand and
 * used it more than the viewer, which is exactly how a second answer to one
 * question gets written.
 *
 * The element stands where the environment's current operating state puts it,
 * so a leaf authored open is measured where it rests. Geometry is read through
 * {@link tessellate} for a primitive and from the stated mesh otherwise, the
 * same vertices the renderer draws.
 *
 * `null` has two ordinary readings, and neither is a fault. An id this record
 * never declared resolves to nothing, because the caller is usually resolving a
 * locator that project source authored and an unresolved locator is a finding
 * for that caller to report rather than an engine refusal — which is why this
 * answers `null` where the space queries in this file throw. A transform-only
 * element draws nothing, so it has no geometry box either, and it is left out
 * here for exactly the reason {@link builtEnvironmentSpaceContentBounds} leaves
 * it out of a room's contents: a grouping node standing eight metres up is not
 * something a camera can be aimed at.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, contributes its own world origin rather than nothing, so the answer is
 * a degenerate box at the place the record does state.
 *
 * One call stages the whole work's transform hierarchy, because an element's
 * world matrix is its ancestors' product. A caller resolving many locators over
 * one environment pays that once per locator, which is worth knowing before
 * putting this inside a loop over thousands of placements.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance `builtEnvironmentElementBounds` answers for one placed occurrence by its own stable identity, keeping a single placement's extent distinct from the prototype it reuses.
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentElementBounds` reports the world box one declared building element's placed geometry fills. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance `builtEnvironmentElementBounds` reports the placement fact recorded against one instance identity rather than a fact about its shared prototype.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentElementBounds` resolves one element's hierarchy, operating state, and geometry into its world extent inside one building-interior boundary.
 * @author Samchon
 */
export const builtEnvironmentElementBounds = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  const element = environment.elements.find(
    (candidate) => candidate.id === elementId,
  );
  if (element === undefined || element.model === null) return null;
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const model = environment.models.find(
    (candidate) => candidate.id === element.model,
  );
  return boundsOf(placedElementPoints(model, matrices.get(element.id)!));
};

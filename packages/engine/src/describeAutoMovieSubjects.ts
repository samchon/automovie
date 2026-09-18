import { IAutoMovieSubjectArtifact, IAutoMovieSubjectDescription } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/**
 * Enumerate directly stored compiled subjects without expanding placed parts or
 * compact instance members.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Lets a reviewer discover stable compiled subject identities without rendering.
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Measures the inventory from the compiled artifact consumed by render and oracle services.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Enumerates prototypes, prototype parts, elements, instance sets, and spaces in deterministic order.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Derives geometry and space boxes from compiled content and declarations.
 */
export const describeAutoMovieSubjects = (
  artifact: IAutoMovieSubjectArtifact,
): IAutoMovieSubjectDescription[] => {
  const context = createDescriptionContext(artifact);
  const descriptions: IAutoMovieSubjectDescription[] = [];
  for (const model of context.models.values()) {
    descriptions.push(describePrototype(context, model));
    for (const part of model.parts)
      descriptions.push(describePrototypePart(context, model, part));
  }
  for (const node of artifact.compiled.scene.nodes)
    descriptions.push(describeElement(context, node.id));
  for (const set of artifact.compiled.instanceSets)
    descriptions.push(describeInstanceSet(context, set));
  for (const environment of artifact.compiled.builtEnvironments ?? []) {
    // A transform-only group stages no node, so the scene walk above never
    // reaches one. Leaving it out made the inventory of a building smaller than
    // the building: one authored example carries 30 elements and stages 22, and
    // the 8 it does not stage include both of its unit roots. They are elements
    // the record owns, so a census that omits them is a census of the scene
    // rather than of the work.
    for (const element of environment.elements)
      if (element.model === null)
        descriptions.push(describeElementGroup(context, environment, element));
    for (const space of environment.spaces)
      descriptions.push(describeSpace(context, environment, space));
    // The unit itself. A work holds several independently placed buildings, and
    // neither the scene walk nor the space tree ever names one: the scene knows
    // nodes and the space tree knows rooms, so without this the only thing a
    // reviewer could not address was the whole building.
    for (const building of environment.buildings)
      descriptions.push(describeBuilding(context, environment, building));
  }
  return descriptions.sort((left, right) =>
    compareAutoMovieRenderIds(left.id, right.id),
  );
};

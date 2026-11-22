import { ArchetypePartOwnership } from "./ArchetypePartOwnership";
import { AutoMovieArchetype } from "./AutoMovieArchetype";

/**
 * Build an archetype from the builder's own rest arrays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the builder's owned inputs, native normalization and original model output.
 * @evidence contracts/development/implementation.md#principled-implementation The actual constructor and native array owners establish provenance for its original output array, after normal physical admission.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Original construction with one optional identity association.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary structural model receives a producer capability and nothing bypasses the original constructor.
 * @evidence contracts/development/implementation.md#efficient-algorithms One constant-size identity record beyond the original normalization.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A later private neutral preparation may use this genuine builder provenance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak identity holds only the original already owned array, never a sampled pose.
 */
export function buildNativeArchetype<Id extends string, D extends string>(
  props: AutoMovieArchetype.IProps<Id, D>,
): AutoMovieArchetype<Id, D> {
  let native: boolean = false;
  const model: AutoMovieArchetype<Id, D> = ArchetypePartOwnership.observe(
    props.parts,
    (): AutoMovieArchetype<Id, D> => new AutoMovieArchetype<Id, D>(props),
    (owned: boolean): void => {
      native = owned;
    },
  );
  if (native) ArchetypePartOwnership.remember(model);
  return model;
}

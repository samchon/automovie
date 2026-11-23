import { ArchetypePartOwnership } from "./ArchetypePartOwnership";
import { AutoMovieArchetype } from "./AutoMovieArchetype";

/**
 * Build an archetype from the builder's own rest arrays.
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

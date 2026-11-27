import { AutoMovieArchetype } from "../AutoMovieArchetype";

/**
 * Build an archetype from the builder's own rest arrays: the builder's
 * constructor seam, kept in its own module so the builder imports the model
 * only as a type.
 *
 * @param props The rest geometry, contacts and properties the builder made.
 * @returns The model over those arrays.
 */
export function buildNativeArchetype<Id extends string, D extends string>(
  props: AutoMovieArchetype.IProps<Id, D>,
): AutoMovieArchetype<Id, D> {
  return new AutoMovieArchetype<Id, D>(props);
}

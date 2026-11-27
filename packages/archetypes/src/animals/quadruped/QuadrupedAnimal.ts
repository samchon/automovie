import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeDrawSession,
} from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";

/*
 * Build a non-equid prototype from its declared dimensions and coarse body.
 *
 * Unlike the equid builder this applies no horse weight law, saddle, segment
 * mass shares or hoof friction. The dog supplies its measured cohort dimensions
 * and an authored total mass. Missing segment shares use the builder's uniform
 * solid-density approximation; missing foot material leaves friction unknown.
 * Parameter props: The producer identity, dimensions, body and optional additions.
 * Returns: The independently owned animal model.
 */
export function QuadrupedAnimal<Id extends string>(
  props: QuadrupedAnimal.IProps<Id>,
): AutoMovieArchetype<Id, AutoMovieArchetypeQuadrupedBody.Dimension> {
  const dimensions: Readonly<
    Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
  > = props.draw.values;
  const rig: AutoMovieArchetypeQuadrupedBody.IRig =
    AutoMovieArchetypeQuadrupedBody.rig(props.body, dimensions);
  const builder: AutoMovieArchetypeBuilder<
    Id,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: props.id,
    name: props.name,
    draw: props.draw,
    material: "skin",
  });
  AutoMovieArchetypeQuadrupedBody.lay(
    props.body,
    builder,
    dimensions.withersHeight!,
    rig,
  );
  props.add?.(builder, rig);
  return builder.build(dimensions.mass!, { rests: props.body.foot });
}

/*
 * Inputs of the non-equid builder, consumed by the dog and coherent
 * ox/camel/deer reference producers.
 */
export namespace QuadrupedAnimal {
  /*
   * One producer's complete construction input.
   */
  export interface IProps<Id extends string> {
    /*
     * Optional instance id.
     */
    id?: string;
    /*
     * Human-readable prototype name.
     */
    name: string;
    /*
     * Already admitted metres, kilograms and dimensionless tempo.
     */
    draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeQuadrupedBody.Dimension>;
    /*
     * Coarse proportions, with any unknown physical fields left absent.
     */
    body: AutoMovieArchetypeQuadrupedBody.IBody;
    /*
     * Add the species' identifying parts and authored tack to this model.
     */
    add?: (
      builder: AutoMovieArchetypeBuilder<
        Id,
        AutoMovieArchetypeQuadrupedBody.Dimension
      >,
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
    ) => void;
  }
}

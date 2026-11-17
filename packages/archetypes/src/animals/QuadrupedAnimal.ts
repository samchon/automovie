import {
  type Archetype,
  ArchetypeBuilder,
  type ArchetypeDrawSession,
} from "../core";
import { QuadrupedBody } from "./QuadrupedBody";

/**
 * Build a non-equid prototype from its declared dimensions and coarse body.
 *
 * Unlike the equid builder this applies no horse weight law, saddle, segment
 * mass shares or hoof friction. The dog supplies its measured cohort dimensions
 * and an authored total mass. Missing segment shares use the builder's uniform
 * solid-density approximation; missing foot material leaves friction unknown.
 *
 * @param props The producer identity, dimensions, body and optional additions.
 * @returns The independently owned animal model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the construction and the two physical approximations.
 * @evidence contracts/development/implementation.md#principled-implementation The existing shared rig, body layout and mass builder consume one coherent profile.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read dimensions, lay the body, add the producer's parts and finish.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No equine mass law or unknown paw coefficient is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size rig and one pass over its parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer's one draw session supplies every recorded dimension.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its data and no process resource is opened.
 */
export function QuadrupedAnimal<Id extends string>(
  props: QuadrupedAnimal.IProps<Id>,
): Archetype<Id, QuadrupedBody.Dimension> {
  const dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>> =
    props.draw.values;
  const rig: QuadrupedBody.IRig = QuadrupedBody.rig(props.body, dimensions);
  const builder: ArchetypeBuilder<Id, QuadrupedBody.Dimension> =
    new ArchetypeBuilder({
      id: props.id,
      name: props.name,
      draw: props.draw,
      material: "skin",
    });
  QuadrupedBody.lay(props.body, builder, dimensions.withersHeight!, rig);
  props.add?.(builder, rig);
  return builder.build(dimensions.mass!, { rests: props.body.foot });
}

/**
 * Inputs of the non-equid builder, consumed by the dog and coherent ox/camel/deer reference producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every input states its ownership and unit.
 * @evidence contracts/development/design.md#principled-representation One body profile and its existing dimension draw session.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds no species registry or alternative geometry representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback adds actual parts and contacts to the same physical model.
 */
export namespace QuadrupedAnimal {
  /** One producer's complete construction input. */
  export interface IProps<Id extends string> {
    /** Optional instance id. */
    id?: string;
    /** Human-readable prototype name. */
    name: string;
    /** Already admitted metres, kilograms and dimensionless tempo. */
    draw: ArchetypeDrawSession<QuadrupedBody.Dimension>;
    /** Coarse proportions, with any unknown physical fields left absent. */
    body: QuadrupedBody.IBody;
    /** Add the species' identifying parts and authored tack to this model. */
    add?: (
      builder: ArchetypeBuilder<Id, QuadrupedBody.Dimension>,
      rig: QuadrupedBody.IRig,
    ) => void;
  }
}

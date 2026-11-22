import type { IAutoMovieBody } from "@automovie/interface";

import type { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import type { IAutoMovieArchetypeProps } from "./IAutoMovieArchetypeProps";

/** The existing scalar body metadata and the mass properties it describes. */
type Props<Physical extends AutoMovieArchetypeMass.IProperties | null> = Pick<
  IAutoMovieArchetypeProps<string, string, Physical>,
  | "properties"
  | "friction"
  | "kineticFriction"
  | "restitution"
  | "drag"
  | "contact"
>;

/**
 * Construct the model body from one archetype's declared physical metadata.
 * A visual-only archetype has a null body.
 * An unknown coefficient stays absent; the body never invents a rebound.
 *
 * @param props Derived mass properties and declared or measured contact data.
 * @returns A fresh body with fresh centre, drag and contact records, or null without mass properties.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States body construction, absent-coefficient meaning and fresh ownership of every mutable nested record.
 * @evidence contracts/development/implementation.md#principled-implementation Copies SI mass properties and only declared contact coefficients into the existing model body representation; null is preserved as absence rather than zero. Builder owns material and restitution admission, while validateBody owns the full model scalar ranges; this projection does not repeat either gate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body-construction owner serves the AutoMovieArchetype constructor and keeps serialization and nested ownership independent of geometry and articulation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no coefficient, material inference or geometry estimate and preserves the existing field insertion order.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of scalar reads and at most three small nested copies take constant time and storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the existing scalar metadata and mass properties without recomputing or revalidating them; every body's mutable records remain distinct.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the fresh body escapes, with no retained archetype, builder, query or external handle.
 */
export function ArchetypeBody<
  Physical extends AutoMovieArchetypeMass.IProperties | null,
>(props: Props<Physical>): Physical extends null ? null : IAutoMovieBody;
export function ArchetypeBody(
  props: Props<AutoMovieArchetypeMass.IProperties | null>,
): IAutoMovieBody | null {
  const properties: AutoMovieArchetypeMass.IProperties | null =
    props.properties;
  if (properties === null) return null;
  return {
    mass: properties.mass,
    centerOfMass: { ...properties.centerOfMass },
    ...(props.friction === null ? {} : { friction: props.friction }),
    ...(props.kineticFriction === null
      ? {}
      : { kineticFriction: props.kineticFriction }),
    ...(props.restitution === null ? {} : { restitution: props.restitution }),
    ...(props.drag === null ? {} : { drag: { ...props.drag } }),
    ...(props.contact === null ? {} : { contact: { ...props.contact } }),
  };
}

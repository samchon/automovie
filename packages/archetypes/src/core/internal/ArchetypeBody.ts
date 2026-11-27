import type { IAutoMovieBody } from "@automovie/interface";

import type { AutoMovieArchetypeMass } from "../AutoMovieArchetypeMass";
import type { IAutoMovieArchetypeProps } from "../IAutoMovieArchetypeProps";

/**
 * Construct the model body from one archetype's declared physical metadata. A
 * visual-only archetype has a null body. An unknown coefficient stays absent;
 * the body never invents a rebound.
 *
 * @param props Derived mass properties and declared or measured contact data.
 * @returns A fresh body with fresh centre, drag and contact records, or null
 *   without mass properties.
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

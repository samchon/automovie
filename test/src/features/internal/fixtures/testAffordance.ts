import type {
  AutoMovieAffordanceKind,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * An affordance for unit tests of a function that reads a prop's named points:
 * its id, kind and frame in the prop's space, no extent, and any further
 * declared fields.
 *
 * @param id The affordance id.
 * @param kind The affordance kind.
 * @param translation Its place in the prop's space, metres.
 * @param rotation Its turn in the prop's space; none by default.
 * @param extra Further declared fields, such as a seat's depth.
 * @returns The affordance.
 */
export function testAffordance(
  id: string,
  kind: AutoMovieAffordanceKind,
  translation: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  extra: Partial<IAutoMovieAffordance> = {},
): IAutoMovieAffordance {
  return {
    id,
    kind,
    frame: { translation, rotation },
    extent: null,
    ...extra,
  };
}

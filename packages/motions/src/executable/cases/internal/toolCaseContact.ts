import { Transform, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A tool or vessel contact frame for the tool captures: at a point, its `+Y`
 * along `out` and its `+X` along `along`, its `+Z` completing the right-handed
 * basis.
 *
 * @param id The contact's id.
 * @param kind The contact's kind.
 * @param at Its point in the prop's frame, metres.
 * @param out Its outward direction, unit.
 * @param along Its long direction, unit, perpendicular to `out`.
 * @param extra Further fields of the contact.
 * @returns The contact.
 */
export function toolCaseContact(
  id: string,
  kind: IAutoMovieAffordance["kind"],
  at: IAutoMovieVector3,
  out: IAutoMovieVector3,
  along: IAutoMovieVector3,
  extra: Partial<IAutoMovieAffordance> = {},
): IAutoMovieAffordance {
  const rotation: IAutoMovieQuaternion = AutoMovieEngineMath.quaternionFromBasis(
    along,
    out,
    Vector3.cross(along, out),
  );
  return {
    id,
    kind,
    frame: Transform.of(at, rotation),
    extent: null,
    ...extra,
  };
}

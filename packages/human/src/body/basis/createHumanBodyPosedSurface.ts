import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodyPosedSurfaceInput } from "./IHumanBodyPosedSurfaceInput";
import { createHumanBodySurfaceMush } from "./createHumanBodySurfaceMush";
import { createHumanBodySurfaceSag } from "./createHumanBodySurfaceSag";
import { humanBodySkinDownDirection } from "./humanBodySkinDownDirection";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Compile one skin surface's pose and optional gravity response for a basis.
 *
 * The surface owns its skin weights and sag neighbourhoods. The body builder
 * supplies one shaped position array, the joint transforms, and the matching
 * rest and lean arrays for the same document revision. Optional rest-detail
 * filtering corrects the skinning of the neutral shape, then the full
 * corrected-minus-neutral skinning displacement is added. Both skin samples
 * use the same transforms; subtraction preserves pose correctives even when
 * distributed twist makes skinning depend on position. Sag follows that
 * result, while its gravity derivative still receives pure skinning:
 * the sag field compares gravity in the rest and posed skin frames, then moves
 * the posed vertices in metres. The basis and document are read only; each
 * evaluation returns a new position array for normal and region projection.
 * `humanBodySkinDownDirection` evaluates the current rig's local rest-down
 * direction for sag, including position-dependent distributed twist. Its
 * difference step comes from floating-point error, not tissue calibration.
 * This stage has no collision or tissue-contact constraint.
 */
export function createHumanBodyPosedSurface(
  surface: Surface,
  joints: IAutoMovieHumanBodyBasis["joints"],
): (input: IHumanBodyPosedSurfaceInput) => number[] {
  const sag =
    surface.sag === undefined
      ? null
      : createHumanBodySurfaceSag(surface, surface.sag);
  const mush =
    surface.mush === undefined
      ? null
      : createHumanBodySurfaceMush(surface, surface.mush);
  return ({ shaped, transforms, rest, lean, document }) => {
    const skinned = skinHumanBodySurface(
      shaped,
      surface.skin,
      joints,
      transforms,
      surface.toeSplit,
    );
    const filtered =
      mush === null || rest === null
        ? skinned
        : (() => {
            const neutral = skinHumanBodySurface(
              rest,
              surface.skin,
              joints,
              transforms,
              surface.toeSplit,
            );
            const restored = mush(rest, neutral);
            return skinned.map(
              (value, i) => value + (restored[i] - neutral[i]),
            );
          })();
    if (sag === null || rest === null) return filtered;
    const declared = surface.sag!;
    const softness = Math.min(
      declared.softness.range[1],
      Math.max(
        declared.softness.range[0],
        Object.entries(declared.softness.channels).reduce(
          (total, [id, gain]) => total + gain * (document.shape[id] ?? 0),
          declared.softness.base,
        ),
      ),
    );
    return sag({
      rest,
      lean: lean(),
      skinned: filtered,
      hanging: humanBodySkinDownDirection({
        positions: shaped,
        skinned,
        skin: surface.skin,
        joints,
        transforms,
        ...(surface.toeSplit === undefined
          ? {}
          : { toeSplit: surface.toeSplit }),
      }),
      softness,
    });
  };
}

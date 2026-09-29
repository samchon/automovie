import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySurfaceSag } from "./createHumanBodySurfaceSag";
import { humanBodySkinDownDirection } from "./humanBodySkinDownDirection";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Compile one skin surface's pose and optional gravity response for a basis.
 *
 * The surface owns its skin weights and sag neighbourhoods. The body builder
 * supplies one shaped position array, the joint transforms, and the matching
 * rest and lean arrays for the same document revision. Skinning precedes sag:
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
): (input: {
  shaped: number[];
  transforms: Parameters<typeof skinHumanBodySurface>[3];
  rest: number[] | null;
  lean: () => number[];
  document: IAutoMovieHumanBodyBasisDocument;
}) => number[] {
  const sag =
    surface.sag === undefined
      ? null
      : createHumanBodySurfaceSag(surface, surface.sag);
  return ({ shaped, transforms, rest, lean, document }) => {
    const skinned = skinHumanBodySurface(shaped, surface.skin, joints, transforms);
    if (sag === null || rest === null) return skinned;
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
      skinned,
      hanging: humanBodySkinDownDirection({
        positions: shaped,
        skinned,
        skin: surface.skin,
        joints,
        transforms,
      }),
      softness,
    });
  };
}

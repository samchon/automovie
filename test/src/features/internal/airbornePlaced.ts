import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The identity orientation of a still body. */
const STILL: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Bones at given world places, unturned: each bone named in `at` sits at its
 * place with the identity rotation.
 *
 * @param at The world place of each bone, metres.
 * @returns The resolved bones keyed by bone name.
 */
export const airbornePlaced: (
  at: Record<string, IAutoMovieVector3>,
) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  at: Record<string, IAutoMovieVector3>,
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
  new Map(
    Object.entries(at).map(
      ([bone, place]: [string, IAutoMovieVector3]): [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ] => [
        bone as AutoMovieHumanoidBone,
        {
          bone: bone as AutoMovieHumanoidBone,
          localRotation: STILL,
          worldPosition: place,
          worldRotation: STILL,
        },
      ],
    ),
  );

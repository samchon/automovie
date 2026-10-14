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
 * The surface owns its skin weights and sag neighbourhoods. The body builder supplies one shaped position array, the joint transforms, and the matching rest and lean arrays for the same document revision. Optional rest-detail filtering corrects the skinning of the neutral shape, then the full corrected-minus-neutral skinning displacement is added. Both skin samples use the same transforms; subtraction preserves pose correctives even when distributed twist makes skinning depend on position. Sag follows that result, while its gravity derivative still receives pure skinning: the sag field compares gravity in the rest and posed skin frames, then moves the posed vertices in metres. The basis and document are read only; each evaluation returns a new position array for normal and region projection. `humanBodySkinDownDirection` evaluates the current rig's local rest-down direction for sag, including position-dependent distributed twist. Its difference step comes from floating-point error, not tissue calibration. This stage has no collision or tissue-contact constraint.
 *
 * @evidence contracts/common.md#principled-implementation Skinning applies shaped positions first; rest-detail correction transfers neutral residuals under the same transforms, and declared sag uses rest/lean tissue proxy plus the rig's current down direction.
 * @evidence contracts/common.md#clear-and-simple-design Basis compilation prepares optional mush and sag closures; one document evaluation sequences skinning, rest correction and gravity response for normal/region consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing optional stages preserve pure skinning; admitted source policy remains required, and filtering or sag supplies no collision, volume or clinical-contact guarantee.
 * @evidence contracts/common.md#meaningful-documentation Inputs share source vertex order and document revision; the prose distinguishes corrective transfer, pure-skin gravity derivative and authored exterior response.
 * @evidence contracts/performance.md#efficient-algorithms Pure skinning walks vertices; requested filtering and sag add topology-based sweeps and a neutral skinning pass, while absent rest-dependent stages avoid those traversals.
 * @evidence contracts/performance.md#reuse-equivalent-work Topology policies compile once per surface, matching rest and lean evaluations come from caller-owned lazy providers, and one pure skinned array also feeds the down-direction derivative.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains basis surface/joint data and optional topology snapshots; per-document arrays expire except returned positions, and dropping the closure releases its references without handles or tasks.
 */
export function createHumanBodyPosedSurface(
  surface: Surface,
  joints: IAutoMovieHumanBodyBasis["joints"],
): (input: IHumanBodyPosedSurfaceInput) => number[] {
  const sag: ReturnType<typeof createHumanBodySurfaceSag> | null =
    surface.sag === undefined
      ? null
      : createHumanBodySurfaceSag(surface, surface.sag);
  const mush: ReturnType<typeof createHumanBodySurfaceMush> | null =
    surface.mush === undefined
      ? null
      : createHumanBodySurfaceMush(surface, surface.mush);
  return ({
    shaped,
    transforms,
    rest,
    lean,
    document,
  }: IHumanBodyPosedSurfaceInput): number[] => {
    const skinned: number[] = skinHumanBodySurface(
      shaped,
      surface.skin,
      joints,
      transforms,
      surface.toeSplit,
    );
    const filtered: number[] =
      mush === null || rest === null
        ? skinned
        : ((): number[] => {
            const neutral: number[] = skinHumanBodySurface(
              rest,
              surface.skin,
              joints,
              transforms,
              surface.toeSplit,
            );
            const restored: number[] = mush(rest, neutral);
            return skinned.map(
              (value: number, i: number): number =>
                value + (restored[i] - neutral[i]),
            );
          })();
    if (sag === null || rest === null) return filtered;
    const declared: NonNullable<Surface["sag"]> = surface.sag!;
    const softness: number = Math.min(
      declared.softness.range[1],
      Math.max(
        declared.softness.range[0],
        Object.entries(declared.softness.channels).reduce(
          (total: number, [id, gain]: [string, number]): number =>
            total + gain * (document.shape[id] ?? 0),
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

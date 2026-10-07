import { validateModel } from "@automovie/engine";

import { measureHumanBodyGroundSupport } from "../measure/measureHumanBodyGroundSupport";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyGroundPlacementProps } from "../structures/IHumanBodyGroundPlacementProps";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Place the lowest of the two performed feet on the fixed source ground.
 *
 * This is a vertical rigid placement, not a joint solve. It keeps every
 * requested angle and every relative body position, so unequal foot heights
 * still leave the higher foot airborne. The caller explicitly requests this
 * placement; an omitted request retains an intentionally airborne pose.
 * The actual foot-region minimum determines the translation. The source-neutral floor and
 * rest landmarks stay fixed; posed bones, unsplit skin and every static part
 * receive that one translation so the person builder carries the head with
 * the same body. No weight, friction, balance or physiological claim follows.
 *
 * @evidence contracts/common.md#principled-implementation Subtracting the minimum final foot gap from every performed Y coordinate puts that minimum on the same fixed horizontal plane without changing relative geometry.
 * @evidence contracts/common.md#clear-and-simple-design One existing final-surface instrument determines one translation shared by the model, skin and posed bone frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing ground or either foot refuses by name; the ground is never moved and angles are never clamped.
 * @evidence contracts/common.md#meaningful-documentation States the explicit placement, airborne higher foot, preserved rest frame and mechanical limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It transforms existing parts and defines none.
 * @evidence contracts/modeling.md#parameter-channels The consumer opts into lowest-foot placement; omission preserves the source-root pose.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It retains every primitive and copies only positions.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the source Y-up frame; translation is vertical relative to the unchanged joint-ground plane.
 * @evidence contracts/modeling.md#shared-boundaries Every part, unsplit surface and posed frame takes one translation, preserving their relative boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation Body and person assembly consumers own observation of the placed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It supplies a geometric placement and no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Pose owners retain their admission; placement admits no clinical range.
 * @evidence contracts/anatomy.md#parametric-authority The public request is a named geometric support choice and never an authored surface or vertex offset.
 */
export function placeHumanBodyOnGround(
  props: IHumanBodyGroundPlacementProps,
): IAutoMovieHumanBodyBuild {
  const { basis, build } = props;
  const ground = basis.landmarks.ids.indexOf("joint-ground");
  if (ground === -1)
    throw new Error(
      "Lowest-foot placement needs the source-neutral joint-ground plane.",
    );
  const groundPlaneHeightMetres = basis.landmarks.positions[ground * 3 + 1];
  const support = measureHumanBodyGroundSupport(
    basis,
    build.posedSurfaces.map((surface) => surface.positions),
    build.landmarks,
    groundPlaneHeightMetres,
  );
  if (support === null || support.length !== 2)
    throw new Error(
      "Lowest-foot placement needs joint-ground and both registered foot skin regions.",
    );
  const shift = -Math.min(...support.map((foot) => foot.gapMetres));
  if (!Number.isFinite(shift))
    throw new Error("Lowest-foot placement needs finite final foot positions.");
  const translate = (positions: readonly number[]): number[] =>
    positions.map((value, index) => (index % 3 === 1 ? value + shift : value));
  const translateFrame = <T extends IAutoMovieHumanBodyBoneTransform>(
    bone: T,
  ): T => ({
    ...bone,
    posed: {
      ...bone.posed,
      position: { ...bone.posed.position, y: bone.posed.position.y + shift },
    },
  });
  const model = {
    ...build.model,
    parts: build.model.parts.map((part) => {
      if (
        part.geometry.type !== "mesh" ||
        part.transform !== null ||
        part.attachedBone !== null
      )
        throw new Error(
          "Lowest-foot placement needs a static source-frame mesh: " + part.id,
        );
      return {
        ...part,
        geometry: {
          type: "mesh" as const,
          mesh: {
            ...part.geometry.mesh,
            positions: translate(part.geometry.mesh.positions),
          },
        },
      };
    }),
  };
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "The ground-placed body is not a valid resident model: " +
        JSON.stringify(validation),
    );
  return {
    ...build,
    groundPlaneHeightMetres,
    model,
    posedSurfaces: build.posedSurfaces.map((surface) => ({
      ...surface,
      positions: translate(surface.positions),
    })),
    bones: build.bones.map(translateFrame),
    ...(build.anatomicalRig === undefined
      ? {}
      : {
          anatomicalRig: {
            bones: new Map(
              [...build.anatomicalRig.bones].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            projections: new Map(
              [...build.anatomicalRig.projections].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            toeProjections: new Map(
              [...build.anatomicalRig.toeProjections].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            sites: new Map(
              [...build.anatomicalRig.sites].map(
                ([id, sites]) =>
                  [
                    id,
                    new Map(
                      [...sites].map(
                        ([site, position]) =>
                          [
                            site,
                            { ...position, y: position.y + shift },
                          ] as const,
                      ),
                    ),
                  ] as const,
              ),
            ),
          },
        }),
  };
}

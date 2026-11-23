import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";

/**
 * Bind one unchanged body's mass/collider demand for changing joint-only flight
 * queries. Each query shares its actual canonical geometry between COM
 * placement and an optional floor reading, then releases that frame.
 *
 * @param body The plan's unchanged body.
 * @param model The plan's unchanged physical mass model.
 * @returns A reader of original joint-only demands and desired world COM in
 *   metres, optionally borrowing its synchronous parent's exact FK source and
 *   genuine ROM projector. Each result owns fresh COM-placed raw demands and a
 *   floor reader of that same articulation.
 * @throws {Error} At query time when limb/digit goals or a separate whole-body
 *   rotation make the shape depend on its translation.
 */
export function prepareGymnasticsFrame(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
): (
  raw: IAutoMovieMotionHumanPosture,
  centre: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
) => IPreparedGymnasticsFrame {
  let requested: ReadonlySet<AutoMovieHumanoidBone> =
    HumanColliders.bones(body);
  if (model !== body.massModel) {
    const combined: Set<AutoMovieHumanoidBone> = new Set(requested);
    for (const segment of model.segments) combined.add(segment.bone);
    requested = combined;
  }
  const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body);
  return (
    raw: IAutoMovieMotionHumanPosture,
    centre: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IPreparedGymnasticsFrame => {
    if (
      Object.values(raw.limbs).some(
        (goal: IAutoMovieHumanLimbGoal | undefined): boolean =>
          goal !== undefined,
      ) ||
      Object.values(raw.digits ?? {}).some(
        (goal: IAutoMovieHumanDigitGoal | undefined): boolean =>
          goal !== undefined,
      ) ||
      raw.rotation !== undefined
    )
      throw new Error(
        "Gymnastic frame preparation requires joint-only articulation",
      );

    const source: IAutoMovieMotionHumanPosture = {
      ...raw,
      root: { ...raw.root, y: 0 },
    };
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readBones(
      resolveHumanPosture.seeded(
        body,
        source,
        undefined,
        undefined,
        read,
        undefined,
        projection,
      ).pose,
      read(),
    );
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      bones,
    );
    return {
      posture: {
        ...raw,
        root: {
          x: source.root.x + (centre.x - com.x),
          y: centre.y - com.y,
          z: source.root.z + (centre.z - com.z),
        },
      },
      floor: (): number => -minimum(bones)[0]!,
    };
  };
}

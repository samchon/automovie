
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieHumanDigitGoal, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";

/*
 * Bind one unchanged body's mass/collider demand for changing joint-only flight
 * queries. Each query shares its actual canonical geometry between COM
 * placement and an optional floor reading, then releases that frame.
 * Parameter body: The plan's unchanged body.
 * Parameter model: The plan's unchanged physical mass model.
 * Returns: A reader of original joint-only demands and desired world COM in
 * metres, optionally borrowing its synchronous parent's exact FK source and
 * genuine ROM projector. Each result owns fresh COM-placed raw demands and a
 * floor reader of that same articulation.
 * At query time when limb/digit goals or a separate whole-body
 * rotation make the shape depend on its translation.
 */
export function prepareGymnasticsFrame(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
): (...query: Query) => IPreparedGymnasticsFrame {
  const place: ReturnType<typeof preparePlacement> = preparePlacement(
    body,
    model,
    true,
  );
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body);
  return (...query: Query): IPreparedGymnasticsFrame => {
    const { posture, bones }: IPlacement = place(...query);
    return { posture, floor: (): number => -minimum(bones)[0]! };
  };
}

/*
 * Prepared readers for the actual observations a flight and landing need.
 */
export namespace prepareGymnasticsFrame {
  /*
   * Bind only the mass-bearing bones for a query that does not test landing.
   */
  export function mass(
    body: IAutoMovieMotionHumanBody,
    model: IAutoMovieResolveCenterOfMass.IModel,
  ): (...query: Query) => IAutoMovieMotionHumanPosture {
    const place: ReturnType<typeof preparePlacement> = preparePlacement(
      body,
      model,
      false,
    );
    return (...query: Query): IAutoMovieMotionHumanPosture =>
      place(...query).posture;
  }
}

/*
 * Read the same projected shape with or without its collision-only bones.
 */
function preparePlacement(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  floor: boolean,
): (...query: Query) => IPlacement {
  const requested: Set<AutoMovieHumanoidBone> = floor
    ? new Set(HumanColliders.bones(body))
    : new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  return (
    raw: IAutoMovieMotionHumanPosture,
    centre: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IPlacement => {
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
    const com: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
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
      bones,
    };
  };
}

/*
 * The time-varying query for this plan's canonical gauge.
 */
type Query = [
  raw: IAutoMovieMotionHumanPosture,
  centre: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
];

/*
 * The demand in world metres and the optional floor geometry it was read on.
 */
interface IPlacement {
  /*
   * The raw articulation translated to the requested COM.
   */
  posture: IAutoMovieMotionHumanPosture;

  /*
   * The bones in the reference posture with root `y` at zero.
   */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
}

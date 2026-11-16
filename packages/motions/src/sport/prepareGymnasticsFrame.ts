import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KnockdownFloor } from "../reaction/KnockdownFloor";
import type { GymnasticsFlight } from "./GymnasticsFlight";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";

/**
 * Bind one unchanged body's mass/collider demand for changing joint-only
 * flight queries. Each query shares its actual canonical geometry between
 * COM placement and an optional floor reading, then releases that frame.
 *
 * @param body The plan's unchanged body.
 * @param model The plan's unchanged physical mass model.
 * @returns A reader of original joint-only demands and desired world COM in metres, optionally borrowing its synchronous parent's exact FK source and genuine ROM projector. Each result owns fresh COM-placed raw demands and a floor reader of that same articulation.
 * @throws {Error} At query time when limb/digit goals or a separate whole-body rotation make the shape depend on its translation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged body/model lifetime, returned query inputs, joint-only refusal, one-query bone lifetime, metre units and independent posture/floor readings.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the original clinical demands once at root Y zero. A rigid translation carries its mass-weighted centre and every collider together; COM fixes the new root, while the negated lowest collider at root Y zero is the root height needed to rest the same articulation on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Bind the body's genuine fixed mass/collider demand once; each query admits its current raw shape, resolves one canonical bone map, places original demands by COM and lends that same map to the floor owner's reduction only on demand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves raw clinical joints, resolver ROM, collision shapes and exact physical bounds. A position-dependent goal is refused rather than frozen or substituted, and the returned posture still receives ordinary downstream resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms The body-owned demand producer performs fixed name lookup/sorting once. Each query still admits every direct joint, resolves its actual canonical mass/collider ancestry and performs O(S) mass reduction plus demanded O(C) collider bounds. It removes the second floor FK without changing stations or tolerance; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged profile supplies canonical mass/collider demand, with alternate model bones explicitly added once. Current-query geometry shares between COM/floor; optional synchronous FK/projector sources share equal FK prerequisites and static ROM metadata, while every current joint is projected without time-keyed result reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan reader retains body/model and bounded fixed demand. Each frame owns actual bones and fresh raw posture; its floor closure captures body/map, never optional FK/projector loans, which stay with their synchronous parent or release on return/throw. No loan enters a retained callback, history or external handle.
 */
export function prepareGymnasticsFrame(
  body: IHumanBody,
  model: GymnasticsFlight.Model,
): (raw: IHumanPosture, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]) => IPreparedGymnasticsFrame {
  let requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(body);
  if (model !== body.massModel) {
    const combined: Set<AutoMovieHumanoidBone> = new Set(requested);
    for (const segment of model.segments) combined.add(segment.bone);
    requested = combined;
  }
  const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  return (raw: IHumanPosture, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IPreparedGymnasticsFrame => {
    if (
      Object.values(raw.limbs).some((goal: IHumanPosture.IGoal | undefined): boolean => goal !== undefined) ||
      Object.values(raw.digits ?? {}).some((goal: IHumanPosture.IDigitGoal | undefined): boolean => goal !== undefined) ||
      raw.rotation !== undefined
    )
      throw new Error("Gymnastic frame preparation requires joint-only articulation");

    const source: IHumanPosture = { ...raw, root: { ...raw.root, y: 0 } };
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readBones(resolveHumanPosture.seeded(body, source, undefined, undefined, read, undefined, projection).pose, read());
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
    return {
      posture: {
        ...raw,
        root: {
          x: source.root.x + (centre.x - com.x),
          y: centre.y - com.y,
          z: source.root.z + (centre.z - com.z),
        },
      },
      floor: (): number => -KnockdownFloor.lowest(body, bones),
    };
  };
}


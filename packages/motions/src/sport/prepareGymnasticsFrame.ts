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
 * Prepare one joint-only flight query for both its COM placement and its
 * optional floor reading. The query owns the resolved bones until its caller
 * has read the posture and floor, then releases this preparation.
 *
 * @param body The unchanged body of the current query.
 * @param model Its physical mass model.
 * @param raw The original joint-only posture with no digit goals or separate whole-body rotation.
 * @param centre The desired world centre of mass, metres.
 * @param resolution Optional exact FK reader or lazy supplier borrowed from the current synchronous planning operation.
 * @returns Fresh raw posture demands placed by COM and a floor reader of that same articulation.
 * @throws {Error} When goals or a separate rotation make the shape depend on its translation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States joint-only admission, one-query bone lifetime, metre units and independent demanded posture/floor readings.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the original clinical demands once at root Y zero. A rigid translation carries its mass-weighted centre and every collider together; COM fixes the new root, while the negated lowest collider at root Y zero is the root height needed to rest the same articulation on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the fixed query inputs, resolve one canonical bone map, place the raw posture by COM and lend that same map to the floor owner's reduction only on demand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves raw clinical joints, resolver ROM, collision shapes and exact physical bounds. A position-dependent goal is refused rather than frozen or substituted, and the returned posture still receives ordinary downstream resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms One canonical resolution and FK of mass/collider bone ancestry supplies both consumers, followed by O(S) mass reduction and demanded O(C) collider bounds. It removes the second floor FK without changing stations or tolerance; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same unchanged profile supplies the body's canonical mass model and borrowed collider demand; alternate model bones are explicitly added. Only current-query geometry is shared between COM/floor, while a synchronous reader reuses exactly unchanged FK dependencies across real stations, without time-keyed result reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each frame owns one current-query map and fresh raw posture. Its floor reader captures only body/map, never the optional FK reader/supplier, which stays with the synchronous planning caller or releases on return/throw; no global history or external handle is acquired.
 */
export function prepareGymnasticsFrame(
  body: IHumanBody,
  model: GymnasticsFlight.Model,
  raw: IHumanPosture,
  centre: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): IPreparedGymnasticsFrame {
  if (
    Object.values(raw.limbs).some((goal: IHumanPosture.IGoal | undefined): boolean => goal !== undefined) ||
    Object.values(raw.digits ?? {}).some((goal: IHumanPosture.IDigitGoal | undefined): boolean => goal !== undefined) ||
    raw.rotation !== undefined
  )
    throw new Error("Gymnastic frame preparation requires joint-only articulation");

  const source: IHumanPosture = { ...raw, root: { ...raw.root, y: 0 } };
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  let requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(body);
  if (model !== body.massModel) {
    const combined: Set<AutoMovieHumanoidBone> = new Set(requested);
    for (const segment of model.segments) combined.add(segment.bone);
    requested = combined;
  }
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture.seeded(body, source, undefined, undefined, read).pose, read(), requested);
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
}


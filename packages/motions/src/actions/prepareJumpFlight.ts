import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpAirborne } from "./jumpAirborne";

/**
 * Prepare the jump's free-flight reader so a single canonical solve supplies
 * both its mass offset and its translated displayed posture for each query.
 * Original clinical joints and free leg demands stay in the posture; the
 * resolver alone admits or discards evidence of their prepared solution.
 *
 * @param body The plan's unchanged body.
 * @param model Its physical mass model.
 * @param shape The same achieved endpoints and authored free-goal interpolation used throughout flight.
 * @returns A reader of flight share in [0,1] and demanded world COM in metres, optionally borrowing its synchronous parent's exact FK source and genuine same-body ROM projector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-query solve lifetime, original demand provenance, input frames and resolver-owned admission boundary.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid root translation moves every mass point equally. Resolve the existing raw shape once at its takeoff reference root, reduce the actual mass-bearing bones, and translate the original raw demands so their canonical COM reaches the ballistic point. No achieved end point replaces a demand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the unchanged mass-name set and airborne tracks once; each query writes its original shape, prepares the actual canonical source, observes only fresh requested FK for COM and delegates authoritative raw translation/evidence to the resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing joint/foot/knee/toe paths and ordinary ROM fitting. The resolver checks live body/rig/raw/context prerequisites: changed dependencies fall back, while an explicitly rebased composition may share only independently proven unchanged free-leg fits. No arbitrary overlay, cut or whole-body turn receives a whole-pose certificate.
 * @evidence contracts/development/implementation.md#efficient-algorithms One actual canonical solve supplies COM and an eligible displayed consumer. Private-source observation computes fresh requested mass-bearing FK plus O(S) reduction without demanding an eager public full-pose clone. The second raw construction and eligible duplicate solve are removed; name admission/checks remain and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A query's actual canonical solution shares only through exact resolver-owned evidence; the plan's mass-name set snapshots its model membership. Private-source FK still admits the actual pose, and borrowed FK/projector sources share only equal prerequisites/static ROM metadata across raw fitting, COM and parent consumers. Every current joint remains projected, without a time key or previous result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/model/endpoints and one bounded mass-name set. Queries own raw shape, preparation and fresh requested FK; private canonical pose never escapes here. FK/projector loans stay synchronous and never enter issued source/token/output evidence; translated evidence remains bounded to its own lifetime, without history or handles.
 */
export function prepareJumpFlight(
  body: IHumanBody,
  model: resolveAutoMovieCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
): (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]) => IHumanPosture {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const shapeAt: ReturnType<typeof jumpAirborne.prepare> = jumpAirborne.prepare(shape);

  return (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IHumanPosture => {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const raw: IHumanPosture = shapeAt(shape.start.root, share);
    const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, raw, read, projection);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolveHumanPosture.preparedBones(prepared, requested, read);
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
    const root: IAutoMovieVector3 = {
      x: centre.x - (com.x - raw.root.x),
      y: centre.y - (com.y - raw.root.y),
      z: centre.z - (com.z - raw.root.z),
    };
    return resolveHumanPosture.translated(prepared, root);
  };
}

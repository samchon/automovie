import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
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
 * @returns A posture reader of flight share in [0,1] and demanded world COM in metres, optionally borrowing its synchronous parent's exact FK reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-query solve lifetime, original demand provenance, input frames and resolver-owned admission boundary.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid root translation moves every mass point equally. Resolve the existing raw shape once at its takeoff reference root, reduce the actual mass-bearing bones, and translate the original raw demands so their canonical COM reaches the ballistic point. No achieved end point replaces a demand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan binds the body's actual fixed mass-bone demand and unchanged airborne endpoint tracks once; each query writes its original shape, obtains a canonical preparation, reads COM and delegates authoritative raw translation/evidence to the resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing joint/foot/knee/toe paths and ordinary ROM fitting. The resolver checks live body/rig/raw/context prerequisites: changed dependencies fall back, while an explicitly rebased composition may share only independently proven unchanged free-leg fits. No arbitrary overlay, cut or whole-body turn receives a whole-pose certificate.
 * @evidence contracts/development/implementation.md#efficient-algorithms One canonical shape solve per query supplies both COM and an eligible displayed consumer, followed by FK only for the ancestor closure of S mass-bearing bones and an O(S) mass reduction. The fixed-demand producer pays name lookup/sorting once; the original second shape construction and eligible duplicate solve are removed, with speedup unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A query's own actual canonical solution is shared only through resolver-owned checked evidence, after exact unchanged-shape admission. The body's genuine demand producer snapshots fixed mass-bone membership once while every current pose is fully admitted. An explicitly borrowed operation reader shares exact FK prerequisites between canonical fitting, COM and the parent's consumers; unchanged endpoint tracks are also prepared, without a time key or previous result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/model/endpoint geometry and one bounded mass-bone demand closure. Each query owns one raw shape and preparation; its lazy reader releases on return/throw or remains with its synchronous parent, never entering the issued result. Translated posture evidence remains bounded to its own lifetime, without history or external handles.
 */
export function prepareJumpFlight(
  body: IHumanBody,
  model: resolveAutoMovieCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
): (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const shapeAt: ReturnType<typeof jumpAirborne.prepare> = jumpAirborne.prepare(shape);

  return (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IHumanPosture => {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const raw: IHumanPosture = shapeAt(shape.start.root, share);
    const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, raw, read);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readBones(prepared.pose, read());
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
    const root: IAutoMovieVector3 = {
      x: centre.x - (com.x - raw.root.x),
      y: centre.y - (com.y - raw.root.y),
      z: centre.z - (com.z - raw.root.z),
    };
    return resolveHumanPosture.translated(prepared, root);
  };
}

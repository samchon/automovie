import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
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
 * @returns A posture reader of flight share in [0,1] and demanded world COM in metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-query solve lifetime, original demand provenance, input frames and resolver-owned admission boundary.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid root translation moves every mass point equally. Resolve the existing raw shape once at its takeoff reference root, reduce the actual mass-bearing bones, and translate the original raw demands so their canonical COM reaches the ballistic point. No achieved end point replaces a demand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan prepares its mass-bone demand set and unchanged airborne endpoint tracks once; each query writes its original shape, obtains a canonical preparation, reads COM and delegates authoritative raw translation/evidence to the resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing joint/foot/knee/toe paths and ordinary ROM fitting. Prepared evidence cannot certify arbitrary authored changes: the resolver checks body, source, goals and active context, and changed overlays, cuts or whole-body turns use its ordinary fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms One canonical shape solve per query supplies both COM and an eligible displayed consumer, followed by FK only for the ancestor closure of S mass-bearing bones and an O(S) mass reduction. The original second shape construction and eligible duplicate solve are removed; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A query's own actual canonical solution is shared only through resolver-owned checked evidence, after exact unchanged-shape admission. The plan shares its fixed mass-bone demand set and unchanged airborne endpoint tracks, with no quantized time key or previous query result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/model/endpoint geometry and an O(S) bone set. Each query owns one raw shape and one preparation; its translated posture carries bounded checked evidence only for its own lifetime, and no reader, history or external handle is retained here.
 */
export function prepareJumpFlight(
  body: IHumanBody,
  model: resolveAutoMovieCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
): (share: number, centre: IAutoMovieVector3) => IHumanPosture {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const shapeAt: ReturnType<typeof jumpAirborne.prepare> = jumpAirborne.prepare(shape);

  return (share: number, centre: IAutoMovieVector3): IHumanPosture => {
    const raw: IHumanPosture = shapeAt(shape.start.root, share);
    const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, raw);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, prepared.pose, undefined, requested);
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
    const root: IAutoMovieVector3 = {
      x: centre.x - (com.x - raw.root.x),
      y: centre.y - (com.y - raw.root.y),
      z: centre.z - (com.z - raw.root.z),
    };
    return resolveHumanPosture.translated(prepared, root);
  };
}

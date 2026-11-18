import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "../posture/HumanPosturePreparation";
import { prepareHumanFreeCurve } from "../posture/prepareHumanFreeCurve";
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
 * @param duration Physical flight duration in seconds for the velocity-continuation angular resolution law.
 * @returns A reader of flight share in [0,1] and demanded world COM in metres, optionally borrowing its synchronous parent's exact FK source and genuine same-body ROM projector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-query solve lifetime, original demand provenance, input frames and resolver-owned admission boundary.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid root translation moves every mass point equally. The actual constructor-owned free curve uses deterministic constrained continuation or ordinary fallback at its reference root, then actual mass-bearing FK sets the original-demand displacement to the ballistic COM. This explicit continuous policy does not claim the public cold score winner is unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare copied pure airborne coefficients, fixed mass names and a deterministic free-curve owner once; each current target is actually fitted/checked, then the resolver's placed owner reads current mass-bearing FK and constructs authoritative raw translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the authored joint/foot/knee/toe paths and original physical bounds. Every admitted continuation verifies actual endpoint/orientation/ROM/pole and bounded chain motion; singular/unsupported/changed context uses cold fitting. Arbitrary layers/cuts cannot acquire whole-pose authority; only a separately constructed native rigid turn may preserve the exact articulation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eligible targets use constrained correction instead of complete cold swivel sweeps. Native curve validation observes flat source clinical values and fresh demanded FK without allocating B temporary joint objects; changed tuples retain actual ROM scoring. Private COM reads avoid an incoming-reader full-pose clone. Original raw/rig checks and independent output construction remain; gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A query's actual canonical solution shares only through exact resolver-owned evidence; the plan's mass-name set snapshots its model membership. Private-source FK still admits the actual pose, and borrowed FK/projector sources share only equal prerequisites/static ROM metadata across raw fitting, COM and parent consumers. Every current joint remains projected, without a time key or previous result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/model/endpoints and one bounded mass-name set. Queries own raw shape, preparation and fresh requested FK; private canonical pose never escapes here. FK/projector loans stay synchronous and never enter issued source/token/output evidence; translated evidence remains bounded to its own raw output lifetime, without history or handles.
 */
export function prepareJumpFlight(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
  duration: number,
): (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]) => IAutoMovieMotionHumanPosture {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const shapeAt: ReturnType<typeof jumpAirborne.prepare> = jumpAirborne.prepare(shape);
  const root: IAutoMovieVector3 = { ...shape.start.root };
  const curve: ReturnType<typeof prepareHumanFreeCurve> = prepareHumanFreeCurve(
    body, (share: number): IAutoMovieMotionHumanPosture => shapeAt(root, share), duration,
  );

  return (share: number, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IAutoMovieMotionHumanPosture => {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const prepared: HumanPosturePreparation.IPrepared = curve(share, read, projection);
    return HumanPosturePreparation.placed(prepared, model, requested, centre, read);
  };
}

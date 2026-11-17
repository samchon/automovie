import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanWorn } from "./HumanWorn";

/**
 * Choose the original wrapped wearable turn with actual current entry reads.
 *
 * @param props The canonical body, live entry posture, holding hand, wearable/region, original held inverse/offset and wear/grip points, and dress's degree step.
 * @returns The original chooser's degree turn, after every requested actual full arm/posture fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed entry and rigid hand/prop geometry, world receiving region, original wrapped degree step, chosen turn and carried's shared world-grip conversion.
 * @evidence contracts/development/implementation.md#principled-implementation Each original wearable turn is rigidly undone through the held prop offset to place the wrist. The original contact-aware complete posture solve judges the achieved wear point against the original actual receiving region, with the unchanged wrapped freedom chooser.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The original turn-score map drives actual worn-frame, default Bend and current complete posture reads; canonical hand-name/FK metadata is separate from borrowed entry values, and carried owns the shared inverse-offset arithmetic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original seed/refinement, actual default Bend and full coupled limb/digit fit, wear point, region target and miss remain. No achieved endpoint replaces the region and no tolerance, turn grid, contact or body constraint changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every original turn score retains actual worn-region/default Bend/complete posture reads. Only genuine canonical body hand-name/point and exact FK metadata are shared; post-fit observation emits the actual hand and omits unused surface axes. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work No fixed direct assembly, worn placement or arm chain is inferred from the borrowed posture graph or private callback purity. Each actual changed turn re-reads current source; only original duplicate-degree scalar scores and canonical metadata are shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The chooser releases its original turn-score map, exact FK reader and hand metadata on return/throw. Only a scalar turn escapes; no borrowed-entry snapshot, fixed base, worn-frame result, arm context or query history is retained.
 */
export function dressTurn(props: {
  body: IAutoMovieMotionHumanBody;
  posture: IAutoMovieMotionHumanPosture;
  side: AutoMovieHumanSide;
  wearable: IAutoMovieMotionHumanProp;
  region: AutoMovieHumanoidRegion;
  inverse: IAutoMovieQuaternion;
  offset: IAutoMovieVector3;
  socket: IAutoMovieVector3;
  wear: IAutoMovieVector3;
  /** The original positive dress.TURN spacing and refinement step, degrees. */
  step: number;
}): number {
  const fitted: Map<number, number> = new Map();
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  let readHand: ReturnType<typeof poseBones.prepare> | undefined;
  let gripAt: ReturnType<typeof HumanHand.preparePoint> | undefined;
  const missed: (degrees: number) => number = (degrees: number): number => {
    const known: number | undefined = fitted.get(degrees);
    if (known !== undefined) return known;
    const at: ReturnType<typeof dressTurn.carried> = dressTurn.carried(
      HumanWorn.frame(props.body, props.posture, props.wearable, props.region, degrees), props.inverse, props.offset,
    );
    const wrist: IAutoMovieMotionHumanHand.IWrist = placeHumanHandSurface(props.socket, at.grip, at.rotation);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...props.posture.limbs };
    limbs[`${props.side}Arm`] = {
      point: wrist.point, rotation: wrist.rotation, contact: props.socket,
      bend: AutoMovieMotionHumanBend.solve({ body: props.body, posture: props.posture, side: props.side,
        point: wrist.point, rotation: wrist.rotation, fallback: "hang" }),
    };
    const resolved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolveHumanPosture.seeded(props.body,
      { ...props.posture, limbs }, undefined, undefined, resolution);
    readHand ??= poseBones.prepare(props.body, new Set<AutoMovieHumanoidBone>([`${props.side}Hand`]));
    const bones: ReturnType<typeof poseBones> = readHand(resolved.pose, resolution());
    gripAt ??= HumanHand.preparePoint(props.body, props.side, "grip");
    const miss: number = Vector3.length(Vector3.subtract(Vector3.add(
      gripAt(bones), Quaternion.rotateVector(bones.get(`${props.side}Hand`)!.worldRotation, props.wear),
    ), HumanTrunk.region(props.body, props.posture, props.region, resolution).point));
    fitted.set(degrees, miss);
    return miss;
  };
  // The hand's own order of turns, and its refinement's first sense with it.
  const seeds: number[] = HumanFreedomChoice.turns(props.step, props.side);
  const turn: number = HumanFreedomChoice.chosen({
    tried: seeds.map((degrees: number): number[] => [degrees]),
    freedoms: [
      {
        kind: "wrapped",
        step: props.side === "left" ? -props.step : props.step,
        period: 360,
      },
    ],
    judge: (values: readonly number[]): number[] => [missed(values[0]!)],
  }).values[0]!;
  fitted.clear();
  return turn;
}

/**
 * The original rigid grip placement shared by dress ranks and runtime targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation carried accepts an actual world wearable frame, fixed inverse held rotation and held grip-local offset, returning a fresh world grip/rotation.
 * @evidence contracts/development/design.md#principled-representation The wearable's world frame composed with the inverse rigid held offset yields the required grip frame, in original metre/quaternion types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chooser and dress's changing-posture runtime target use one original placement body; no second region, target or solver representation is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every current wearable frame remains actual, without a guessed socket, stored pose or answer capability.
 */
export namespace dressTurn {
  /**
   * Undo the fixed held rotation, normalize the original product and
   * subtract its rotated local offset from the actual worn origin. This
   * same constant-work rigid arithmetic serves search and runtime, returning
   * fresh grip/rotation records and retaining none of its numerical inputs.
   */
  export function carried(worn: IAutoMovieRigidTransform, inverse: IAutoMovieQuaternion,
    offset: IAutoMovieVector3): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(Quaternion.multiply(worn.rotation, inverse));
    return { grip: Vector3.subtract(worn.position, Quaternion.rotateVector(rotation, offset)), rotation };
  }
}

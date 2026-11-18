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
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanWorn } from "./HumanWorn";

/**
 * Choose the turn about the crown at which a held hat is set on the head
 * (`dress`): the turn whose wear socket the fitted arm brings nearest the
 * receiving region.
 *
 * @param props The body, the entry posture, the carrying hand, the wearable
 *   and the region it goes onto, the inverse of the wearable's rotation in
 *   the hand and its grip-local offset, the hand's grip socket and the
 *   wearable's wear point in the hand's frame, and the spacing of the turns
 *   tried first, degrees (`dress.TURN`).
 * @returns The chosen turn, degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is chosen, the miss it is judged by, the inputs with their frames and units, and the returned unit.
 * @evidence contracts/development/implementation.md#principled-implementation Each turn places the wearable on the region (`HumanWorn`), undoes the rigid hold to find the wrist's goal (`dressTurn.carried`), fits the whole posture to it within the joints' ranges (`resolveHumanPosture.seeded`) and measures how far the achieved wear point lies from the region; the turn is a wrapped freedom chosen by the shared chooser (`HumanFreedomChoice`), so the arm's limits, not a typed angle, decide it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed site, one miss per turn and the chooser.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The miss is measured on the fitted pose against the region's own point; no tolerance or turn is tuned.
 * @evidence contracts/development/implementation.md#efficient-algorithms The wear socket, the region and its alignment are read once (`HumanWorn.prepareSite`); each turn costs one elbow hint, one posture fit and one hand read, and a turn tried twice is judged once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The site is shared because the body, the posture, the wearable and the region are fixed for the call; the misses are keyed by the turn alone, the only input that varies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The site, the misses and the pose workspace live until return or throw; only the turn escapes.
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
  /** The spacing of the turns tried first and the refinement's first step, degrees; positive. */
  step: number;
}): number {
  // The body, the posture, the wearable and the region are fixed, so the
  // receiving site is read once for every turn tried.
  const site: ReturnType<typeof HumanWorn.prepareSite> = HumanWorn.prepareSite(
    props.body,
    props.posture,
    props.wearable,
    props.region,
  );
  const region: IAutoMovieVector3 = site.point();
  const fitted: Map<number, number> = new Map();
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  let readHand: ReturnType<typeof poseBones.prepare> | undefined;
  let gripAt: ReturnType<typeof HumanHand.preparePoint> | undefined;
  const missed: (degrees: number) => number = (degrees: number): number => {
    const known: number | undefined = fitted.get(degrees);
    if (known !== undefined) return known;
    const at: ReturnType<typeof dressTurn.carried> = dressTurn.carried(
      site.frame(degrees), props.inverse, props.offset,
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
    ), region));
    fitted.set(degrees, miss);
    return miss;
  };

  // The hand's own order of turns, and its refinement's first sense with it.
  const seeds: number[] = HumanFreedomChoice.turns(props.step, props.side);
  return HumanFreedomChoice.chosen({
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
}

/**
 * The rigid hold of a wearable undone: where the carrying hand's grip
 * socket must be, and how the hand is turned, for the wearable to take a
 * given world frame. Shared by the turn search and `dress`'s carrying
 * stroke, so both place the hand by one rule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the rigid inverse gives and who shares it.
 * @evidence contracts/development/design.md#principled-representation The wearable's world frame composed with the inverse of its rigid frame in the hand gives the hand's frame, in metres and unit quaternions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function beside the search, read by the search and `dress`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wearable's frame and its hold are the callers' own; nothing is stored.
 */
export namespace dressTurn {
  /**
   * The hand's frame for a wearable's world frame: the rotation is the
   * worn rotation times the inverse held rotation, and the grip lies the
   * held offset, turned by that rotation, behind the worn origin.
   *
   * @param worn The wearable's world frame.
   * @param inverse The inverse of the wearable's rotation in the hand.
   * @param offset The wearable's origin in the hand's grip frame, metres.
   * @returns The grip socket's world point and the hand's world rotation.
   */
  export function carried(worn: IAutoMovieRigidTransform, inverse: IAutoMovieQuaternion,
    offset: IAutoMovieVector3): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(Quaternion.multiply(worn.rotation, inverse));
    return { grip: Vector3.subtract(worn.position, Quaternion.rotateVector(rotation, offset)), rotation };
  }
}

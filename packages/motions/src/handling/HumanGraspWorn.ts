import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanWorn } from "../dressing/HumanWorn";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * The key pose a grasp taken to wear a thing must also hold
 * (`HumanGraspUse.IUse`, line `worn`): the thing's whole frame where it is
 * worn on the performer's own region (`HumanWorn.frame`, the one `dress`
 * puts it at), the hand following rigidly from the candidate grasp, so the
 * grasp is judged at the very pose it is put on in.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key, the frame it is read from and why.
 * @evidence contracts/development/design.md#principled-representation The worn frame is the one owner's (`HumanWorn`); the hand is the candidate grasp's rigid offset carried onto it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The turn step and one key builder, read by `HumanGraspUse.presented`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No wearable is named: the socket is the thing's own `wear` contact and the region the use's.
 */
export namespace HumanGraspWorn {
  /** The refinement step of a round worn thing's turn about its region, and the spacing of the turns tried first round it, degrees (search resolution: an eighth of a turn, halving to under 6). */
  export const ROUND: number = 45;

  /**
   * The key pose of a grasp taken to wear a thing.
   *
   * @param props The action's context, the held thing and its `wear` contact, the region and its point on the entry's body, the hand, the candidate grasp's hand, whether the thing is round about the region, and how far the closed hand at a wrist keeps out of the body's other parts (none when absent).
   * @returns The key, with its judge: the fitted hand's wear socket off the region, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The thing is rigid in the hand from the grasp on, so the hand's pose at the key is the worn frame times the inverse of the thing's frame in the hand. A round thing's turn about the region is the shared chooser's (`HumanFreedomChoice`, a wrapped freedom), the turn the arm, fitted within its ranges, brings the wear socket nearest the region at, the closed hand's depth inside the body added as a cost; the key is judged by the same miss. Each fit's elbow is left to the body (`IHumanPosture.IGoal.elbow`): the least hand error, then the least strain, read from the fit's own sweep; never placed by a share of the arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The hand's offset, the key of a turn, its fitted miss, one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The judge is the quantity `dress` judges, never a mix of degrees and millimetres.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed worn-frame alignment and canonical root/direct-joint clamp are prepared once; each original turn still performs its complete coupled fit, retained only for duplicate turn queries, and readback demands only the actual hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller's explicit preparation fixes the same body, entry posture and prop at start across candidate wrists; each wrist retains its own rigid offsets and fitted turns, with one exact FK reader per candidate search.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Turn scores, the exact reader, base-workspace reference and clearance callback are cleared before the returned key escapes; its judge retains only the actual hand socket/site geometry needed for later judgement.
   */
  export function key(props: {
    context: Pick<IHumanActionContext, "body" | "entry" | "start">;
    held: IHumanActionContext.IProp;
    tip: IAutoMovieAffordance;
    at: AutoMovieHumanoidRegion;
    site: IAutoMovieVector3;

    side: HumanHand.Side;
    wrist: HumanHand.IWrist;
    round?: boolean;
    clear?: (wrist: HumanHand.IWrist) => number;
    prepared?: {
      world: IHumanProp.IFrame;
      worn: ReturnType<typeof HumanWorn.prepare>;
      base: ReturnType<typeof resolveHumanPosture.prepareBase>;
    };
  }): HumanGrasp.IKey {
    const { context, held, tip, at, site } = props;
    const world: IHumanProp.IFrame = props.prepared?.world ?? held.frame(context.start);
    const wornAt: ReturnType<typeof HumanWorn.prepare> = props.prepared?.worn ??
      HumanWorn.prepare(context.body, context.entry.posture, held.prop, at);
    let base: ReturnType<typeof resolveHumanPosture.prepareBase> | undefined = props.prepared?.base ??
      resolveHumanPosture.prepareBase(context.body, context.entry.posture);
    const side: HumanHand.Side = props.side;
    let clear: ((wrist: HumanHand.IWrist) => number) | undefined = props.clear;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      props.wrist.rotation,
    );
    const position: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(world.position, props.wrist.point),
    );
    const turn: IAutoMovieQuaternion = Quaternion.inverse(
      Quaternion.multiply(inverse, world.rotation),
    );
    // The wear socket in the hand's frame, from the wrist joint.
    const socket: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(
        Vector3.add(
          world.position,
          Quaternion.rotateVector(world.rotation, tip.frame.translation),
        ),
        props.wrist.point,
      ),
    );
    const keyed: (degrees: number) => HumanHand.IWrist = (degrees: number): HumanHand.IWrist => {
      const worn: IHumanProp.IFrame = wornAt(degrees);
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(worn.rotation, turn),
      );
      return {
        point: Vector3.subtract(
          worn.position,
          Quaternion.rotateVector(rotation, position),
        ),
        rotation,
      };
    };
    // A turn's elbow is left to the body (`IHumanPosture.IGoal.elbow`): the
    // fit takes the least hand error, then the least strain, in its own
    // sweep; the hanging arm's place is only where no place is legal.
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      side,
    );

    // How far the arm, fitted to the key within its ranges, leaves the
    // wear socket off the region, metres, and how far the closed hand
    // would lie inside the body there, added as a cost. Each turn is
    // fitted once, however often the search comes back to it.
    const fitted: Map<number, number> = new Map();
    let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      prepareHumanPoseResolution();
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const missed: (degrees: number) => number = (degrees: number): number => {
      const known: number | undefined = fitted.get(degrees);
      if (known !== undefined) return known;
      const wrist: HumanHand.IWrist = keyed(degrees);
      const posture: IHumanPosture = context.entry.posture;
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      limbs[`${side}Arm`] = {
        point: wrist.point,
        rotation: wrist.rotation,
        bend: hang,
        elbow: "strain",
      };
      const hand: IAutoMovieResolvedBone = poseBones(
        context.body,
        base!.seeded(limbs, {}, resolution).pose,
        resolution!(),
        requested,
      ).get(`${side}Hand`)!;
      const kept: number =
        clear === undefined ? 0 : Math.min(0, clear(wrist));
      const miss: number =
        Vector3.length(
          Vector3.subtract(
            Vector3.add(
              hand.worldPosition,
              Quaternion.rotateVector(hand.worldRotation, socket),
            ),
            site,
          ),
        ) - kept;
      fitted.set(degrees, miss);
      return miss;
    };
    // A round thing's turn about the region is a wrapped freedom of the
    // shared chooser, tried every `ROUND` degrees round, nearest facing
    // the body's way first; any other is worn facing it.
    const seeds: number[] = [0];
    if (props.round === true)
      for (let k: number = ROUND; k <= 180; k += ROUND)
        seeds.push(...(k < 180 ? [k, -k] : [k]));
    const turned: number = HumanFreedomChoice.chosen({
      tried: seeds.map((degrees: number): number[] => [degrees]),
      freedoms: [
        {
          kind: "wrapped",
          step: props.round === true ? ROUND : 0,
          period: 360,
        },
      ],
      judge: (values: readonly number[]): number[] => [missed(values[0]!)],
    }).values[0]!;
    const chosen: HumanHand.IWrist = keyed(turned);
    fitted.clear();
    resolution = undefined;
    base = undefined;
    clear = undefined;
    return {
      posture: context.entry.posture,
      wrist: chosen,
      bend: hang,
      // Judged as dress judges it: the fitted hand's wear socket off the
      // region it is worn on.
      judge: (
        bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ): number => {
        const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        return Vector3.length(
          Vector3.subtract(
            Vector3.add(
              hand.worldPosition,
              Quaternion.rotateVector(hand.worldRotation, socket),
            ),
            site,
          ),
        );
      },
    };
  }
}

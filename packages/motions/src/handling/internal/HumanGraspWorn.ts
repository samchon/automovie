import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanWorn } from "../../dressing/internal/HumanWorn";
import { HumanFreedomChoice } from "../../posture/internal/HumanFreedomChoice";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * The key pose a grasp taken to wear a thing must also hold
 * (`HumanGraspUse.IUse`, line `worn`): the thing's whole frame where it is worn
 * on the performer's own region (`HumanWorn.frame`, the one `dress` puts it
 * at), the hand following rigidly from the candidate grasp, so the grasp is
 * judged at the very pose it is put on in.
 */
export namespace HumanGraspWorn {
  /**
   * The refinement step of a round worn thing's turn about its region, and the
   * spacing of the turns tried first round it, degrees (search resolution: an
   * eighth of a turn, halving to under 6).
   */
  export const ROUND: number = 45;

  /**
   * The key pose of a grasp taken to wear a thing.
   *
   * @param props The action's context, the held thing and its world frame at
   *   closure and `wear` contact, the region and its point on the entry's body,
   *   the hand, the candidate grasp's hand, whether the thing is round about
   *   the region, and how far the closed hand at a wrist keeps out of the
   *   body's other parts (none when absent).
   * @returns The key, with its judge: the fitted hand's wear socket off the
   *   region, metres.
   */
  export function key(props: IKeyProps): IAutoMovieMotionHumanGrasp.IKey {
    const { context, held, world, tip, at, site }: typeof props = props;
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
    const keyed: (degrees: number) => IAutoMovieMotionHumanHand.IWrist = (
      degrees: number,
    ): IAutoMovieMotionHumanHand.IWrist => {
      const worn: IAutoMovieRigidTransform = HumanWorn.frame(
        context.body,
        context.entry.posture,
        held.prop,
        at,
        degrees,
      );
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
    // A turn's elbow is left to the body (`HumanPosture.IGoal.elbow`): the
    // fit takes the least hand error, then the least strain, in its own
    // sweep; the hanging arm's place is only where no place is legal.
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      props.side,
    );

    // How far the arm, fitted to the key within its ranges, leaves the
    // wear socket off the region, metres, and how far the closed hand
    // would lie inside the body there, added as a cost. Each turn is
    // fitted once, however often the search comes back to it.
    const fitted: Map<number, number> = new Map();
    const missed: (degrees: number) => number = (degrees: number): number => {
      const known: number | undefined = fitted.get(degrees);
      if (known !== undefined) return known;
      const wrist: IAutoMovieMotionHumanHand.IWrist = keyed(degrees);
      const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      limbs[`${props.side}Arm`] = {
        point: wrist.point,
        rotation: wrist.rotation,
        bend: hang,
        elbow: "strain",
      };
      const hand: IAutoMovieResolvedBone = poseBones(
        context.body,
        resolveHumanPosture(context.body, { ...posture, limbs }),
        undefined,
        new Set<AutoMovieHumanoidBone>([`${props.side}Hand`]),
      ).get(`${props.side}Hand`)!;
      const kept: number =
        props.clear === undefined ? 0 : Math.min(0, props.clear(wrist));
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
    const seeds: number[] =
      props.round === true ? HumanFreedomChoice.turns(ROUND, props.side) : [0];
    const turned: number = HumanFreedomChoice.chosen({
      tried: seeds.map((degrees: number): number[] => [degrees]),
      freedoms: [
        {
          kind: "wrapped",
          step:
            props.round === true ? (props.side === "left" ? -ROUND : ROUND) : 0,
          period: 360,
        },
      ],
      judge: (values: readonly number[]): number[] => [missed(values[0]!)],
    }).values[0]!;
    const chosen: IAutoMovieMotionHumanHand.IWrist = keyed(turned);
    fitted.clear();
    return {
      posture: context.entry.posture,
      wrist: chosen,
      bend: hang,
      // Judged as dress judges it: the fitted hand's wear socket off the
      // region it is worn on.
      judge: (
        bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ): number => {
        const hand: IAutoMovieResolvedBone = bones.get(`${props.side}Hand`)!;
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

/** The record of `IKeyProps`'s site. */
type IKeyProps = {
  context: Pick<IAutoMovieMotionHumanActionContext, KeyPropsContext>;
  held: IAutoMovieMotionHumanPropReader;
  world: IAutoMovieRigidTransform;
  tip: IAutoMovieAffordance;
  at: AutoMovieHumanoidRegion;
  site: IAutoMovieVector3;

  side: AutoMovieHumanSide;
  wrist: IAutoMovieMotionHumanHand.IWrist;
  round?: boolean;
  clear?: (wrist: IAutoMovieMotionHumanHand.IWrist) => number;
};

/** The alternatives of `KeyPropsContext`'s site. */
type KeyPropsContext = "body" | "entry" | "start";

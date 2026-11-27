import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";

/*
 * Orient a held racket at the strike and recover the actual entry wrist,
 * rigidly carried by the current chest. The grip remains fixed to the hand.
 * Parameter context: The body and its displayed entry pose.
 * Parameter tool: The already held racket, with face and longitudinal axis.
 * Parameter axis: The world direction of the racket's long axis at contact.
 * Parameter face: The world face normal at contact.
 * Parameter bend: The arm fit's world-space elbow hint.
 * Returns: The contact offset and a goal reader for the wrist path.
 */
export function courtRacketWrist(
  context: Pick<IAutoMovieMotionHumanActionContext, CourtRacketWristContext>,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  axis: IAutoMovieVector3,
  face: IAutoMovieVector3,
  bend: IAutoMovieVector3,
): IRacketWrist {
  const hand: CourtRacketWristHand = `${tool.side}Hand`;
  const bones: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set([hand, "chest"]),
  );
  const entryHand: IAutoMovieResolvedBone = bones.get(hand)!;
  const entryChest: IAutoMovieResolvedBone = bones.get("chest")!;
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    entryChest.worldRotation,
  );
  const inChest: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    inverse,
    AutoMovieEngineVector3.subtract(entryHand.worldPosition, entryChest.worldPosition),
  );
  const wristRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    inverse,
    entryHand.worldRotation,
  );
  const chest: ReadonlySet<"chest"> = new Set(["chest"]);
  const impact: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
    StrikingHeld.hand(tool, 0, AutoMovieEngineVector3.create(0, 0, 0), axis, face);
  const fit: ReturnType<typeof StrikingHeld.prepareGoal> =
    StrikingHeld.prepareGoal(context, tool, 0);
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    tool.side,
    "grip",
  ).point;
  return {
    faceOffset: AutoMovieEngineVector3.scale(fit(impact, bend).point, -1),
    goal: (
      posture: IAutoMovieMotionHumanPosture,
      wrist: IAutoMovieVector3,
      alignment: number,
      recovery: number,
    ): IAutoMovieHumanLimbGoal => {
      let from: IAutoMovieQuaternion = entryHand.worldRotation;
      let point: IAutoMovieVector3 = wrist;
      if (recovery > 0) {
        const current: IAutoMovieResolvedBone = HumanTrunk.resolve(
          context.body,
          posture,
          undefined,
          undefined,
          chest,
        ).get("chest")!;
        from = AutoMovieEngineQuaternion.multiply(current.worldRotation, wristRotation);
        point = AutoMovieEngineVector3.lerp(
          wrist,
          AutoMovieEngineVector3.add(
            current.worldPosition,
            AutoMovieEngineQuaternion.rotateVector(current.worldRotation, inChest),
          ),
          recovery,
        );
      }
      const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
        from,
        impact.rotation,
        alignment,
      );
      return fit(
        {
          point: AutoMovieEngineVector3.add(point, AutoMovieEngineQuaternion.rotateVector(rotation, grip)),
          rotation,
        },
        bend,
      );
    },
  };
}
/*
 * Reads a racket's actual held frame for wrist fitting.
 */
export namespace courtRacketWrist {
  /*
   * Read the finite face point and orient it by the racket's perpendicular face
   * and long axes.
   * Parameter context: The entering holds and prop readers for this performer.
   * Parameter side: The hitting hand.
   * Parameter implement: The racket subject already held by that hand.
   * Returns: The face point, working normal and shaft direction in the retained
   * grip frame.
   * When the racket is absent from the hand or lacks the
   * named affordances.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    side: AutoMovieHumanSide,
    implement: string,
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      implement,
    );
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.read(
      held,
      {
        tip: "face",
        edge: "face",
        from: "grip",
      },
    );
    return {
      ...tool,
      axis: AutoMovieMotionHumanHeld.point(held, "sweetSpot").direction,
      edge: AutoMovieMotionHumanHeld.point(held, "face").direction,
    };
  }
}

/*
 * The racket face at contact and the grip-preserving goal on a wrist path.
 */
interface IRacketWrist {
  /*
   * World displacement from the wrist to the face at the contact orientation.
   */
  readonly faceOffset: IAutoMovieVector3;
  /*
   * Fit the strike approach and carry the entry wrist with the moving chest
   * during recovery.
   */
  readonly goal: (
    posture: IAutoMovieMotionHumanPosture,
    wrist: IAutoMovieVector3,
    alignment: number,
    recovery: number,
  ) => IAutoMovieHumanLimbGoal;
}

/*
 * The alternatives of `CourtRacketWristHand`'s site.
 */
type CourtRacketWristHand = "rightHand" | "leftHand";

/*
 * The alternatives of `CourtRacketWristContext`'s site.
 */
type CourtRacketWristContext = "body" | "entry";

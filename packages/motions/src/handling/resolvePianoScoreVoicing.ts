import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateReach } from "./manipulateReach";
import { manipulateShape } from "./manipulateShape";

/**
 * Place the wrist for a voicing from the key centers and the performer's finger
 * lengths. The wrist averages individual press placements at the common
 * orientation, with its forward reach set by the digit that needs the wrist
 * closest to the keys.
 */
export function resolvePianoScoreVoicing(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoScore>,
  frame: IAutoMovieRigidTransform,
  keys: readonly resolvePianoScoreVoicing.Key[],
  bend: IAutoMovieVector3,
): resolvePianoScoreVoicing.Voicing {
  const notes: resolvePianoScoreVoicing.Note[] = keys.map(
    ({
      score,
      key,
    }: resolvePianoScoreVoicing.Key): resolvePianoScoreVoicing.Note => {
      const site: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, key.frame.translation),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.multiply(frame.rotation, key.frame.rotation),
        { x: 0, y: 1, z: 0 },
      );
      const dip: number = key.travel!;
      return {
        score,
        dip,
        normal,
        points: [site, Vector3.subtract(site, Vector3.scale(normal, dip))],
        digit:
          `${score.hand}${score.digit[0]!.toUpperCase()}${score.digit.slice(1)}` as AutoMovieHumanDigit,
      };
    },
  );
  const first: resolvePianoScoreVoicing.Note = notes[0]!;
  const score: IAutoMovieMotionHumanPianoScore.INote = first.score;
  const normal: IAutoMovieVector3 = first.normal;
  const site: IAutoMovieVector3 = mean(
    notes.map(
      (note: resolvePianoScoreVoicing.Note): IAutoMovieVector3 =>
        note.points[0],
    ),
  );
  const rotation: IAutoMovieQuaternion = manipulateFacing(
    context.entry.posture,
    [{ site, normal, side: score.hand }],
    score.hand,
  );
  const reach: ReturnType<typeof manipulateReach.prepare> =
    manipulateReach.prepare(context.body, score.hand, rotation, notes.map((note): IAutoMovieMotionHumanPianoScore.INote["digit"] => note.score.digit));
  const preferred: IAutoMovieVector3[] = notes.map(
    (note: resolvePianoScoreVoicing.Note): IAutoMovieVector3 =>
      reach(note.score.digit, note.points[0], note.normal, note.dip),
  );
  const average: IAutoMovieVector3 = mean(preferred);
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: score.hand === "left" ? 1 : -1,
    y: 0,
    z: 0,
  });
  // The closest preferred position leaves room for the shortest extension.
  // A longer digit can flex to absorb its share of the lateral mismatch.
  const advance: number = Math.max(
    0,
    ...preferred.map((point: IAutoMovieVector3): number =>
      Vector3.dot(Vector3.subtract(point, average), forward),
    ),
  );
  const arm: IAutoMovieHumanLimbGoal = {
    point: Vector3.addScaled(average, forward, advance),
    bend,
    rotation,
  };

  // Select idle angles against the first key plane. Each additional key
  // replaces only its playing digit with the straight seed for its own fit.
  const shape: IAutoMovieMotionHumanPosture["joints"] = manipulateShape(
    context.body,
    score.hand,
    score.digit,
    arm.point,
    rotation,
    first.points[0],
    normal,
  ).joints;
  if (notes.length > 1) {
    const seed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      score.hand,
      "flat",
    );
    for (const bone of Object.keys(seed) as AutoMovieHumanoidBone[])
      if (
        notes.some(({ digit }: resolvePianoScoreVoicing.Note): boolean =>
          bone.startsWith(digit),
        )
      )
        shape[bone] = seed[bone]!;
  }
  return { score, notes, normal, arm, shape, ends: [{}, {}] };
}

/** The key contacts, common arm placement and hand shapes read by pianoScore. */
export namespace resolvePianoScoreVoicing {
  /**
   * An authored note with its key validated by the score law.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admission owner.
   * @evidence contracts/development/design.md#principled-representation Pairs the authored input with the measured articulation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies the two inputs for resolving key contacts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing affordance and score types.
   */
  export interface Key {
    /** The authored key assignment and timing. */
    score: IAutoMovieMotionHumanPianoScore.INote;
    /** The upright model's button with its local frame and positive travel. */
    key: IAutoMovieAffordance;
  }

  /**
   * One independently moving fingertip target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the endpoint order, frame and units.
   * @evidence contracts/development/design.md#principled-representation Both target endpoints are in world space and come from one articulation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The per-key values used by the score drives and poses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the authored key and the canonical digit identity.
   */
  export interface Note {
    /** The score's key assignment and timing. */
    score: IAutoMovieMotionHumanPianoScore.INote;
    /** The button's physical full travel in metres. */
    dip: number;
    /** The button's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
    /**
     * The button's unpressed and fully depressed contact points, in world
     * metres.
     */
    points: readonly [IAutoMovieVector3, IAutoMovieVector3];
    /** The rig's pressing digit. */
    digit: AutoMovieHumanDigit;
  }

  /**
   * One or more co-timed key contacts on a hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the shared placement and the transport boundaries.
   * @evidence contracts/development/design.md#principled-representation Distinguishes a shared wrist goal from independent targets and fitted angles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Holds the placement and hand shapes read by the score.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the canonical arm goal and joint shapes.
   */
  export interface Voicing {
    /** The first note supplies the shared hand and time interval. */
    score: IAutoMovieMotionHumanPianoScore.INote;
    /** The distinct keys and digits pressed together. */
    notes: readonly Note[];
    /** The first key's outward normal for hand transport. */
    normal: IAutoMovieVector3;
    /** The common physical wrist goal. */
    arm: IAutoMovieHumanLimbGoal;
    /** The pressing and idle digit seeds for the voicing. */
    shape: IAutoMovieMotionHumanPosture["joints"];
    /** At-rest fitted hand shapes for the first contact and final release. */
    ends: [
      IAutoMovieMotionHumanPosture["joints"],
      IAutoMovieMotionHumanPosture["joints"],
    ];
  }
}

/** The least-squares translation for a nonempty set of preferred placements. */
function mean(points: readonly IAutoMovieVector3[]): IAutoMovieVector3 {
  return Vector3.scale(points.reduce(Vector3.add), 1 / points.length);
}

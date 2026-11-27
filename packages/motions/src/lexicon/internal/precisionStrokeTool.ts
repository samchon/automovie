import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingQuality } from "../../striking/internal/StrikingQuality";
import type { PrecisionStrokeForms } from "./PrecisionStrokeForms";

/**
 * What a precision stroke strikes with, read from the implement as the hand
 * holds it: the tool in the hand's frame, its face, and the second hand's place
 * on its handle. The stroke reads it from its entry
 * (`createPrecisionSportStroke`) and the address from the stance it tries
 * (`PrecisionStrokeForms.address`), so both meet the ball with one tool.
 *
 * A held implement strikes with its named working point and face; a bare hand
 * strikes with its grip socket and the palm's normal, read in the hand bone's
 * frame at the entry pose. Except for a cue, which strikes along its own axis,
 * the tool's axis is squared to the face and the face is its edge. Two hands
 * close on a swung implement's handle, the second grip socket two fists' widths
 * from the first along the axis toward the butt; a cue, a one-handed stroke and
 * a bare hand have none.
 *
 * @param body The body.
 * @param side The striking hand.
 * @param form The row's form.
 * @param held The implement in the striking hand's grip frame; none for a bare
 *   hand.
 * @param entry The pose the stroke starts from, whose hand frame a bare palm is
 *   read in.
 * @returns The tool, its face in the hand's frame and the second hand's place.
 * @throws {HumanRefusal} When the implement lacks the row's working point.
 */
export function precisionStrokeTool(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  form: PrecisionStrokeForms.IForm,
  held: IAutoMovieMotionHumanHeld.IHeld | undefined,
  entry: IAutoMoviePose,
): precisionStrokeTool.IStrokeTool {
  const read: IAutoMovieMotionHumanStrikingHeld.ITool =
    held === undefined
      ? StrikingHeld.bare(body, side)
      : StrikingHeld.read(held, { tip: form.point });
  const face: IAutoMovieVector3 =
    held === undefined
      ? palm(body, side, entry)
      : AutoMovieMotionHumanHeld.point(held, form.point).direction;
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool =
    form.point === "tip"
      ? read
      : {
          ...read,
          axis: Vector3.normalize(
            Vector3.subtract(
              read.axis,
              Vector3.scale(face, Vector3.dot(read.axis, face)),
            ),
          ),
          edge: face,
        };
  return {
    tool,
    face,
    support:
      form.point === "tip" || form.oneHand === true || held === undefined
        ? null
        : {
            handle: "axis",
            offset: {
              x: -2 * StrikingQuality.fist(body.measure.hand),
              y: 0,
              z: 0,
            },
          },
  };
}

/** The palm's normal in the hand bone's frame at the entry pose. */
function palm(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  entry: IAutoMoviePose,
): IAutoMovieVector3 {
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    entry,
    undefined,
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
  );
  return Quaternion.rotateVector(
    Quaternion.inverse(bones.get(`${side}Hand`)!.worldRotation),
    HumanHand.frame(body, bones, side, "palm").normal,
  );
}

/** Companion types of `precisionStrokeTool`. */
export namespace precisionStrokeTool {
  /** A precision stroke's tool. */
  export interface IStrokeTool {
    /** The tool in the striking hand's grip frame, its axis squared to the face. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The working face's outward direction in the hand bone's frame. */
    face: IAutoMovieVector3;

    /** The second hand's place on the handle; null when no second hand holds it. */
    support: IAutoMovieMotionHumanStrikingBlade.ISupport | null;
  }
}

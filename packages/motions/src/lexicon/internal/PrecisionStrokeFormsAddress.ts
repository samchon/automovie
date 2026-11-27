import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import type { fitClearArmPose } from "../../compose/internal/fitClearArmPose";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { PRECISION_STROKE_FORMS } from "./PRECISION_STROKE_FORMS";
import { PrecisionStrokeForms } from "./PrecisionStrokeForms";
import { addressPrecisionStroke } from "./addressPrecisionStroke";
import { precisionStrokeTool } from "./precisionStrokeTool";

/*
 * Where a striker stands to play a row at a ball: the floor point under the
 * root that puts the striking shoulder (the shoulders' middle for a two-handed
 * grip) on the implement's line, the arm's reach back from the grip, the grip
 * where the held implement puts its working point on the contact; then the
 * nearest stance along that line, further back first, whose contact pose the
 * arm planner finds clear (`contact`), closed on by bisection.
 * Parameter props: The body, the row, the hand, the facing, the ball, the shot and
 * the implement as the hand holds it.
 * Returns: The floor point, world metres.
 * For a row no stroke has registered, or when no stance
 * within the scan gives a clear contact pose, with the planner's reason at
 * the line's place.
 */
export function PrecisionStrokeFormsAddress(
  props: PrecisionStrokeForms.IAddress,
): IAutoMovieVector3 {
  const form: PrecisionStrokeForms.IForm | undefined =
    PRECISION_STROKE_FORMS[props.row];
  if (form === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "row",
      value: props.row,
      reason: `no precision stroke is named ${props.row}`,
      fix: "name a registered precision stroke row",
    });
  const direction: IAutoMovieVector3 = Vector3.normalize({
    x: props.toward.x - props.ball.x,
    y: 0,
    z: props.toward.z - props.ball.z,
  });
  const working: IAutoMovieVector3 = PrecisionStrokeForms.axis(
    form,
    props.side,
    direction,
  );
  const contact: IAutoMovieVector3 = Vector3.subtract(
    props.ball,
    Vector3.scale(direction, props.radius),
  );
  // The shoulder is read from the stroke's own pose at contact: the quiet
  // stance at the facing given, hinged at the hips to the grip as the
  // stroke's address hinges it (`addressPrecisionStroke`) and turned toward
  // the shot by the row's trunk turn. The hinge depends on where the grip
  // lies from the body, so the stance is placed, the pose read, and the
  // stance placed again until the shoulder stands on its place.
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const stance: IAutoMovieMotionHumanPosture = stand.posture(
    props.body,
    origin,
    props.yaw,
  );
  const feet: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  > = AutoMovieMotionHumanTrunk.footing(props.body, stance);
  // The stroke's own tool and its hand frame at the contact, as the stroke
  // reads them (`precisionStrokeTool`): the grip lies where the tool's
  // working point meets the ball with its face toward the shot.
  const stroke: precisionStrokeTool.IStrokeTool = precisionStrokeTool(
    props.body,
    props.side,
    form,
    props.held,
    resolveHumanPosture(props.body, stance),
  );
  const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = StrikingHeld.hand(
    stroke.tool,
    0,
    contact,
    working,
    form.point === "tip" ? { x: 0, y: 1, z: 0 } : direction,
  );
  const grip: IAutoMovieVector3 = frame.point;
  const sign: number = props.side === "right" ? 1 : -1;
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    sign * form.turn,
  );
  const span: number =
    PrecisionStrokeForms.ARM * PrecisionStrokeForms.reach(props.body);
  const back: IAutoMovieVector3 = Vector3.normalize({
    x: -working.x,
    y: 0,
    z: -working.z,
  });
  let at: IAutoMovieVector3 = origin;
  for (let i: number = 0; i < PrecisionStrokeForms.ADDRESSED; i++) {
    const local: IAutoMovieVector3 = Vector3.subtract(grip, at);
    const posture: IAutoMovieMotionHumanPosture =
      form.point === "tip"
        ? stance
        : addressPrecisionStroke(
            props.body,
            stance,
            feet,
            props.side,
            local,
            undefined,
            0,
            Infinity,
          )(stance, 1);
    const bones: ReturnType<typeof poseBones> = poseBones(
      props.body,
      resolveHumanPosture(props.body, posture),
    );
    const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
    const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
    const standing: IAutoMovieVector3 =
      form.oneHand === true || form.bare === true
        ? props.side === "left"
          ? left
          : right
        : Vector3.scale(Vector3.add(left, right), 0.5);
    const offset: IAutoMovieVector3 = Vector3.add(
      { x: posture.root.x, y: 0, z: posture.root.z },
      Quaternion.rotateVector(
        turn,
        Vector3.subtract(standing, {
          x: posture.root.x,
          y: 0,
          z: posture.root.z,
        }),
      ),
    );

    // A one-handed arm reaches out from the shoulder at its height: the
    // shoulder lies the arm's reach from the grip, the rest of that reach
    // across the floor back along the implement's line. Two hands on one
    // implement hang the arms along it (the arm-and-club line), so the
    // shoulders lie over the line's own horizontal run of the reach, the
    // hinge setting their height. A grip lower than the reach below a
    // one-handed shoulder also lies on that run.
    const drop: number = offset.y - grip.y;
    const across: number =
      (form.oneHand === true || form.bare === true) && Math.abs(drop) < span
        ? Math.sqrt(span * span - drop * drop)
        : Math.max(
            span * Math.hypot(working.x, working.z),
            // Hanging arms lie in front of the chest, never inside it.
            props.body.measure.chestDepth / 2 +
              props.body.measure.upperArmRadius +
              props.body.measure.forearmRadius,
          );
    const shoulder: IAutoMovieVector3 = Vector3.add(
      grip,
      Vector3.scale(back, across),
    );
    at = { x: shoulder.x - offset.x, y: 0, z: shoulder.z - offset.z };
  }
  // A cue's bridged stroke keeps its fitted arms (`createPrecisionSportStroke`).
  if (form.point === "tip") return at;

  // The arm-and-club place is where the lever lines up; the stance is
  // where the arms meet the ball clear of the body. The stroke's contact
  // pose at a stance moved `s` metres back along the line is judged by the
  // arm planner (`fitClearArmPose`); the nearest clear stance is the
  // address, the scan stepping further back first and then nearer, and the
  // bisection closing on the boundary from the refused side.
  const judge = (s: number): fitClearArmPose.Verdict =>
    PrecisionStrokeForms.contact(
      props,
      form,
      stroke,
      contact,
      direction,
      Vector3.add(at, Vector3.scale(back, s)),
    );
  const first: fitClearArmPose.Verdict = judge(0);
  if (first.clear) return at;
  const step: number =
    PrecisionStrokeForms.SCAN_STEP * PrecisionStrokeForms.reach(props.body);
  for (let k: number = 1; k <= PrecisionStrokeForms.SCAN; k++)
    for (const way of [1, -1]) {
      if (!judge(way * k * step).clear) continue;
      let refused: number = way * (k - 1) * step;
      let clear: number = way * k * step;
      for (let i: number = 0; i < PrecisionStrokeForms.BISECT; i++) {
        const middle: number = (refused + clear) / 2;
        if (judge(middle).clear) clear = middle;
        else refused = middle;
      }
      return Vector3.add(at, Vector3.scale(back, clear));
    }
  throw new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: "ball",
    value: props.ball,
    feasible: null,
    reason: `no stance within ${(PrecisionStrokeForms.SCAN * step).toFixed(2)} m of the ${props.row} address meets the ball with the arms clear: ${first.refusal.reason}`,
    fix: "move the ball, or choose a row whose implement reaches it with the arms clear of the body",
  });
}

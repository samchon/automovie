import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { readHumanBone } from "../../body/internal/readHumanBone";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanMount } from "./HumanMount";
import { HumanMountPush } from "./HumanMountPush";

/*
 * A foot's end on a high seat.
 * Parameter body: The body.
 * Parameter side: The foot.
 * Parameter hip: The seated hip joint, world metres.
 * Parameter yaw: The seated heading, degrees.
 * Parameter pitch: The seated pelvis's pitch, degrees, forward positive.
 * Parameter astride: Whether the seat is sat astride.
 * Parameter tread: The rest's tread the ball goes on, world metres, if the seat
 * names one for this side.
 * Parameter under: The floor's height, world metres.
 * Returns: The end.
 * When the rest the leg spans asks the hip to flex past
 * its range from the seated pelvis, with that range.
 */
export function HumanMountPlace(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  hip: IAutoMovieVector3,
  yaw: number,
  pitch: number,
  astride: boolean,
  tread: IAutoMovieVector3 | undefined,
  under: number,
): HumanMountPlace.IPlace {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const sign: number = side === "left" ? 1 : -1;
  const heading: number = yaw + sign * stand.TOE_OUT;
  if (tread !== undefined) {
    const ankle: IAutoMovieVector3 = Vector3.subtract(
      tread,
      Quaternion.rotateVector(
        HumanFrame.turn(heading),
        HumanFoot.offset(body, side, "ball"),
      ),
    );
    const span: readonly [number, number] = HumanMount.span(body);
    const d: number = Vector3.length(Vector3.subtract(ankle, hip));
    const bend: IAutoMovieVector3 = HumanFrame.point(
      { origin: hip, yaw },
      { x: sign * (astride ? 0.5 : 0.05), y: 0, z: 1 },
    );
    if (d >= span[0] && d <= span[1]) {
      // The rest is the leg's only where the hip bends to it: the thigh's
      // flexion off the seated pelvis, read off the two-link knee the fit
      // places (`HumanMountPush.knee`), within the hip's range.
      const flexion: number = hipFlexion(body, hip, ankle, bend, yaw, pitch);
      const most: number = hipRange(body, side);
      if (flexion > most)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "footrests",
          value: flexion,
          feasible: {
            kind: "range",
            minimum: null,
            maximum: most,
            unit: "deg",
          },
          reason: `the ${side} foot's rest asks the hip ${flexion.toFixed(1)} degrees of flexion from the seated pelvis, past its ${most.toFixed(1)}`,
          fix: 'sit back against the seat\'s backrest (`back: "lean"`), which opens the hip, or use a seat whose rest the leg reaches',
        });
      return {
        foot: { ankle, bend, yaw: heading },
        rests: true,
        tread: true,
        height: tread.y,
      };
    }
  }
  const thigh: readonly [number, number, number] =
    HumanMount.HANG[astride ? "astride" : "ahead"];
  const knee: IAutoMovieVector3 = HumanFrame.point(
    { origin: hip, yaw },
    {
      x: sign * thigh[0] * m.thigh,
      y: thigh[1] * m.thigh,
      z: thigh[2] * m.thigh,
    },
  );
  return {
    foot: {
      ankle: {
        ...knee,
        y: Math.max(under + m.ankleHeight, knee.y - m.shank),
      },
      bend: knee,
      yaw: heading,
    },
    rests: knee.y - m.shank <= under + m.ankleHeight,
    tread: false,
    height: under,
  };
}

/*
 * Where each foot ends on a high seat (`HumanMountOn`): on its rest when the
 * seated leg reaches it, on the floor when the hanging leg would pass it,
 * hanging under a thigh in the direction `HumanMount.HANG` gives otherwise.
 */
export namespace HumanMountPlace {
  /*
   * Where a foot ends and what bears it there.
   */
  export interface IPlace {
    /*
     * The foot's final placement.
     */
    foot: HumanMount.IFoot;

    /*
     * Whether it bears on a rest or the floor there.
     */
    rests: boolean;

    /*
     * Whether the leg reaches the seat's declared footrest.
     */
    tread: boolean;

    /*
     * The height of what bears it, world metres.
     */
    height: number;
  }
}

/*
 * A seated thigh's flexion off its pelvis, degrees: the two-link knee
 * (`HumanMountPush.knee`) read in the pelvis's sagittal plane, forward of its
 * downward axis.
 */
function hipFlexion(
  body: IAutoMovieMotionHumanBody,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  pole: IAutoMovieVector3,
  yaw: number,
  pitch: number,
): number {
  const knee: IAutoMovieVector3 | null = HumanMountPush.knee(
    body,
    hip,
    ankle,
    pole,
  );
  if (knee === null) return 0;
  const pelvis: IAutoMovieQuaternion = humanPostureHeading({
    yaw,
    pitch,
    roll: 0,
  });
  const thigh: IAutoMovieVector3 = Vector3.subtract(knee, hip);
  return (
    Math.atan2(
      Vector3.dot(thigh, Quaternion.rotateVector(pelvis, { x: 0, y: 0, z: 1 })),
      -Vector3.dot(
        thigh,
        Quaternion.rotateVector(pelvis, { x: 0, y: 1, z: 0 }),
      ),
    ) / Quaternion.DEG2RAD
  );
}

/*
 * The hip's flexion range's upper bound, degrees: the range table's for the
 * body's thigh.
 */
function hipRange(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): number {
  const bone: AutoMovieHumanoidBone = `${side}UpperLeg`;
  const constraint: IAutoMovieJointConstraint | null = AutoMovieEngineKinematics.getConstraint(
    bone,
    readHumanBone(body, bone)?.constraint ?? null,
  );
  return constraint?.flexion?.max ?? Infinity;
}

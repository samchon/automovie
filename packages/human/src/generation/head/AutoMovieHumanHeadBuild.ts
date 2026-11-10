import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanHeadIdentity } from "../../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanHeadAnatomy } from "../AutoMovieHumanHeadAnatomy";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanF1Body } from "../AutoMovieHumanF1Body";
import { AutoMovieHumanTrunkJointDatums } from "../trunk/AutoMovieHumanTrunkJointDatums";
import { AutoMovieHumanTrunkNeckBase } from "../trunk/AutoMovieHumanTrunkNeckBase";
import { AutoMovieHumanTrunkSpecLandmarks } from "../trunk/AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import { AutoMovieHumanHeadF1Skin } from "./AutoMovieHumanHeadF1Skin";
import { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMass } from "./AutoMovieHumanHeadMass";
import { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import { AutoMovieHumanHeadPlacement } from "./AutoMovieHumanHeadPlacement";
import { AutoMovieHumanHeadThroat } from "./AutoMovieHumanHeadThroat";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * One build of the head's original construction from the public input, the
 * single entry the head renderer and the head capture provider share: the
 * Frankfort frame and landmarks, the trunk's joint datums and the head's
 * placement in the thorax frame, the trunk's
 * neck-base end (`AutoMovieHumanTrunkNeckBase.end`, read at build time from the datums S00 fixes there: the
 * port's plane, axis point, extents and shoulder with their jets), the
 * head-owned throat contour (`AutoMovieHumanHeadThroat`), the head/neck
 * course (in the head frame and in the world) and head.mass's view curves
 * with their tape solves. Each stage is timed separately (milliseconds).
 */
export namespace AutoMovieHumanHeadBuild {
  /** Draw F1's measured skin and eyes above the exact trunk-owned neck boundary. */
  export function f1(neck: readonly Vec3[]): AutoMovieHumanF1Body.IFixedPart {
    return AutoMovieHumanHeadF1Skin.f1(neck);
  }

  /** The build. */
  export interface IOutput {
    /** Resolved head measures. */
    head: IAutoMovieHumanHeadIdentity;

    /** Resolved body measures. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Frankfort frame and landmarks. */
    frame: AutoMovieHumanHeadFrankfort.IOutput;

    /** Trunk joint datums (`f1_trunk`). */
    trunk: AutoMovieHumanTrunkJointDatums.IOutput;

    /** The trunk's neck-base spec: S00's level end, world and thorax frame. */
    neckBase: AutoMovieHumanTrunkNeckBase.IEnd;

    /** The head frame in the thorax frame. */
    placement: AutoMovieHumanHeadPlacement.IOutput;

    /** The head frame in the world. */
    world: AutoMovieHumanArmCurveSpec.ITransform;

    /** The throat contour in the head frame. */
    throat: AutoMovieHumanHeadThroat.IOutput;

    /** The course in the head frame. */
    course: AutoMovieHumanHeadNeckCourse.IOutput;

    /** The same course placed in the world (for the loft). */
    worldCourse: AutoMovieHumanHeadNeckCourse.IOutput;

    /** head.mass's view curves. */
    curves: AutoMovieHumanHeadMass.IOutput;

    /** Stage times, ms. */
    ms: { inputs: number; frame: number; port: number; course: number; curves: number };
  }

  /**
   * Build from the public input; an override of the head identity serves one-input edits. `end`, when given, is S00's own end read from its built view curves (`AutoMovieHumanTrunkNeckBase.of`): the head stream then starts from S00's actual outlines' values and height jets, so the continuation is exact in all four extents. Absent, the end comes from the datums S00 fixes there (`AutoMovieHumanTrunkNeckBase.end`, no S00 build), whose back slope is the back profile's at the cervicale and whose side slope is zero: 8.26 degrees off S00's actual back at clock 180 (f1_integration's gate, 2026-11-08 14:5x).
   */
  export function create(params: IAutoMovieHumanParameters, override?: Partial<IAutoMovieHumanHeadIdentity>, end?: AutoMovieHumanTrunkNeckBase.IEnd): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const t0: number = performance.now();
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    const head: IAutoMovieHumanHeadIdentity = { ...AutoMovieHumanHeadAnatomy.resolve(params), ...override };
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const ankle: number | undefined = params.extremities?.feet?.left?.ankleHeight;
    if (ankle === undefined) throw new Error("The trunk's joint datums need the ankle height input (ISO 8559-1 5.7.6)");
    const trunk: AutoMovieHumanTrunkJointDatums.IOutput = AutoMovieHumanTrunkJointDatums.of(measures, ankle, measures.inseam + ankle);
    const t1: number = performance.now();
    // f1's pose (owner, 15:2x): the zero frame's landmarks carried into her upright frame (`AutoMovieHumanHeadF1Pose.frame`), where the course runs level from the trunk's level neck end.
    const frame: AutoMovieHumanHeadFrankfort.IOutput = AutoMovieHumanHeadF1Pose.frame(AutoMovieHumanHeadFrankfort.create({ head, stature: measures.stature, female }));
    const placement: AutoMovieHumanHeadPlacement.IOutput = AutoMovieHumanHeadPlacement.create(trunk, frame, measures.stature, female);
    const world: AutoMovieHumanArmCurveSpec.ITransform = S.compose(trunk.frames.world("thorax"), placement.frame.relative);
    const t2: number = performance.now();

    // The port: the trunk's own S00 end, read through its spec at build time.
    const landmark: (name: string) => Vec3 = (name: string): Vec3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(trunk.landmarks, name);
      return S.apply(trunk.frames.world(l.frame), l.point);
    };
    // S00's end alone from the datums S00 fixes there (no S00 build).
    const neckBase: AutoMovieHumanTrunkNeckBase.IEnd = end ?? AutoMovieHumanTrunkNeckBase.end(trunk.frames, trunk.landmarks, measures, AutoMovieHumanHeadThroat.of(measures, head, trunk));
    const t3: number = performance.now();

    const toHead: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => S.apply(S.inverse(world), p);
    const throat: AutoMovieHumanHeadThroat.IOutput = AutoMovieHumanHeadThroat.create({ ij: toHead(landmark("IJ")), gn: frame.points.gn, head });
    const courseInput: AutoMovieHumanHeadNeckCourse.IInput = {
      origin: toHead(neckBase.plane.origin as Vec3),
      extents: neckBase.extents,
      shoulder: neckBase.shoulder,
      vertex: frame.points.v,
      menton: frame.points.me,
    };
    const course: AutoMovieHumanHeadNeckCourse.IOutput = AutoMovieHumanHeadNeckCourse.create(courseInput);
    const worldCourse: AutoMovieHumanHeadNeckCourse.IOutput = AutoMovieHumanHeadNeckCourse.create(courseInput, world);
    const t4: number = performance.now();
    const curves: AutoMovieHumanHeadMass.IOutput = AutoMovieHumanHeadMass.create(frame, course, throat, measures.neckCircumference);
    const t5: number = performance.now();
    return {
      head,
      measures,
      frame,
      trunk,
      neckBase,
      placement,
      world,
      throat,
      course,
      worldCourse,
      curves,
      ms: { inputs: t1 - t0, frame: t2 - t1, port: t3 - t2, course: t4 - t3, curves: t5 - t4 },
    };
  }
}

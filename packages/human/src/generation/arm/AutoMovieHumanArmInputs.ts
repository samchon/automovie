import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanTrunkJointDatums } from "../trunk/AutoMovieHumanTrunkJointDatums";
import { AutoMovieHumanTrunkPorts } from "../trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanTrunkS00 } from "../trunk/AutoMovieHumanTrunkS00";
import type { AutoMovieHumanArmContact } from "./AutoMovieHumanArmContact";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Pose } from "./AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmLandmarks } from "./AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "./AutoMovieHumanArmSegmentFrames";
import type { AutoMovieHumanArmViewCurves } from "./AutoMovieHumanArmViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The arm experiment's constructor arguments from one person, owned once so
 * every reader (`node:arm-specs`, the capture provider, the tests' fixtures)
 * builds the same arm: the public arm inputs (`AutoMovieHumanBodyLaw`), the
 * tapes and breadths the view curves read, and the humerus root placed by
 * the trunk's shoulder port (`AutoMovieHumanTrunkJointDatums`, owned by the
 * trunk: GH from the acromion by de Leva 1996 and Campbell 2009). The trunk
 * datums are in the measures' millimetres; the arm works in calibration
 * millimetres, so the port's origin is carried by the calibration scale.
 *
 * Step 1 of the owner's two-step method: the arm stands in f1's own pose on
 * the trunk's armscye port (`posed`, `AutoMovieHumanArmF1Pose`), its rail on
 * the port loop. The neutral hang with a chest-wall contact
 * (`AutoMovieHumanArmContact`) is not solved here: it swung her
 * 31-degree-abducted humerus 69 mm into S00, past the contact's +-28.6-degree
 * bracket, and it belongs to step 2 (frozen). `root` stays the unabducted
 * shoulder port for the neutral readers. Without a trunk surface `posed` is
 * null and the reason is recorded.
 */
export namespace AutoMovieHumanArmInputs {
  /** The arm's inputs. */
  export interface IOutput {
    /** Public arm and hand inputs, calibration mm. */
    arms: ReturnType<typeof AutoMovieHumanBodyLaw.limbInputs>["arms"];

    /** Tapes and breadths for the view curves, calibration mm. */
    tapes: AutoMovieHumanArmViewCurves.ITapes;

    /** The person's forearm and wrist skin calipers (resolved: measured, else Perry's relations to the girths), calibration mm. */
    calipers: AutoMovieHumanArmViewCurves.ICalipers;

    /** World placement of the humerus frame: the trunk's shoulder port turned by the contact abduction, calibration mm. */
    root: AutoMovieHumanArmCurveSpec.ITransform;

    /** The shoulder port before the abduction, calibration mm. */
    port: AutoMovieHumanArmCurveSpec.ITransform;

    /** The trunk's acromion landmark the port is measured from (`AutoMovieHumanTrunkJointDatums.IPort.landmark`), world calibration mm. */
    acromion: Vec3;

    /** The solved chest-wall contact; null in step 1, where the arm stands in f1's own pose (`posed`). */
    contact: AutoMovieHumanArmContact.IOutput | null;

    /** f1's own pose on the trunk's armscye port (`AutoMovieHumanArmF1Pose`), or null when S00 has no surface. */
    posed: AutoMovieHumanArmF1Pose.IOutput | null;

    /** What placed the root. */
    placement: string;
  }

  /**
   * Read one person's arm inputs, shoulder port and chest-wall contact.
   *
   * @param parameters The person.
   * @param side The arm's side.
   * @param s00 The same person's trunk S00 (`AutoMovieHumanTrunkS00.of(parameters, measures)`) when the caller has built it already, so the contact reads it instead of building it again; absent, it is built here.
   * @returns The arm's inputs, cached per person object and side.
   */
  export function of(parameters: IAutoMovieHumanParameters, side: "left" | "right" = "left", s00?: AutoMovieHumanTrunkS00.IOutput): IOutput {
    const cached: IOutput | undefined = CACHE.get(parameters)?.[side];
    if (cached !== undefined) return cached;
    const arms: IOutput["arms"] = AutoMovieHumanBodyLaw.limbInputs(parameters).arms;
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(parameters);
    const ankle: number | undefined = parameters.extremities?.feet?.[side]?.ankleHeight;
    if (ankle === undefined) throw new Error("The trunk's joint datums need the ankle height input (ISO 8559-1 5.7.6)");
    const ports: AutoMovieHumanTrunkJointDatums.IOutput = AutoMovieHumanTrunkJointDatums.of(measures, ankle, measures.inseam + ankle);
    const shoulder: AutoMovieHumanTrunkJointDatums.IPort = ports.shoulders[side];
    const s: number = arms.scale;
    const tapes: AutoMovieHumanArmViewCurves.ITapes = {
      bicep: arms.bicep,
      elbow: arms.elbow,
      forearm: arms.forearm,
      wrist: arms.wrist,
      hand: arms.circumference,
      breadth: arms[side].breadth,
      bideltoid: arms.bideltoid,
      biacromial: measures.biacromialBreadth * s,
      scale: s,
      // Absent, the resolver's mid-arm girth: the axilla site then lies on the flat upper arm, which leaves the arm unchanged.
      axillary: measures.axillaryArmCircumference * s,
    };
    const calipers: AutoMovieHumanArmViewCurves.ICalipers = {
      forearm: { breadth: measures.forearmBreadth * s, depth: measures.forearmDepth * s },
      wrist: { breadth: measures.wristSkinBreadth * s, depth: measures.wristDepth * s },
    };
    const port: AutoMovieHumanArmCurveSpec.ITransform = { origin: [shoulder.world.origin[0] * s, shoulder.world.origin[1] * s, shoulder.world.origin[2] * s], axes: shoulder.world.axes };
    // The port frame is GH with the thorax's axes, so the acromion is the port applied to its offset from GH.
    const fromGh: Vec3 = scale([shoulder.landmark[0] - shoulder.relative.origin[0], shoulder.landmark[1] - shoulder.relative.origin[1], shoulder.landmark[2] - shoulder.relative.origin[2]], s);
    const acromion: Vec3 = AutoMovieHumanArmCurveSpec.apply(port, fromGh);
    const placed: string = `trunk shoulder port ${side} (AutoMovieHumanTrunkJointDatums: thorax at IJ, GH 0.1044 AR below the acromion, Campbell 2009 offset), origin times calibration scale ${s}`;

    // Step 1 (the owner's order): f1's own pose on the trunk's armscye port
    // (`AutoMovieHumanArmF1Pose`), no neutral hang and no chest-wall contact
    // solve (the hang swung her 31-degree-abducted humerus 69 mm into S00).
    const built: AutoMovieHumanTrunkS00.IOutput = s00 ?? AutoMovieHumanTrunkS00.of(parameters, measures);
    const armscyes: AutoMovieHumanTrunkPorts.IOutput | null = AutoMovieHumanTrunkPorts.create(built);
    let output: IOutput;
    if (armscyes === null) output = { arms, tapes, calipers, root: port, port, acromion, contact: null, posed: null, placement: `${placed}; no posed root: the trunk S00 has no surface for its ports` };
    else {
      const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms, pose: { elbow: 0, wrist: 0 } });
      const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, arms);
      const rail: number = AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk - landmarks.course.port;
      const posed: AutoMovieHumanArmF1Pose.IOutput = AutoMovieHumanArmF1Pose.create({ side, port: armscyes.shoulders[side], scale: s, rail });
      output = { arms, tapes, calipers, root: port, port, acromion, contact: null, posed, placement: `${placed}; posed in f1's own pose: ${posed.basis}` };
    }
    const entry: Partial<Record<"left" | "right", IOutput>> = CACHE.get(parameters) ?? {};
    entry[side] = output;
    CACHE.set(parameters, entry);
    return output;
  }

  /** The port turned by `beta` about its own X axis through its origin (GH). */
  export function abducted(port: AutoMovieHumanArmCurveSpec.ITransform, beta: number): AutoMovieHumanArmCurveSpec.ITransform {
    const c: number = Math.cos(beta);
    const n: number = Math.sin(beta);
    return AutoMovieHumanArmCurveSpec.compose(port, {
      origin: [0, 0, 0],
      axes: [
        [1, 0, 0],
        [0, c, n],
        [0, -n, c],
      ],
    });
  }

  /** One build per person object and side: the contact solve lofts the arm and the trunk once. */
  const CACHE: WeakMap<IAutoMovieHumanParameters, Partial<Record<"left" | "right", IOutput>>> = new WeakMap();
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

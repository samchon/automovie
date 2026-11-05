import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanSex,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import {
  buildHumanCartoonFace,
  buildHumanPolygon,
} from "@automovie/viewer/human-polygon";
import * as THREE from "three";

import { inspectHumanModel } from "./inspectHumanModel";
import { createSchoolUniform } from "./createSchoolUniform";

/**
 * Prepare one reusable polygon actor and expose the actual Human clinical IK.
 * Body coordinates are metres, +X forward, +Y up, +Z anatomical left. Root
 * placement belongs to the caller; reach targets use the unplaced body frame.
 * Stature is authored, not measured from a portrait. Omitted anatomy uses the
 * installed Human survey law, so this blockout proves no age-specific anatomy.
 * The caller owns the group and must dispose it after removing attachments.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Human prepares fixed geometry and clinical FK once. Viewer consumes those exact outputs, including exterior courses. Reach returns the actual solver residual rather than moving a hand independently of its chain. Drawing and face resources retire together.
 * @evidence contracts/common.md#authoring-interface Supply stature in metres, sex statistics and house RGB. Pose and reach return matching FK; point reads that last applied output. Root transforms are deliberately excluded from these body-frame controls. Dispose after the caller releases separately owned attachments.
 */
export function createHumanPerformer(options: {
  stature: number;
  female: boolean;
  houseColor: number;
}): {
  object: THREE.Group;
  model: ReturnType<typeof inspectHumanModel>;
  parameters: IAutoMovieHumanParameters;
  drawing: ReturnType<typeof buildHumanPolygon>;
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  neutral: AutoMovieHumanSkeleton.IOutput;
  feet: ReturnType<typeof createSchoolUniform>["feet"];
  expression: (state: "neutral" | "smirk" | "startled") => void;
  pose: (pose: IAutoMovieHumanPose) => AutoMovieHumanSkeleton.IOutput;
  reach: (
    pose: IAutoMovieHumanPose,
    side: "left" | "right",
    target: [number, number, number],
  ) => AutoMovieHumanClinicalIk.IResult;
  point: (bone: string, offset?: [number, number, number]) => THREE.Vector3;
  dispose: () => void;
} {
  if (!Number.isFinite(options.stature) || options.stature < 0.4 || options.stature > 2.5)
    throw new Error("Human stature must be between 0.4 and 2.5 metres");
  const parameters: IAutoMovieHumanParameters = {
    body: { anatomy: {
      sex: options.female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male,
      stature: options.stature * 1000,
    } },
    head: {
      length: 185, cephalicIndex: 80, circumference: 550, height: 220,
      faceHeight: 115, faceWidth: 130, mandibularWidth: 105,
      minimumFrontalWidth: 100, mouthOpening: 48, mandibularLaterotrusion: 9,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
          right: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
        },
        intercanthalWidth: 31,
        nose: { width: 34, height: 52, protrusion: 20 },
        mouth: { width: 45, upperVermilionHeight: 8, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 60, breadth: 27, protrusion: 18 },
        right: { length: 60, breadth: 27, protrusion: 18 },
      },
    },
  };
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(parameters, { neckSurface: true, footSurface: true });
  let current: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const neutral: AutoMovieHumanSkeleton.IOutput = current;
  const colors: Record<string, number> = {};
  for (const bone of current.bones)
    colors[bone.bone] = /Hand|Finger|Thumb|Index|Middle|Ring|Little|head|neck|atlas|Eye|jaw|ear/i.test(bone.bone)
      ? 0xe7bd9f : /Foot|Toe|Subtalar|Midfoot/.test(bone.bone) ? 0x151a20 : 0x353b43;
  colors.chest = 0x41464b;
  if (options.female) for (const side of ["left", "right"]) { colors[side + "UpperLeg"] = 0x20252a; colors[side + "LowerLeg"] = 0x20252a; }
  const drawing: ReturnType<typeof buildHumanPolygon> = buildHumanPolygon(current, { partColors: colors });
  const faces: Map<"neutral" | "smirk" | "startled", ReturnType<typeof buildHumanCartoonFace>> = new Map();
  let uniform: ReturnType<typeof createSchoolUniform> | undefined;
  let retired: boolean = false;
  /** Retire every acquired attachment even if another disposer refuses. */
  const retire: () => void = (): void => {
    if (retired) return;
    retired = true;
    const errors: unknown[] = [];
    const owners: (() => void)[] = [(): void => { uniform?.dispose(); }, ...[...faces.values()].map((face: ReturnType<typeof buildHumanCartoonFace>): (() => void) => face.dispose), drawing.dispose];
    for (const owner of owners) { try { owner(); } catch (error: unknown) { errors.push(error); } }
    if (errors.length) throw new AggregateError(errors, "Human performer retirement failed");
  };
  try {
  faces.set("neutral", buildHumanCartoonFace(drawing.head));
  faces.set("smirk", buildHumanCartoonFace(drawing.head, { units: [{ unit: "AU12", side: "left", intensity: 0.35 }, { unit: "AU2", side: "right", intensity: 0.15 }] }));
  faces.set("startled", buildHumanCartoonFace(drawing.head, { units: [{ unit: "AU1", side: "both", intensity: 0.4 }, { unit: "AU5", side: "both", intensity: 0.3 }, { unit: "AU25", side: "both", intensity: 0.15 }] }));
  for (const [name, face] of faces) { drawing.head.object.add(face.object); face.object.visible = name === "neutral"; }
  uniform = createSchoolUniform(drawing, options.female, options.houseColor, neutral);
  return {
    object: drawing.object,
    model: inspectHumanModel(neutral, drawing),
    parameters: structuredClone(parameters),
    drawing,
    evaluate,
    neutral,
    feet: uniform.feet,
    expression(state: "neutral" | "smirk" | "startled"): void {
      for (const [name, face] of faces) face.object.visible = name === state;
    },
    /** Apply one complete clinical pose and retain its exact FK for contacts. */
    pose(pose: IAutoMovieHumanPose): AutoMovieHumanSkeleton.IOutput {
      current = evaluate(pose);
      drawing.setPose(current);
      uniform!.update(current);
      return current;
    },
    /** Fit the hand joint with a bounded arm solve; expose unresolved error. */
    reach(
      pose: IAutoMovieHumanPose,
      side: "left" | "right",
      target: [number, number, number],
    ): AutoMovieHumanClinicalIk.IResult {
      const result: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(evaluate, pose, {
        chain: { region: "arm", side },
        targets: [{ bone: side === "left" ? "leftHand" : "rightHand", position: target }],
        iterations: 16,
        tolerance: 0.005,
      });
      current = result.output;
      drawing.setPose(current);
      uniform!.update(current);
      return result;
    },
    /** Read a body-frame rigid point from the applied FK, refusing unknown bones. */
    point(bone: string, offset: [number, number, number] = [0, 0, 0]): THREE.Vector3 {
      const placement: AutoMovieHumanSkeleton.IPlacement | undefined = current.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone,
      );
      if (!placement) throw new Error(`Missing Human contact bone: ${bone}`);
      return new THREE.Vector3(...offset)
        .applyQuaternion(new THREE.Quaternion(...placement.rotation))
        .add(new THREE.Vector3(...placement.position));
    },
    dispose: retire,
  };
  } catch (error: unknown) {
    try { retire(); } catch (cleanup: unknown) { throw new AggregateError([error, cleanup], "Human performer construction and cleanup failed"); }
    throw error;
  }
}

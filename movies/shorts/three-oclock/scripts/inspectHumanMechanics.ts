import { AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { buildHumanPolygon, type AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import { writeFile } from "node:fs/promises";

import { createHumanParameters } from "../src/actors/createHumanParameters";

/**
 * Exercise both real Human polygon consumers before replacing the live scene.
 * Retains the complete admission failures without a reduced-foot fallback.
 */
export async function inspectHumanMechanics(): Promise<void> {
  const results: object[] = [];
  let failed: boolean = false;
  for (const person of ["carina", "harry"] as const) {
    let drawing: AutoMovieHumanPolygon.IDrawing | undefined;
    try {
      const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(
        createHumanParameters(person), { neckSurface: true, footSurface: true },
      );
      const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
      if (neutral.footSurface === undefined) throw new Error("Requested Human foot surface is absent");
      drawing = buildHumanPolygon(neutral);
      const poses: IAutoMovieHumanPose[] = [
        {},
        { arms: { left: {}, right: { shoulder: { flexion: 40 }, elbow: { flexion: 75 } } } },
        { spine: { lumbar: { flexion: 28 } }, legs: { left: { hip: { flexion: 30 }, knee: { flexion: 55 } }, right: { hip: { flexion: 30 }, knee: { flexion: 55 } } } },
      ];
      const samples: object[] = poses.map((pose: IAutoMovieHumanPose): object => {
        const output: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
        drawing!.setPose(output);
        if (output.posed.some((item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          ![...item.position, ...item.rotation].every(Number.isFinite)))
          throw new Error("Human FK returned a nonfinite placement");
        return { clamped: output.clamped, bones: output.posed.length };
      });
      results.push({ person, outcome: "admitted", parts: drawing.parts.size, samples,
        boneNames: neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): string => bone.bone) });
    } catch (error: unknown) {
      failed = true;
      results.push({ person, outcome: "refused", error: error instanceof Error ? error.stack : String(error) });
    } finally {
      drawing?.dispose();
    }
  }
  const report: object = { scope: "Public Human skeleton plus polygon foot-surface consumer, no appearance/motion acceptance", results };
  await writeFile(".cache/motion-human-admission.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failed) process.exitCode = 1;
}

void inspectHumanMechanics();

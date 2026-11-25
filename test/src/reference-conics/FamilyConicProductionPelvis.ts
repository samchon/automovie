import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { buildHumanNeutralCapture } from "@automovie/human/capture";
import type {
  IAutoMovieHumanParameters,
  IAutoMovieMesh,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import PEOPLE from "../features/internal/MOTION_HUMAN_PEOPLE.json";
import { FamilyConicNeutralNailAssembly } from "./FamilyConicNeutralNailAssembly";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";

/** Inspect the ordinary Human body and its exact lower branch publication. */
export namespace FamilyConicProductionPelvis {
  /** Owners whose normal realization can meet a lower-body chart. */
  const LOWER =
    /^(trunk|groin\.|leg\.|foot\.|toe\.|gluteal\.|fold\..*(?:leg\.|foot\.|gluteal\.)|nail\.toe\.)/;

  /** Read actual topology, shared faces, crossing witnesses and all toe nails. */
  export async function run(output: string, subject: string): Promise<void> {
    const params = subject === "f-average" ? PEOPLE[subject].params : undefined;
    const result = buildHumanNeutralCapture.inspect(
      params as IAutoMovieHumanParameters | undefined,
    );
    const { mesh, calibration, triangleGroups: groups } = result;
    const whole = mesh.indices;
    if (whole === null)
      throw new Error("The production skin has no index buffer");
    const lower: string[] = [];
    const indices: number[] = [];
    groups.forEach(({ name, start }, i): void => {
      if (!LOWER.test(name)) return;
      const end = groups[i + 1]?.start ?? whole.length;
      for (let entry = start; entry < end; entry += 3) {
        indices.push(whole[entry]!, whole[entry + 1]!, whole[entry + 2]!);
        lower.push(name);
      }
    });
    const crop: IAutoMovieMesh = { ...mesh, indices };
    const outputRecord = {
      subject,
      topology: result.topology,
      pieces: result.pieces,
      diagnostics: result.diagnostics,
      timingsMs: result.milliseconds,
      grids: result.gridReads,
      lowerOwners: result.trianglesByOwner.filter(({ name }) =>
        LOWER.test(name),
      ),
      shared: calibration.bodies?.flatMap(({ faces }) =>
        faces
          .filter(({ chain }) => LOWER.test(chain))
          .map((face) => ({
            name: face.chain,
            cycles: face.cycles.map(({ kind, points }) => ({
              kind,
              points: points.length,
            })),
            domain: face.domainLoops?.map(({ kind, points }) => ({
              kind,
              points: points.length,
            })),
          })),
      ),
      toes: calibration.nailSources
        ?.filter(({ original }) => original.source.name.startsWith("toe."))
        .map(({ original }) => original.source.name),
      clipping: result.nailClipping,
    };
    await mkdir(output, { recursive: true });
    await writeFile(
      path.join(output, `production-${subject}.json`),
      JSON.stringify(outputRecord, null, 2),
    );
    const names = outputRecord.toes ?? [];
    if (names.length > 0) {
      const nailDir: string = path.join(output, "toenail-clay");
      await mkdir(nailDir, { recursive: true });
      NodeCanvasRaster.initialize();
      const nails = await FamilyConicNeutralNailAssembly.observeBody(result, undefined, names, nailDir);
      await writeFile(path.join(output, `production-${subject}-nails.json`), JSON.stringify(nails, null, 2));
    }
    console.log(
      `${subject}: ${lower.length} emitted lower faces; starting strict crossing census`,
    );
    const start = performance.now();
    const witnesses = measureAutoMovieMeshCrossings(crop, crop, {
      allPairs: true,
    });
    const pairs: Record<string, number> = {};
    for (const { triangle, other } of witnesses) {
      if (triangle >= other) continue;
      const key: string = [lower[triangle]!, lower[other]!].sort().join(" / ");
      pairs[key] = (pairs[key] ?? 0) + 1;
    }
    await writeFile(
      path.join(output, `production-${subject}-crossings.json`),
      JSON.stringify(
        {
          triangles: lower.length,
          pairs,
          milliseconds: performance.now() - start,
        },
        null,
        2,
      ),
    );
  }
}

void FamilyConicProductionPelvis.run(
  process.argv[2]!,
  process.argv[3] ?? "neutral",
).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

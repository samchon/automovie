import { AutoMovieHumanSex, type AutoMovieHumanGrounding, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";

import { createDuelActor } from "../src/createDuelActor";
import { createDuelGrounding } from "../src/createDuelGrounding";
import { createDuelHumanParameters } from "../src/createDuelHumanParameters";

/** Original fixed preparation arguments; no inferred or reconstructed numerical pose. */
interface ActorInput {
  supportStatus: string;
  supportSolve: {
    input: { seed: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; request: AutoMovieHumanGrounding.IRequest };
  };
}

/** Exact v2 cached input subset consumed by this read-only inspection. */
interface BakeInput {
  format: string;
  source: { production: Record<string, string> };
  frames: { carina: ActorInput; harry: ActorInput }[];
}

/**
 * Inspect every retained initial seed through the matching actual public FK and full floor.
 *
 * @evidence contracts/common.md#implementation-and-ownership Fixed v2 bytes and all production source hashes are checked before rebuilding the two original actors. Public Grounding.inspect performs zero optimization updates. It uses the exact original root, material goals and full Human/shoe vertices. Initial FK residuals and clamps explain preparation quality, not global feasibility or a replacement trajectory. The source movie and its final results are never changed.
 * @evidence contracts/common.md#authoring-interface Run with a production-contained v2 bake path and output JSON path. Both original cast identities and parameters match the production. The report owns input-byte identity and every initial hard-point vector; it makes no new solve, visual or film acceptance claim. Dispose both temporary observer actors after the complete inspection.
 */
export async function inspectDuelSeeds(): Promise<void> {
  const root: string = process.cwd();
  const inputPath: string = path.resolve(root, process.argv[2] ?? "");
  const outputPath: string = path.resolve(root, process.argv[3] ?? "");
  for (const target of [inputPath, outputPath]) {
    const relative: string = path.relative(root, target);
    if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Use explicit production-contained input and output files");
  }
  const bytes: Buffer = await readFile(inputPath);
  const bake: BakeInput = JSON.parse(bytes.toString("utf8")) as BakeInput;
  if (bake.format !== "look-at-me-duel-motion-bake-v2") throw new Error("Original v2 input required");
  for (const [file, expected] of Object.entries(bake.source.production)) {
    const observed: string = createHash("sha256").update(await readFile(path.join(root, "src", file))).digest("hex");
    if (observed !== expected) throw new Error(`Source epoch mismatch: ${file}`);
  }
  const rows: object[] = [];
  for (const role of ["carina", "harry"] as const) {
    const actor: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(role === "carina" ? 1700 : 1780, role === "carina" ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male), { hair: role === "carina" ? 0xe8d9af : 0x25201f, house: role === "carina" ? 0x245d48 : 0x842a33, glasses: role === "harry", smirk: role === "carina", skirt: role === "carina" });
    try {
      const grounding: ReturnType<typeof createDuelGrounding> = createDuelGrounding(actor.drawing, actor.evaluate, actor.shoes.points);
      for (let frame: number = 0; frame < bake.frames.length; frame++) {
        const recorded: ActorInput = bake.frames[frame]![role];
        const original: ActorInput["supportSolve"]["input"] = recorded.supportSolve.input;
        const result: AutoMovieHumanGrounding.IResult = grounding.solve.inspect(original.seed, original.root, { ...original.request, channels: [], rootAxes: [] });
        const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(result.output.posed.map((item: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [item.bone, item]));
        const rotation: THREE.Quaternion = new THREE.Quaternion(...original.root.rotation);
        const translation: THREE.Vector3 = new THREE.Vector3(...original.root.translation);
        const targets: object[] = original.request.targets.map((target: AutoMovieHumanGrounding.IRequest["targets"][number]): object => {
          const bone: AutoMovieHumanSkeleton.IPlacement = placements.get(target.bone)!;
          const actual: THREE.Vector3 = new THREE.Vector3(...(target.localPoint ?? [0, 0, 0])).applyQuaternion(new THREE.Quaternion(...bone.rotation)).add(new THREE.Vector3(...bone.position)).applyQuaternion(rotation).add(translation);
          return { bone: target.bone, localPoint: target.localPoint ?? null, target: target.position, actual: actual.toArray(), difference: actual.clone().sub(new THREE.Vector3(...target.position)).toArray(), error: actual.distanceTo(new THREE.Vector3(...target.position)) };
        });
        rows.push({ frame, role, originalFinalStatus: recorded.supportStatus, initial: { error: result.error, floorMinimum: result.floorMinimum, clamps: result.output.clamped, targets } });
      }
    } finally { actor.dispose(); }
  }
  await writeFile(outputPath, JSON.stringify({ scope: "Original seed public FK and full registered-floor inspect only; zero optimization calls", inputPath, inputSha256: createHash("sha256").update(bytes).digest("hex"), frames: bake.frames.length, actorStates: rows.length, rows }, null, 2) + "\n");
  console.log({ outputPath, actorStates: rows.length, optimizationCalls: 0 });
}

void inspectDuelSeeds().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });

import fs from "node:fs";
import path from "node:path";
import type { AutoMovieLoftContract, IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanBodySurface } from "../generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { AutoMovieHumanHandFingerTree } from "../generation/hand/AutoMovieHumanHandFingerTree";
import { AutoMovieHumanHandPorts } from "../generation/hand/AutoMovieHumanHandPorts";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1's left hand with its digits joined by the finger tree
 * (`AutoMovieHumanHandFingerTree`: each digit a merge fold onto the arm
 * part), realized by the engine and tessellated by the body's skin
 * (`AutoMovieHumanBodySurface`), drawn as clay in close-ups (front,
 * oblique, side, palm) under `.shots/f1_arm/hand-<stamp>/` with the tree's
 * diagnostics and timings (`node:arm-hand`).
 */
export namespace NodeArmHand {
  /** Build, join, tessellate and draw. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "left");
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side: "left", arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers);
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.root, order: 32, samples: 64, gap: 6 });
    const digits: AutoMovieHumanHandDigits.IDigit[] = AutoMovieHumanHandDigits.create(frames, inputs.root, { sex: inputs.arms.sex, breadth: inputs.tapes.breadth });
    if (loft.part === null) throw new Error(`arm loft: ${loft.diagnostics.join("; ")}`);
    const arm: IAutoMovieViewPart = loft.part;
    const built: number = performance.now();
    const joined: AutoMovieHumanHandFingerTree.IOutput = AutoMovieHumanHandFingerTree.create(arm, digits, inputs.tapes.breadth);
    const realized: number = performance.now();
    // The palm's digit ports (AutoMovieHumanHandPorts) for f1_integration's known-port bands.
    const chain = loft.loft?.chain ?? null;
    const ports: ReturnType<typeof AutoMovieHumanHandPorts.create> = chain === null ? [] : AutoMovieHumanHandPorts.create(chain, digits);
    console.log(JSON.stringify({ ports: ports.map((p: ReturnType<typeof AutoMovieHumanHandPorts.create>[number]) => ({ name: p.name, rail: Number(p.rail.toFixed(2)), centre: p.centre.map((x: number): number => Number(x.toFixed(4))), semi: p.semi.map((x: number): number => Number(x.toFixed(4))), girth: Number(p.girth.toFixed(2)), perimeter: Number(p.perimeter.toFixed(2)), gap: Number(p.gap.toFixed(2)) })) }));
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...joined.diagnostics];
    const triangles: [V3, V3, V3][] = [];
    if (joined.tree !== null) {
      const calibration: IAutoMovieHumanBodyCalibration = { stature: 1700, chains: joined.tree.chains, events: [], poles: [], apertures: [], eyes: [], bodies: [joined.tree.body], diagnostics: [] };
      const skin: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration);
      const p: number[] = skin.mesh.positions;
      const ix: number[] = skin.mesh.indices;
      for (let k: number = 0; k + 2 < ix.length; k += 3) {
        const at = (i: number): V3 => [p[3 * i]!, p[3 * i + 1]!, p[3 * i + 2]!];
        triangles.push([at(ix[k]!), at(ix[k + 1]!), at(ix[k + 2]!)]);
      }
    }
    const skinned: number = performance.now();
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm/hand-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.mkdirSync(out, { recursive: true });
    const centre: V3 = loft.centres[loft.centres.length - 1]!;
    const bounds: V3[] = [NodeArmDraw.add(centre, [-95, -95, -95]), NodeArmDraw.add(centre, [95, 95, 95])];
    const files: string[] = [];
    for (const [name, forward] of [["front", [-1, 0, 0]], ["oblique", NodeArmDraw.unit([-1, 0.4, 1])], ["side", [0, 0, 1]], ["palm", [1, 0, 0]]] as [string, V3][]) {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      NodeArmDraw.clay(v, triangles);
      NodeArmDraw.caption(v, [`f1 left hand, digits joined by the finger tree, ${name}`, `${triangles.length} triangles, ${diagnostics.length} diagnostics, ${joined.blends.length} folds`]);
      fs.writeFileSync(path.join(out, `hand.${name}.png`), NodeArmDraw.png(v));
      files.push(`hand.${name}.png`);
    }
    const report: Record<string, unknown> = {
      folds: joined.blends.map((c: { name: string }): string => c.name),
      triangles: triangles.length,
      diagnostics,
      ms: { build: built - started, join: realized - built, skin: skinned - realized, total: performance.now() - started },
      files,
    };
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(`node:arm-hand ${out}`);
    console.log(JSON.stringify({ ...report, files: undefined }, null, 2));
  }
}

void NodeArmHand.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});

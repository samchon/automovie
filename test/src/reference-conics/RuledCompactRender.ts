import { ConicPaperRender as R } from "./ConicPaperRender";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Matched whole-body cameras and explicitly disclosed camera-only regional crops. */
export namespace RuledCompactRender {
  /** Actual generated scene; all coordinates are metres and no reference geometry is substituted. */
  export interface Scene {
    /** Flattened actual recoveryLocal mesh. */
    mesh: N.Mesh;
    /** Actual engine construction evaluated from the generating coefficients. */
    curves: N.Curve[];
  }

  /** Draw full front/back/sides/obliques at all three stages, then inspect readable source/result crops. */
  export async function run(root: string, out: string, original: Scene, compact: Scene): Promise<{ whole: R.Result; regional: object[]; milliseconds: number }> {
    const started: number = performance.now();
    const whole: R.Result = await R.run(root, out, [{ name: "original-full-ruled", loft: original }, { name: "compact-full-ruled", loft: compact }]);
    const regional: object[] = [];
    const points: readonly number[] = original.mesh.positions;
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (let i: number = 0; i < points.length; i += 3) for (let axis: number = 0; axis < 3; ++axis) {
      low[axis] = Math.min(low[axis]!, points[i + axis]!);
      high[axis] = Math.max(high[axis]!, points[i + axis]!);
    }
    const height: number = high[1]! - low[1]!;
    const centerZ: number = (high[2]! + low[2]!) / 2;
    const width: number = high[2]! - low[2]!;
    const crops: { name: string; cameras: string[]; overlay: boolean; admits: (x: number, y: number, z: number) => boolean }[] = [
      { name: "upper-head", cameras: ["front", "left", "back"], overlay: true, admits: (_x: number, y: number, _z: number): boolean => y >= low[1]! + 0.82 * height },
      { name: "central-trunk", cameras: ["front", "back"], overlay: false, admits: (_x: number, y: number, z: number): boolean => y >= low[1]! + 0.43 * height && y <= low[1]! + 0.84 * height && Math.abs(z - centerZ) <= 0.24 * width },
      { name: "left-peripheral-hand", cameras: ["front"], overlay: true, admits: (_x: number, y: number, z: number): boolean => y >= low[1]! + 0.44 * height && y <= low[1]! + 0.65 * height && z >= centerZ + 0.28 * width },
      { name: "right-peripheral-hand", cameras: ["front"], overlay: true, admits: (_x: number, y: number, z: number): boolean => y >= low[1]! + 0.44 * height && y <= low[1]! + 0.65 * height && z <= centerZ - 0.28 * width },
    ];
    for (const crop of crops) {
      const minimum: number[] = [Infinity, Infinity, Infinity];
      const maximum: number[] = [-Infinity, -Infinity, -Infinity];
      for (let i: number = 0; i < points.length; i += 3) if (crop.admits(points[i]!, points[i + 1]!, points[i + 2]!)) for (let axis: number = 0; axis < 3; ++axis) {
        minimum[axis] = Math.min(minimum[axis]!, points[i + axis]!);
        maximum[axis] = Math.max(maximum[axis]!, points[i + axis]!);
      }
      if (!minimum.every(Number.isFinite)) { regional.push({ crop: crop.name, unavailable: "camera-only selection contains no original generated points" }); continue; }
      const bounds: N.Point[] = [];
      for (const x of [minimum[0]!, maximum[0]!]) for (const y of [minimum[1]!, maximum[1]!]) for (const z of [minimum[2]!, maximum[2]!]) bounds.push([x, y, z]);
      for (const direction of crop.cameras) {
        const camera: N.Camera = NodeCanvasCamera.fit(direction, bounds, 800, 800);
        for (const [subject, scene] of [["original-full-ruled", original], ["compact-full-ruled", compact]] as const)
          for (const stage of crop.overlay ? ["clay", "overlay"] : ["clay"]) {
            if (performance.now() - started > 120000 || process.memoryUsage.rss() > 8 * 1024 ** 3) throw new Error("Explicit render time or RSS budget exceeded");
            const selected: N.Curve[] = stage === "clay" ? [] : scene.curves.filter((curve: N.Curve): boolean => curve.points.some((p: N.Point): boolean => p[0] >= minimum[0]! && p[0] <= maximum[0]! && p[1] >= minimum[1]! && p[1] <= maximum[1]! && p[2] >= minimum[2]! && p[2] <= maximum[2]!));
            const frame: ReturnType<typeof NodeCanvasRaster.render> = NodeCanvasRaster.render(camera, [scene.mesh], selected, "depth", subject + " | " + crop.name + " | " + direction + " | " + stage);
            const file: string = subject + ".roi-" + crop.name + "." + direction + "." + stage + ".png";
            await fs.writeFile(path.join(out, file), frame.png);
            regional.push({ file, subject, stage, camera, sha256: createHash("sha256").update(frame.png).digest("hex"), milliseconds: frame.milliseconds, selection: { rule: "camera-only relative source bounds; no fitting landmark or anatomy certification", minimum, maximum } });
            process.stdout.write(JSON.stringify({ event: "ruled-compact-roi", file }) + "\n");
          }
      }
    }
    return { whole, regional, milliseconds: performance.now() - started };
  }
}

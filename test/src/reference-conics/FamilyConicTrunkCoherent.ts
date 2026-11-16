import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { realizeAutoMovieConstruction } from "@automovie/engine";
import { FamilyConicFigure as G } from "./FamilyConicFigure";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicTrunkLaw as T } from "./FamilyConicTrunkLaw";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Draw the exact proposed D on an already connected f1 skin, as a control for the independently projected child candidate. */
export namespace FamilyConicTrunkCoherent {
  /**
   * Render the five existing figure cases at the existing cameras, changing only the map applied to the original connected skin.
   * This is a sampled display of D(S_reference), not a child-dimension or rig implementation. The original index topology is retained;
   * no point is fitted, smoothed or corrected. Raster accuracy after deformation remains unqualified.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States source, compared variable, unit conversion, retained topology, exclusions and diagnostic-only output.
   * @evidence contracts/development/implementation.md#principled-implementation A single point map acts once on every shared original vertex, so this control cannot introduce a gap by independently deforming a connection's two copies.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the existing reference once, map one case at a time, then draw its fixed camera set and retain a running record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No per-part gain, nearest projection or retuned connection is used; finite values are required and exact identity points retain their original metre values.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original realization, O(V) mapping per case and the existing raster cost per frame; no changed-case connection is rebuilt.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the original topology and reference-framed cameras across all five maps.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One standalone invocation retains the original skin and reference bounds plus one mapped skin at a time; PNG buffers are written per frame and records retain only their hashes/cameras.
   */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const name: string = process.argv.find((argument: string): boolean => argument.startsWith("--dir="))?.slice(6) ?? "trunk-d-coherent-" + new Date().toISOString().replaceAll(":", "-");
    const out: string = path.join(root, "packages/human/.shots", name);
    await fs.mkdir(out, { recursive: true });
    const frames: { case: string; file: string; sha256: string; camera: N.Camera }[] = [];
    const state: { status: "running" | "complete" | "failed"; stage: string; triangles: number | null; entrySha256: string; cases: Pick<T.ICoherentInput["cases"][number], "name" | "fields">[]; frames: typeof frames; limitation: string; error: string | null } = {
      status: "running", stage: "prepare", triangles: null,
      entrySha256: createHash("sha256").update(await fs.readFile(process.argv[1]!)).digest("hex"), cases: [], frames,
      limitation: "Whole-skin D control only; excludes separate child dimension laws, rig/binding updates, construction passes and a post-deformation chord-error guarantee. CPU diagnostic clay only.", error: null,
    };

    /** A partial render keeps its own stage and frames, never a completed receipt. */
    const checkpoint: () => Promise<void> = async (): Promise<void> => fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(state, null, 2));
    await checkpoint();
    try {
      const prepared: T.ICoherentInput = await T.coherentInput();
      state.cases = prepared.cases.map((item: T.ICoherentInput["cases"][number]): Pick<T.ICoherentInput["cases"][number], "name" | "fields"> => ({ name: item.name, fields: item.fields }));
      state.stage = "reference realization";
      await checkpoint();
      const original: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction({ name: "trunk-law.f1", root: prepared.reference.declared.root, fills: prepared.reference.declared.fills }, { chord: 0.001, sources: prepared.reference.sources });
      if (original.diagnostics.length !== 0) throw new Error("The f1 control source has diagnostics: " + JSON.stringify(original.diagnostics));
      state.triangles = original.mesh.indices.length / 3;
      const reference: R.ISource = await R.load(root);
      const bounds: N.Point[] = [];
      for (const mesh of [reference.body, reference.head])
        for (let k: number = 0; k < mesh.positions.length; k += 3) bounds.push([mesh.positions[k]! / 1000, mesh.positions[k + 1]! / 1000, mesh.positions[k + 2]! / 1000]);
      const cells: { file: string; label: string; camera: N.Camera }[] = [];
      for (const view of ["front", "back", "left"]) cells.push({ file: "figure." + view, label: view, camera: NodeCanvasCamera.fit(view, bounds, 900, 1500) });
      for (const [zone, inside] of G.ZONES.filter(([zone]: [string, unknown]): boolean => ["chest", "shoulder", "neck", "hip", "head"].includes(zone))) {
        const near: N.Point[] = bounds.filter(inside);
        for (const view of G.views(zone)) cells.push({ file: zone + "." + view, label: zone + " " + view, camera: NodeCanvasCamera.fit(view, near, 900, 900) });
      }
      NodeCanvasRaster.initialize();
      for (const [index, item] of prepared.cases.entries()) {
        const tag: string = ["f1", "bust-5th", "bust-95th", "every-site-5th", "every-site-95th"][index]!;
        state.stage = "map " + item.name;
        await checkpoint();

        // The map consumes world millimetres; the raster consumes metres. Preserve exact zero moves through that boundary.
        const positions: number[] = new Array<number>(original.mesh.positions.length);
        for (let k: number = 0; k < positions.length; k += 3) {
          const p: N.Point = [original.mesh.positions[k]! * 1000, original.mesh.positions[k + 1]! * 1000, original.mesh.positions[k + 2]! * 1000];
          const q: N.Point = item.map(p);
          if (!q.every(Number.isFinite)) throw new Error(`${item.name}: D returned a nonfinite point`);
          const same: boolean = q[0] === p[0] && q[1] === p[1] && q[2] === p[2];
          for (let j: number = 0; j < 3; ++j) positions[k + j] = same ? original.mesh.positions[k + j]! : q[j]! / 1000;
        }
        const mesh: N.Mesh = { id: tag, positions, indices: original.mesh.indices, colour: [0.64, 0.65, 0.67] };
        for (const cell of cells) {
          state.stage = "draw " + cell.file + "." + tag;
          const file: string = `${cell.file}.${tag}.png`;
          const png: Buffer = NodeCanvasRaster.render(cell.camera, [mesh], [], "depth", `f1 trunk law | ${item.name} | ${cell.label}`).png;
          await fs.writeFile(path.join(out, file), png, { flag: "wx" });
          frames.push({ case: item.name, file, sha256: createHash("sha256").update(png).digest("hex"), camera: cell.camera });
          await checkpoint();
        }
        process.stdout.write(`coherent: ${index + 1}/${prepared.cases.length} ${item.name}\n`);
      }
      state.status = "complete";
      state.stage = "complete";
      await checkpoint();
      process.stdout.write("out " + out + "\n");
    } catch (error: unknown) {
      state.status = "failed";
      state.error = error instanceof Error ? error.stack ?? error.message : String(error);
      await checkpoint();
      throw error;
    }
  }
}

if (/FamilyConicTrunkCoherent\.(c?js|ts)$/.test(process.argv[1] ?? "")) void FamilyConicTrunkCoherent.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});

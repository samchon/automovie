import type { IAutoMovieRecoveryImageFit } from "@automovie/recovery";
import type { IAutoMovieRecoveryImageFiles } from "@automovie/recovery/node";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Exercise installed image acquisition, fitting and independent recipe generation.
 * Four P6 masks rasterize an analytic 12 by 8 mm elliptical cylinder with known
 * orthographic cameras. They establish packaging and physical reconstruction only;
 * real photograph accuracy and camera estimation remain separate experiments.
 * The final installed command and geometry check cannot read the original images.
 *
 * @evidence contracts/common.md#principled-implementation Fixed analytic pixel-centre inclusion and SHA-256 manifests drive the actual installed observe/fit commands; a permission-isolated realize command supplies a public atlas whose engine vertices are checked against an independent cylinder equation.
 * @evidence contracts/common.md#clear-and-simple-design This host owns acquisition files and a physical oracle; installed ingest, recovery and engine packages retain decoding, inverse fitting and geometry authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original-image reads must fail with ERR_ACCESS_DENIED during the final consumer check; no source alias, original mesh, copied normal, learned completion or generated vertex table supplies the result.
 * @evidence contracts/common.md#meaningful-documentation States analytic dimensions, supplied cameras, partial coverage, runtime isolation and the separate photographic/camera-estimation boundary.
 * @evidence contracts/performance.md#efficient-algorithms Four fixed 256 by 128 rasters and one bounded engine grid limit acquisition and oracle work; each artifact is read once per required boundary.
 * @evidence contracts/performance.md#reuse-equivalent-work Saved recipe coefficients from the one installed fit supply the installed realization and its independent vertex check without refitting or reopening acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns exact external scratch and bounded synchronous processes; this helper starts no browser, GPU, retained worker or hidden cache.
 */
export function verifyAutoMovieRecoveryImageConsumer(input: {
  consumer: string;
  cli: string;
  sourceEpoch: string;
  run: (command: string, args: string[], cwd: string) => string;
}): {
  cohort: "analytic";
  cameras: "supplied";
  images: number;
  recipeBytes: number;
  vertices: number;
  maximumVertexDefectMm: number;
  sourceImagesDenied: true;
} {
  const source: string = path.join(input.consumer, "image-acquisition"),
    independent: string = path.join(input.consumer, "image-independent");
  fs.mkdirSync(source);
  fs.mkdirSync(independent);
  const manifest: IAutoMovieRecoveryImageFiles = {
    schema: "automovie-recovery-image-files-v1",
    encoding: "ppm-srgb-rgb8-v1",
    capture: {
      schema: "automovie-recovery-images-v1",
      objectId: "packed-analytic-cylinder",
      frame: "supplied-millimetres",
      rigidity: "asserted-fixed",
      cohort: "analytic",
      background: { rgb: [240, 240, 240], threshold: 20 },
      budget: { maxPixels: 150_000, maxViews: 4, maxRows: 400 },
    },
    maxHeaderBytes: 128,
    views: [],
  };
  for (const degrees of [0, 45, 90, 135]) {
    const angle: number = (degrees * Math.PI) / 180;
    const halfWidthMm: number = Math.hypot(
      12 * Math.cos(angle),
      8 * Math.sin(angle),
    );
    const rgb: Buffer = Buffer.alloc(256 * 128 * 3, 240);
    for (let row: number = 0; row < 128; row++) {
      const y: number = (110 - row - 0.5) * 0.5;
      if (y < 0 || y > 40) continue;
      for (let column: number = 0; column < 256; column++)
        if (Math.abs((column + 0.5 - 128) * 0.5) <= halfWidthMm) {
          const at: number = 3 * (256 * row + column);
          rgb[at] = 30;
          rgb[at + 1] = 80;
          rgb[at + 2] = 130;
        }
    }
    const bytes: Buffer = Buffer.concat([
      Buffer.from("P6\n256 128\n255\n"),
      rgb,
    ]);
    const file: string = `view-${degrees}.ppm`;
    fs.writeFileSync(path.join(source, file), bytes, { flag: "wx" });
    manifest.views.push({
      id: `view.${degrees}`,
      path: file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      camera: {
        type: "horizontal-orthographic",
        calibration: "supplied",
        azimuthRadians: angle,
        pixelPitchMm: 0.5,
        principalPointPx: [128, 110],
      },
    });
  }
  const write: (directory: string, name: string, value: unknown) => string = (
    directory: string,
    name: string,
    value: unknown,
  ): string => {
    const file: string = path.join(directory, name);
    fs.writeFileSync(file, JSON.stringify(value), { flag: "wx" });
    return file;
  };
  const observeInput: string = write(source, "capture.json", manifest),
    observed: string = path.join(source, "observation.json"),
    fitted: string = path.join(source, "fit.json");
  const command: (
    operation: string,
    document: string,
    output: string,
    permissions?: string[],
  ) => void = (
    operation: string,
    document: string,
    output: string,
    permissions: string[] = [],
  ): void => {
    input.run(
      process.execPath,
      [
        ...permissions,
        input.cli,
        "images",
        "--source-epoch",
        input.sourceEpoch,
        operation,
        document,
        output,
        "2000000",
      ],
      input.consumer,
    );
  };
  command("observe", observeInput, observed);
  const observation: { value: unknown } = JSON.parse(
    fs.readFileSync(observed, "utf8"),
  );
  const fitInput: string = write(source, "fit-input.json", {
    observation: observation.value,
    policy: {
      family: "aligned-elliptical-sections",
      maxViews: 4,
      maxRows: 400,
      maxSpans: 4,
      maximumResidualPx: 2,
      minimumDirectionRatio: 0.001,
      minimumSplineRatio: 1e-8,
    },
  });
  command("fit", fitInput, fitted);
  const fit: {
    operation: { status: string };
    value: IAutoMovieRecoveryImageFit;
  } = JSON.parse(fs.readFileSync(fitted, "utf8"));
  const recipeBytes: number = Buffer.byteLength(
    JSON.stringify(fit.value.recipe),
  );
  if (
    fit.operation.status !== "partial" ||
    fit.value.maximumResidualPx > 2 ||
    fit.value.counts.freeScalars !== 16 ||
    recipeBytes > 3000
  )
    throw new Error("The installed image fit changed its physical contract");
  const recipe: string = write(independent, "recipe.json", {
    recipe: fit.value.recipe,
    budget: { tolerance: 0.0001, maxCells: 20_000, maxVertices: 30_000 },
  });
  const generated: string = path.join(independent, "model.json");
  const permissions: string[] = [
    "--permission",
    `--allow-fs-read=${path.join(input.consumer, "node_modules")}`,
    `--allow-fs-read=${independent}`,
    `--allow-fs-write=${independent}`,
  ];
  command("realize", recipe, generated, permissions);
  const probe: string = path.join(independent, "check.cjs");
  fs.writeFileSync(
    probe,
    `const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const {realizeAutoMovieBicubicAtlas64}=require("@automovie/engine/geometry/realizeAutoMovieBicubicAtlas64");
assert.throws(()=>fs.readFileSync(${JSON.stringify(path.join(source, "view-0.ppm"))}),{code:"ERR_ACCESS_DENIED"});
const artifact=JSON.parse(fs.readFileSync(${JSON.stringify(generated)},"utf8"));
assert.equal(artifact.sourceEpoch,${JSON.stringify(input.sourceEpoch)});
assert.equal(artifact.schema,"automovie-recovery-image-artifact-v1");
assert.equal(artifact.operation.status,"partial");
const geometry=artifact.value.model.parts[0].geometry;
assert.equal(geometry.type,"bicubic-atlas");
const result=realizeAutoMovieBicubicAtlas64(geometry);
assert.ok(result.complete&&result.approximationQualified);
assert.ok(result.mesh.positions.length>0&&result.mesh.positions.every(Number.isFinite));
assert.ok(result.mesh.normals&&result.mesh.normals.every(Number.isFinite));
let maximumVertexDefectMm=0;
for(let i=0;i<result.mesh.positions.length;i+=3){
 const x=result.mesh.positions[i]*1000,y=result.mesh.positions[i+1]*1000,z=result.mesh.positions[i+2]*1000;
 assert.ok(y>=.25-1e-9&&y<=39.75+1e-9);
 maximumVertexDefectMm=Math.max(maximumVertexDefectMm,Math.abs(Math.hypot(x/12,z/8)-1)*12);
}
assert.ok(maximumVertexDefectMm<=.5);
for(const file of Object.keys(require.cache))assert.ok(file.startsWith(__dirname+path.sep)||file.startsWith(${JSON.stringify(path.join(input.consumer, "node_modules") + path.sep)}));
console.log(JSON.stringify({vertices:result.mesh.positions.length/3,maximumVertexDefectMm,sourceImagesDenied:true}));
`,
    { flag: "wx" },
  );
  const measured: {
    vertices: number;
    maximumVertexDefectMm: number;
    sourceImagesDenied: true;
  } = JSON.parse(
    input.run(process.execPath, [...permissions, probe], input.consumer),
  );
  return {
    cohort: "analytic",
    cameras: "supplied",
    images: manifest.views.length,
    recipeBytes,
    ...measured,
  };
}

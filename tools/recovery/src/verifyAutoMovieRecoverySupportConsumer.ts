import type { IAutoMovieRecoverySupportFit } from "@automovie/recovery";
import type { IAutoMovieRecoveryImageFiles } from "@automovie/recovery/node";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Verify installed nonelliptical RGB fitting and source-denied generation.
 * Twelve supplied cameras rasterize an independently authored rotated box with
 * cubic dimensions/translation. The final installed process reads only its saved
 * support recipe, then checks new vertices against all analytic training support
 * inequalities and checks its own finite unit normals. This is a packaging and
 * calibrated analytic workflow check, separately from held-out/viewer evidence.
 *
 * @evidence contracts/common.md#principled-implementation Analytic pixel inclusion and fixed byte hashes drive the real installed observe/fit/realize commands. A permission-scoped independent probe checks original-image denial, compactness, coverage, actual mesh normals and known support inequalities.
 * @evidence contracts/common.md#clear-and-simple-design This real-host verifier owns acquisition files and an independent analytic oracle; installed ingest/recovery/engine retain their normal public implementation and exports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source alias, original vertex/normal, source mesh or changed permission gate supplies generation. Supplied-camera analytic success is not promoted to camera estimation or hidden-shape fidelity.
 * @evidence contracts/common.md#meaningful-documentation States the twelve-camera rotated-box fixture, polynomial dimensions, isolated recipe consumer, physical support bound and separate held-out/visual qualification.
 * @evidence contracts/performance.md#efficient-algorithms Twelve fixed 256 by 240 rasters and bounded engine budgets limit acquisition and verification; each byte artifact is acquired once at its required process boundary.
 * @evidence contracts/performance.md#reuse-equivalent-work One installed fit supplies the saved coefficients for the source-denied realization/probe without any acquisition-side regeneration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns exact external scratch and time-bounded synchronous child runners; no browser, GPU, hidden cache or worker remains after the checks settle.
 */
export function verifyAutoMovieRecoverySupportConsumer(input: {
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
  maximumTrainingSupportViolationMm: number;
  sourceImagesDenied: true;
} {
  const acquisition: string = path.join(input.consumer, "support-acquisition");
  const independent: string = path.join(input.consumer, "support-independent");
  fs.mkdirSync(acquisition);
  fs.mkdirSync(independent);
  const manifest: IAutoMovieRecoveryImageFiles = {
    schema: "automovie-recovery-image-files-v1",
    encoding: "ppm-srgb-rgb8-v1",
    maxHeaderBytes: 128,
    capture: {
      schema: "automovie-recovery-images-v1",
      objectId: "packed-rotated-support",
      frame: "supplied-millimetres",
      rigidity: "asserted-fixed",
      cohort: "analytic",
      background: { rgb: [240, 240, 240], threshold: 20 },
      budget: { maxPixels: 800_000, maxViews: 12, maxRows: 2000 },
    },
    views: [],
  };
  for (let view: number = 0; view < 12; view++) {
    const angle: number = (view * Math.PI) / 12;
    const rgb: Buffer = Buffer.alloc(256 * 240 * 3, 240);
    for (let row: number = 0; row < 240; row++) {
      const y: number = (210 - row - 0.5) * 0.25,
        t: number = y / 40;
      if (t < 0 || t > 1) continue;
      const a: number = 12 + 2 * t - t * t + t ** 3,
        b: number = 8 + 3 * t - t ** 3;
      const centre: number =
        (0.5 - t + 0.5 * t * t) * Math.cos(angle) +
        (-0.5 + t - 0.25 * t ** 3) * Math.sin(angle);
      const support: number =
        a * Math.abs(Math.cos(angle - (19 * Math.PI) / 180)) +
        b * Math.abs(Math.sin(angle - (19 * Math.PI) / 180));
      for (let column: number = 0; column < 256; column++)
        if (Math.abs((column + 0.5 - 128) * 0.25 - centre) <= support)
          rgb.set([30, 80, 130], 3 * (row * 256 + column));
    }
    const bytes: Buffer = Buffer.concat([
      Buffer.from("P6\n256 240\n255\n"),
      rgb,
    ]);
    const file: string = `view-${view}.ppm`;
    fs.writeFileSync(path.join(acquisition, file), bytes, { flag: "wx" });
    manifest.views.push({
      id: `view.${view}`,
      path: file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      camera: {
        type: "horizontal-orthographic",
        calibration: "supplied",
        azimuthRadians: angle,
        pixelPitchMm: 0.25,
        principalPointPx: [128, 210],
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
  const observedFile: string = path.join(acquisition, "observed.json"),
    fittedFile: string = path.join(acquisition, "fitted.json");
  command(
    "observe",
    write(acquisition, "capture.json", manifest),
    observedFile,
  );
  const observed: { value: unknown } = JSON.parse(
    fs.readFileSync(observedFile, "utf8"),
  );
  const generation: object = {
    tolerance: 0.00005,
    maxPlanes: 32,
    maxEvents: 128,
    maxCells: 20_000,
    maxVertices: 30_000,
    minimumDirectionSine: 0.0001,
  };
  command(
    "fit",
    write(acquisition, "fit-input.json", {
      observation: observed.value,
      policy: {
        family: "finite-view-convex-support",
        maxViews: 12,
        maxRows: 2000,
        maxSpans: 4,
        maximumResidualPx: 2,
        minimumSplineRatio: 1e-8,
        generation,
      },
    }),
    fittedFile,
  );
  const fitted: {
    operation: { status: string };
    value: IAutoMovieRecoverySupportFit;
  } = JSON.parse(fs.readFileSync(fittedFile, "utf8"));
  const recipeBytes: number = Buffer.byteLength(
    JSON.stringify(fitted.value.recipe),
  );
  if (
    fitted.operation.status !== "partial" ||
    fitted.value.maximumResidualPx > 2 ||
    fitted.value.counts.freeScalars !== 96 ||
    recipeBytes > 12000
  )
    throw new Error(
      "Installed support fit changed its compact physical contract",
    );
  const generated: string = path.join(independent, "model.json");
  const permissions: string[] = [
    "--permission",
    `--allow-fs-read=${path.join(input.consumer, "node_modules")}`,
    `--allow-fs-read=${independent}`,
    `--allow-fs-write=${independent}`,
  ];
  command(
    "realize",
    write(independent, "recipe.json", {
      recipe: fitted.value.recipe,
      budget: generation,
    }),
    generated,
    permissions,
  );
  const probe: string = path.join(independent, "check.cjs");
  fs.writeFileSync(
    probe,
    `const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
assert.throws(()=>fs.readFileSync(${JSON.stringify(path.join(acquisition, "view-0.ppm"))}),{code:"ERR_ACCESS_DENIED"});
const artifact=JSON.parse(fs.readFileSync(${JSON.stringify(generated)},"utf8"));
assert.equal(artifact.sourceEpoch,${JSON.stringify(input.sourceEpoch)});assert.equal(artifact.operation.status,"partial");
assert.equal(artifact.value.model.parts[0].geometry.type,"mesh");
const mesh=artifact.value.model.parts[0].geometry.mesh;
assert.ok(mesh.positions.length&&mesh.positions.every(Number.isFinite)&&mesh.normals.every(Number.isFinite));
let maximumTrainingSupportViolationMm=0;
for(let i=0;i<mesh.positions.length;i+=3){
 const [x,y,z]=mesh.positions.slice(i,i+3).map(v=>v*1000),t=y/40;
 assert.ok(y>=.125-1e-9&&y<=39.875+1e-9);assert.ok(Math.abs(Math.hypot(...mesh.normals.slice(i,i+3))-1)<1e-9);
 for(let view=0;view<12;view++){
  const theta=view*Math.PI/12,a=12+2*t-t*t+t**3,b=8+3*t-t**3;
  const centre=(.5-t+.5*t*t)*Math.cos(theta)+(-.5+t-.25*t**3)*Math.sin(theta);
  const support=a*Math.abs(Math.cos(theta-19*Math.PI/180))+b*Math.abs(Math.sin(theta-19*Math.PI/180));
  maximumTrainingSupportViolationMm=Math.max(maximumTrainingSupportViolationMm,Math.abs(x*Math.cos(theta)+z*Math.sin(theta)-centre)-support);
 }
}
// .5mm fit budget + .125mm pixel-cell uncertainty + .05mm face interpolation, rounded outward to .7mm.
assert.ok(maximumTrainingSupportViolationMm<=.7);
for(const file of Object.keys(require.cache))assert.ok(file.startsWith(__dirname+path.sep)||file.startsWith(${JSON.stringify(path.join(input.consumer, "node_modules") + path.sep)}));
console.log(JSON.stringify({vertices:mesh.positions.length/3,maximumTrainingSupportViolationMm,sourceImagesDenied:true}));
`,
    { flag: "wx" },
  );
  const measured: {
    vertices: number;
    maximumTrainingSupportViolationMm: number;
    sourceImagesDenied: true;
  } = JSON.parse(
    input.run(process.execPath, [...permissions, probe], input.consumer),
  );
  return {
    cohort: "analytic",
    cameras: "supplied",
    images: 12,
    recipeBytes,
    ...measured,
  };
}

import fs from "node:fs";
import path from "node:path";

/**
 * Write the actual external consumer's public declaration calls and strict config.
 * Runtime package checks remain separate; the returned project must be compiled
 * by the installed consumer toolchain with skipLibCheck false and no source alias.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary public imports and calls make the independent installed compiler check all exposed recovery/ingest contracts and their declaration closure under NodeNext resolution. The generated config preserves strict checking without declaration skipping.
 * @evidence contracts/common.md#clear-and-simple-design Declaration fixture ownership is separate from pack/install orchestration because new public camera consumers extend the actual type-check surface without growing the dispatcher beyond its file bound.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source path, declaration substitute, parent dependency, expected file-content assertion or compiler hook supplies the imported public types. This writer does not label an unexecuted compiler pass successful.
 * @evidence contracts/common.md#meaningful-documentation States external ownership, public imported seams, NodeNext/strict checking and the requirement for a subsequent actual compiler run.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size consumer source/config serialization costs O(B) bytes and constant fixture construction work; declaration checking belongs to the actual installed compiler.
 * @evidence contracts/performance.md#reuse-equivalent-work One generated consumer project serves the complete declared package surface instead of a separate install and config per method.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous file writes retain no descriptor or process; the external validation owner retains and retires the exact consumer files after collecting compiler evidence.
 */
export function writeAutoMovieRecoveryConsumerTypes(consumer: string): string {
  fs.writeFileSync(
    path.join(consumer, "consumer-types.mts"),
    `import { observeAutoMovieRecovery, reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { publishAutoMovieRecoveryArtifact } from "@automovie/recovery/node";
import type { IAutoMovieRecoveryInput, IAutoMovieRecoveryImageInput, IAutoMovieRecoveryImageLoft } from "@automovie/interface/recovery";
import { observeAutoMovieRecoveryImages, fitAutoMovieRecoveryImageLoft, compileAutoMovieRecoveryImageLoft } from "@automovie/recovery";
import { decodeAutoMoviePpmImage } from "@automovie/ingest/ppm";
import { fitAutoMovieRecoveryImageSupportLoft, compileAutoMovieRecoverySupportLoft } from "@automovie/recovery";
import type { IAutoMovieRecoveryImageObservation, IAutoMovieRecoverySupportLoft } from "@automovie/interface/recovery";
export function consumeSupport(observation: IAutoMovieRecoveryImageObservation, recipe: IAutoMovieRecoverySupportLoft): void {
 const generation: Parameters<typeof compileAutoMovieRecoverySupportLoft>[1]={tolerance:.00005,maxPlanes:32,maxEvents:128,maxCells:20000,maxVertices:30000,minimumDirectionSine:.0001};
 fitAutoMovieRecoveryImageSupportLoft(observation,{family:"finite-view-convex-support",maxViews:12,maxRows:2000,maxSpans:4,maximumResidualPx:2,minimumSplineRatio:1e-8,generation});
 compileAutoMovieRecoverySupportLoft(recipe,generation);
}
export function consume(input: IAutoMovieRecoveryInput, saved: Parameters<typeof reconstructAutoMovieRecoveryModel>[0]): void {
 const observed: ReturnType<typeof observeAutoMovieRecovery> = observeAutoMovieRecovery(input);
 const generated: ReturnType<typeof reconstructAutoMovieRecoveryModel> = reconstructAutoMovieRecoveryModel(saved);
 if ("value" in observed && "value" in generated) publishAutoMovieRecoveryArtifact("unused.json", {observed:observed.value,model:generated.value.model});
}
export function consumeImages(input: IAutoMovieRecoveryImageInput, recipe: IAutoMovieRecoveryImageLoft, bytes: Uint8Array): void {
 const observed: ReturnType<typeof observeAutoMovieRecoveryImages> = observeAutoMovieRecoveryImages(input);
 if ("value" in observed) fitAutoMovieRecoveryImageLoft(observed.value, {family:"aligned-elliptical-sections",maxViews:4,maxRows:400,maxSpans:4,maximumResidualPx:2,minimumDirectionRatio:.001,minimumSplineRatio:1e-8});
 compileAutoMovieRecoveryImageLoft(recipe,{tolerance:.0001,maxCells:20000,maxVertices:30000});
 decodeAutoMoviePpmImage(bytes,{maxPixels:150000,maxHeaderBytes:128,transfer:"srgb"});
}
`,
  );
  const typeConfig: string = path.join(consumer, "tsconfig.json");
  fs.writeFileSync(
    typeConfig,
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        files: ["consumer-types.mts"],
      },
      null,
      2,
    ),
  );
  fs.appendFileSync(path.join(consumer, "consumer-types.mts"), `
import { estimateAutoMovieRecoveryCameraPair } from "@automovie/recovery";
import type { IAutoMovieRecoveryCameraPairEstimate } from "@automovie/recovery";
import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import type { IAutoMovieRecoveryCameraFiles } from "@automovie/recovery/node";
export function consumeCameras(input: IAutoMovieRecoveryCameraPairInput, manifest: IAutoMovieRecoveryCameraFiles): IAutoMovieRecoveryCameraPairEstimate | null {
 const result: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> = estimateAutoMovieRecoveryCameraPair(input, {onProgress:(phase:string,completed:number,total:number):void=>{void phase;void completed;void total;}});
 const encoding: "ppm-srgb-rgb8-v1" = manifest.encoding; void encoding;
 if ("value" in result) { const artifact: IAutoMovieRecoveryCameraPairEstimate = result.value; if(artifact.pose){const rotation:number[]=artifact.pose.rotation;void rotation;} return artifact; }
 return null;
}
`);
  return typeConfig;
}

import type { IAutoMovieRecoveryCameraFiles } from "@automovie/recovery/node";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Verify installed automatic-camera imports, fixed-byte acquisition and refusal.
 * Singleton constant rasters are deliberately unobservable: completing their
 * observation must preserve evidence without inventing a camera. Independent
 * weak-direction SVD arithmetic also exercises the installed engine owner.
 * This integration check does not establish positive photographic accuracy.
 *
 * @evidence contracts/common.md#principled-implementation Actual tarball-installed public APIs and the installed command dispatcher consume two hashed P6 sources inside a filesystem-permission process. Constant singleton charts independently require zero features and no pose, while an analytic 1e-10 singular direction tests the original-design engine factorization.
 * @evidence contracts/common.md#clear-and-simple-design This publication host owns small analytic fixture bytes and observable integration expectations; all decoding, feature observation, camera fitting and immutable writing remain in their distributed owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The child must fail an explicit repository-source read with ERR_ACCESS_DENIED, resolve public entrypoints to distributed lib files and load no automovie source modules. No source alias, alternate implementation, weakened declaration gate, manual match, camera truth or accepted-pose claim substitutes for real runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation States the analytic negative oracle, actual source-denied publication boundary, mismatch/overwrite failure effects and separate positive photographic qualification.
 * @evidence contracts/performance.md#efficient-algorithms Two singleton P6 sources and fixed metadata keep fixture construction constant-sized; one bounded synchronous child uses the real installed package closure without a separate install or renderer.
 * @evidence contracts/performance.md#reuse-equivalent-work The same installed runtime and fixed fixture drive API, CLI, source-hash mismatch and immutable publication checks; no feature work or package installation is duplicated across independent consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The calling validation owner retains and retires exact external fixture/artifact paths after receipt collection; this helper waits for its bounded child and retains no process, browser, source handle or global cache.
 */
export function verifyAutoMovieRecoveryCameraConsumer(input: {
  repository: string;
  consumer: string;
  sourceEpoch: string;
  run: (command: string, args: string[], cwd: string) => string;
}): {
  cohort: "analytic";
  expectedCamera: "unobservable";
  actualInstalledApi: true;
  publishedLibEntrypoints: true;
  fixedByteCliObservation: true;
  sourceHashMismatchRefused: true;
  immutablePublication: true;
  repositorySourceDenied: true;
  originalDesignWeakDirection: true;
  photographicAccuracy: "not-measured";
} {
  const directory: string = path.join(input.consumer, "camera-acquisition");
  fs.mkdirSync(directory);
  const spec: IAutoMovieRecoveryCameraFiles = {
    schema: "automovie-recovery-camera-files-v1",
    encoding: "ppm-srgb-rgb8-v1",
    maxHeaderBytes: 64,
    capture: {
      schema: "automovie-recovery-camera-pair-v1",
      objectId: "packed-singleton-negative",
      rigidity: "asserted-fixed-scene",
      cohort: "analytic",
      policy: {
        family: "harris-gradient-calibrated-eight-point",
        minimumCornerResponse: 10,
        suppressionRobustness: 0.9,
        descriptorDistanceRatio: 0.7,
        maximumSampsonErrorPx: 2,
        samplingConfidence: 0.999,
        samplingSeed: 17,
        minimumInliers: 16,
        minimumInlierFraction: 0.35,
        maximumMedianErrorPx: 1.5,
        maximumP90ErrorPx: 3,
        minimumPositiveDepthFraction: 0.9,
        minimumParallaxRadians: Math.PI / 180,
        maximumHomographyOverlapFraction: 0.9,
        maximumHomographyTransferPx: 2,
        minimumDesignSingularRatio: 1e-8,
        refinementLossScalePx: 1,
      },
      budget: {
        maxPixels: 2,
        maxCandidates: 5000,
        maxFeatures: 64,
        maxPyramidLevels: 1,
        maxDescriptorPairs: 4096,
        maxRansacTrials: 128,
        minimumRansacTrials: 32,
        maxLocalRefinements: 4,
        maxRefinementIterations: 100,
        maxSingularSweeps: 64,
      },
    },
    views: [],
  };
  for (const id of ["first", "second"]) {
    const bytes: Buffer = Buffer.concat([
      Buffer.from("P6\n1 1\n255\n"),
      Buffer.from([37, 37, 37]),
    ]);
    const file: string = id + ".ppm";
    fs.writeFileSync(path.join(directory, file), bytes, { flag: "wx" });
    spec.views.push({
      id,
      path: file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      pixelProvenance:
        "analytic constant singleton in unchanged integer-pixel-centre chart",
      camera: {
        type: "pinhole",
        calibration: "supplied-intrinsics",
        distortion: "caller-corrected",
        focalPx: [300, 310],
        skewPx: 0,
        principalPointPx: [0, 0],
        uncertaintyPx: null,
      },
    });
  }
  fs.writeFileSync(path.join(directory, "capture.json"), JSON.stringify(spec), {
    flag: "wx",
  });
  const probe: string = path.join(
    input.repository,
    "packages",
    "recovery",
    "src",
    "estimateAutoMovieRecoveryCameraPair.ts",
  );
  const script: string = `
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const recovery=require("@automovie/recovery"),host=require("@automovie/recovery/node"),engine=require("@automovie/engine");
(async()=>{
 const entrypoints=[["@automovie/recovery","@automovie/recovery","lib/index.js"],["@automovie/recovery/node","@automovie/recovery","lib/node/index.js"],["@automovie/engine","@automovie/engine","lib/index.js"],["@automovie/ingest/ppm","@automovie/ingest","lib/decodeAutoMoviePpmImage.js"]];
 for(const [entry,owner,expected] of entrypoints){const root=path.dirname(require.resolve(owner+"/package.json"));assert.equal(path.relative(root,require.resolve(entry)).split(path.sep).join("/"),expected,"Public entrypoint did not resolve to distributed lib: "+entry);}
 const directory=path.join(__dirname,"camera-acquisition"),manifest=path.join(directory,"capture.json"),output=path.join(directory,"camera.json");
 const spec=JSON.parse(fs.readFileSync(manifest,"utf8"));
 const resident={...spec.capture,views:spec.views.map(view=>({id:view.id,sourceSha256:view.sha256,pixelProvenance:view.pixelProvenance,width:1,height:1,rgb8:new Uint8Array([37,37,37]),camera:view.camera}))};
 const observed=recovery.estimateAutoMovieRecoveryCameraPair(resident);
 assert.equal(observed.status,"partial");assert.equal(observed.value.status,"refused");assert.equal(observed.value.pose,null);
 assert.equal(observed.value.matches.length,0);assert.ok(observed.value.refusalReasons.includes("insufficient-appearance-matches"));
 let denied=false;try{fs.readFileSync(${JSON.stringify(probe)});}catch(error){denied=error.code==="ERR_ACCESS_DENIED";}assert.ok(denied,"Repository source read was not denied");
 const weak=engine.decomposeAutoMovieSingularMatrix([[1,1],[1e-10,0],[0,1e-10]],{maxEntries:9,maxSweeps:64,orthogonalityTolerance:1e-12});
 assert.ok(Math.abs(weak.singularValues[0]/Math.sqrt(2)-1)<1e-12);assert.ok(Math.abs(weak.singularValues[1]/1e-10-1)<1e-10);
 const command=(source,target)=>["cameras","--source-epoch",${JSON.stringify(input.sourceEpoch)},"estimate",source,target,"16384"];
 assert.equal(await host.runAutoMovieRecoveryCommand(command(manifest,output)),0);
 const before=fs.readFileSync(output),artifact=JSON.parse(before.toString("utf8"));
 assert.equal(artifact.schema,"automovie-recovery-camera-artifact-v1");assert.equal(artifact.sourceEpoch,${JSON.stringify(input.sourceEpoch)});
 assert.equal(artifact.operation.operator,"calibrated-image-pair-v1");assert.equal(artifact.operation.status,"partial");
 assert.equal(artifact.value.status,"refused");assert.equal(artifact.value.pose,null);assert.equal(artifact.value.matches.length,0);
 assert.equal(artifact.value.sources[0].sourceSha256,spec.views[0].sha256);
 assert.equal(await host.runAutoMovieRecoveryCommand(command(manifest,output)),1);assert.ok(before.equals(fs.readFileSync(output)));
 const bad=structuredClone(spec);bad.views[0].sha256="0".repeat(64);const badManifest=path.join(directory,"mismatch.json"),badOutput=path.join(directory,"must-not-exist.json");
 fs.writeFileSync(badManifest,JSON.stringify(bad),{flag:"wx"});assert.equal(await host.runAutoMovieRecoveryCommand(command(badManifest,badOutput)),1);assert.ok(!fs.existsSync(badOutput));
 for(const file of Object.keys(require.cache)){assert.ok(file.startsWith(__dirname+path.sep),"Foreign source escaped installed closure: "+file);assert.ok(!file.split(path.sep).join("/").split("/node_modules/@automovie/").slice(1).some(suffix=>suffix.split("/")[1]==="src"),"Source module replaced a distributed lib: "+file);}
 console.log(JSON.stringify({cohort:"analytic",expectedCamera:"unobservable",actualInstalledApi:true,publishedLibEntrypoints:true,fixedByteCliObservation:true,sourceHashMismatchRefused:true,immutablePublication:true,repositorySourceDenied:denied,originalDesignWeakDirection:true,photographicAccuracy:"not-measured"}));
})().catch(error=>{console.error(error);process.exitCode=1});
`;
  const file: string = path.join(input.consumer, "camera-consumer.cjs");
  fs.writeFileSync(file, script, { flag: "wx" });
  const output: string = input.run(
    process.execPath,
    [
      "--permission",
      `--allow-fs-read=${input.consumer}`,
      `--allow-fs-write=${directory}`,
      file,
    ],
    input.consumer,
  );
  return JSON.parse(output.trim()) as ReturnType<
    typeof verifyAutoMovieRecoveryCameraConsumer
  >;
}

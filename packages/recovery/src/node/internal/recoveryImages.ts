import { decodeAutoMoviePpmImage } from "@automovie/ingest";
import type {
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageObservation,
} from "@automovie/interface/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import { compileAutoMovieRecoveryImageLoft } from "../../compileAutoMovieRecoveryImageLoft";
import { fitAutoMovieRecoveryImageLoft } from "../../fitAutoMovieRecoveryImageLoft";
import { observeAutoMovieRecoveryImages } from "../../observeAutoMovieRecoveryImages";
import type { IAutoMovieRecoveryImageFiles } from "../IAutoMovieRecoveryImageFiles";
import { readAutoMovieRecoveryBoundedFile } from "./readAutoMovieRecoveryBoundedFile";
import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

/**
 * Run fixed-image observation, qualified fitting or recipe-only compilation.
 * Every command requires input, a new immutable output path and maxInputBytes.
 * observe consumes the versioned P6 sRGB manifest; fit consumes {observation,
 * policy}; realize consumes {recipe,budget}. Fit outputs keep dense observation
 * evidence separate from recipe coefficients. Realize reads only its supplied
 * recipe document; no source path or acquisition cache is consulted.
 *
 * @evidence contracts/common.md#principled-implementation Bounded complete-byte acquisition and SHA-256 image verification precede deterministic P6 decoding and public resident operations. Independent commands expose the observation-to-recipe-to-source-free-model boundaries.
 * @evidence contracts/common.md#clear-and-simple-design This Node host owns explicit paths, codec dispatch, provenance and immutable publication while recovery library operations own observation/fitting and the engine owns geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory scan, unknown-format fallback, unverified image bytes, source mesh, trained estimator, changed budget or output overwrite is used; a refused operation publishes nothing.
 * @evidence contracts/common.md#meaningful-documentation States command schemas, explicit per-file byte bound, raw P6 colour convention, separate evidence/recipe files, source epoch and recipe-only consumption.
 * @evidence contracts/performance.md#efficient-algorithms Reading and hashing are O(B) in admitted bytes, RGB copies O(P) in bounded pixels, and serialization O(O) in output size. Delegated observation/fitting costs retain their declared budgets; image sources are acquired once and aggregate pixels are checked before accumulating decoded arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One command invokes one public operation and publishes its completed value once; exact source hashes and operation/version/source-epoch provenance identify that effect without a hidden resume cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded reads close descriptors synchronously. Decoded arrays grow only to the manifest pixel/view budget, expire after observation and never enter recipe-only compilation; the atomic writer owns and cleans its staging file.
 */
export function recoveryImages(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    !inputPath ||
    !outputPath ||
    args.length !== 4 ||
    !["observe", "fit", "realize"].includes(command) ||
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes <= 0
  )
    throw new Error(
      "Usage: images observe|fit|realize input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readAutoMovieRecoveryBoundedFile(
    inputPath,
    maxInputBytes,
  );
  const inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const document: unknown = JSON.parse(bytes.toString("utf8"));
  const started: number = performance.now();
  let outcome:
    | ReturnType<typeof observeAutoMovieRecoveryImages>
    | ReturnType<typeof fitAutoMovieRecoveryImageLoft>
    | ReturnType<typeof compileAutoMovieRecoveryImageLoft>;
  if (command === "observe") {
    const spec: IAutoMovieRecoveryImageFiles =
      document as IAutoMovieRecoveryImageFiles;
    if (
      !spec ||
      spec.schema !== "automovie-recovery-image-files-v1" ||
      spec.encoding !== "ppm-srgb-rgb8-v1" ||
      !spec.capture?.budget ||
      !Number.isSafeInteger(spec.capture.budget.maxViews) ||
      spec.capture.budget.maxViews < 3 ||
      !Number.isSafeInteger(spec.capture.budget.maxPixels) ||
      spec.capture.budget.maxPixels < 1 ||
      !Number.isSafeInteger(spec.maxHeaderBytes) ||
      spec.maxHeaderBytes < 1 ||
      !Array.isArray(spec.views) ||
      spec.views.length < 3 ||
      spec.views.length > spec.capture.budget.maxViews
    )
      throw new Error(
        "A versioned P6 sRGB manifest with known charts and finite image budgets is required",
      );
    const views: IAutoMovieRecoveryImageInput["views"] = [];
    let pixels: number = 0;
    for (let index: number = 0; index < spec.views.length; index++) {
      const view: IAutoMovieRecoveryImageFiles["views"][number] =
        spec.views[index];
      if (
        !view ||
        typeof view.path !== "string" ||
        !view.path ||
        typeof view.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/i.test(view.sha256)
      )
        throw new Error("Every image needs an explicit path and SHA-256");
      const image: Buffer = readAutoMovieRecoveryBoundedFile(
        path.resolve(path.dirname(inputPath), view.path),
        maxInputBytes,
      );
      if (
        createHash("sha256").update(image).digest("hex") !==
        view.sha256.toLowerCase()
      )
        throw new Error(`Fixed image hash mismatch: ${view.id}`);
      const decoded: ReturnType<typeof decodeAutoMoviePpmImage> =
        decodeAutoMoviePpmImage(image, {
          maxPixels: spec.capture.budget.maxPixels - pixels,
          maxHeaderBytes: spec.maxHeaderBytes,
          transfer: "srgb",
        });
      pixels += decoded.width * decoded.height;
      views.push({
        id: view.id,
        sourceSha256: view.sha256.toLowerCase(),
        pixelProvenance:
          "fixed P6 sRGB RGB8 bytes; top-to-bottom rows; no orientation, crop, resize or rectification applied",
        width: decoded.width,
        height: decoded.height,
        rgb8: decoded.rgb8,
        camera: view.camera,
      });
    }
    outcome = observeAutoMovieRecoveryImages({ ...spec.capture, views });
  } else if (command === "fit") {
    const spec: {
      observation: IAutoMovieRecoveryImageObservation;
      policy: Parameters<typeof fitAutoMovieRecoveryImageLoft>[1];
    } = document as {
      observation: IAutoMovieRecoveryImageObservation;
      policy: Parameters<typeof fitAutoMovieRecoveryImageLoft>[1];
    };
    outcome = fitAutoMovieRecoveryImageLoft(spec?.observation, spec?.policy);
  } else {
    const spec: {
      recipe: IAutoMovieRecoveryImageLoft;
      budget: Parameters<typeof compileAutoMovieRecoveryImageLoft>[1];
    } = document as {
      recipe: IAutoMovieRecoveryImageLoft;
      budget: Parameters<typeof compileAutoMovieRecoveryImageLoft>[1];
    };
    outcome = compileAutoMovieRecoveryImageLoft(spec?.recipe, spec?.budget);
  }
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeAutoMovieRecoveryArtifact(outputPath, {
    schema: "automovie-recovery-image-artifact-v1",
    command,
    sourceEpoch,
    inputSha256,
    operation: {
      schema: outcome.schema,
      operator: outcome.operator,
      status: outcome.status,
      diagnostics: outcome.diagnostics,
    },
    value: outcome.value,
    elapsedMs: performance.now() - started,
  });
}

import { AutoMovieIngestPpmImage } from "@automovie/ingest";
import type {
  IAutoMovieRecoveryImageFit,
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoveryImageFiles,
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageLoftBudget,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryImageRealization,
  IAutoMovieRecoveryImageRecipe,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportFit,
  IAutoMovieRecoverySupportFitPolicy,
  IAutoMovieRecoverySupportLoftBudget,
  IAutoMovieRecoverySupportRealization,
} from "@automovie/interface";
import {
  AutoMovieRecoveryCompilation,
  AutoMovieRecoveryFitting,
  AutoMovieRecoveryObservation,
} from "@automovie/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import { writeRecoveryArtifact } from "../artifact/writeRecoveryArtifact";
import { readRecoveryBoundedFile } from "./readRecoveryBoundedFile";

/*
 * Run fixed-image observation, qualified fitting or recipe-only compilation.
 * Every command requires input, a new immutable output path and maxInputBytes.
 * observe consumes the P6 sRGB manifest; fit consumes {observation, policy};
 * realize consumes {recipe,budget}. Fit outputs keep dense observation evidence
 * separate from recipe coefficients. Realize reads only its supplied recipe
 * document; no source path or acquisition cache is consulted.
 */
export function recoveryImages(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    !inputPath ||
    !outputPath ||
    args.length !== 4 ||
    !["observe", "fit", "realize"].includes(command) ||
    maxInputBytes <= 0
  )
    throw new Error(
      "Usage: images observe|fit|realize input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readRecoveryBoundedFile(
    inputPath,
    maxInputBytes,
  );
  const inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const document: unknown = JSON.parse(bytes.toString("utf8"));
  const started: number = performance.now();
  let outcome:
    | ReturnType<typeof AutoMovieRecoveryObservation.observeImages>
    | IAutoMovieRecoveryResult<IAutoMovieRecoveryImageFit>
    | IAutoMovieRecoveryResult<IAutoMovieRecoveryImageRealization>
    | IAutoMovieRecoveryResult<IAutoMovieRecoverySupportFit>
    | IAutoMovieRecoveryResult<IAutoMovieRecoverySupportRealization>;
  if (command === "observe") {
    const spec: IAutoMovieRecoveryImageFiles =
      document as IAutoMovieRecoveryImageFiles;
    if (
      !spec ||
      spec.encoding !== "ppm-srgb-rgb8" ||
      !spec.capture?.budget ||
      spec.capture.budget.maxViews < 3 ||
      spec.capture.budget.maxPixels < 1 ||
      spec.maxHeaderBytes < 1 ||
      !Array.isArray(spec.views) ||
      spec.views.length < 3 ||
      spec.views.length > spec.capture.budget.maxViews
    )
      throw new Error(
        "A P6 sRGB manifest with known charts and finite image budgets is required",
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
      const image: Buffer = readRecoveryBoundedFile(
        path.resolve(path.dirname(inputPath), view.path),
        maxInputBytes,
      );
      if (
        createHash("sha256").update(image).digest("hex") !==
        view.sha256.toLowerCase()
      )
        throw new Error(`Fixed image hash mismatch: ${view.id}`);
      const decoded: ReturnType<typeof AutoMovieIngestPpmImage.decode> =
        AutoMovieIngestPpmImage.decode(image, {
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
    outcome = AutoMovieRecoveryObservation.observeImages({ ...spec.capture, views });
  } else if (command === "fit") {
    const spec: {
      observation: IAutoMovieRecoveryImageObservation;
      policy:
        | IAutoMovieRecoveryImageFitPolicy
        | IAutoMovieRecoverySupportFitPolicy;
    } = document as {
      observation: IAutoMovieRecoveryImageObservation;
      policy:
        | IAutoMovieRecoveryImageFitPolicy
        | IAutoMovieRecoverySupportFitPolicy;
    };
    outcome =
      spec?.policy?.family === "finite-view-convex-support"
        ? AutoMovieRecoveryFitting.fitSupportLoft(spec.observation, spec.policy)
        : AutoMovieRecoveryFitting.fitImageLoft(spec?.observation, spec?.policy);
  } else {
    const spec: {
      recipe: IAutoMovieRecoveryImageRecipe;
      budget:
        | IAutoMovieRecoveryImageLoftBudget
        | IAutoMovieRecoverySupportLoftBudget;
    } = document as {
      recipe: IAutoMovieRecoveryImageRecipe;
      budget:
        | IAutoMovieRecoveryImageLoftBudget
        | IAutoMovieRecoverySupportLoftBudget;
    };
    outcome =
      spec?.recipe?.family === "finite-view-convex-support"
        ? AutoMovieRecoveryCompilation.compileSupportLoft(
            spec.recipe,
            spec.budget as IAutoMovieRecoverySupportLoftBudget,
          )
        : AutoMovieRecoveryCompilation.compileImageLoft(
            spec?.recipe,
            spec?.budget,
          );
  }
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeRecoveryArtifact(outputPath, {
    command,
    sourceEpoch,
    inputSha256,
    operation: {
      operator: outcome.operator,
      status: outcome.status,
      diagnostics: outcome.diagnostics,
    },
    value: outcome.value,
    elapsedMs: performance.now() - started,
  });
}

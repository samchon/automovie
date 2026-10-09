import { autoMovieRenderDigest } from "@automovie/engine";
import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import typia from "typia";
import type { IHumanBodyLayerThicknessReceipt } from "../human-source/body-layer/IHumanBodyLayerThicknessReceipt.ts";

import type { IRegisterHumanBodySkinLayersProps } from "./IRegisterHumanBodySkinLayersProps";

/**
 * Register a field produced from the actual derived body's native view.
 *
 * This normal production step writes its candidate view before invoking the
 * maintained TypeScript producer through its normal ttsx entry. It consumes the exact generated field and keeps
 * the producer's original receipt; no basis string or scalar is retargeted.
 * The body's identity already includes this producer's recipe digest. Adding
 * the field retains every original skin, shape, weight, rig and material row.
 * Its registered native shell replaces the independent static subcutaneous
 * surface. The retired source payload remains in this epoch's receipt;
 * visceral adipose and every other static member remain unchanged. This
 * ownership transfer does not admit the field's offset or tissue quality.
 * Failed processes and registration observations remain in this fresh epoch.
 */
export function registerHumanBodySkinLayers(props: IRegisterHumanBodySkinLayersProps): void {
  const hash = (bytes: string | Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
  const before = JSON.stringify(props.candidate);
  const assembly = props.candidate.anatomicalAssembly;
  if (props.candidate.surfaces.length !== 1 || props.candidate.surfaces[0].layerThickness !== undefined)
    throw new Error("Native layer registration needs one unregistered connected skin surface.");
  if (assembly === undefined || assembly.nativeSubcutaneous !== undefined)
    throw new Error("Native subcutaneous registration needs an unregistered anatomical source owner.");
  const originalParts = assembly.parts;
  const originalGeneration = assembly.generation;
  const originalRig = assembly.rig;
  const retired = originalParts.find((part) => part.id === "subcutaneousAdipose");
  if (retired !== undefined)
    fs.writeFileSync(path.join(props.output, "retired-subcutaneous-source.json"), JSON.stringify(retired));
  const viewBytes = gzipSync(JSON.stringify({ ...props.body, body: props.candidate }));
  const viewFile = path.join(props.output, "layer-native-input.body.json.gz");
  fs.writeFileSync(viewFile, viewBytes);
  const fieldOutput = path.join(props.output, "native-field");
  const ttscPackage = require.resolve("ttsc/package.json");
  const bin: unknown = JSON.parse(fs.readFileSync(ttscPackage, "utf8")).bin;
  if (bin === null || typeof bin !== "object" || !("ttsx" in bin) || typeof bin.ttsx !== "string")
    throw new Error("Native thickness production needs the installed normal ttsx entry.");
  const launcher = path.resolve(path.dirname(ttscPackage), bin.ttsx);
  const project = path.resolve(__dirname, "../..");
  const result = spawnSync(process.execPath, [launcher, "-P", path.join(path.dirname(props.producer), "tsconfig.json"), props.producer, viewFile, fieldOutput], {
    cwd: project, windowsHide: true, encoding: "utf8",
  });
  fs.writeFileSync(path.join(props.output, "layer-producer.stdout.log"), result.stdout ?? "");
  fs.writeFileSync(path.join(props.output, "layer-producer.stderr.log"), result.stderr ?? "");
  fs.writeFileSync(path.join(props.output, "layer-producer-execution.json"), JSON.stringify({
    pid: result.pid, actualExit: result.status, signal: result.signal,
    error: result.error?.message, producer: props.producer,
  }, null, 2));
  if (result.error !== undefined || result.status !== 0)
    throw new Error("Native thickness producer failed; original output and exit are retained.");
  const fieldBytes = fs.readFileSync(path.join(fieldOutput, "layer-thickness-field.json"));
  const field = typia.assertEquals<IAutoMovieHumanBodyLayerThicknessField>(JSON.parse(fieldBytes.toString("utf8")));
  const receiptBytes = fs.readFileSync(path.join(fieldOutput, "layer-thickness-receipt.json"));
  const receipt = typia.assertEquals<IHumanBodyLayerThicknessReceipt>(JSON.parse(receiptBytes.toString("utf8")));
  const repository = path.resolve(__dirname, "../../..");
  const expectedRecipes: Record<string, string> = {};
  for (const file of [
    "author-body-layer-thickness.ts", "authorHumanBodyLayerThicknessField.ts",
    "IHumanBodyLayerThicknessReceipt.ts", "readHumanBodyLayerThicknessAnchors.ts",
  ]) {
    const absolute = path.join(path.dirname(props.producer), file);
    expectedRecipes[path.relative(repository, absolute).replaceAll("\\", "/")] = hash(fs.readFileSync(absolute));
  }
  if (Object.keys(receipt.recipes).length !== Object.keys(expectedRecipes).length ||
      Object.entries(expectedRecipes).some(([file, digest]) => receipt.recipes[file] !== digest) ||
      receipt.bodyViewSha256 !== hash(viewBytes) ||
      hash(fs.readFileSync(viewFile)) !== hash(viewBytes) ||
      receipt.fieldSha256 !== hash(fieldBytes) ||
      receipt.producerSha256 !== hash(fs.readFileSync(props.producer)) ||
      receipt.basis !== props.candidate.id || field.basis !== props.candidate.id ||
      receipt.vertices !== props.candidate.surfaces[0].positions.length / 3)
    throw new Error("Native layer receipt does not bind the actual view, field, producer and basis.");
  props.candidate.surfaces = props.candidate.surfaces.map((surface) => ({ ...surface, layerThickness: field }));
  assembly.parts = originalParts.filter((part) => part.id !== "subcutaneousAdipose");
  assembly.nativeSubcutaneous = {
    id: "subcutaneousAdipose",
    tissue: "adipose",
    surface: props.candidate.surfaces[0].id,
    fieldDigest: autoMovieRenderDigest(JSON.stringify(field)),
    fieldFileUri: path.relative(path.resolve(__dirname, "../../.."), path.join(fieldOutput, "layer-thickness-field.json")).replaceAll("\\", "/"),
    fieldFileSha256: hash(fieldBytes),
    producerSha256: hash(fs.readFileSync(props.producer)),
    inputViewSha256: hash(viewBytes),
    receiptSha256: hash(receiptBytes),
    bindingAccount: "The native field addresses this skin's own vertex ordinals. Final dermal, fascial and rim members are generated once from the evaluated exterior; no acquired atlas bone binding or copied inner-sheet correspondence is claimed.",
    qualification: field.qualification,
  };
  assembly.generation = "native-subcutaneous-" + hash(JSON.stringify({
    parentGeneration: originalGeneration,
    fieldDigest: assembly.nativeSubcutaneous.fieldDigest,
    registrationRecipeSha256: hash(fs.readFileSync(path.resolve(__dirname, "registerHumanBodySkinLayers.ts"))),
  }));
  assembly.rig = { ...originalRig, generation: assembly.generation };
  const restored = { ...props.candidate, anatomicalAssembly: {
    ...assembly, generation: originalGeneration, rig: originalRig,
    parts: originalParts, nativeSubcutaneous: undefined,
  }, surfaces: props.candidate.surfaces.map((surface) => {
    const copy = { ...surface };
    delete copy.layerThickness;
    return copy;
  }) };
  if (JSON.stringify(restored) !== before)
    throw new Error("Native layer registration changed original body geometry or rig.");
  fs.writeFileSync(path.join(props.output, "layer-registration.json"), JSON.stringify({
    basis: props.candidate.id, surface: props.candidate.surfaces[0].id,
    inputViewSha256: hash(viewBytes), fieldSha256: hash(fieldBytes),
    producerSha256: hash(fs.readFileSync(props.producer)), receiptSha256: hash(receiptBytes),
    parentAssemblyGeneration: originalGeneration,
    registeredAssemblyGeneration: assembly.generation,
    numericalRigUnchanged: JSON.stringify({ ...assembly.rig, generation: originalGeneration }) === JSON.stringify(originalRig),
    nativeSubcutaneous: assembly.nativeSubcutaneous,
    retiredSubcutaneous: retired === undefined ? undefined : {
      file: "retired-subcutaneous-source.json",
      partSha256: hash(JSON.stringify(retired)),
      originalSources: retired.surfaces.map((surface) => surface.source),
      meaning: "Historical static compartment replaced by the registered final-exterior native shell; original source bytes are retained, not erased or requalified.",
    },
    nativeSkinUnchanged: true, fieldQualification: field.qualification,
    meaning: "Actual native field registration only; construction, embedding and clinical acceptance are separate",
  }, null, 2));
}

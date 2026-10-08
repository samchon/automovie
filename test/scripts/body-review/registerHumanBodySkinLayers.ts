import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import typia from "typia";

import type { IRegisterHumanBodySkinLayersProps } from "./IRegisterHumanBodySkinLayersProps";

/**
 * Register a field produced from the actual derived body's native view.
 *
 * This normal production step writes its candidate view before invoking the
 * maintained Python producer. It consumes the exact generated field and keeps
 * the producer's original receipt; no basis string or scalar is retargeted.
 * The body's identity already includes this producer's recipe digest. Adding
 * the field retains every original skin, shape, weight, rig and material row.
 * Failed processes and registration observations remain in this fresh epoch.
 */
export function registerHumanBodySkinLayers(props: IRegisterHumanBodySkinLayersProps): void {
  const hash = (bytes: string | Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
  const before = JSON.stringify(props.candidate);
  if (props.candidate.surfaces.length !== 1 || props.candidate.surfaces[0].layerThickness !== undefined)
    throw new Error("Native layer registration needs one unregistered connected skin surface.");
  const viewBytes = gzipSync(JSON.stringify({ ...props.body, body: props.candidate }));
  const viewFile = path.join(props.output, "layer-native-input.body.json.gz");
  fs.writeFileSync(viewFile, viewBytes);
  const fieldOutput = path.join(props.output, "native-field");
  const result = spawnSync("python", [props.producer, viewFile, fieldOutput], { windowsHide: true, encoding: "utf8" });
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
  const receipt: unknown = JSON.parse(receiptBytes.toString("utf8"));
  if (receipt === null || typeof receipt !== "object" ||
      !("bodyViewSha256" in receipt) || receipt.bodyViewSha256 !== hash(viewBytes) ||
      hash(fs.readFileSync(viewFile)) !== hash(viewBytes) ||
      !("fieldSha256" in receipt) || receipt.fieldSha256 !== hash(fieldBytes) ||
      !("producerSha256" in receipt) || receipt.producerSha256 !== hash(fs.readFileSync(props.producer)) ||
      !("basis" in receipt) || receipt.basis !== props.candidate.id || field.basis !== props.candidate.id ||
      !("vertices" in receipt) || receipt.vertices !== props.candidate.surfaces[0].positions.length / 3)
    throw new Error("Native layer receipt does not bind the actual view, field, producer and basis.");
  props.candidate.surfaces = props.candidate.surfaces.map((surface) => ({ ...surface, layerThickness: field }));
  const restored = { ...props.candidate, surfaces: props.candidate.surfaces.map((surface) => {
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
    sourceGeometryAndRigUnchanged: true, fieldQualification: field.qualification,
    meaning: "Actual native field registration only; construction, embedding and clinical acceptance are separate",
  }, null, 2));
}

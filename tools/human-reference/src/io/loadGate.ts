import type { Mesh } from "../geometry/Mesh.ts";
import type { ReferenceManifest } from "./ReferenceManifest.ts";
import { loadMesh } from "./loadMesh.ts";

/**
 * Loads declared body and head inputs, with an optional explicitly declared diagnostic body pose.
 *
 * @evidence contracts/common.md#principled-implementation Reads the explicit body, head and optional bodyT identities through loadMesh; only the diagnostic body selects declared posed rig matrices.
 * @evidence contracts/common.md#clear-and-simple-design Owns the three input roles without discovering files, converting frames or interpreting anatomy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required body or head inputs throw through the manifest reader; no calibration-specific paths or substitute meshes are used.
 * @evidence contracts/common.md#meaningful-documentation States source roles and that the diagnostic body is optional and explicitly declared.
 * @evidence contracts/performance.md#efficient-algorithms Loads each selected document once; time and memory are the sums of loadMesh costs over two or three inputs.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-call mesh cache is retained; every selected input is verified for this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Loaded objects transfer to the caller; synchronous reader handles close at their owners and no module resources persist.
 */
export function loadGate(manifest: ReferenceManifest): {
  gate: string;
  body: Mesh;
  head: Mesh;
  bodyT?: Mesh;
} {
  return {
    gate: manifest.gate,
    body: loadMesh(manifest, "body"),
    head: loadMesh(manifest, "head"),
    bodyT: manifest.files.bodyT ? loadMesh(manifest, "bodyT", true) : undefined,
  };
}

/**
 * Export every published study document at rest, hair included, through the
 * actual connected runtime, for `capture-articulation.mjs` to render on a
 * real GPU. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/export-subject-views.ts STUDY OUTPUT [id,id,...]
 *
 * Each subject is written as `<id>__rest.json` in the model format the
 * capture page reads, vertex colours included, and `views.json` records
 * each subject's build time, its hair triangle count and the crossing pairs
 * of the built model, so a render is read beside what it cost and what it
 * crossed. The documents are the published ones, unchanged: the views are
 * what the editor produces from their parameters, not a separate asset.
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/connectedRuntime";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [studyDirectory, output, filter] = process.argv.slice(2);
if (studyDirectory === undefined || output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply the study directory, a new output directory and an optional subject filter.",
  );
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(studyDirectory, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const subjects = JSON.parse(
  fs.readFileSync(path.join(studyDirectory, "subjects.json"), "utf8"),
) as IAutoMovieHumanFaceBasisDocument[];
const wanted = filter === undefined ? null : new Set(filter.split(","));
const runtime = createConnectedFaceRuntime({ basis });
fs.mkdirSync(output, { recursive: true });
void (async () => {
  const records: Record<string, unknown>[] = [];
  for (const document of subjects) {
    const id = document.id.replace(/-connected$/u, "");
    if (wanted !== null && !wanted.has(id)) continue;
    const started = Date.now();
    const result = await runtime({
      document: JSON.stringify(document),
      operation: "preview",
    });
    const seconds = (Date.now() - started) / 1000;
    if (result.operation !== "preview") throw new Error("Expected a preview.");
    const model = result.model;
    const hairTriangles = model.parts
      .filter((part) => part.id.startsWith("numerical-hair:"))
      .reduce(
        (total, part) =>
          total +
          (part.geometry.type === "mesh"
            ? (part.geometry.mesh.indices?.length ?? 0) / 3
            : 0),
        0,
      );
    const crossings = measureAutoMovieModelCrossings(model).map((crossing) => ({
      pair: [crossing.part, crossing.other],
      triangles: [crossing.triangles, crossing.otherTriangles],
    }));
    fs.writeFileSync(
      path.join(output, `${id}__rest.json`),
      JSON.stringify({
        id,
        parts: model.parts.map((part) => ({
          id: part.id,
          material: part.material,
          mesh:
            part.geometry.type === "mesh"
              ? {
                  positions: part.geometry.mesh.positions,
                  normals: part.geometry.mesh.normals,
                  indices: part.geometry.mesh.indices,
                  uvs: part.geometry.mesh.uvs,
                  colors: part.geometry.mesh.colors ?? null,
                }
              : null,
        })),
        materials: model.materials.map((material) => ({
          id: material.id,
          baseColor: material.baseColor,
          roughness: material.roughness,
          texture:
            typeof material.baseColorTexture === "string"
              ? material.baseColorTexture
              : null,
        })),
      }),
    );
    records.push({ subject: id, seconds, hairTriangles, crossings });
    console.log(id, `${seconds} s`, `${hairTriangles} hair triangles`);
  }
  fs.writeFileSync(
    path.join(output, "views.json"),
    JSON.stringify({ basis: basis.id, records }, null, 2) + "\n",
  );
})();

/**
 * Export a declared census of articulated states through the actual connected
 * runtime, with the engine's triangle-crossing census on each state. Run from
 * the test package with ttsx -P tsconfig.scripts.json and three arguments: the
 * study directory holding `basis.json.gz` and `subjects.json`, a new output
 * directory, and an optional comma-separated subject filter (document ids
 * without their `-connected` suffix; `neutral` names the bald source neutral).
 *
 * Every state is a document the editor could hold: the study document's own
 * shape, its hair removed so the head reads, with the expression replaced by
 * the state's. The states are the coupled cases the articulation exists for:
 * rest, half and full opening, opening with closure, tongue out with and
 * without opening, protrusion, laterotrusion, conjugate gaze and blink.
 * `capture-articulation.mjs` renders the written `model.json` files on a real
 * GPU; `census.json` records the crossing pairs of every state so a render is
 * read beside its numbers. A state the builder refuses is recorded as a
 * refusal with its message, never skipped silently. Counts are strict
 * triangle crossings between parts; they measure incidence, not depth, and are
 * not an anatomical acceptance score.
 */
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/connectedRuntime";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [studyDirectory, output, filter] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, a new output directory and an optional subject filter.",
  );
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(
    fs.readFileSync(path.join(studyDirectory, "basis.json.gz")),
  ).toString("utf8"),
);
const subjects: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(path.join(studyDirectory, "subjects.json"), "utf8"),
);
const wanted = filter === undefined ? null : new Set(filter.split(","));
const documents: IAutoMovieHumanFaceBasisDocument[] = [
  {
    id: "neutral",
    name: "neutral",
    basis: basis.id,
    shape: {},
    expression: {},
  },
  ...subjects.map((document) => ({
    ...document,
    id: document.id.replace(/-connected$/u, ""),
    hair: null,
  })),
].filter((document) => wanted === null || wanted.has(document.id));
const states: Record<string, Record<string, number>> = {
  rest: {},
  "open-half": { jawOpen: 0.5 },
  "open-full": { jawOpen: 1 },
  "open-close": { jawOpen: 1, mouthClose: 1 },
  "tongue-closed": { tongueOut: 1 },
  "tongue-open": { tongueOut: 1, jawOpen: 1 },
  forward: { jawForward: 1 },
  "open-forward": { jawOpen: 1, jawForward: 0.3 },
  left: { jawLeft: 1 },
  "gaze-up": { eyeLookUpLeft: 1, eyeLookUpRight: 1 },
  "gaze-down": { eyeLookDownLeft: 1, eyeLookDownRight: 1 },
  "gaze-right": { eyeLookInLeft: 1, eyeLookOutRight: 1 },
  blink: { eyeBlinkLeft: 1, eyeBlinkRight: 1 },
  "smile-open": { mouthSmileLeft: 1, mouthSmileRight: 1, jawOpen: 0.5 },
};
const runtime = createConnectedFaceRuntime({ basis });
fs.mkdirSync(output, { recursive: true });
void (async () => {
  const census: Record<string, unknown>[] = [];
  for (const document of documents)
    for (const [state, expression] of Object.entries(states)) {
      const request = JSON.stringify({ ...document, expression });
      const name = `${document.id}__${state}`;
      try {
        const result = await runtime({
          document: request,
          operation: "preview",
          measure: true,
        });
        if (result.operation !== "preview")
          throw new Error("Expected a preview.");
        const model = {
          id: name,
          parts: result.model.parts.map((part) => ({
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
          materials: result.model.materials.map((material) => ({
            id: material.id,
            baseColor: material.baseColor,
            roughness: material.roughness,
            texture:
              typeof material.baseColorTexture === "string"
                ? material.baseColorTexture
                : null,
          })),
        };
        fs.writeFileSync(
          path.join(output, name + ".json"),
          JSON.stringify(model),
        );
        const crossings = (result.crossings ?? []).map((crossing) => ({
          pair: [crossing.part, crossing.other],
          triangles: [crossing.triangles, crossing.otherTriangles],
          coplanar: crossing.coplanar,
        }));
        census.push({ subject: document.id, state, expression, crossings });
        console.log(
          name,
          crossings
            .map((c) => `${c.pair.join("x")}=${c.triangles.join("/")}`)
            .join(" ") || "clean",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        census.push({
          subject: document.id,
          state,
          expression,
          refused: message,
        });
        console.log(name, "REFUSED:", message);
      }
    }
  fs.writeFileSync(
    path.join(output, "census.json"),
    JSON.stringify({ basis: basis.id, states, census }, null, 2) + "\n",
  );
})();

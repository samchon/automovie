import type { IAutoMovieHumanBodySourceRig } from "@automovie/human/body/anatomy/articulation/rig/IAutoMovieHumanBodySourceRig";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { AutoMovieHumanBodyPartId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import typia from "typia";
import type { IHumanBodyAnatomicalCompilePlan } from "./IHumanBodyAnatomicalCompilePlan";
import type { IHumanBodyAnatomicalCompileInputs } from "./IHumanBodyAnatomicalCompileInputs";
import { registerHumanBodySkinLayers } from "./registerHumanBodySkinLayers";
import type { INativeHumanBodyLayerCompileInputs } from "./INativeHumanBodyLayerCompileInputs";

/**
 * Admit the exact original source, rig and plan before deriving a candidate.
 * Hash and typed identity refusals precede publication. Candidate construction
 * changes only assembly registration and preserves the original exterior.
 * Output tuples retain rejected construction independently of its acceptance.
 * The layer-surfaces preparation stage admits the actual typed partition views
 * and native thickness field before opening a future anatomical assembly. Its
 * source byte receipt identifies only those consumed inputs; it neither registers
 * parts nor claims source/rig admission for the later construction stages.
 */
export function readHumanBodyAnatomicalCompileInputs(
  assemblyFile: string,
  planFile: string,
  output: string,
  layerFieldFile: string | undefined,
  shapeFile: string | undefined,
  stage: "layer-surfaces",
): INativeHumanBodyLayerCompileInputs;
export function readHumanBodyAnatomicalCompileInputs(
  assemblyFile: string,
  planFile: string,
  output: string,
  layerFieldFile: string | undefined,
  shapeFile: string | undefined,
  stage?: "layer-registration",
): IHumanBodyAnatomicalCompileInputs;
export function readHumanBodyAnatomicalCompileInputs(
  assemblyFile: string,
  planFile: string,
  output: string,
  layerFieldFile: string | undefined,
  shapeFile: string | undefined,
  stage?: "layer-surfaces" | "layer-registration",
): IHumanBodyAnatomicalCompileInputs | INativeHumanBodyLayerCompileInputs {
  if (stage === "layer-registration" && layerFieldFile !== undefined)
    throw new Error("Layer registration produces a field from its actual candidate view; a supplied field cannot replace it.");
  const planBytes = fs.readFileSync(planFile);
  const plan = typia.assertEquals<IHumanBodyAnatomicalCompilePlan>(
    JSON.parse(planBytes.toString("utf8")),
  );
  const resolve = (file: string): string =>
    path.resolve(path.dirname(planFile), file);
  const hash = (bytes: string | Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  const headBytes = fs.readFileSync(resolve(plan.headView));
  const originalBodyBytes = fs.readFileSync(resolve(plan.bodyView));
  const head = typia.assertEquals<IAutoMovieHumanPersonHeadView>(
    JSON.parse(gunzipSync(headBytes).toString("utf8")),
  );
  const body = typia.assertEquals<IAutoMovieHumanPersonBodyView>(
    JSON.parse(gunzipSync(originalBodyBytes).toString("utf8")),
  );
  const layerFieldBytes =
    layerFieldFile === undefined ? undefined : fs.readFileSync(layerFieldFile);
  const layerFieldSha256 =
    layerFieldBytes === undefined ? undefined : hash(layerFieldBytes);
  const layerField =
    layerFieldBytes === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanBodyLayerThicknessField>(
          JSON.parse(layerFieldBytes.toString("utf8")),
        );
  if (layerField !== undefined && layerField.basis !== body.body.id)
    throw new Error("Layer thickness field addresses another body basis.");
  const skinIndices = body.body.surfaces[0].indices;
  if (stage === "layer-surfaces") {
    if (layerField === undefined)
      throw new Error("The layer-surfaces stage needs a layer thickness field.");
    joinHumanPersonGeneration(head, body);
    fs.writeFileSync(path.join(output, "layer-input-receipt.json"), JSON.stringify({
      generation: body.id,
      bodyBasis: body.body.id,
      planSha256: hash(planBytes),
      headSha256: hash(headBytes),
      bodySha256: hash(originalBodyBytes),
      fieldSha256: layerFieldSha256,
      qualification: "Native source layer preparation only; anatomical assembly and construction admission not run",
    }, null, 2));
    return { plan, head, body, layerField, layerFieldSha256, skinIndices };
  }
  const assemblyBytes = fs.readFileSync(assemblyFile);
  const originalAssembly =
    typia.assertEquals<IAutoMovieHumanBodyAnatomicalAssembly>(
      JSON.parse(assemblyBytes.toString("utf8")),
    );
  const originalRig = typia.assertEquals<IAutoMovieHumanBodySourceRig>(
    JSON.parse(fs.readFileSync(resolve(plan.rig), "utf8")),
  );
  if (JSON.stringify(originalRig) !== JSON.stringify(originalAssembly.rig))
    throw new Error("Actual rig input differs from the assembled source graph.");
  const originalSourceHashes = new Set<string>();
  const preparation: unknown = JSON.parse(
    fs.readFileSync(resolve(plan.sourcePreparationReceipt), "utf8"),
  );
  if (
    preparation === null ||
    typeof preparation !== "object" ||
    !("sourceGaps" in preparation) ||
    !Array.isArray(preparation.sourceGaps)
  )
    throw new Error(
      "Actual source preparation needs its complete source-member refusal population.",
    );
  const sourceRefusals: unknown[] = preparation.sourceGaps;
  for (const source of plan.rawInputs) {
    const digest = hash(fs.readFileSync(resolve(source.file)));
    if (digest !== source.sha256.toLowerCase())
      throw new Error("Original anatomical source bytes differ: " + source.file);
    originalSourceHashes.add(digest);
  }
  if (
    originalAssembly.basis !== body.body.id ||
    originalAssembly.generation !== originalAssembly.rig.generation
  )
    throw new Error(
      "Source assembly is not registered to the actual original body view.",
    );
  if (JSON.stringify(originalAssembly.shape) !== JSON.stringify(plan.shape))
    throw new Error(
      "Source assembly plan differs from its actual registered shape.",
    );
  const declared = new Set(typia.reflect.literals<AutoMovieHumanBodyPartId>());
  const originalIds = [
    ...originalAssembly.parts.map((part) => part.id),
    ...(originalAssembly.nativeSubcutaneous === undefined ? [] : [originalAssembly.nativeSubcutaneous.id]),
  ];
  if (new Set(originalIds).size !== originalIds.length || originalIds.some((id) => !declared.has(id)))
    throw new Error("Source assembly repeats or invents an anatomical owner.");
  for (const part of originalAssembly.parts)
    for (const surface of part.surfaces)
      if (
        !originalSourceHashes.has(surface.source.sha256.toLowerCase()) ||
        hash(JSON.stringify(surface.mesh)) !==
          surface.compiledMeshSha256.toLowerCase()
      )
        throw new Error(
          "Registered source mesh identity differs: " +
            part.id +
            "/" +
            surface.id,
        );

  const registered = body.body.anatomicalAssembly !== undefined;
  if (registered && JSON.stringify(body.body.anatomicalAssembly) !== JSON.stringify(originalAssembly))
    throw new Error("Published body assembly differs from its supplied registered source.");
  const candidateId = registered && stage !== "layer-registration" ? body.body.id : body.body.id +
    "/anatomical-" +
    hash(
      JSON.stringify({
        originalBody: hash(JSON.stringify(body.body)),
        assembly: hash(assemblyBytes),
        plan: hash(planBytes),
        layerRecipe: stage === "layer-registration" ? hash(fs.readFileSync(
          path.resolve(__dirname, "../human-source/body-anatomy/author_layer_thickness.py"),
        )) : undefined,
        layerRegistrationRecipe: stage === "layer-registration" ? hash(fs.readFileSync(
          path.resolve(__dirname, "registerHumanBodySkinLayers.ts"),
        )) : undefined,
      }),
    ).slice(0, 16);
  const assembly = { ...originalAssembly, basis: candidateId };
  const candidate: IAutoMovieHumanBodyBasis = {
    ...body.body,
    id: candidateId,
    anatomicalAssembly: assembly,
  };
  // A derived atlas consumer cannot silently change any original skin, rig,
  // shape, material or source correspondence row while inheriting its source ID.
  const restore = { ...candidate, id: body.body.id };
  delete restore.anatomicalAssembly;
  const original = { ...body.body };
  delete original.anatomicalAssembly;
  if (JSON.stringify(restore) !== JSON.stringify(original))
    throw new Error(
      "Derived source assembly altered the original skin/rig/shape payload.",
    );
  if (stage === "layer-registration")
    registerHumanBodySkinLayers({
      candidate, body, output,
      producer: path.resolve(__dirname, "../human-source/body-anatomy/author_layer_thickness.py"),
    });
  fs.writeFileSync(path.join(output, "registered-source-assembly.json"), JSON.stringify(assembly));
  fs.writeFileSync(path.join(output, "registered-source-rig.json"), JSON.stringify(assembly.rig));
  const ids = [
    ...assembly.parts.map((part) => part.id),
    ...(assembly.nativeSubcutaneous === undefined ? [] : [assembly.nativeSubcutaneous.id]),
  ];
  const person = parseHumanPersonDocument(
    fs.readFileSync(resolve(plan.personDocument), "utf8"),
    originalAssembly,
  );
  if (person.face.basis !== head.face.id || person.body.basis !== body.body.id)
    throw new Error(
      "Actual saved person document does not name the source head/body.",
    );
  // An optional sixth argument gives the document a shape of its own: named
  // channel weights away from the registered shape, which only an assembly
  // that declares an exterior binding admits. The assembly itself is unchanged.
  const documentShape =
    shapeFile === undefined
      ? plan.shape
      : typia.assertEquals<Record<string, number>>(
          JSON.parse(fs.readFileSync(shapeFile, "utf8")),
        );
  person.body = {
    ...person.body,
    basis: candidateId,
    shape: { ...documentShape },
    anatomicalInspection: undefined,
  };
  const saved = serializeHumanPersonDocument(person, assembly);
  const document = parseHumanPersonDocument(saved, assembly);
  const bodyDocument: IAutoMovieHumanBodyBasisDocument = document.body;
  fs.writeFileSync(
    path.join(output, "candidate-body.basis.json.gz"),
    gzipSync(JSON.stringify(candidate)),
  );
  fs.writeFileSync(path.join(output, "person-document.json"), saved);
  fs.writeFileSync(
    path.join(output, "body-document.json"),
    JSON.stringify(bodyDocument, null, 2),
  );
  // The existing viewer tuple reader consumes each complete typed partition;
  // joining both into one JSON string would exceed the runtime string limit.
  const bodyBytes = gzipSync(JSON.stringify({ ...body, body: candidate }));
  fs.writeFileSync(path.join(output, "whole-neutral.head.json.gz"), headBytes);
  fs.writeFileSync(path.join(output, "whole-neutral.body.json.gz"), bodyBytes);
  fs.writeFileSync(path.join(output, "whole-neutral.json"), saved);
  fs.writeFileSync(
    path.join(output, "viewer-split-receipt.json"),
    JSON.stringify(
      {
        generation: body.id,
        bodyBasis: candidateId,
        faceBasis: head.face.id,
        headSha256: hash(headBytes),
        bodySha256: hash(bodyBytes),
        documentSha256: hash(saved),
        originalBodySha256: hash(originalBodyBytes),
        sourceAssemblySha256: hash(assemblyBytes),
        meaning:
          "Actual complete typed construction inputs; runtime admission and rendered acceptance remain separate",
      },
      null,
      2,
    ),
  );
  return { plan, head, body, originalAssembly, assembly, candidate, document, assemblyBytes, sourceRefusals, layerField, layerFieldSha256, skinIndices, declared, ids, candidateId };
}

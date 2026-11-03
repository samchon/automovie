import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";
import { AutoMovieTextureCache, materialTextureBindings } from "@automovie/viewer";
import type * as THREE from "three";

import { AutoMovieHuman } from "../../src/AutoMovieHuman";
import type { IAutoMovieHumanGenerated } from "../../src/structures/IAutoMovieHumanGenerated";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import { HumanDebugPeople } from "../people/HumanDebugPeople";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HUMAN_DEBUG_PIECES } from "../pieces/HUMAN_DEBUG_PIECES";
import { HumanDebugTubeCentreline } from "../pieces/HumanDebugTubeCentreline";
import type { IHumanDebugPiece } from "../pieces/IHumanDebugPiece";
import { HumanDebugDocumentModel } from "./HumanDebugDocumentModel";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/** Part id prefix the generator gives every construction tube. */
const CONSTRUCTION: string = "human.construction.";

/**
 * Load the subject one person and piece name: a registered piece's document, or the whole figure.
 *
 * The whole figure is `AutoMovieHuman.generate` of the person's typed inputs by the modules the page
 * loaded. Its construction tubes leave the model and return as their centrelines
 * (`HumanDebugTubeCentreline`, from millimetres), so the whole figure and a piece draw their curves
 * through the same tubes and options. The images the model carries are decoded into a texture cache
 * before anything is built, so no surface draws untextured; any other texture asset is refused,
 * because the page has no project asset loader.
 *
 * @param person Person alias, or null for the first exported person.
 * @param piece `<name>` or `<name>:<argument>` of a registered piece, or null for the whole figure.
 * @returns The subject, owning its texture cache.
 */
export async function loadHumanDebugSubject(
  person: string | null,
  piece: string | null,
): Promise<IHumanDebugSubject> {
  const started: number = performance.now();
  const who: IHumanDebugPerson = HumanDebugPeople.of(person);
  if (piece !== null) {
    const at: number = piece.indexOf(":");
    const name: string = at < 0 ? piece : piece.slice(0, at);
    const found: IHumanDebugPiece | undefined = HUMAN_DEBUG_PIECES.find(
      (candidate: IHumanDebugPiece): boolean => candidate.name === name,
    );
    if (found === undefined)
      throw new Error(
        "Unknown Human piece " +
          name +
          "; registered: " +
          HUMAN_DEBUG_PIECES.map((candidate: IHumanDebugPiece): string => candidate.name).join(", "),
      );
    const document: IHumanDebugDocument = found.build(who, at < 0 ? null : piece.slice(at + 1));
    const assembled: ReturnType<typeof HumanDebugDocumentModel.assemble> =
      HumanDebugDocumentModel.assemble(document);
    return {
      key: { person: who.alias, piece },
      model: assembled.model,
      curves: assembled.curves,
      textures: null,
      provenance: document.provenance,
      milliseconds: performance.now() - started,
    };
  }

  const result: IAutoMovieHumanGenerated = AutoMovieHuman.generate(who.parameters);
  const generated: number = performance.now() - started;
  const curves: IHumanDebugDocument.ICurve[] = [];
  const parts: IAutoMovieModelPart[] = [];
  for (const part of result.model.parts) {
    if (part.geometry.type !== "mesh") {
      parts.push(part);
      continue;
    }

    // The figure is shown at its bind, where the positions already are the skin, so the binding
    // is left out and the parts draw as plain meshes.
    if (!part.id.startsWith(CONSTRUCTION)) {
      parts.push({ ...part, geometry: { type: "mesh", mesh: { ...part.geometry.mesh, skin: null } } });
      continue;
    }

    // Recovered in millimetres so the centreline's rounding keeps micrometres, then back to metres.
    const mesh: { positions: number[]; indices: number[] | null } = part.geometry.mesh;
    const line: { closed: boolean; points: IHumanDebugDocument.Point[] } = HumanDebugTubeCentreline(
      mesh.positions,
      (mesh.indices?.length ?? mesh.positions.length / 3) / 3,
      part.id,
      1000,
    );
    curves.push({
      id: part.id,
      closed: line.closed,
      points: line.points.map((p: IHumanDebugDocument.Point): IHumanDebugDocument.Point => [
        p[0] / 1000,
        p[1] / 1000,
        p[2] / 1000,
      ]),
    });
  }
  // The skeleton stays, at its bind, so a part attached to a bone rides it where it was generated.
  const model: IAutoMovieModel = { ...result.model, parts };
  const textures: AutoMovieTextureCache = new AutoMovieTextureCache(
    (asset: string): Promise<THREE.Texture> =>
      Promise.reject(new Error("Human model binds texture asset " + asset + " that it does not carry")),
  );
  try {
    await textures.prime(model.materials.flatMap(materialTextureBindings), model.images ?? []);
  } catch (error) {
    await textures.dispose().catch(console.error);
    throw error;
  }
  return {
    key: { person: who.alias, piece: null },
    model,
    curves,
    textures,
    provenance: {
      producer: "AutoMovieHuman.generate",
      person: who.alias,
      generateMilliseconds: Math.round(generated),
      parts: parts.length,
      curves: curves.length,
    },
    milliseconds: performance.now() - started,
  };
}

import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";
import { AutoMovieTextureCache, materialTextureBindings } from "@automovie/viewer";
import type * as THREE from "three";
import { Singleton } from "tstl";

import { AutoMovieHuman } from "../../src/AutoMovieHuman";
import type { IAutoMovieHumanPrepared } from "../../src/instance/IAutoMovieHumanPrepared";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import { HumanDebugPeople } from "../people/HumanDebugPeople";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HUMAN_DEBUG_PIECES } from "../pieces/HUMAN_DEBUG_PIECES";
import { HumanDebugTubeCentreline } from "../pieces/HumanDebugTubeCentreline";
import type { IHumanDebugPiece } from "../pieces/IHumanDebugPiece";
import { HumanDebugDocumentModel } from "./HumanDebugDocumentModel";
import { loadHumanDebugCompare } from "./loadHumanDebugCompare";
import { HumanDebugPose } from "./HumanDebugPose";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/** Part id prefix the generator gives every construction tube. */
const CONSTRUCTION: string = "human.construction.";

/** Prepared bodies by person alias, kept for the page's lifetime so a new pose does not generate again. */
const PREPARED: Map<string, Singleton<IAutoMovieHumanPrepared>> = new Map();

/**
 * Load the subject one person, piece and pose name: a registered piece's document, or the whole
 * figure in a pose.
 *
 * The whole figure is `AutoMovieHuman.prepare` of the person's typed inputs by the modules the page
 * loaded, generated once per person and page load. Unless the pose is `bind`, its parts are moved
 * into the named pose by the production rig (`HumanDebugPose`); `neutral` is the anatomical neutral
 * every pose is measured from. Its construction tubes ride the same binding, leave the model and
 * return as their centrelines (`HumanDebugTubeCentreline`, from millimetres), so the whole figure
 * and a piece draw their curves through the same tubes and options. The images the model carries
 * are decoded into a texture cache before anything is built, so no surface draws untextured; any
 * other texture asset is refused, because the page has no project asset loader.
 *
 * Each stage's milliseconds go to the provenance and to the console as one `[human-debug timing]`
 * line, which the capture session repeats in the server log.
 *
 * @param person Person alias, or null for the first exported person.
 * @param piece `<name>` or `<name>:<argument>` of a registered piece, or null for the whole figure.
 * @param pose Pose name for the whole figure, `bind` or a key of `HUMAN_DEBUG_POSES`; a piece ignores it.
 * @param reference The view comparison's reference id, style and drawn pieces (`loadHumanDebugCompare`), or null; with one, piece and pose are not read and the person defaults to the reference.
 * @returns The subject, owning its texture cache.
 */
export async function loadHumanDebugSubject(
  person: string | null,
  piece: string | null,
  pose: string,
  reference: { id: string; style: "clay" | "loft"; parts: string[] } | null = null,
): Promise<IHumanDebugSubject> {
  const started: number = performance.now();
  if (reference !== null) return loadHumanDebugCompare(HumanDebugPeople.of(person ?? reference.id), reference);
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
      key: { person: who.alias, piece, pose: null },
      model: assembled.model,
      curves: assembled.curves,
      textures: null,
      provenance: document.provenance,
      milliseconds: performance.now() - started,
    };
  }

  let cached: Singleton<IAutoMovieHumanPrepared> | undefined = PREPARED.get(who.alias);
  const fresh: boolean = cached === undefined;
  if (cached === undefined) {
    cached = new Singleton((): IAutoMovieHumanPrepared => AutoMovieHuman.prepare(who.parameters));
    PREPARED.set(who.alias, cached);
  }
  const result: IAutoMovieHumanPrepared = cached.get();
  const prepared: number = performance.now();
  const posed: HumanDebugPose.IResult | null =
    pose === HumanDebugPose.BIND ? null : HumanDebugPose.apply(result, result.model.parts, pose);
  const moved: number = performance.now();
  const curves: IHumanDebugDocument.ICurve[] = [];
  const parts: IAutoMovieModelPart[] = [];
  for (const part of posed?.parts ?? result.model.parts) {
    if (part.geometry.type !== "mesh") {
      parts.push(part);
      continue;
    }

    // The positions already are the skin in the pose (or at the bind), so the binding is left out
    // and the parts draw as plain meshes.
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
  // The skeleton stays at its bind; a posed part attached to a bone was moved with it and detached.
  const model: IAutoMovieModel = { ...result.model, parts };
  const split: number = performance.now();
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
  const milliseconds: Record<string, number> = {
    prepare: Math.round(prepared - started),
    pose: Math.round(moved - prepared),
    curves: Math.round(split - moved),
    textures: Math.round(performance.now() - split),
  };
  console.log(
    "[human-debug timing] person=" + who.alias + " pose=" + pose + " prepared=" + (fresh ? "new" : "kept") + " " +
      Object.entries(milliseconds).map(([stage, ms]: [string, number]): string => stage + "=" + ms + "ms").join(" ") +
      (posed === null ? "" : " evaluate=" + posed.milliseconds.evaluate + "ms skin=" + posed.milliseconds.skin + "ms"),
  );
  return {
    key: { person: who.alias, piece: null, pose },
    model,
    curves,
    textures,
    provenance: {
      producer: "AutoMovieHuman.prepare",
      person: who.alias,
      pose,
      prepared: fresh ? "new" : "kept",
      milliseconds,
      posing:
        posed === null
          ? null
          : { moved: posed.moved, kept: posed.kept, clamped: posed.clamped, milliseconds: posed.milliseconds },
      parts: parts.length,
      curves: curves.length,
    },
    milliseconds: performance.now() - started,
  };
}

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

/**
 * Completed public preparation and diagnosis for one fixed typed example in this page.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the prepared model with public diagnostics from the same synchronous factory inputs; the duration measures only that diagnosis.
 * @evidence contracts/common.md#clear-and-simple-design One record extends the existing alias Singleton without a second cache or generator API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds real public results without replacing generation or translating its failures.
 * @evidence contracts/common.md#meaningful-documentation Names the CPU result, final-stage diagnostic provenance and elapsed-time units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no algorithm; the loader owns its factory and reuse.
 * @evidence contracts/performance.md#reuse-equivalent-work The page's fixed alias inputs and loaded modules identify one reusable preparation/diagnosis pair.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing alias map owns the prepared CPU data and O(D) diagnostic records until module unload, at most one entry per exported person; no GPU handle is stored here.
 */
interface IPrepared {
  /** Immutable bind shape and rig returned by public prepare. */
  prepared: IAutoMovieHumanPrepared;

  /** Public diagnose results for the same final-generation inputs, not source-definition diagnostics. */
  diagnostics: ReturnType<typeof AutoMovieHuman.diagnose>;

  /** Factory's diagnose duration in milliseconds; reuse does not incur it again. */
  diagnoseMilliseconds: number;
}

/** Successful preparation/diagnosis pairs by fixed alias for this page's module lifetime. */
const PREPARED: Map<string, Singleton<IPrepared>> = new Map();

/**
 * Load the subject one person, piece and pose name: a registered piece's document, or the whole
 * figure in a pose.
 *
 * The whole figure is `AutoMovieHuman.prepare` of the person's typed inputs by the modules the page
 * loaded, prepared once per person and page load. The same factory immediately calls public
 * `diagnose` on those inputs: it reuses the just-prepared shape stages but repeats appearance,
 * binding and model assembly, measured separately. Only a successful pair is published; original
 * factory failures propagate unchanged. Later poses reuse both results. Unless the pose is `bind`,
 * its parts are moved into the named pose by the production rig (`HumanDebugPose`); `neutral` is the anatomical neutral
 * every pose is measured from. Its construction tubes ride the same binding, leave the model and
 * return as their centrelines (`HumanDebugTubeCentreline`, from millimetres), so the whole figure
 * and a piece draw their curves through the same tubes and options. The images the model carries
 * are decoded into a texture cache before the view builds GPU resources, so no surface draws untextured; any
 * other texture asset is refused, because the page has no project asset loader.
 *
 * Each stage's milliseconds go to the provenance and to the console as one `[human-debug timing]`
 * line, which the capture session repeats in the server log.
 *
 * @param person Person alias, or null for the first exported person.
 * @param piece `<name>` or `<name>:<argument>` of a registered piece, or null for the whole figure.
 * @param pose Pose name for the whole figure, `bind` or a key of `HUMAN_DEBUG_POSES`; a piece ignores it.
 * @param reference The comparison's id, style, reference crop and compared-part diagnostic scope, or null; with one, piece/pose are ignored and person defaults to reference.
 * @returns The subject; an ordinary prepared figure owns its primed texture cache.
 *
 * @evidence contracts/common.md#principled-implementation Routes comparison to its real source definition; ordinary prepare and immediate public diagnose share fixed inputs synchronously, so the just-prepared ShapeStages entry remains current. Successful pairs alone enter the alias map and factory exceptions are not caught or wrapped.
 * @evidence contracts/common.md#clear-and-simple-design One dispatch returns the common subject; the existing Singleton owns the prepared model, diagnostics and separate diagnosis duration, with no parallel cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses existing production builders and typed people without an alternate preview generator, fixture or skipped final-figure check.
 * @evidence contracts/common.md#meaningful-documentation Names public diagnostic provenance, separate diagnosis cost, successful publication, pose and texture ownership, and the distinct source-comparison stage.
 * @evidence contracts/performance.md#efficient-algorithms Ordinary work includes shape generation, repeated diagnosis appearance/binding/model assembly, O(V) curve recovery over construction vertices and texture priming. Diagnosis is charged separately, once per factory, without an unmeasured speedup claim; comparison retains its selected-station costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The page's fixed typed alias and loaded modules identify one Singleton pair reused across poses; reused loads charge diagnose zero. Comparison owns its separate equivalent-input source cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing alias map retains one successful CPU figure/diagnostic pair per requested exported alias until module unload. Failed factories are not published. Returned subjects own their primed textures for the view to retire; no new GPU cache or handle is retained.
 */
export async function loadHumanDebugSubject(
  person: string | null,
  piece: string | null,
  pose: string,
  reference: { id: string; style: "clay" | "loft"; parts: string[]; comparedParts: string[] } | null = null,
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

  let cached: Singleton<IPrepared> | undefined = PREPARED.get(who.alias);
  const fresh: boolean = cached === undefined;
  if (cached === undefined)
    cached = new Singleton((): IPrepared => {
      const prepared: IAutoMovieHumanPrepared = AutoMovieHuman.prepare(who.parameters);
      const diagnosing: number = performance.now();
      const diagnostics: IPrepared["diagnostics"] = AutoMovieHuman.diagnose(who.parameters);
      return { prepared, diagnostics, diagnoseMilliseconds: performance.now() - diagnosing };
    });
  const built: IPrepared = cached.get();

  // Singleton does not keep thrown values; publish only success so a failed factory's retry is new.
  if (fresh) PREPARED.set(who.alias, cached);
  const result: IAutoMovieHumanPrepared = built.prepared;
  const diagnosed: number = fresh ? built.diagnoseMilliseconds : 0;
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
    prepare: Math.round(prepared - started - diagnosed),
    diagnose: Math.round(diagnosed),
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
      diagnosticsProducer: "AutoMovieHuman.diagnose",
      diagnostics: built.diagnostics,
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

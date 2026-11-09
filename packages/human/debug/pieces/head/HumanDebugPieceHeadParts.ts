import { AutoMovieHumanBodyAnatomy } from "../../../src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanEarPlace } from "../../../src/generation/AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../../../src/generation/AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../../../src/generation/AutoMovieHumanHeadArcs";
import { AutoMovieHumanNeckSource } from "../../../src/generation/AutoMovieHumanNeckSource";
import { AutoMovieHumanHeadLayout } from "../../../src/generation/head/AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadComposer } from "../../../src/generation/head/AutoMovieHumanHeadComposer";
import { AutoMovieHumanHeadTree } from "../../../src/generation/head/AutoMovieHumanHeadTree";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadInputs } from "../../../src/generation/IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadLayout } from "../../../src/generation/IAutoMovieHumanHeadLayout";
import { type AutoMovieConstructionRealization, type AutoMovieLoftContract, type IAutoMovieLoftChain, realizeAutoMovieConstruction } from "@automovie/engine";
import type { IAutoMovieHumanEar } from "../../../src/structures/head/IAutoMovieHumanEar";
import type { AutoMovieHumanSex } from "../../../src/typings/AutoMovieHumanSex";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "../HumanDebugChainLoft";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";

/**
 * The head lane's view parts (#3052 to #3056) lofted alone from the person's
 * landmark skeleton, through the production surface and construction
 * (`HumanDebugChainLoft`), before they are wired into a person:
 *
 * - `all`: the realized head's every face and every join's blend, as chains;
 * - `mass`: the head mass and its neck alone;
 * - `parts`: the face parts alone, without the head mass;
 * - `nose`: the head mass and the nose alone, one merge, realized as `composed`;
 * - `nose.alone`: the nose's own loft, without the merge;
 * - `composed`: the head's construction tree (`AutoMovieHumanHeadTree`)
 *   realized by the engine (`realizeAutoMovieConstruction`): its one skin,
 *   and each face's curves.
 *
 * The skeleton is the production lane's anatomical layout from the neck's
 * generating curves, without constructing the old radial head.
 */
export const HumanDebugPieceHeadParts: IHumanDebugPiece = {
  name: "head.parts",
  region: "head",
  description: "The head lane's view parts (head mass with its neck, face parts and their joins) lofted alone from the person's landmark skeleton.",
  arguments: ["all", "mass", "parts", "composed", "nose", "nose.alone"],
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    const which: string = argument ?? "all";
    const inputs: IAutoMovieHumanHeadInputs = AutoMovieHumanBodyLaw.headInputs(person.parameters);
    const neck: AutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(inputs, AutoMovieHumanBodyLaw.limbInputs(person.parameters).legs.scale);
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLayout.create(neck, inputs);
    // The tragion and the auricles' tops at their published places.
    const sex: AutoMovieHumanSex = AutoMovieHumanBodyAnatomy.sexOf(person.parameters);
    const k: number = plan.scale;
    const tragion: number = plan.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * k;
    const top: (ear: IAutoMovieHumanEar) => number = (ear: IAutoMovieHumanEar): number => tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * k;
    const composed: AutoMovieHumanHeadComposer.IOutput = AutoMovieHumanHeadComposer.compose(plan, inputs.head.earPair, neck.bottom[1], {
      tragion,
      ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
    });
    // The chains each argument shows: the placed parts' own lofts, or the
    // head's construction tree realized by the engine.
    const chains: (IAutoMovieLoftChain | null)[] = [];
    if (which === "mass") chains.push(composed.mass.chain);
    if (which === "parts") {
      for (const placed of composed.parts) chains.push(placed.loft.chain);
      for (const study of composed.studies) chains.push(study.loft.chain);
    }
    if (which === "nose.alone") chains.push(...composed.parts.filter((p: AutoMovieHumanHeadComposer.IPlaced): boolean => p.feature.part.name === "nose").map((p: AutoMovieHumanHeadComposer.IPlaced): IAutoMovieLoftChain | null => p.loft.chain));

    // Explicit raw getters may add their own failures; read diagnostics only
    // after those requested results exist, without waking any other loft.
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...composed.diagnostics];

    // `nose`: the head mass and the nose alone, one merge.
    const subset: Pick<AutoMovieHumanHeadComposer.IOutput, "massView" | "parts"> = {
      massView: composed.massView,
      parts: which === "nose" ? composed.parts.filter((p: AutoMovieHumanHeadComposer.IPlaced): boolean => p.feature.part.name === "nose") : composed.parts,
    };
    let skin: IHumanDebugDocument.IPart[] = [];
    if (which === "all" || which === "composed" || which === "nose") {
      const realized: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction(AutoMovieHumanHeadTree.of(subset), { chord: CHORD, sources: composed.sources });
      for (const d of realized.diagnostics) diagnostics.push({ producer: `construction.${d.node}`, level: 6, contract: d.contract, detail: d.detail });
      chains.push(...realized.chains);
      if (which === "all") for (const j of realized.joins) chains.push(j.blend.chain);
      if (which !== "all") skin = faces(realized.mesh);
    }
    const shown: IAutoMovieLoftChain[] = chains.filter((c: IAutoMovieLoftChain | null): c is IAutoMovieLoftChain => c !== null);
    if (!shown.length) throw new Error(`head.parts:${which} made no chain: ${JSON.stringify(diagnostics)}`);
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: plan.vertex,
      chains: shown,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      diagnostics,
    };
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      calibration,
      shown.map((c: IAutoMovieLoftChain): string => c.name),
    );

    // The composed head's skin is the realization's one mesh; each chain's
    // curves move onto its face's part of that skin, and a chain with no face
    // there keeps its own lofted part.
    const byFace: Map<string, IHumanDebugDocument.IPart> = new Map(skin.map((part: IHumanDebugDocument.IPart): [string, IHumanDebugDocument.IPart] => [part.id.slice(PREFIX.length, part.id.lastIndexOf("/")), part]));
    const kept: IHumanDebugDocument.IPart[] = [];
    const skinned: boolean = which === "composed" || which === "nose";
    for (const part of skinned ? document.parts : []) {
      const face: IHumanDebugDocument.IPart | undefined = byFace.get(part.id.slice(PREFIX.length, part.id.lastIndexOf("/")));
      if (face === undefined) kept.push(part);
      else face.curves.push(...part.curves);
    }
    const parts: IHumanDebugDocument.IPart[] = skinned ? [...kept, ...skin] : document.parts;

    // The joins' and seeds' failures first, then the view sections', so the
    // header's cut keeps the ones a composed view needs.
    const ordered: AutoMovieLoftContract.IDiagnostic[] = [
      ...diagnostics.filter((d: AutoMovieLoftContract.IDiagnostic): boolean => !d.producer.startsWith("view.")),
      ...diagnostics.filter((d: AutoMovieLoftContract.IDiagnostic): boolean => d.producer.startsWith("view.")),
    ];
    return { ...document, parts, provenance: { ...document.provenance, piece: `head.parts:${which}`, diagnostics: ordered } };
  },
};

/** The id prefix of a skin part. */
const PREFIX: string = "human.skin.";

/** The realized skin's chord tolerance, metres. */
const CHORD: number = 2e-4;

/** The first interval number of a face's part of the realized skin, past any chain's lofted intervals. */
const SKIN: number = 9000;

/**
 * The realization's one mesh as one part per face, millimetres in the body
 * frame: each triangle goes to the face that evaluates its first vertex.
 */
function faces(mesh: AutoMovieConstructionRealization.IMesh): IHumanDebugDocument.IPart[] {
  type Face = { points: IHumanDebugDocument.Point[]; indices: number[]; index: Map<number, number> };
  const out: Map<number, Face> = new Map();
  for (let t: number = 0; t < mesh.indices.length; t += 3) {
    const owner: number = mesh.coordinates[3 * mesh.indices[t]!]!;
    let face: Face | undefined = out.get(owner);
    if (face === undefined) {
      face = { points: [], indices: [], index: new Map() };
      out.set(owner, face);
    }
    for (let k: number = 0; k < 3; k++) {
      const v: number = mesh.indices[t + k]!;
      let i: number | undefined = face.index.get(v);
      if (i === undefined) {
        i = face.points.length;
        face.index.set(v, i);
        face.points.push([mesh.positions[3 * v]! * 1e3, mesh.positions[3 * v + 1]! * 1e3, mesh.positions[3 * v + 2]! * 1e3]);
      }
      face.indices.push(i);
    }
  }
  return [...out].map(([owner, face]: [number, Face]): IHumanDebugDocument.IPart => ({
    id: `${PREFIX}${mesh.owners[owner]!}/${SKIN}`,
    space: "body-mm",
    frame: { origin: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], left: [0, 0, 1] },
    points: face.points,
    indices: face.indices,
    curves: [],
  }));
}

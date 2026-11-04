import { AutoMovieHumanBodyAnatomy } from "../../../src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanEarPlace } from "../../../src/generation/AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../../../src/generation/AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../../../src/generation/AutoMovieHumanHeadArcs";
import type { AutoMovieHumanHeadConstruction } from "../../../src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../../../src/generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../../../src/generation/AutoMovieHumanHeadPass";
import { AutoMovieHumanHeadComposer } from "../../../src/generation/head/AutoMovieHumanHeadComposer";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadBuilt } from "../../../src/generation/IAutoMovieHumanHeadBuilt";
import { type AutoMovieLoftContract, AutoMovieSolidBlendChain, type AutoMovieSolidJoin, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanMergeEntry } from "../../../src/generation/limb/AutoMovieHumanMergeEntry";
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
 * - `all`: the head mass and its neck, every face part and every join's blend;
 * - `mass`: the head mass and its neck alone;
 * - `parts`: the face parts alone, without the head mass;
 * - `composed`: the head mass with every part joined straight
 *   to it drawn trimmed by the solid tessellation (`calibration.merges`).
 *
 * The skeleton is the head pass's first build, without the secant passes
 * that solve the inputs' measures on the old skin.
 */
export const HumanDebugPieceHeadParts: IHumanDebugPiece = {
  name: "head.parts",
  region: "head",
  description: "The head lane's view parts (head mass with its neck, face parts and their joins) lofted alone from the person's landmark skeleton.",
  arguments: ["all", "mass", "parts", "composed"],
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    const which: string = argument ?? "all";
    const base: IAutoMovieHumanBodyCalibration = person.calibration();
    const neckChain: IAutoMovieLoftChain | undefined = base.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "head");
    if (neckChain === undefined) throw new Error("head.parts: the calibration has no neck chain `head`");
    const inputs: AutoMovieHumanHeadConstruction.IInputs = AutoMovieHumanBodyLaw.headInputs(person.parameters);
    const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(AutoMovieHumanHeadPass.prepare(neckChain, inputs), AutoMovieHumanHeadLandmarks.NONE);
    // The tragion and the auricles' tops at their published places.
    const sex: AutoMovieHumanSex = AutoMovieHumanBodyAnatomy.sexOf(person.parameters);
    const k: number = built.plan.scale;
    const tragion: number = built.plan.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * k;
    const top = (ear: IAutoMovieHumanEar): number => tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * k;
    const composed: AutoMovieHumanHeadComposer.IOutput = AutoMovieHumanHeadComposer.compose(built.plan, inputs.head.earPair, neckChain, {
      tragion,
      ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
    });
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...composed.diagnostics];

    // A join's blend as a chain of its own.
    const blend = (name: string, join: AutoMovieSolidJoin.IJoin | null): IAutoMovieLoftChain | null =>
      join === null ? null : (AutoMovieSolidBlendChain.of(`${name}.blend`, join, AutoMovieHumanHeadComposer.COUNT)?.chain ?? null);

    // The chains each argument shows.
    const chains: (IAutoMovieLoftChain | null)[] = [];
    if (which === "all" || which === "mass") chains.push(composed.mass.chain);
    if (which === "all" || which === "parts")
      for (const joined of composed.parts) {
        chains.push(joined.loft.chain);
        if (which === "all") chains.push(blend(joined.feature.part.name, joined.join));
      }

    // The composed head: the mass with every part joined straight to it
    // published as a merge entry, so the solid tessellation draws the host and
    // the part trimmed at their rails and the blend between them.
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];
    if (which === "composed") {
      chains.push(composed.mass.chain);
      const joins: AutoMovieHumanHeadComposer.IJoined[] = composed.parts;
      for (const joined of joins) {
        if (joined.feature.parent !== "head.mass" || joined.join === null || joined.loft.chain === null) continue;
        const entry: AutoMovieHumanMergeEntry.IEntry | null = AutoMovieHumanMergeEntry.of(
          `blend.${joined.feature.part.name}`,
          "head.mass",
          joined.feature.part.name,
          joined.join,
          AutoMovieHumanHeadComposer.COUNT,
          1,
          joined.feature.join === "diff",
          diagnostics,
        );
        if (entry === null) continue;
        chains.push(joined.loft.chain, entry.chain);
        merges.push(entry.merge);
      }
    }
    const shown: IAutoMovieLoftChain[] = chains.filter((c: IAutoMovieLoftChain | null): c is IAutoMovieLoftChain => c !== null);
    if (!shown.length) throw new Error(`head.parts:${which} made no chain: ${JSON.stringify(diagnostics)}`);
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: base.stature,
      chains: shown,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      ...(merges.length ? { merges } : {}),
      diagnostics,
    };
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      calibration,
      shown.map((c: IAutoMovieLoftChain): string => c.name),
    );
    // The solid tessellation groups a trimmed face as `<chain>/solid`, which
    // the document's `<chain>/<k>` ids do not admit and which repeats once per
    // trim: each such part takes an interval number of its own past the
    // chain's lofted intervals.
    const seen: Map<string, number> = new Map();
    const parts: IHumanDebugDocument.IPart[] = document.parts.map((part: IHumanDebugDocument.IPart): IHumanDebugDocument.IPart => {
      const match: RegExpMatchArray | null = part.id.match(/^(.*)\/solid$/);
      if (match === null) return part;
      const k: number = (seen.get(match[1]!) ?? 0) + 1;
      seen.set(match[1]!, k);
      return { ...part, id: `${match[1]!}/${SOLID + k}` };
    });
    // The joins' and seeds' failures first, then the view sections', so the
    // header's cut keeps the ones a composed view needs.
    const ordered: AutoMovieLoftContract.IDiagnostic[] = [
      ...diagnostics.filter((d: AutoMovieLoftContract.IDiagnostic): boolean => !d.producer.startsWith("view.")),
      ...diagnostics.filter((d: AutoMovieLoftContract.IDiagnostic): boolean => d.producer.startsWith("view.")),
    ];
    return { ...document, parts, provenance: { ...document.provenance, piece: `head.parts:${which}`, diagnostics: ordered } };
  },
};

/** The first interval number a trimmed face's part takes, past any chain's lofted intervals. */
const SOLID: number = 9000;

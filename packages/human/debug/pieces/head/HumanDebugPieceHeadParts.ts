import { AutoMovieHumanBodyLaw } from "../../../src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanHeadConstruction } from "../../../src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../../../src/generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../../../src/generation/AutoMovieHumanHeadPass";
import { AutoMovieHumanHeadComposer } from "../../../src/generation/head/AutoMovieHumanHeadComposer";
import { AutoMovieHumanNeckPart } from "../../../src/generation/head/AutoMovieHumanNeckPart";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadBuilt } from "../../../src/generation/IAutoMovieHumanHeadBuilt";
import type { AutoMovieHumanLoftContract } from "../../../src/lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlendChain } from "../../../src/lofting/AutoMovieHumanSolidBlendChain";
import { AutoMovieHumanViewLoft } from "../../../src/lofting/AutoMovieHumanViewLoft";
import type { IAutoMovieHumanLoftChain } from "../../../src/lofting/IAutoMovieHumanLoftChain";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "../HumanDebugChainLoft";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";

/**
 * The head lane's view parts (#3052 to #3056) lofted alone from the person's
 * landmark skeleton, through the production surface and construction
 * (`HumanDebugChainLoft`), before they are wired into a person:
 *
 * - `all`: the neck, the head mass, every face part and every join's blend;
 * - `mass`: the head mass alone;
 * - `neck`: the neck alone;
 * - `parts`: the face parts alone, without the head mass.
 *
 * The skeleton is the head pass's first build, without the secant passes
 * that solve the inputs' measures on the old skin.
 */
export const HumanDebugPieceHeadParts: IHumanDebugPiece = {
  name: "head.parts",
  region: "head",
  description: "The head lane's view parts (neck, head mass, face parts and their joins) lofted alone from the person's landmark skeleton.",
  arguments: ["all", "mass", "neck", "parts"],
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    const which: string = argument ?? "all";
    const base: IAutoMovieHumanBodyCalibration = person.calibration();
    const neckChain: IAutoMovieHumanLoftChain | undefined = base.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "head");
    if (neckChain === undefined) throw new Error("head.parts: the calibration has no neck chain `head`");
    const inputs: AutoMovieHumanHeadConstruction.IInputs = AutoMovieHumanBodyLaw.headInputs(person.parameters);
    const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(AutoMovieHumanHeadPass.prepare(neckChain, inputs), AutoMovieHumanHeadLandmarks.NONE);
    const composed: AutoMovieHumanHeadComposer.IOutput = AutoMovieHumanHeadComposer.compose(built.plan, inputs.head.earPair);
    const neck: AutoMovieHumanViewLoft.IResult = AutoMovieHumanViewLoft.create(AutoMovieHumanNeckPart.of(neckChain));
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [...composed.diagnostics, ...neck.diagnostics];

    // The chains each argument shows.
    const chains: IAutoMovieHumanLoftChain[] = [];
    if ((which === "all" || which === "neck") && neck.chain !== null) chains.push(neck.chain);
    if ((which === "all" || which === "mass") && composed.mass.chain !== null) chains.push(composed.mass.chain);
    if (which === "all" || which === "parts")
      for (const joined of composed.parts) {
        if (joined.loft.chain !== null) chains.push(joined.loft.chain);
        if (which !== "all" || joined.join === null) continue;
        const blend: AutoMovieHumanSolidBlendChain.IBlend | null = AutoMovieHumanSolidBlendChain.of(`${joined.feature.part.name}.blend`, joined.join, AutoMovieHumanHeadComposer.COUNT);
        if (blend !== null) chains.push(blend.chain);
      }
    if (!chains.length) throw new Error(`head.parts:${which} made no chain: ${JSON.stringify(diagnostics)}`);
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: base.stature,
      chains,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      diagnostics,
    };
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      calibration,
      chains.map((c: IAutoMovieHumanLoftChain): string => c.name),
    );
    return { ...document, provenance: { ...document.provenance, piece: `head.parts:${which}`, diagnostics } };
  },
};

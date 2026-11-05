import type { IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../../src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyCalibration } from "../../src/generation/IAutoMovieHumanBodyCalibration";
import { HUMAN_DEBUG_VIEW_PARTS } from "../compare/HUMAN_DEBUG_VIEW_PARTS";
import type { HumanDebugViewParts } from "../compare/HumanDebugViewParts";
import { HumanDebugOptionField } from "../contracts/HumanDebugOptionField";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "./HumanDebugChainLoft";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * Named current-person source parts, lofted together before final joining.
 *
 * The shared source cache runs the same BodyLaw.define used by calibration,
 * without calibrate, realization, rigging or whole-person preparation. Last
 * source results are selected by name; their actual loft.chain references go
 * unchanged to the existing ChainLoft surface/construction consumer. Studies
 * and definition-only parts remain explicitly separate from tree members.
 * The reserved `tree` argument selects exactly observation.treeParts by name,
 * excluding unconnected studies and definition-only records, without a fixed
 * person-specific inventory. Missing tree lofts remain unavailable. Subtractive
 * operands are positive raw lofts here; no Boolean difference is performed.
 *
 * Only this newly generated document's positions receive the source-to-person
 * scale about the floor; normals, indices and borrowed chain frames/sources
 * remain unchanged. The ordinary document adapter then converts mm to metres.
 * Flat end fans are the existing isolated-loft cuts, not joined anatomy.
 *
 * Selection scans the source records against the requested globs; selected
 * production tessellation dominates cost. Matching page inputs reuse the one
 * source definition, while each new piece selection builds its own document.
 * The view owns that document; no extra cache, fixture or GPU handle is kept.
 * Source/loft exceptions propagate. A selection with no usable chain throws
 * with its available names and source diagnostics, never a substitute model.
 */
export const HumanDebugPieceSourceParts: IHumanDebugPiece = {
  name: "source.parts",
  region: "body",
  description: "Named actual production source parts lofted together before joins; tree selects the current production tree, and the default is trunk.",
  arguments: ["tree", "trunk", "arm.left,thumb.left", "arm.right,thumb.right"],
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    const parsed: { value: string[] } | string =
      HumanDebugOptionField.globs().read(argument ?? "trunk");
    if (typeof parsed === "string") throw new Error(`source.parts: ${parsed}`);
    const globs: string[] = parsed.value;
    if (globs.length === 0) throw new Error("source.parts needs at least one part-name glob");
    const treeOnly: boolean = globs.length === 1 && globs[0] === "tree";

    const started: number = performance.now();
    const source: HumanDebugViewParts.IOutput =
      HUMAN_DEBUG_VIEW_PARTS.get(person.alias, person.parameters);
    const defined: number = performance.now();
    const tree: Set<string> = new Set(source.observation.treeParts);
    const expressions: RegExp[] = globs.map(HumanDebugPattern.expression);
    const matches: (name: string) => boolean = (name: string): boolean =>
      treeOnly
        ? tree.has(name)
        : expressions.some((expression: RegExp): boolean => expression.test(name));
    const names: string[] = [
      ...source.parts.map((part: HumanDebugViewParts.IPart): string => part.name),
      ...source.observation.unavailableParts,
    ];
    const selected: HumanDebugViewParts.IPart[] = source.parts.filter(
      (part: HumanDebugViewParts.IPart): boolean => matches(part.name),
    );
    const chains: IAutoMovieLoftChain[] = [];
    const unavailable: string[] = treeOnly
      ? source.observation.treeParts.filter((name: string): boolean =>
          !selected.some((part: HumanDebugViewParts.IPart): boolean => part.name === name))
      : source.observation.unavailableParts.filter(matches);
    for (const part of selected) {
      const chain: IAutoMovieLoftChain | null = part.loft?.chain ?? null;
      if (chain === null) unavailable.push(part.name);
      else chains.push(chain);
    }
    if (chains.length === 0)
      throw new Error(`source.parts:${globs.join(",")} has no usable raw loft; unavailable ${unavailable.join(",")}; source names ${names.join(",")}; diagnostics ${JSON.stringify(source.diagnostics)}`);

    // This is input to the isolated loft consumer, not a completed calibration.
    // ChainLoft copies diagnostics before the surface stage can append to them.
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: AutoMovieHumanBodyAnatomy.resolve(person.parameters).stature / source.scale,
      chains,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      diagnostics: [...source.diagnostics.body, ...source.diagnostics.head],
    };
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      calibration,
      chains.map((chain: IAutoMovieLoftChain): string => chain.name),
    );

    // These buffers belong to the new document, not the cached source chains.
    if (source.scale !== 1)
      for (const part of document.parts) {
        for (const point of part.points) {
          point[0] *= source.scale;
          point[1] *= source.scale;
          point[2] *= source.scale;
        }
        for (const curve of part.curves)
          for (const point of curve.points) {
            point[0] *= source.scale;
            point[1] *= source.scale;
            point[2] *= source.scale;
          }
      }
    return {
      parts: document.parts,
      provenance: {
        producer: "HumanDebugPieceSourceParts -> HumanDebugChainLoft",
        piece: "source.parts:" + globs.join(","),
        person: person.alias,
        selection: treeOnly ? "production-tree" : "part-name-globs",
        observation: {
          stage: "prejoin-part-loft",
          finalRealization: "not-run",
          treeParts: source.observation.treeParts.filter(matches),
          studies: source.observation.studies.filter(matches),
          definitionOnlyParts: source.observation.definitionOnlyParts.filter(matches),
          unavailableParts: unavailable,
        },
        scale: source.scale,
        selected: selected.map((part: HumanDebugViewParts.IPart): string => part.name),
        unmatchedGlobs: treeOnly ? [] : globs.filter((_glob: string, index: number): boolean =>
          !names.some((name: string): boolean => expressions[index]!.test(name))),
        milliseconds: { source: Math.round(defined - started), loft: Math.round(performance.now() - defined) },
        loft: document.provenance,
        diagnostics: source.diagnostics,
        sourceRecords: source.sourceRecords,
        sourceObservation: source.observation,
      },
    };
  },
};

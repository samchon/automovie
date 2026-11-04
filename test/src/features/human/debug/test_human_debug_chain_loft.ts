import { AutoMovieConstructionViews, AutoMovieSolidBody, AutoMovieSolidChain, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";

import { HumanDebugChainLoft } from "../../../../../packages/human/debug/pieces/HumanDebugChainLoft";
import type { IHumanDebugDocument } from "../../../../../packages/human/debug/contracts/IHumanDebugDocument";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A raw chain selection draws its operands independently of the full body's
 * trimmed-face inventory, without changing the caller's calibration.
 *
 * Scenarios:
 * 1. Two closed ellipsoids are published together. Selecting one draws its
 *    raw skin and curves without needing the other body's chain.
 * 2. Selecting both draws both, and a missing name reports the inventory.
 * 3. Repeating the selection leaves the original body and diagnostics intact.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual chain-piece builder with a published two-face body and inspects its returned skin and construction. A whole-body solid record leaking into a subset makes the selected skin disappear and fails this test.
 * @evidence contracts/testing.md#independent-expectations A raw selection must contain exactly the requested operands; the selected ellipsoid is centred at the origin and its neighbour ten metres away, so a leaked neighbour cannot meet the selected bounds. No generated-person snapshot or reference fit supplies an answer.
 * @evidence contracts/testing.md#distinguishing-cases Covers a singleton, a two-chain group, an empty match, repeated reads and original-record preservation. Joined-skin topology belongs to construction tests; this piece intentionally shows the raw operands.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit under --include human_debug_chain_loft; it creates analytic parts in process without generating a person or starting a host.
 */
export function test_human_debug_chain_loft(): void {
  const chains: IAutoMovieLoftChain[] = [0, 10].map((offset: number, index: number): IAutoMovieLoftChain => {
    const part: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
      ConstructionShapes.ellipsoid(index === 0 ? "selected" : "neighbour", { ...ConstructionShapes.DOWN, origin: { x: offset, y: 0, z: 0 } }, 0.01, 0.008, 0.02),
    );
    if (typeof part === "string") throw new Error(part);
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    if (loft.chain === null) throw new Error("The analytic ellipsoid was not lofted");
    return loft.chain;
  });
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("both", chains.map((chain: IAutoMovieLoftChain): AutoMovieSolidBody.IFaceInput => {
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    if (surface === null) throw new Error("The analytic ellipsoid has no surface");
    return { surface, stations: chain.layers.map((layer: IAutoMovieLoftChain.ILayer): number => layer.y), phases: ConstructionShapes.uniform(0, 2 * Math.PI, 17).slice(0, -1) };
  }));
  const calibration: IAutoMovieHumanBodyCalibration = { stature: 100, chains, events: [], poles: [], apertures: [], eyes: [], bodies: [AutoMovieSolidBody.publish(body)], diagnostics: [] };
  const original: string = JSON.stringify(calibration.bodies);
  for (const names of [["selected"], ["selected", "neighbour"], ["selected"]]) {
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(calibration, names);
    const found: Set<string> = new Set(document.parts.map((part: IHumanDebugDocument.IPart): string => part.id.slice("human.skin.".length, part.id.lastIndexOf("/"))));
    if (found.size !== names.length || names.some((name: string): boolean => !found.has(name))) throw new Error("Raw selection lost or added a requested skin");
    if (document.parts.some((part: IHumanDebugDocument.IPart): boolean => part.indices.length === 0 || part.points.some((point: IHumanDebugDocument.Point): boolean => point.some((value: number): boolean => !Number.isFinite(value))))) throw new Error("A raw skin has no triangles or a non-finite point");
    for (const name of names)
      if (!document.parts.some((part: IHumanDebugDocument.IPart): boolean => part.curves.some((curve: IHumanDebugDocument.ICurve): boolean => curve.id.startsWith("human.construction." + name + "/")))) throw new Error("A raw chain has no construction curves");
    if (names.length === 1 && document.parts.some((part: IHumanDebugDocument.IPart): boolean => part.points.some((point: IHumanDebugDocument.Point): boolean => Math.abs(point[0]) > 10.000001))) throw new Error("A raw singleton contains its distant neighbour");
  }
  let refused: boolean = false;
  try {
    HumanDebugChainLoft.build(calibration, ["missing"]);
  } catch (error) {
    refused = error instanceof Error && error.message.includes("No chain matches") && error.message.includes("selected") && error.message.includes("neighbour");
  }
  if (!refused) throw new Error("An empty raw selection did not name its available chains");
  if (JSON.stringify(calibration.bodies) !== original || calibration.diagnostics!.length !== 0) throw new Error("Raw inspection changed the original body's records");
}

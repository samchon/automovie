import { AutoMovieConstructionViews } from "@automovie/engine";
import { AutoMovieHumanBodyTree } from "@automovie/human";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionView,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * Bind all original leaves of a five-way body split in the declared order.
 *
 * Scenarios:
 *
 * 1. A forefoot and five declared views bind to all six names in the supplied
 *    original table.
 * 2. Rebinding that same definition preserves its object identity.
 * 3. Omitting the final original is refused with its actual name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production body source binding and checks its actual split children.
 * @evidence contracts/development/testing.md#independent-expectations The fixture names five child views and supplies one distinct original for each.
 * @evidence contracts/development/testing.md#distinguishing-cases Valid five-way binding, an already bound tree, and an absent original beyond the first two children.
 * @evidence contracts/development/testing.md#execution-ownership Uses small analytic section declarations without realizing skin or reading a model.
 * @evidence contracts/development/common.md#meaningful-documentation Names the order, exact identity and missing source checks.
 */
export function test_human_body_split_sources(): void {
  const parts: Map<string, IAutoMovieViewPart> = new Map();
  const view = (name: string): IAutoMovieConstructionView => {
    const declaration: IAutoMovieConstructionView = ConstructionShapes.part(
      name,
      ConstructionShapes.DOWN,
      [0, 0.02],
      (): [number, number, number, number] => [0.005, 0.005, 0.005, 0.005],
      "open",
    );
    const original: IAutoMovieViewPart | string =
      AutoMovieConstructionViews.part(declaration);
    if (typeof original === "string") throw new Error(original);
    parts.set(name, original);
    return declaration;
  };
  const child = (index: number): IAutoMovieConstructionSplit.IChild => {
    const source: string = `toe.${index}`;
    return {
      band: `web.${index}`,
      part: view(source),
      partFace: source,
      partEnd: "bottom",
      rail: 0.005,
    };
  };
  const split: IAutoMovieConstructionSplit = {
    type: "split",
    name: "forefoot.split",
    host: view("forefoot"),
    hostFace: "forefoot",
    hostEnd: "top",
    seam: [0, Math.PI],
    count: 8,
    rows: 1,
    children: [child(1), child(2), child(3), child(4), child(5)],
  };
  const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
  const bound: IAutoMovieConstructionNode | null =
    AutoMovieHumanBodyTree.sources(split, parts, diagnostics);
  const errors: string[] = [];
  if (
    bound?.type !== "split" ||
    bound.host.type !== "source" ||
    bound.children.length !== split.children.length ||
    bound.children.some(
      (
        { part, band }: IAutoMovieConstructionSplit.IChild,
        index: number,
      ): boolean =>
        part.type !== "source" ||
        part.source !== `toe.${index + 1}` ||
        band !== `web.${index + 1}`,
    ) ||
    diagnostics.length !== 0
  )
    errors.push(
      `expected all five bound children in order, got ${bound?.type === "split" ? bound.children.length : 0}`,
    );
  if (
    bound !== null &&
    AutoMovieHumanBodyTree.sources(bound, parts, diagnostics) !== bound
  )
    errors.push("rebinding an unchanged split copied the tree");

  parts.delete("toe.5");
  const missing: IAutoMovieConstructionNode | null =
    AutoMovieHumanBodyTree.sources(split, parts, diagnostics);
  if (
    missing !== null ||
    !diagnostics.some(({ detail }): boolean => detail.includes("toe.5"))
  )
    errors.push("an absent last child did not refuse the split");
  if (errors.length !== 0) throw new Error(errors.join("\n"));
}

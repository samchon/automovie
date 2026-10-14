import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieModel,
  IAutoMovieShotBuildContext,
  IAutoMovieSpace,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieSubject } from "@automovie/engine";
import { AutoMovieSubjectGroup } from "@automovie/engine";
import type { IAutoMovieSubjectContribution } from "@automovie/engine";
import { lowerBuiltEnvironment } from "@automovie/engine";
import { createModel } from "../internal/fixtures";
import { nclose } from "../internal/nclose";
import { sameProductData } from "../internal/sameProductData";

const context: IAutoMovieShotBuildContext = {} as IAutoMovieShotBuildContext;

const STOREY_HEIGHT: number = 3.2;

const identity: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const slabTransform: (y: number) => IAutoMovieTransform = (
  y: number,
): IAutoMovieTransform => ({
  ...identity(0, y, 0),
  scale: { x: 8, y: 0.2, z: 6 },
});

const storeySpace: (index: number) => IAutoMovieBuiltSpace = (
  index: number,
): IAutoMovieBuiltSpace => ({
  id: `storey-${index}`,
  kind: "storey",
  parent: "whole",
  cells: [],
});

/**
 * The one building this file repeats, written once as a loop over its storeys.
 *
 * Nothing about a storey is stated twice: the slab element, the logical space, and the stair joining it to the storey below are all derived from the same index, which is what makes a thirty-storey tower the same source as a three-storey one.
 */
class LoopedWing extends AutoMovieSubject<IAutoMovieBuiltEnvironment> {
  /** Retain the authored namespace and storey count used by the existing cases. */
  public constructor(
    /** Namespace of this fixture's building and contribution ids. */
    public readonly id: string,
    /** Authored number of slab/space rows, without extra admission here. */
    public readonly storeys: number,
  ) {
    super();
  }

  /** Derive fresh slab, space and inter-storey connector records from the same indices. */
  public design(): IAutoMovieBuiltEnvironment {
    const indices: number[] = Array.from(
      { length: this.storeys },
      (_: unknown, index: number): number => index,
    );
    return {
      version: 1,
      id: this.id,
      units: "meter",
      buildings: [{ id: `${this.id}-unit`, element: "root", space: "whole" }],
      models: [{ ...createModel(null), id: `${this.id}-slab` }],
      modelReferences: [],
      elements: [
        {
          id: "root",
          kind: "building",
          parent: null,
          transform: identity(0, 0, 0),
          model: null,
          space: "whole",
        },
        ...indices.map(
          (
            index: number,
          ): {
            id: string;
            kind: string;
            parent: string;
            transform: IAutoMovieTransform;
            model: string;
            space: string;
          } => ({
            id: `slab-${index}`,
            kind: "floor-slab",
            parent: "root",
            transform: slabTransform(index * STOREY_HEIGHT),
            model: `${this.id}-slab`,
            space: `storey-${index}`,
          }),
        ),
      ],
      spaces: [
        { id: "whole", kind: "building", parent: null, cells: [] },
        ...indices.map(storeySpace),
      ],
      boundaries: indices.slice(1).map(
        (
          index: number,
        ): {
          id: string;
          kind: string;
          spaces: string[];
          elements: string[];
        } => ({
          id: `slab-boundary-${index}`,
          kind: "floor-ceiling",
          spaces: [`storey-${index - 1}`, `storey-${index}`],
          elements: [`slab-${index}`],
        }),
      ),
      openings: [],
      connectors: indices.slice(1).map(
        (
          index: number,
        ): {
          id: string;
          kind: "stair";
          from: string;
          to: string;
          bidirectional: true;
          route: { x: number; y: number; z: number }[];
          width: number;
          clearHeight: number;
          elements: never[];
        } => ({
          id: `stair-${index}`,
          kind: "stair" as const,
          from: `storey-${index - 1}`,
          to: `storey-${index}`,
          bidirectional: true,
          route: [
            { x: -3, y: (index - 1) * STOREY_HEIGHT, z: 0 },
            { x: -1, y: index * STOREY_HEIGHT, z: 0 },
          ],
          width: 1.4,
          clearHeight: 2.2,
          elements: [],
        }),
      ),
      surfaces: [],
      walkable: [],
    };
  }

  /** Lower this authored graph to CPU contributions; the fixture consumes no context field. */
  public render(
    _context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return lowerBuiltEnvironment(this.design());
  }
}

/** A group of wings, which is itself just another subject. */
class Wings extends AutoMovieSubjectGroup<null, LoopedWing> {
  /** Keep the namespace and borrowed leaf list in authored merge order. */
  public constructor(
    /** Group identity, unused by the inherited contribution merge. */
    public readonly id: string,
    /** Borrowed ordered leaves returned without copying by members. */
    private readonly wings: readonly LoopedWing[],
  ) {
    super();
  }

  /** This grouping fixture has no independent design payload. */
  public design(): null {
    return null;
  }

  /** Expose the existing leaf order to the inherited CPU merge. */
  public members(): readonly LoopedWing[] {
    return this.wings;
  }
}

/** A building that is a group of wing groups, composed with no new rules. */
class Campus extends AutoMovieSubjectGroup<null, Wings> {
  /** Stable outer group identity, unused by the inherited merge. */
  public readonly id: string = "campus";

  /** Retain the authored nested groups in their merge order. */
  public constructor(private readonly wings: readonly Wings[]) {
    super();
  }

  /** This outer grouping fixture has no independent design payload. */
  public design(): null {
    return null;
  }

  /** Expose nested groups without changing their supplied order. */
  public members(): readonly Wings[] {
    return this.wings;
  }
}

/** Order field names lexically so the contributed key list is compared stably. */
const alphabetical: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);

/**
 * Render existing subject groups and compare their ordered merged contributions with the authored leaf contributions.
 *
 * Scenarios:
 * 1. The group's CPU contribution preserves the authored building/model/node/space id order for its distinct leaves.
 * 2. Nesting groups (campus of wing-groups of wings) yields the same flat merge as the leaves in the same order, so the hierarchy is free.
 * 3. Visible and semantic output stay joined through the merge: every merged set node is namespaced by the building that emitted it, and so is every space.
 * 4. This population-free leaf contributes exactly the builtEnvironments/models/set/spaces keys; its fixture render ignores the supplied context.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls AutoMovieSubjectGroup.render through Wings/Campus and lowerBuiltEnvironment through LoopedWing.render, observing merged id order, complete nested-versus-flat plain data, ownership-prefix counts and the leaf's contribution keys. Omitted members, changed merge order or extra contribution domains change these observations; render here returns CPU records and invokes no image renderer.
 * @evidence contracts/testing.md#independent-expectations Literal north/south/east storey counts 2/3/1 determine the explicit model/node/space lists. Nested and flat results must match through sameProductData with numeric tolerance zero, so this relational check proves grouping equivalence for these leaves while both sides share the same lowerer. The separately rendered three-storey leaf fixes the four-key expectation; duplicate ids, empty contributions and arbitrary context-dependent subjects are not exercised.
 * @evidence contracts/testing.md#distinguishing-cases Flat and nested groups, ownership prefixes and the exact contribution-key set expose reordering or extra domains; the fixture render ignores its supplied context, so this does not prove context independence for arbitrary subjects.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_composition imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_composition(): void {
  const looped: LoopedWing = new LoopedWing("north", 3);
  const north: LoopedWing = new LoopedWing("north", 2);
  const south: LoopedWing = new LoopedWing("south", 3);
  const east: LoopedWing = new LoopedWing("east", 1);
  const flat: Wings = new Wings("flat", [north, south, east]);
  const nested: Campus = new Campus([
    new Wings("pair", [north, south]),
    new Wings("single", [east]),
  ]);
  const merged: IAutoMovieSubjectContribution = flat.render(context);
  TestValidator.equals(
    "a group render is the stable merge of its leaves",
    {
      buildings: merged.builtEnvironments?.map(
        (value: IAutoMovieBuiltEnvironment): string => value.id,
      ),
      models: merged.models?.map((model: IAutoMovieModel): string => model.id),
      set: merged.set?.map(
        (piece: IAutoMovieStageSetPiece): string => piece.node,
      ),
      spaces: merged.spaces?.map((space: IAutoMovieSpace): string => space.id),
    },
    {
      buildings: ["north", "south", "east"],
      models: ["north-slab", "south-slab", "east-slab"],
      set: [
        "north/slab-0",
        "north/slab-1",
        "south/slab-0",
        "south/slab-1",
        "south/slab-2",
        "east/slab-0",
      ],
      spaces: [
        "north/whole",
        "north/storey-0",
        "north/storey-1",
        "south/whole",
        "south/storey-0",
        "south/storey-1",
        "south/storey-2",
        "east/whole",
        "east/storey-0",
      ],
    },
  );
  TestValidator.predicate(
    "grouping depth does not change what a group contributes",
    sameProductData(nested.render(context), merged),
  );
  TestValidator.predicate(
    "merged visible nodes and merged spaces stay owned by their building",
    ((): boolean => {
      const observed: {
        unnamespacedNodes: number;
        unnamespacedSpaces: number;
      } = {
        unnamespacedNodes: (merged.set ?? []).filter(
          (piece: IAutoMovieStageSetPiece): boolean =>
            !(merged.builtEnvironments ?? []).some(
              (value: IAutoMovieBuiltEnvironment): boolean =>
                piece.node.startsWith(`${value.id}/`),
            ),
        ).length,
        unnamespacedSpaces: (merged.spaces ?? []).filter(
          (space: IAutoMovieSpace): boolean =>
            !(merged.builtEnvironments ?? []).some(
              (value: IAutoMovieBuiltEnvironment): boolean =>
                space.id.startsWith(`${value.id}/`),
            ),
        ).length,
      };
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 2 &&
        Object.hasOwn(observed, "unnamespacedNodes") &&
        typeof observed["unnamespacedNodes"] === "number" &&
        Number.isInteger(observed["unnamespacedNodes"]) &&
        nclose(observed["unnamespacedNodes"], 0, 0) &&
        Object.hasOwn(observed, "unnamespacedSpaces") &&
        typeof observed["unnamespacedSpaces"] === "number" &&
        Number.isInteger(observed["unnamespacedSpaces"]) &&
        nclose(observed["unnamespacedSpaces"], 0, 0)
      );
    })(),
  );
  TestValidator.equals(
    "a lowered building contributes nothing beyond its own graphs",
    Object.keys(looped.render(context)).sort(alphabetical),
    ["builtEnvironments", "models", "set", "spaces"],
  );
}

import {
  AutoMovieSubject,
  AutoMovieSubjectGroup,
  type IAutoMovieSubjectContribution,
  lowerBuiltEnvironment,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieShotBuildContext,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";

const context = {} as IAutoMovieShotBuildContext;

const STOREY_HEIGHT = 3.2;

const identity = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const slabTransform = (y: number): IAutoMovieTransform => ({
  ...identity(0, y, 0),
  scale: { x: 8, y: 0.2, z: 6 },
});

const storeySpace = (index: number): IAutoMovieBuiltSpace => ({
  id: `storey-${index}`,
  kind: "storey",
  parent: "whole",
  cells: [],
});

/**
 * The one building this file repeats, written once as a loop over its storeys.
 *
 * Nothing about a storey is stated twice: the slab element, the logical space,
 * and the stair joining it to the storey below are all derived from the same
 * index, which is what makes a thirty-storey tower the same source as a
 * three-storey one.
 */
class LoopedWing extends AutoMovieSubject<IAutoMovieBuiltEnvironment> {
  public constructor(
    public readonly id: string,
    public readonly storeys: number,
  ) {
    super();
  }

  public design(): IAutoMovieBuiltEnvironment {
    const indices = Array.from({ length: this.storeys }, (_, index) => index);
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
        ...indices.map((index) => ({
          id: `slab-${index}`,
          kind: "floor-slab",
          parent: "root",
          transform: slabTransform(index * STOREY_HEIGHT),
          model: `${this.id}-slab`,
          space: `storey-${index}`,
        })),
      ],
      spaces: [
        { id: "whole", kind: "building", parent: null, cells: [] },
        ...indices.map(storeySpace),
      ],
      boundaries: indices.slice(1).map((index) => ({
        id: `slab-boundary-${index}`,
        kind: "floor-ceiling",
        spaces: [`storey-${index - 1}`, `storey-${index}`],
        elements: [`slab-${index}`],
      })),
      openings: [],
      connectors: indices.slice(1).map((index) => ({
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
      })),
      surfaces: [],
      walkable: [],
    };
  }

  public render(
    _context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return lowerBuiltEnvironment(this.design());
  }
}

/** A group of wings, which is itself just another subject. */
class Wings extends AutoMovieSubjectGroup<null, LoopedWing> {
  public constructor(
    public readonly id: string,
    private readonly wings: readonly LoopedWing[],
  ) {
    super();
  }

  public design(): null {
    return null;
  }

  public members(): readonly LoopedWing[] {
    return this.wings;
  }
}

/** A building that is a group of wing groups, composed with no new rules. */
class Campus extends AutoMovieSubjectGroup<null, Wings> {
  public readonly id = "campus";

  public constructor(private readonly wings: readonly Wings[]) {
    super();
  }

  public design(): null {
    return null;
  }

  public members(): readonly Wings[] {
    return this.wings;
  }
}

/** Order field names lexically so the contributed key list is compared stably. */
const alphabetical = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

/**
 * Composition is merge: a group of buildings must be exactly the stable
 * concatenation of what its leaves said, however deeply the groups nest, and a
 * lowered building must contribute nothing but its own graphs. This pins both,
 * because each is a place where a second, disagreeing answer could otherwise
 * appear.
 *
 * Scenarios:
 *
 * 1. A group's render is the stable, order-preserving concatenation of its leaves'
 *    contributions, with nothing deduplicated and nothing reordered.
 * 2. Nesting groups (campus of wing-groups of wings) yields the same flat merge as
 *    the leaves in the same order, so the hierarchy is free.
 * 3. Visible and semantic output stay joined through the merge: every merged set
 *    node is namespaced by the building that emitted it, and so is every
 *    space.
 * 4. A lowered building contributes only its built environment, models, set
 *    pieces and spaces, so no external context enters its contribution.
 */
export const test_architecture_built_environment_composition = (): void => {
  const looped = new LoopedWing("north", 3);
  const north = new LoopedWing("north", 2);
  const south = new LoopedWing("south", 3);
  const east = new LoopedWing("east", 1);
  const flat = new Wings("flat", [north, south, east]);
  const nested = new Campus([
    new Wings("pair", [north, south]),
    new Wings("single", [east]),
  ]);
  const merged = flat.render(context);
  TestValidator.equals(
    "a group render is the stable merge of its leaves",
    {
      buildings: merged.builtEnvironments?.map((value) => value.id),
      models: merged.models?.map((model) => model.id),
      set: merged.set?.map((piece) => piece.node),
      spaces: merged.spaces?.map((space) => space.id),
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
  TestValidator.equals(
    "grouping depth does not change what a group contributes",
    nested.render(context),
    merged,
  );
  TestValidator.equals(
    "merged visible nodes and merged spaces stay owned by their building",
    {
      unnamespacedNodes: (merged.set ?? []).filter(
        (piece) =>
          !(merged.builtEnvironments ?? []).some((value) =>
            piece.node.startsWith(`${value.id}/`),
          ),
      ).length,
      unnamespacedSpaces: (merged.spaces ?? []).filter(
        (space) =>
          !(merged.builtEnvironments ?? []).some((value) =>
            space.id.startsWith(`${value.id}/`),
          ),
      ).length,
    },
    { unnamespacedNodes: 0, unnamespacedSpaces: 0 },
  );
  TestValidator.equals(
    "a lowered building contributes nothing beyond its own graphs",
    Object.keys(looped.render(context)).sort(alphabetical),
    ["builtEnvironments", "models", "set", "spaces"],
  );
};

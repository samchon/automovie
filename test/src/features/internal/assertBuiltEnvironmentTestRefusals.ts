import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentTestRefusalPaths as refusalPaths } from "./builtEnvironmentTestRefusalPaths";
import { builtEnvironmentTestTransform as transform } from "./builtEnvironmentTestTransform";

/** Run the existing malformed BuiltEnvironmentTest cases in their authored order. */
export const assertBuiltEnvironmentTestRefusals = (): void => {
  const malformed: Array<
    readonly [string, (value: IAutoMovieBuiltEnvironment) => void, string]
  > = [
    ["blank building id", (value) => (value.id = " "), "$input.id"],
    ["unknown version", (value) => (value.version = 2 as 1), "$input.version"],
    [
      "unknown units",
      (value) => (value.units = "foot" as "meter"),
      "$input.units",
    ],
    [
      "no building units",
      (value) => (value.buildings = []),
      "$input.buildings",
    ],
    [
      "duplicate building unit",
      (value) => value.buildings.push(value.buildings[0]!),
      "$input.buildings[1].id",
    ],
    [
      "blank building unit",
      (value) => (value.buildings[0]!.id = " "),
      "$input.buildings[0].id",
    ],
    [
      "missing building element",
      (value) => (value.buildings[0]!.element = "missing"),
      "$input.buildings[0].element",
    ],
    [
      "nested building element",
      (value) => (value.buildings[0]!.element = "ground-slab"),
      "$input.buildings[0].element",
    ],
    [
      "missing building space",
      (value) => (value.buildings[0]!.space = "missing"),
      "$input.buildings[0].space",
    ],
    [
      "nested building space",
      (value) => (value.buildings[0]!.space = "ground"),
      "$input.buildings[0].space",
    ],
    [
      "shared building element root",
      (value) =>
        value.buildings.push({ id: "annex", element: "root", space: "upper" }),
      "$input.buildings[1].element",
    ],
    [
      "shared building space root",
      (value) =>
        value.buildings.push({
          id: "annex",
          element: "bridge",
          space: "whole",
        }),
      "$input.buildings[1].space",
    ],
    [
      "unowned root element",
      (value) =>
        value.elements.push({
          id: "detached-root",
          kind: "folly",
          parent: null,
          transform: transform(40),
          model: null,
          space: null,
        }),
      "$input.elements[5].parent",
    ],
    [
      "unowned root space",
      (value) =>
        value.spaces.push({
          id: "detached",
          kind: "room",
          parent: null,
          cells: [],
        }),
      "$input.spaces[4].parent",
    ],
    [
      "duplicate model",
      (value) => value.models.push(value.models[0]!),
      "$input.models[1].id",
    ],
    [
      "invalid owned model",
      (value) => (value.models[0]!.id = " "),
      "$input.models[0].id",
    ],
    [
      "blank model reference",
      (value) => (value.modelReferences[0] = " "),
      "$input.modelReferences[0]",
    ],
    [
      "owned model reference",
      (value) => value.modelReferences.push("slab"),
      "$input.modelReferences[1]",
    ],
    [
      "duplicate model reference",
      (value) => value.modelReferences.push("external-stone"),
      "$input.modelReferences[1]",
    ],
    [
      "blank space id",
      (value) => (value.spaces[1]!.id = " "),
      "$input.spaces[1].id",
    ],
    [
      "blank space kind",
      (value) => (value.spaces[1]!.kind = " "),
      "$input.spaces[1].kind",
    ],
    [
      "missing space parent",
      (value) => (value.spaces[1]!.parent = "missing"),
      "$input.spaces[1].parent",
    ],
    [
      "space cycle",
      (value) => (value.spaces[0]!.parent = "ground"),
      "$input.spaces[0].parent",
    ],
    [
      "blank cell id",
      (value) => (value.spaces[1]!.cells[0]!.id = " "),
      "$input.spaces[1].cells[0].id",
    ],
    [
      "duplicate cell",
      (value) => value.spaces[1]!.cells.push(value.spaces[1]!.cells[0]!),
      "$input.spaces[1].cells[1].id",
    ],
    [
      "too few cell planes",
      (value) => (value.spaces[1]!.cells[0]!.planes = []),
      "$input.spaces[1].cells[0].planes",
    ],
    [
      "non-finite plane normal",
      (value) => (value.spaces[1]!.cells[0]!.planes[0]!.normal.x = Number.NaN),
      "$input.spaces[1].cells[0].planes[0].normal.x",
    ],
    [
      "zero plane normal",
      (value) =>
        (value.spaces[1]!.cells[0]!.planes[0]!.normal = { x: 0, y: 0, z: 0 }),
      "$input.spaces[1].cells[0].planes[0].normal",
    ],
    [
      "non-finite plane offset",
      (value) =>
        (value.spaces[1]!.cells[0]!.planes[0]!.offset =
          Number.POSITIVE_INFINITY),
      "$input.spaces[1].cells[0].planes[0].offset",
    ],
    [
      "duplicate element",
      (value) => value.elements.push(value.elements[0]!),
      "$input.elements[5].id",
    ],
    [
      "blank element id",
      (value) => (value.elements[1]!.id = " "),
      "$input.elements[1].id",
    ],
    [
      "blank element kind",
      (value) => (value.elements[1]!.kind = " "),
      "$input.elements[1].kind",
    ],
    [
      "missing element parent",
      (value) => (value.elements[1]!.parent = "missing"),
      "$input.elements[1].parent",
    ],
    [
      "missing element model",
      (value) => (value.elements[1]!.model = "missing"),
      "$input.elements[1].model",
    ],
    [
      "missing element space",
      (value) => (value.elements[1]!.space = "missing"),
      "$input.elements[1].space",
    ],
    [
      "invalid element transform",
      (value) => (value.elements[1]!.transform.scale.x = 0),
      "$input.elements[1].transform.scale.x",
    ],
    [
      "element cycle",
      (value) => (value.elements[0]!.parent = "ground-slab"),
      "$input.elements[0].parent",
    ],
    [
      "hierarchical shear",
      (value) => {
        value.elements[0]!.transform.scale = { x: 2, y: 1, z: 1 };
        value.elements[1]!.transform.rotation = {
          x: 0,
          y: 0,
          z: Math.sin(Math.PI / 8),
          w: Math.cos(Math.PI / 8),
        };
      },
      "$input.elements[1].transform",
    ],
    [
      "duplicate boundary",
      (value) => value.boundaries.push(value.boundaries[0]!),
      "$input.boundaries[2].id",
    ],
    [
      "blank boundary id",
      (value) => (value.boundaries[0]!.id = " "),
      "$input.boundaries[0].id",
    ],
    [
      "blank boundary kind",
      (value) => (value.boundaries[0]!.kind = " "),
      "$input.boundaries[0].kind",
    ],
    [
      "empty boundary spaces",
      (value) => (value.boundaries[0]!.spaces = []),
      "$input.boundaries[0].spaces",
    ],
    [
      "three boundary spaces",
      (value) => value.boundaries[0]!.spaces.push("roof"),
      "$input.boundaries[0].spaces",
    ],
    [
      "missing boundary space",
      (value) => (value.boundaries[0]!.spaces[0] = "missing"),
      "$input.boundaries[0].spaces[0]",
    ],
    [
      "duplicate boundary space",
      (value) => (value.boundaries[0]!.spaces[1] = "ground"),
      "$input.boundaries[0].spaces[1]",
    ],
    [
      "missing boundary element",
      (value) => (value.boundaries[0]!.elements[0] = "missing"),
      "$input.boundaries[0].elements[0]",
    ],
    [
      "duplicate boundary element",
      (value) => value.boundaries[0]!.elements.push("bridge"),
      "$input.boundaries[0].elements[1]",
    ],
    [
      "duplicate opening",
      (value) => value.openings.push(value.openings[0]!),
      "$input.openings[1].id",
    ],
    [
      "blank opening id",
      (value) => (value.openings[0]!.id = " "),
      "$input.openings[0].id",
    ],
    [
      "blank opening kind",
      (value) => (value.openings[0]!.kind = " "),
      "$input.openings[0].kind",
    ],
    [
      "opening without host",
      (value) => (value.openings[0]!.boundary = "missing"),
      "$input.openings[0].boundary",
    ],
    [
      "missing opening fill",
      (value) => (value.openings[0]!.fill = "missing"),
      "$input.openings[0].fill",
    ],
    [
      "duplicate connector",
      (value) => value.connectors.push(value.connectors[0]!),
      "$input.connectors[3].id",
    ],
    [
      "unknown connector kind",
      (value) => (value.connectors[0]!.kind = "teleport" as "other"),
      "$input.connectors[0].kind",
    ],
    [
      "missing connector from",
      (value) => (value.connectors[0]!.from = "missing"),
      "$input.connectors[0].from",
    ],
    [
      "missing connector to",
      (value) => (value.connectors[0]!.to = "missing"),
      "$input.connectors[0].to",
    ],
    [
      "same connector endpoints",
      (value) => (value.connectors[0]!.to = "ground"),
      "$input.connectors[0].to",
    ],
    [
      "short connector route",
      (value) => (value.connectors[0]!.route = []),
      "$input.connectors[0].route",
    ],
    [
      "non-finite connector route",
      (value) => (value.connectors[0]!.route[0]!.x = Number.NaN),
      "$input.connectors[0].route[0].x",
    ],
    [
      "invalid connector width",
      (value) => (value.connectors[0]!.width = 0),
      "$input.connectors[0].width",
    ],
    [
      "invalid connector clearance",
      (value) => (value.connectors[0]!.clearHeight = Number.NaN),
      "$input.connectors[0].clearHeight",
    ],
    [
      "missing connector element",
      (value) => (value.connectors[0]!.elements[0] = "missing"),
      "$input.connectors[0].elements[0]",
    ],
    [
      "duplicate connector element",
      (value) => value.connectors[0]!.elements.push("bridge"),
      "$input.connectors[0].elements[1]",
    ],
    [
      "missing surface space",
      (value) => (value.surfaces[0]!.space = "missing"),
      "$input.surfaces[0].space",
    ],
    [
      "invalid support surface",
      (value) => (value.surfaces[0]!.surface.polygon = []),
      "$input.surfaces[0].surface.polygon",
    ],
    [
      "duplicate support surface",
      (value) => value.surfaces.push(value.surfaces[0]!),
      "$input.surfaces[3].surface.id",
    ],
    [
      "missing walkable surface",
      (value) => value.walkable.push("missing"),
      "$input.walkable[2]",
    ],
    [
      "duplicate walkable surface",
      (value) => value.walkable.push("ground-floor"),
      "$input.walkable[2]",
    ],
  ];
  malformed.forEach(([name, mutate, path]) =>
    TestValidator.equals(
      `${name} is refused at ${path}`,
      refusalPaths(mutate).includes(path),
      true,
    ),
  );
};

import {
  deriveAutoMovieSemanticMask,
  resolveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Stable building layers retain their nearest owner and resolve a door pixel through the declared ownership chain.
 *
 * Scenarios:
 * 1. The13 named layers retain their expected building, room, boundary, opening, element and slot owners.
 * 2. A door-leaf colour resolves its node and six declared ancestors with their semantic labels.
 */
export const test_render_semantic_mask = (): void => {
  const { subject } = createSemanticMaskTestInputs();

  const mask = deriveAutoMovieSemanticMask(subject());

  const owners = new Map(mask.entries.map((entry) => [entry.id, entry.owner]));

  TestValidator.equals(
      "every addressable layer of the building is an entry with the tightest owner",
      {
        building: owners.get("building:tower/unit-a"),
        rootSpace: owners.get("space:tower/site"),
        room: owners.get("space:tower/ground-hall"),
        facade: owners.get("boundary:tower/hall-facade"),
        door: owners.get("opening:tower/hall-door"),
        doorLeaf: owners.get("element:tower/hall-door-leaf"),
        wall: owners.get("element:tower/hall-wall"),
        slab: owners.get("element:tower/loft-slab"),
        shell: owners.get("element:tower/shell"),
        prop: owners.get("node:lantern"),
        water: owners.get("water-body:atrium-pool"),
        set: owners.get("instance-set:windows"),
        slot: owners.get("instance-slot:windows#7"),
      },
      {
        building: null,
        rootSpace: "building:tower/unit-a",
        room: "space:tower/ground",
        facade: "space:tower/ground-hall",
        door: "boundary:tower/hall-facade",
        doorLeaf: "opening:tower/hall-door",
        wall: "boundary:tower/hall-facade",
        slab: "element:tower/shell",
        shell: "building:tower/unit-a",
        prop: null,
        water: "space:tower/ground-hall",
        set: null,
        slot: "instance-set:windows",
      },
    );

  const leaf = mask.entries.find(
      (entry) => entry.id === "element:tower/hall-door-leaf",
    )!;

  const resolved = resolveAutoMovieSemanticMask(mask, leaf.color)!;

  TestValidator.equals(
      "a door pixel resolves to the door and everything containing it",
      {
        entry: resolved.entry.id,
        label: resolved.entry.label,
        nodes: resolved.entry.nodes,
        ancestors: resolved.ancestors.map((entry) => entry.id),
        labels: resolved.ancestors.map((entry) => entry.label),
      },
      {
        entry: "element:tower/hall-door-leaf",
        label: "door-leaf",
        nodes: ["tower/hall-door-leaf"],
        ancestors: [
          "opening:tower/hall-door",
          "boundary:tower/hall-facade",
          "space:tower/ground-hall",
          "space:tower/ground",
          "space:tower/site",
          "building:tower/unit-a",
        ],
        labels: ["door", "wall", "room", "storey", "building", null],
      },
    );
};

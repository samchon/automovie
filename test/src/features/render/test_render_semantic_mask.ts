import {
  IAutoMovieSceneNode,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieRenderSubject } from "../../../../packages/engine/src/render/IAutoMovieRenderSubject";
import { IAutoMovieSemanticMaskResolution } from "../../../../packages/engine/src/render/IAutoMovieSemanticMaskResolution";
import { deriveAutoMovieSemanticMask } from "../../../../packages/engine/src/render/deriveAutoMovieSemanticMask";
import { resolveAutoMovieSemanticMask } from "../../../../packages/engine/src/render/resolveAutoMovieSemanticMask";
import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Stable building layers retain their nearest owner and resolve a declared door-leaf colour through the ownership chain.
 *
 * Scenarios:
 * 1. The 13 named layers retain their expected building, room, boundary, opening, element and slot owners.
 * 2. A door-leaf colour resolves its node and six declared ancestors with their semantic labels.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual semantic entries and resolves a declared door-leaf colour, checking tight owner joins, drawing-node identity and the reachable ancestor chain.
 * @evidence contracts/testing.md#independent-expectations The authored building's unit, spaces, facade, opening and leaf hierarchy supplies thirteen hand-listed owners and six ancestor labels; lookup uses a derived colour as its key, so this is ownership/lookup consistency rather than an independent palette-colour oracle.
 * @evidence contracts/testing.md#distinguishing-cases Logical containers, orphan-free prop, water body and compact set/slot cover distinct claim classes; dangling/cyclic lookup, collisions and capacity have their own units.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask owns its cases. Portable semantic metadata derivation and lookup, with no pixel buffer, mask drawing or GPU segmentation.
 */
export function test_render_semantic_mask(): void {
  const {
    subject,
  }: {
    subject: () => IAutoMovieRenderSubject;
    bulk: (semantic: string) => IAutoMovieSceneNode;
    broken: (owner: string) => IAutoMovieSemanticMask;
    cyclic: () => IAutoMovieSemanticMask;
  } = createSemanticMaskTestInputs();

  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(subject());

  const owners: Map<string, string | null> = new Map(
    mask.entries.map(
      (entry: IAutoMovieSemanticMaskEntry): [string, string | null] => [
        entry.id,
        entry.owner,
      ],
    ),
  );

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

  const leaf: IAutoMovieSemanticMaskEntry = mask.entries.find(
    (entry: IAutoMovieSemanticMaskEntry): boolean =>
      entry.id === "element:tower/hall-door-leaf",
  )!;

  const resolved: IAutoMovieSemanticMaskResolution =
    resolveAutoMovieSemanticMask(mask, leaf.color)!;

  TestValidator.equals(
    "a door pixel resolves to the door and everything containing it",
    {
      entry: resolved.entry.id,
      label: resolved.entry.label,
      nodes: resolved.entry.nodes,
      ancestors: resolved.ancestors.map(
        (entry: IAutoMovieSemanticMaskEntry): string => entry.id,
      ),
      labels: resolved.ancestors.map(
        (entry: IAutoMovieSemanticMaskEntry): string | null => entry.label,
      ),
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
}

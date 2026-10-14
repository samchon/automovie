import { describeAutoMovieSubject } from "@automovie/engine";
import {
  type IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  type IAutoMovieModel,
  type IAutoMovieSubjectArtifact,
  type IAutoMovieSubjectDescription,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { subjectInspectionInstanceSet } from "../internal/subjectInspectionInstanceSet";
import { subjectInspectionModel } from "../internal/subjectInspectionModel";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Compact set descriptions regenerate every supported placement law on demand
 * while keeping ordinary membership output bounded.
 *
 * Scenarios:
 *
 * 1. A 65-member grid reports the exact total, first 64 stable ids, one omitted
 *    member, and regenerates the last slot without enumerating it in output.
 * 2. Scatter, lattice, explicit, and along-route subjects each produce a finite
 *    world placement from compiled data.
 * 3. Explicit prototype selection links an instance to the selected runtime
 *    model and preserves the authored transform.
 * 4. Missing routes, zero-length routes, missing prototypes, malformed
 *    addresses, and out-of-range slots fail explicitly.
 *
 * @evidence contracts/testing.md#behavioral-verification Opens compact sets and individual members, checking bounded summaries, last-slot access, selected prototype, world placement and explicit malformed-law failures; wrong slot addressing or lost authored TRS fails.
 * @evidence contracts/testing.md#independent-expectations A centered 65-slot unit row spans minus/plus32, while the explicit quarter-turn maps local (7,1,2) plus anchor to (12,1,-7) and transforms the authored prototype box. These coordinates and identities are derived from input geometry; the other layout cases check finite placement only, not their complete distribution law.
 * @evidence contracts/testing.md#distinguishing-cases Keeps 64-item summary/65th access, scatter/lattice/explicit/route placements, prototype selection, repeated route point, malformed/outside addresses, missing/zero route and missing prototype; seeded parity and repeated pages have separate entries.
 * @evidence contracts/testing.md#execution-ownership The exported CPU entry is discovered under inspection and directly imports the description source with code-authored compiled fixtures; numeric placement/bounds are not rendered-pixel or delivered-video evidence.
 */
export function test_inspection_subject_instances(): void {
  const modelA: IAutoMovieModel = subjectInspectionModel({
    id: "tree-a",
    min: { x: -1, y: 0, z: -1 },
    max: { x: 1, y: 2, z: 1 },
  });
  const modelB: IAutoMovieModel = subjectInspectionModel({
    id: "tree-b",
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: 4, z: 0.5 },
  });
  const grid: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "grid",
    model: "tree-a",
    count: 65,
  });
  const scatter: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "scatter",
    model: "tree-a",
    count: 1,
    overrides: { layout: { kind: "scatter", radius: 3 } },
  });
  const lattice: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "lattice",
    model: "tree-a",
    count: 2,
    overrides: {
      layout: {
        kind: "lattice",
        rows: 1,
        columns: 1,
        layers: 2,
        spacing: { x: 1, y: 3, z: 1 },
      },
    },
  });
  const explicit: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "explicit",
    model: "tree-a",
    count: 1,
    overrides: {
      prototypes: [
        compiledPrototype("default", "tree-a", 1),
        compiledPrototype("tall", "tree-b", 1),
      ],
      layout: { kind: "explicit", transforms: [OAK_TRANSFORM] },
      anchor: { x: 10, y: 0, z: 0 },
      facingDeg: 90,
      variation: {
        scale: { min: 1, max: 1 },
        scale3: {
          min: { x: 0.9, y: 0.9, z: 0.9 },
          max: { x: 1.1, y: 1.1, z: 1.1 },
        },
        rotationDeg: {
          x: { min: 0, max: 1 },
          y: { min: 0, max: 1 },
          z: { min: 0, max: 1 },
        },
        palette: ["#ffffff"],
        traits: [],
      },
    },
  });
  const along: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "along",
    model: "tree-a",
    count: 2,
    overrides: {
      layout: { kind: "along-route", route: "lane", lateralJitter: 0 },
      route: {
        id: "lane",
        waypoints: [
          { x: 0, z: 0 },
          { x: 0, z: 0 },
          { x: 8, z: 0 },
        ],
        allowedFormationWidth: 3,
      },
      anchor: { x: 100, y: 2, z: 100 },
    },
  });
  const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    models: [modelA, modelB],
    nodes: [],
    instanceSets: [grid, scatter, lattice, explicit, along],
    environment: null,
  });

  const setDescription: IAutoMovieSubjectDescription = describeAutoMovieSubject(
    artifact,
    "instance-set:grid",
  );
  const lastGrid: IAutoMovieSubjectDescription = describeAutoMovieSubject(
    artifact,
    "instance:grid:slot:000064",
  );
  TestValidator.equals(
    "compact membership stays bounded while the last grid slot remains addressable",
    {
      members: setDescription.members,
      setBounds:
        setDescription.bounds.content !== null &&
        vclose(setDescription.bounds.content.min, { x: -32, y: 0, z: 0 }, 0) &&
        vclose(setDescription.bounds.content.max, { x: 32, y: 0, z: 0 }, 0),
      lastId: lastGrid.id,
      lastPosition:
        lastGrid.transform !== null &&
        vclose(lastGrid.transform.translation, { x: 32, y: 0, z: 0 }, 0),
      lastPrototype: lastGrid.prototype,
    },
    {
      members: {
        total: 65,
        offset: 0,
        items: Array.from(
          { length: 64 },
          (_: unknown, slot: number): string =>
            `instance:grid:slot:${String(slot).padStart(6, "0")}`,
        ),
        omitted: 1,
      },
      setBounds: true,
      lastId: "instance:grid:slot:000064",
      lastPosition: true,
      lastPrototype: "prototype:tree-a",
    },
  );

  const placements: IAutoMovieSubjectDescription[] = [
    "instance:scatter:slot:000000",
    "instance:lattice:slot:000001",
    "instance:explicit:oak",
    "instance:along:slot:000000",
  ].map(
    (id: string): IAutoMovieSubjectDescription =>
      describeAutoMovieSubject(artifact, id),
  );
  TestValidator.equals(
    "every compiled layout regenerates a finite addressable world placement",
    placements.map(
      (
        description: IAutoMovieSubjectDescription,
      ): {
        id: string;
        finite: boolean;
        model: string | null;
        owner: string | null;
      } => ({
        id: description.id,
        finite:
          Object.keys(description.transform!.translation).length === 3 &&
          Object.values(description.transform!.translation).every(
            Number.isFinite,
          ),
        model: description.model,
        owner: description.owner,
      }),
    ),
    [
      {
        id: "instance:scatter:slot:000000",
        finite: true,
        model: "tree-a",
        owner: "instance-set:scatter",
      },
      {
        id: "instance:lattice:slot:000001",
        finite: true,
        model: "tree-a",
        owner: "instance-set:lattice",
      },
      {
        id: "instance:explicit:oak",
        finite: true,
        model: "tree-b",
        owner: "instance-set:explicit",
      },
      {
        id: "instance:along:slot:000000",
        finite: true,
        model: "tree-a",
        owner: "instance-set:along",
      },
    ],
  );
  TestValidator.equals(
    "an explicit instance keeps its exact scale and selected prototype geometry",
    {
      transform:
        placements[2]!.transform !== null &&
        vclose(
          placements[2]!.transform!.translation,
          { x: 12, y: 1, z: -7 },
          0,
        ) &&
        nclose(placements[2]!.transform!.rotation.x, 0, 0) &&
        nclose(
          placements[2]!.transform!.rotation.y,
          Math.sin(Math.PI / 4),
          0,
        ) &&
        nclose(placements[2]!.transform!.rotation.z, 0, 0) &&
        nclose(
          placements[2]!.transform!.rotation.w,
          Math.cos(Math.PI / 4),
          0,
        ) &&
        vclose(placements[2]!.transform!.scale, { x: 2, y: 1, z: 2 }, 0),
      prototype: placements[2]!.prototype,
      bounds:
        placements[2]!.bounds.content !== null &&
        vclose(placements[2]!.bounds.content!.min, { x: 11, y: 1, z: -8 }, 0) &&
        vclose(placements[2]!.bounds.content!.max, { x: 13, y: 5, z: -6 }, 0),
    },
    {
      transform: true,
      prototype: "prototype:tree-b",
      bounds: true,
    },
  );

  TestValidator.equals(
    "invalid compiled instance addresses and laws fail explicitly",
    {
      malformed: throwsError(
        (): IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(artifact, "instance:grid:slot:64"),
        "does not exist",
      ),
      outside: throwsError(
        (): IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(artifact, "instance:grid:slot:000065"),
        "does not exist",
      ),
      missingRoute: throwsError(
        (): IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(
            artifactWithSet({ ...along, route: null, id: "missing-route" }),
            "instance:missing-route:slot:000000",
          ),
        "unavailable route",
      ),
      zeroRoute: throwsError(
        (): IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(
            artifactWithSet({
              ...along,
              id: "zero-route",
              layout: { kind: "along-route", route: "zero", lateralJitter: 0 },
              route: {
                id: "zero",
                waypoints: [
                  { x: 1, z: 1 },
                  { x: 1, z: 1 },
                ],
                allowedFormationWidth: 1,
              },
            }),
            "instance:zero-route:slot:000000",
          ),
        "finite non-zero length",
      ),
      missingPrototype: throwsError(
        (): IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(
            artifactWithSet({
              ...explicit,
              id: "missing-prototype",
              layout: {
                kind: "explicit",
                transforms: [
                  { ...OAK_TRANSFORM, id: "broken", prototype: "absent" },
                ],
              },
            }),
            "instance:missing-prototype:broken",
          ),
        "references missing prototype",
      ),
    },
    {
      malformed: true,
      outside: true,
      missingRoute: true,
      zeroRoute: true,
      missingPrototype: true,
    },
  );
}

const compiledPrototype: (
  id: string,
  model: string,
  weight: number,
) => IAutoMovieCompiledInstancePrototype = (
  id: string,
  model: string,
  weight: number,
): IAutoMovieCompiledInstancePrototype => ({
  id,
  modelRecipe: model,
  weight,
  lod: [
    {
      tier: "near" as const,
      maxDistance: null,
      recipe: model,
      recipeDigest: `sha256:${"3".repeat(64)}` as const,
      model,
    },
  ],
  projectionRadius: 1,
});

const artifactWithSet: (
  set: IAutoMovieCompiledInstanceSet,
) => IAutoMovieSubjectArtifact = (
  set: IAutoMovieCompiledInstanceSet,
): IAutoMovieSubjectArtifact =>
  subjectInspectionArtifact({
    models: [
      subjectInspectionModel({
        id: "tree-a",
        min: { x: -1, y: 0, z: -1 },
        max: { x: 1, y: 2, z: 1 },
      }),
      subjectInspectionModel({
        id: "tree-b",
        min: { x: -1, y: 0, z: -1 },
        max: { x: 1, y: 2, z: 1 },
      }),
    ],
    nodes: [],
    instanceSets: [set],
    environment: null,
  });

/**
 * The one authored explicit placement both explicit-layout fixtures build on.
 *
 * Spelled once so the missing-prototype fixture reuses the exact authored
 * transform instead of narrowing it back out of a compiled union, which needed
 * an unreachable fallback branch to type-check.
 */
const OAK_TRANSFORM: {
  id: string;
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
  prototype: string;
} = {
  id: "oak",
  translation: { x: 7, y: 1, z: 2 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 2, y: 1, z: 2 },
  prototype: "tall",
};

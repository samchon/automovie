import {
  type AutoMovieConstructionRealization,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A join that breaks a premise leaves its part's whole subtree out and its host exactly as the host realizes alone: the same chains, surfaces and skin, with only the join's diagnostics added.
 *
 * Scenarios:
 * 1. A post 0.2 m off a beam, merged by a point seed that meets nothing: the realization records the join's diagnostic, keeps no join and no part chain, and its skin's positions and indices are the beam's alone, bit for bit.
 * 2. Red: the same reader against the realization of the post merged where it meets the beam finds the skins differ.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the broken tree and the host alone with `realizeAutoMovieConstruction` and compares their chains, joins and skins. It catches a broken join that leaves its part, a blend face, a trim cycle or a stray vertex behind; any realization that rolls the part back to the host's own state passes.
 * @evidence contracts/development/testing.md#independent-expectations The diagnostic's document (`IAutoMovieConstructionDiagnostic`): a join that cannot keep its premises is left out with its host standing as it was, so the host alone is the expectation; the skins are compared by identity of their buffers (`ConstructionChecks.identical`), since the same faces drawn the same way give the same numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the post that misses. Negative: the post that meets. Each broken premise's own contract belongs to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_rollback`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A post 0.2 m off a beam, merged by a point seed that meets nothing: the realization records the join's diagnostic, keeps no join and no...).
 */
export function test_construction_rollback(): void {
  const failures: string[] = [];
  const beam: () => IAutoMovieConstructionView =
    (): IAutoMovieConstructionView =>
      ConstructionShapes.cylinder(
        "beam",
        {
          origin: { x: -0.1, y: 0, z: 0 },
          u: { x: 0, y: 0, z: 1 },
          v: { x: 0, y: 1, z: 0 },
        },
        0.03,
        0.2,
      );
  const post: (y: number) => IAutoMovieConstructionView = (
    y: number,
  ): IAutoMovieConstructionView =>
    ConstructionShapes.cylinder(
      "post",
      {
        origin: { x: 0, y, z: 0 },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      0.015,
      0.08,
    );
  const join: (y: number) => AutoMovieConstructionNode = (
    y: number,
  ): AutoMovieConstructionNode =>
    ConstructionShapes.join(
      "merge",
      "blend.post",
      beam(),
      post(y),
      {
        partFace: "post",
        hostFace: "beam",
        part: [0.031, Math.PI / 2],
        host: [0.115, 0.01],
      },
      {
        part: { type: "chord", value: 0.005 },
        host: { type: "chord", value: 0.005 },
      },
    );
  const realize: (
    root: AutoMovieConstructionNode,
  ) => AutoMovieConstructionRealization.IRealization = (
    root: AutoMovieConstructionNode,
  ): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });

  const alone: AutoMovieConstructionRealization.IRealization = realize(beam());
  const broken: AutoMovieConstructionRealization.IRealization = realize(
    join(0.2),
  );
  if (
    !broken.diagnostics.some(
      (d: { node: string }): boolean => d.node === "blend.post",
    )
  )
    failures.push("the missing join recorded no diagnostic on blend.post");
  if (broken.joins.length !== 0)
    failures.push(`the missing join kept ${broken.joins.length} joins`);
  const names: string[] = broken.chains.map(
    (c: { name: string }): string => c.name,
  );
  if (names.join(",") !== "beam")
    failures.push(`the chains are ${names.join(", ")}, not the beam alone`);
  if (broken.mesh.owners.join(",") !== alone.mesh.owners.join(","))
    failures.push(`the skin's owners are ${broken.mesh.owners.join(", ")}`);
  failures.push(
    ...ConstructionChecks.identical(
      broken.mesh.positions,
      alone.mesh.positions,
    ).map((f: string): string => `positions: ${f}`),
  );
  failures.push(
    ...ConstructionChecks.identical(
      broken.mesh.indices,
      alone.mesh.indices,
    ).map((f: string): string => `indices: ${f}`),
  );

  // Red: the post that meets the beam changes the skin.
  const met: AutoMovieConstructionRealization.IRealization = realize(join(0));
  if (
    ConstructionChecks.identical(met.mesh.indices, alone.mesh.indices)
      .length === 0
  )
    failures.push("proof: the joined skin reads as the beam alone");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} rollback failures:\n${failures.join("\n")}`,
    );
}

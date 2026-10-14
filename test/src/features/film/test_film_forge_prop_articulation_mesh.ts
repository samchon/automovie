import {
  IAutoMovieConstraintViolation,
  IAutoMovieNode,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedProp } from "@automovie/engine";
import { forgeProp } from "@automovie/engine";
import { placementChildNode } from "@automovie/engine";
import { sceneToNodes } from "@automovie/engine";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Apply an authored mutation to a fresh door's articulation node list.
 *
 * The owning test chooses node indexes and panel/sash identities independently
 * of forge output. The copied list retains the fixture's original order.
 */
function withNodes(
  mutate: (nodes: IAutoMovieNode[]) => IAutoMovieNode[],
): IAutoMoviePropSpec {
  const spec: IAutoMoviePropSpec = createDoorPropSpec();
  return {
    ...spec,
    articulation: {
      ...spec.articulation!,
      nodes: mutate([...spec.articulation!.nodes]),
    },
  };
}

/**
 * Give one authored joint index the requested mesh reference.
 *
 * Index one is the fixture hinge; panel is declared and sash is absent. The
 * owning test asserts admission and lowering of the resulting authored inputs.
 */
function drives(index: number, part: string): IAutoMoviePropSpec {
  return withNodes((nodes: IAutoMovieNode[]): IAutoMovieNode[] =>
    nodes.map(
      (node: IAutoMovieNode, i: number): IAutoMovieNode =>
        i === index ? { ...node, mesh: part } : node,
    ),
  );
}

/**
 * A prop joint may name the part it drives, and `forgeProp` holds that name to
 * the prop's own model.
 *
 * The reference is what makes a declared joint visible: a hinge that names no
 * part turns an empty frame while the leaf stands still, so a shot renders a
 * door that validated clean and never opened. The gate therefore has to catch
 * the two ways the name can be wrong before the frame does, and it has to leave
 * the lowered id alone, because the id is what a shot's `objectMotions` channel
 * and the viewer's lookup both spell.
 *
 * Scenarios:
 *
 * 1. The hinge driving the model's own `panel` part forges, and the lowered scene
 *    id of that joint is the placement child `sceneToNodes` writes.
 * 2. A joint naming a part the model does not declare is a `type` violation at
 *    that joint's own `mesh` path, and no other joint is blamed.
 * 3. Two joints claiming one part violate at the second claim, naming the first; a
 *    part rides one frame.
 * 4. Every joint leaving `mesh` null still forges, which is the contract every
 *    prop authored before the reference existed was written against.
 *
 * @evidence contracts/testing.md#behavioral-verification Forges joint-to-part references and observes sceneToNodes output; accepted panel identity, missing-part paths and second-claim diagnostics catch invisible or multiply-owned articulated parts.
 * @evidence contracts/testing.md#independent-expectations The authored model contains exactly one panel part; one joint may claim it, an absent sash cannot be claimed and a second claim must name the first. Expected placement/hinge identity follows the placement child naming contract, with no sampled render or geometry oracle implied.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid ownership, unknown mesh, duplicate ownership and the adjacent all-null legacy joint case; exact one-error counting checks that an unrelated joint is not blamed. Numeric travel, binding and hierarchy defects belong to the other forge tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test owns four in-memory forge/lowering cases and reaches portable engine source without a process, browser or asset installation.
 */
export function test_film_forge_prop_articulation_mesh(): void {
  const driven: IAutoMoviePropSpec = drives(1, "panel");
  const forged: IAutoMovieForgedProp = forgeProp(driven);
  TestValidator.equals(
    "a hinge driving a declared part forges",
    forged.success,
    true,
  );
  const lowered: IAutoMovieNode[] = sceneToNodes({
    scene: {
      id: "hall",
      name: null,
      nodes: [
        {
          id: "frontDoor",
          model: "door",
          transform: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          motion: null,
          pose: null,
        },
      ],
      cameras: [],
      lights: [],
    },
    props: { door: driven },
  });
  TestValidator.equals(
    "the driving joint lowers under the placement, carrying its part",
    lowered
      .filter((node: IAutoMovieNode): boolean => node.mesh !== null)
      .map((node: IAutoMovieNode): (string | null)[] => [node.id, node.mesh]),
    [[placementChildNode("frontDoor", "hinge"), "panel"]],
  );

  const unknown: IAutoMovieForgedProp = forgeProp(drives(1, "sash"));
  TestValidator.predicate(
    "a joint driving a part the model does not declare violates",
    hasViolation(unknown, "type", "$input.articulation.nodes[1].mesh"),
  );
  TestValidator.equals(
    "only the joint that named it is blamed",
    unknown.success === false
      ? unknown.violations.filter(
          (violation: IAutoMovieConstraintViolation): boolean =>
            violation.path.endsWith(".mesh"),
        ).length
      : 0,
    1,
  );

  const twice: IAutoMovieForgedProp = forgeProp(
    withNodes((nodes: IAutoMovieNode[]): IAutoMovieNode[] =>
      nodes.map(
        (node: IAutoMovieNode, i: number): IAutoMovieNode =>
          i === 1 || i === 2 ? { ...node, mesh: "panel" } : node,
      ),
    ),
  );
  TestValidator.predicate(
    "a part claimed by two joints violates at the second claim",
    hasViolation(twice, "type", "$input.articulation.nodes[2].mesh"),
  );
  TestValidator.equals(
    "the refusal names the joint that claimed it first",
    namedFacts([
      ["refused", (): boolean => twice.success === false],
      [
        "namesFirstClaim",
        (): boolean =>
          twice.success === false &&
          twice.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.expected.includes("$input.articulation.nodes[1]"),
          ),
      ],
    ]),
    { refused: true, namesFirstClaim: true },
  );

  TestValidator.equals(
    "a prop whose joints drive nothing still forges",
    forgeProp(createDoorPropSpec()).success,
    true,
  );
}

import {
  autoMovieInspectionEntityPathOf,
  autoMovieInspectionPathOf,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, type Object3D, Scene } from "three";

/**
 * Name the nodes of a graph with repeated and missing names and pin each
 * unique identity.
 *
 * Scenarios:
 * 1. Unique named nodes keep the shared name path.
 * 2. Two same-named siblings, and two same-named nodes under different unnamed wrappers, get `#0` and `#1`.
 * 3. Unnamed nodes append child indices below their nearest named ancestor, or below `scene`.
 * 4. A shared frontier memo gives the same identities, and a node outside the root throws.
 */
export function test_unit_render_inspection_entity_path(): void {
  const named = (name: string, ...children: Object3D[]): Group => {
    const group = new Group();
    group.name = name;
    if (children.length !== 0) group.add(...children);
    return group;
  };
  const bed = named("bed", named("base"));
  const firstArm = named("arm", new Group());
  const secondArm = named("arm");
  const rig = named("rig", firstArm, secondArm);
  const leftHand = named("hand");
  const rightHand = named("hand");
  const loose = new Group();
  const scene = new Scene();
  scene.add(bed, rig, named("", leftHand), named("", rightHand), loose);
  const base = bed.children[0]!;
  const pad = firstArm.children[0]!;

  const paths = (
    frontiers?: Map<Object3D, ReadonlyMap<string, readonly Object3D[]>>,
  ) =>
    [base, firstArm, secondArm, pad, leftHand, rightHand, loose].map((node) =>
      autoMovieInspectionEntityPathOf(scene, node, frontiers),
    );
  const expected: string[] = [
    "bed/base",
    "rig/arm#0",
    "rig/arm#1",
    "rig/arm#0.children[0]",
    "hand#0",
    "hand#1",
    "scene.children[4]",
  ];
  TestValidator.equals("unique identities", paths(), expected);
  TestValidator.equals(
    "unique names keep the shared name path",
    autoMovieInspectionEntityPathOf(scene, base),
    autoMovieInspectionPathOf(scene, base),
  );
  TestValidator.equals(
    "a shared memo gives the same identities",
    paths(new Map()),
    expected,
  );
  TestValidator.error("a node outside the root throws", () =>
    autoMovieInspectionEntityPathOf(scene, new Group()),
  );
}

import {
  listAutoMovieInspectionPaths,
  matchAutoMovieInspectionPath,
} from "@automovie/render";
import {
  type IAutoMovieInspectorPathNode,
  buildAutoMovieInspectorPathTree,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The selection panel's tree of a scene with nested groups lists every drawable path once in scene order, and each node's pattern selects exactly that node and what lies beneath it.
 *
 * Scenarios:
 *
 * 1. A scene with a named group holding a mesh with a child mesh, a nested group of three meshes (one sharing its name with a top-level mesh), a second mesh sharing the first mesh's path, a top-level mesh, and an unnamed mesh, plus a mark path under the first mesh: the drawn nodes in pre-order are the distinct paths in the order they first appear, and the shared path appears once.
 * 2. Groups are nodes that are not drawn, a mark nests under its object, and the unnamed mesh is one top-level node with the empty name and no pattern.
 * 3. For every node with a pattern, the paths the path grammar matches with it are exactly the node's path and the paths beneath it: a top-level name does not reach a deeper object of the same name.
 * 4. An empty list gives an empty tree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a real three.js scene, lists its paths with render's listing, builds the tree with the public builder and walks it.
 * @evidence contracts/development/testing.md#independent-expectations Expected paths are written out from the scene the test builds; pattern reach is checked with render's own matcher against the prefix relation of the paths, not against the builder.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts drawn objects against groups, a repeated path against distinct ones, a top-level name against a deeper namesake, a named against the empty path, and a populated against an empty list.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_path_tree`; it draws nothing. The panel's dispatches belong to `test_inspector_reducer`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_path_tree(): void {
  const mesh: (name: string, ...children: THREE.Object3D[]) => THREE.Mesh = (
    name: string,
    ...children: THREE.Object3D[]
  ): THREE.Mesh => {
    const object: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial(),
    );
    object.name = name;
    if (children.length !== 0) object.add(...children);
    return object;
  };
  const group: (name: string, ...children: THREE.Object3D[]) => THREE.Group = (
    name: string,
    ...children: THREE.Object3D[]
  ): THREE.Group => {
    const object: THREE.Group = new THREE.Group();
    object.name = name;
    object.add(...children);
    return object;
  };
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    group(
      "hero",
      mesh("torso", mesh("arm")),
      group("legs", mesh("left"), mesh("right"), mesh("prop")),
      mesh("torso"),
    ),
    mesh("prop"),
    mesh(""),
  );
  const paths: string[] = [
    ...listAutoMovieInspectionPaths(scene).map(
      ({ path }: { path: string }): string => path,
    ),
    "hero/torso/section/3",
  ];
  TestValidator.equals("the scene lists its paths", paths, [
    "hero/torso",
    "hero/torso/arm",
    "hero/legs/left",
    "hero/legs/right",
    "hero/legs/prop",
    "hero/torso",
    "prop",
    "",
    "hero/torso/section/3",
  ]);
  const tree: IAutoMovieInspectorPathNode[] =
    buildAutoMovieInspectorPathTree(paths);
  const nodes: IAutoMovieInspectorPathNode[] = [];
  const walk: (node: IAutoMovieInspectorPathNode) => void = (
    node: IAutoMovieInspectorPathNode,
  ): void => {
    nodes.push(node);
    node.children.forEach(walk);
  };
  tree.forEach(walk);

  // 1. Every drawn path once, in first-appearance order.
  TestValidator.equals(
    "drawn nodes are the distinct paths in order",
    nodes
      .filter((node: IAutoMovieInspectorPathNode): boolean => node.drawn)
      .map((node: IAutoMovieInspectorPathNode): string => node.path),
    [
      "hero/torso",
      "hero/torso/arm",
      "hero/torso/section/3",
      "hero/legs/left",
      "hero/legs/right",
      "hero/legs/prop",
      "prop",
      "",
    ],
  );

  // 2. Groups, marks and the empty path.
  const at: (path: string) => IAutoMovieInspectorPathNode = (
    path: string,
  ): IAutoMovieInspectorPathNode =>
    nodes.find(
      (node: IAutoMovieInspectorPathNode): boolean => node.path === path,
    )!;
  TestValidator.equals(
    "top-level nodes",
    tree.map((node: IAutoMovieInspectorPathNode): string => node.name),
    ["hero", "prop", ""],
  );
  TestValidator.predicate(
    "groups are not drawn",
    !at("hero").drawn &&
      !at("hero/legs").drawn &&
      !at("hero/torso/section").drawn,
  );
  TestValidator.equals(
    "a mark nests under its object",
    at("hero/torso").children.map(
      (node: IAutoMovieInspectorPathNode): string => node.name,
    ),
    ["arm", "section"],
  );
  TestValidator.equals(
    "the empty path has no pattern",
    [at("").name, at("").pattern],
    ["", null],
  );
  TestValidator.equals(
    "patterns",
    [at("hero").pattern, at("prop").pattern, at("hero/legs").pattern],
    ["hero/**", "prop/**", "hero/legs"],
  );

  // 3. A pattern reaches its node and the paths beneath it, and nothing else.
  const distinct: string[] = [...new Set<string>(paths)];
  for (const node of nodes) {
    if (node.pattern === null) continue;
    const pattern: string = node.pattern;
    TestValidator.equals(
      `${pattern} selects ${node.path} and beneath`,
      distinct.filter((path: string): boolean =>
        matchAutoMovieInspectionPath(path, pattern),
      ),
      distinct.filter(
        (path: string): boolean =>
          path === node.path || path.startsWith(`${node.path}/`),
      ),
    );
  }

  // 4. Empty list.
  TestValidator.equals(
    "an empty list is an empty tree",
    buildAutoMovieInspectorPathTree([]),
    [],
  );
}

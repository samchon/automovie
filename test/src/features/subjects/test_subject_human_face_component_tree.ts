import {
  type IAutoMovieHumanFaceComponentTree,
  createHumanFaceComponentTree,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A connected face's navigation hierarchy is exhaustive but never changes
 * its flat shape/expression document or physical mesh ownership.
 * Scenarios:
 * 1. Nested nodes own both analytic channels, both resident surfaces and each
 *    appearance field once; the returned tree is independent of its input.
 * 2. Stale basis identity, duplicated basis identities, shared/cyclic nodes,
 *    empty/malformed nodes and repeated node IDs refuse.
 * 3. Unknown, duplicated and missing channel, surface and appearance owners
 *    refuse while the adjacent complete manifest remains valid.
 */
export const test_subject_human_face_component_tree = (): void => {
  const { basis } = humanFaceBasisFixture();
  const manifest: IAutoMovieHumanFaceComponentTree = {
    basis: basis.id,
    root: {
      id: "face",
      label: "Face",
      description: "Connected analytic skin and its components.",
      channels: ["width"],
      surfaces: ["square"],
      documentFields: ["materials", "skin"],
      children: [
        {
          id: "eye",
          label: "Eye",
          description: "Analytic expression and attached surface.",
          channels: ["lift"],
          surfaces: ["attachment"],
          documentFields: ["iris"],
          children: [],
        },
        {
          id: "hair",
          label: "Hair",
          description: "Procedural appearance rather than a basis mesh.",
          channels: [],
          surfaces: [],
          documentFields: ["hair"],
          children: [],
        },
      ],
    },
  };
  const compiled = createHumanFaceComponentTree(basis, manifest);
  TestValidator.equals(
    "nested channel path",
    compiled.channelPaths.get("lift"),
    ["Face", "Eye"],
  );
  TestValidator.equals(
    "shared skin owner",
    compiled.surfacePaths.get("square"),
    ["Face"],
  );
  TestValidator.equals("appearance owner", compiled.documentPaths.get("hair"), [
    "Face",
    "Hair",
  ]);
  manifest.root.children[0].label = "Changed by caller";
  TestValidator.equals(
    "compiled tree owns its nodes",
    compiled.root.children[0].label,
    "Eye",
  );
  manifest.root.children[0].label = "Eye";
  const altered = (edit: (value: IAutoMovieHumanFaceComponentTree) => void) => {
    const next = structuredClone(manifest);
    edit(next);
    return next;
  };
  TestValidator.predicate(
    "stale basis refuses",
    throwsError(
      () =>
        createHumanFaceComponentTree(
          basis,
          altered((value) => {
            value.basis = "other";
          }),
        ),
      "exact basis revision",
    ),
  );
  for (const edit of [
    (value: typeof basis) => value.channels.push(value.channels[0]),
    (value: typeof basis) => value.surfaces.push(value.surfaces[0]),
  ]) {
    const next = structuredClone(basis);
    edit(next);
    TestValidator.predicate(
      "basis identities are distinct",
      throwsError(
        () => createHumanFaceComponentTree(next, manifest),
        "distinct basis",
      ),
    );
  }
  const shared = altered((value) =>
    value.root.children.push(value.root.children[0]),
  );
  TestValidator.predicate(
    "shared node refuses",
    throwsError(() => createHumanFaceComponentTree(basis, shared), "unalias"),
  );
  const cyclic = altered((value) => value.root.children.push(value.root));
  TestValidator.predicate(
    "cycle refuses",
    throwsError(() => createHumanFaceComponentTree(basis, cyclic), "unalias"),
  );
  for (const edit of [
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.children[0].id = "face"),
    (value: IAutoMovieHumanFaceComponentTree) => (value.root.id = ""),
    (value: IAutoMovieHumanFaceComponentTree) => (value.root.label = ""),
    (value: IAutoMovieHumanFaceComponentTree) => (value.root.description = ""),
    (value: IAutoMovieHumanFaceComponentTree) => {
      value.root.children[1].documentFields = [];
    },
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.children[0] =
        null as unknown as IAutoMovieHumanFaceComponentTree.Node),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.channels = null as unknown as string[]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.surfaces = null as unknown as string[]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.documentFields =
        null as unknown as IAutoMovieHumanFaceComponentTree.DocumentField[]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.children =
        null as unknown as IAutoMovieHumanFaceComponentTree.Node[]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.channels = [null as unknown as string]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.surfaces = [null as unknown as string]),
    (value: IAutoMovieHumanFaceComponentTree) =>
      (value.root.documentFields = [
        null as unknown as IAutoMovieHumanFaceComponentTree.DocumentField,
      ]),
  ])
    TestValidator.predicate(
      "malformed group refuses",
      throwsError(() => createHumanFaceComponentTree(basis, altered(edit))),
    );
  for (const [title, edit, message] of [
    [
      "unknown channel",
      (v: IAutoMovieHumanFaceComponentTree) => v.root.channels.push("other"),
      "one resident owner",
    ],
    [
      "duplicate channel",
      (v: IAutoMovieHumanFaceComponentTree) => v.root.channels.push("lift"),
      "one resident owner",
    ],
    [
      "missing channel",
      (v: IAutoMovieHumanFaceComponentTree) => {
        v.root.children[0].channels = [];
      },
      "omits channel",
    ],
    [
      "unknown surface",
      (v: IAutoMovieHumanFaceComponentTree) => v.root.surfaces.push("other"),
      "one resident owner",
    ],
    [
      "duplicate surface",
      (v: IAutoMovieHumanFaceComponentTree) =>
        v.root.surfaces.push("attachment"),
      "one resident owner",
    ],
    [
      "missing surface",
      (v: IAutoMovieHumanFaceComponentTree) => {
        v.root.children[0].surfaces = [];
      },
      "omits surface",
    ],
    [
      "unknown appearance",
      (v: IAutoMovieHumanFaceComponentTree) =>
        v.root.documentFields.push(
          "other" as IAutoMovieHumanFaceComponentTree.DocumentField,
        ),
      "supported owner",
    ],
    [
      "duplicate appearance",
      (v: IAutoMovieHumanFaceComponentTree) =>
        v.root.documentFields.push("iris"),
      "supported owner",
    ],
    [
      "missing appearance",
      (v: IAutoMovieHumanFaceComponentTree) => {
        v.root.children[0].documentFields = [];
      },
      "omits appearance",
    ],
  ] as const)
    TestValidator.predicate(
      title,
      throwsError(
        () => createHumanFaceComponentTree(basis, altered(edit)),
        message,
      ),
    );
};

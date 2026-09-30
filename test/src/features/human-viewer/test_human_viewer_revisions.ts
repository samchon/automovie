import { TestValidator } from "@nestia/e2e";

import { collectHumanViewerImports } from "../../../scripts/human-viewer/collectHumanViewerImports";
import { createHumanViewerRevisions } from "../../../scripts/human-viewer/createHumanViewerRevisions";
import { resolveHumanViewerImport } from "../../../scripts/human-viewer/resolveHumanViewerImport";

const R = "/r";
const P = `${R}/packages`;
const files = (): Map<string, string> =>
  new Map<string, string>([
    [
      `${P}/human/src/index.ts`,
      `export * from "./face";\nexport * from "./body";\nexport { Bone as Rig } from "./body/bone";`,
    ],
    [
      `${P}/human/src/face/index.ts`,
      `export { Eye } from "./eye";\nexport type { Lid } from "./lid";`,
    ],
    [
      `${P}/human/src/face/eye.ts`,
      `import { Lid } from "./lid";\nexport const Eye = 1;`,
    ],
    [`${P}/human/src/face/lid.ts`, `export interface Lid {}`],
    [
      `${P}/human/src/body/index.ts`,
      `export { Torso } from "./torso";\nexport * as Skin from "./skin";`,
    ],
    [
      `${P}/human/src/body/torso.ts`,
      `import { Bone } from "./bone";\nexport function Torso() {}`,
    ],
    [`${P}/human/src/body/bone.ts`, `export class Bone {}`],
    [`${P}/human/src/body/skin.ts`, `export const tone = 1;`],
    [`${P}/human/src/body/unused.ts`, `export const never = 1;`],
    [
      `${P}/playground/src/human/common/asset.ts`,
      `import { Bone } from "@automovie/human";\nimport("./lazy.js");\nnew Worker(new URL("./w.mts", import.meta.url));`,
    ],
    [`${P}/playground/src/human/common/lazy.ts`, `export const lazy = 1;`],
    [`${P}/playground/src/human/common/w.mts`, `export {};`],
    [
      `${P}/playground/src/human/face/run.ts`,
      `import { Eye, type Lid } from "@automovie/human";\nimport * as asset from "../common/asset";\nimport "three";`,
    ],
    [
      `${P}/playground/src/human/body/run.ts`,
      `import { Torso, Rig } from "@automovie/human";\nimport { Skin } from "@automovie/human";`,
    ],
    [`${P}/human/src/unrelated.test.ts`, `export const t = 1;`],
    [`${R}/lock.yaml`, "lock 1"],
  ]);
const build = (map: Map<string, string>) =>
  createHumanViewerRevisions({
    root: R,
    entries: {
      browser: [
        `${P}/playground/src/human/face/run.ts`,
        `${P}/playground/src/human/body/run.ts`,
      ],
      face: [`${P}/playground/src/human/face/run.ts`],
      body: [`${P}/playground/src/human/body/run.ts`],
    },
    extra: [`${R}/lock.yaml`],
    bases: () => "bases",
    io: { exists: (file) => map.has(file), read: (file) => map.get(file) },
  });

/**
 * A cache key depends on the files a build reads, and on nothing else.
 *
 * Scenarios:
 * 1. Resolution takes a relative specifier as written, with an extension, as
 *    a folder index, as the TypeScript file behind a written `.js`, and a
 *    workspace package by its `src/index.ts` or its subpath; a registry
 *    package and a missing file resolve to nothing.
 * 2. The graph follows a named import through barrels to its declaring file
 *    (a re-export, a renamed one, `export *`, a namespace re-export), so the
 *    body graph holds the torso and bone and never the eye or the unused
 *    module, while dynamic imports and worker URLs are followed.
 * 3. Editing a file only the face reads moves the face and browser digests
 *    and not the body digest; editing a body file the reverse; editing a test
 *    or an unread file moves none, and `reaches` says which files matter. A
 *    changed extra file moves all.
 * 4. Reverting the edits returns the earlier digests, and a removed file
 *    moves the digests of the graphs that read it.
 */
export const test_human_viewer_revisions = (): void => {
  const map = files();
  const exists = (file: string): boolean => map.has(file);
  const resolve = (specifier: string, from: string) =>
    resolveHumanViewerImport(specifier, from, { root: R, io: { exists } });
  const at = `${P}/playground/src/human/common/asset.ts`;
  TestValidator.equals(
    "relative",
    resolve("./lazy", at),
    `${P}/playground/src/human/common/lazy.ts`,
  );
  TestValidator.equals(
    "written js",
    resolve("./lazy.js", at),
    `${P}/playground/src/human/common/lazy.ts`,
  );
  TestValidator.equals(
    "parent",
    resolve("../face/run", at),
    `${P}/playground/src/human/face/run.ts`,
  );
  TestValidator.equals(
    "index",
    resolve("./face", `${P}/human/src/index.ts`),
    `${P}/human/src/face/index.ts`,
  );
  TestValidator.equals(
    "package",
    resolve("@automovie/human", at),
    `${P}/human/src/index.ts`,
  );
  TestValidator.equals(
    "subpath",
    resolve("@automovie/human/body/torso", at),
    `${P}/human/src/body/torso.ts`,
  );
  TestValidator.equals("registry", resolve("three", at), null);
  TestValidator.equals("missing", resolve("./absent", at), null);

  const graph = (entry: string) =>
    collectHumanViewerImports({
      entries: [entry],
      root: R,
      io: { exists, read: (file) => map.get(file) },
    }).map((file) => file.slice(P.length + 1));
  TestValidator.equals("body graph", graph(`${P}/playground/src/human/body/run.ts`), [
    "human/src/body/bone.ts",
    "human/src/body/skin.ts",
    "human/src/body/torso.ts",
    "playground/src/human/body/run.ts",
  ]);
  TestValidator.equals("face graph", graph(`${P}/playground/src/human/face/run.ts`), [
    "human/src/body/bone.ts",
    "human/src/face/eye.ts",
    "human/src/face/lid.ts",
    "playground/src/human/common/asset.ts",
    "playground/src/human/common/lazy.ts",
    "playground/src/human/common/w.mts",
    "playground/src/human/face/run.ts",
  ]);

  const revisions = build(map);
  const before = revisions.current();
  const edit = (file: string, text: string | undefined): string[] => {
    if (text === undefined) map.delete(file);
    else map.set(file, text);
    return revisions.changed([file]).moved.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  };
  TestValidator.equals("eye reaches", revisions.reaches(`${P}/human/src/face/eye.ts`), true);
  TestValidator.equals("unused unreached", revisions.reaches(`${P}/human/src/body/unused.ts`), false);
  TestValidator.equals("test unreached", revisions.reaches(`${P}/human/src/unrelated.test.ts`), false);
  TestValidator.equals(
    "eye edit",
    edit(`${P}/human/src/face/eye.ts`, `export const Eye = 2;`),
    ["browser", "face"],
  );
  TestValidator.equals(
    "torso edit",
    edit(
      `${P}/human/src/body/torso.ts`,
      `import { Bone } from "./bone";\nexport function Torso() { return 1; }`,
    ),
    ["body", "browser"],
  );
  TestValidator.equals(
    "shared edit",
    edit(`${P}/human/src/body/bone.ts`, `export class Bone { x = 1 }`),
    ["body", "browser", "face"],
  );
  TestValidator.equals("test edit", edit(`${P}/human/src/unrelated.test.ts`, "changed"), []);
  TestValidator.equals("unused edit", edit(`${P}/human/src/body/unused.ts`, "changed"), []);
  TestValidator.equals("lock edit", edit(`${R}/lock.yaml`, "lock 2"), [
    "body",
    "browser",
    "face",
  ]);
  edit(
    `${P}/human/src/face/eye.ts`,
    `import { Lid } from "./lid";\nexport const Eye = 1;`,
  );
  edit(
    `${P}/human/src/body/torso.ts`,
    `import { Bone } from "./bone";\nexport function Torso() {}`,
  );
  edit(`${P}/human/src/body/bone.ts`, `export class Bone {}`);
  edit(`${R}/lock.yaml`, "lock 1");
  TestValidator.equals("revert", revisions.current(), before);
  TestValidator.equals("removed", edit(`${P}/human/src/face/lid.ts`, undefined), [
    "browser",
    "face",
  ]);
};

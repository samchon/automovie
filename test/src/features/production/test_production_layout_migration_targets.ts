import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { planAutoMovieProductionLayoutMigration as plan } from "../../../../packages/production/src/production/planAutoMovieProductionLayoutMigration";
import { throwsError } from "../internal/predicates";

interface IEntry {
  name: string;
  isFile: boolean;
}

type IOutputState = ReturnType<Parameters<typeof plan>[0]["outputState"]>;
type IMove = ReturnType<typeof plan>[number];

const root: string = path.resolve("layout-project");
const automovieRoot: string = path.join(root, "automovie");
const generatedRoot: string = path.join(root, "generated");
const renderRoot: string = path.join(root, "renders");
const segment: string = "film";
const readme: IEntry = { name: "README.md", isFile: true };

const designEntry: (name: string) => string = (name: string): string =>
  path.join(automovieRoot, "design", name);

const run: (props: { resident?: readonly string[]; generated?: IOutputState; renders?: IOutputState }) => IMove[] = (props: {
  resident?: readonly string[];
  generated?: IOutputState;
  renders?: IOutputState;
}): IMove[] =>
  plan({
    automovieRoot,
    sharedDesignRoot: path.join(automovieRoot, "design", "shared"),
    productionDesignRoot: path.join(automovieRoot, "design", segment),
    productionStateRoot: path.join(automovieRoot, "productions", segment),
    productionSegment: segment,
    outputRoots: [
      { directory: "generated", root: generatedRoot },
      { directory: "renders", root: renderRoot },
    ],
    outputState: (target: string): IOutputState =>
      target === generatedRoot
        ? (props.generated ?? { kind: "absent" })
        : (props.renders ?? { kind: "absent" }),
    resident: (source: string): boolean => (props.resident ?? []).includes(source),
  });

/**
 * A legacy layout migration targets resident records while preserving the
 * supported regular renders/README.md document exception.
 *
 * The registration's layout version says which layout a project was written
 * against, not that it holds records to move. The fresh version-0 fixture below
 * declares none, so its plan is empty; version adoption by an actual open is
 * outside this planner test. A project that does hold the old
 * layout moves record by record, and the output roots are expanded entry by
 * entry because renaming a root would carry the reserved render document too.
 *
 * The plan also fixes the shape of every move it can emit. Each destination
 * sits under the shared design root, the production's own design or state root,
 * or the production namespace inside an output root, so no move ever publishes
 * an entry inside its own source. An entry spelled exactly like the namespace
 * would be the one exception, and it is refused instead, because a root holding
 * both a legacy entry and the destination that entry would be published at is
 * an ambiguity only the author can settle.
 *
 * Scenarios:
 *
 * 1. Fresh project: no resident record, an empty generated root and a render
 *    root holding only a regular README plan no move at all, and so do two
 *    absent output roots. A plan this empty never reaches the namespace
 *    conflict check below.
 * 2. Legacy project: resident design and state records plus generated files and
 *    render bundles plan the design, state, generated and render moves in that
 *    order, each output entry ordered by code unit rather than by the order the
 *    directory reported it (`Final` before `preview`, which a locale collation
 *    reverses), and no move publishes an entry inside its own source.
 * 3. Document exception: a directory borrowing the `README.md` name moves, and
 *    a `README.md` file under generated output moves, because only a regular
 *    file directly inside the render root is the reserved document exception.
 * 4. Mixed project: a render root holding only the regular README contributes
 *    nothing while the project's resident design record still moves.
 * 5. Occupied namespace: an entry named exactly like the production segment is
 *    refused in either output root, naming the root, the namespaced
 *    destination, and the one authoritative copy to keep.
 * 6. Linked output root: a root that is a link is refused before it is read.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual migration planner against declared resident entries and root states, checking exact ordered source/destination moves, render-README exceptions, namespace ambiguity and linked-root refusal; no real files are moved.
 * @evidence contracts/testing.md#independent-expectations Shared/production design and state namespaces determine literal destinations through native path.join, and UTF-16 code-unit order places Final before preview. Only a regular README.md directly under renders is reserved; folders and generated README entries remain movable.
 * @evidence contracts/testing.md#distinguishing-cases Fresh/absent/legacy/mixed layouts, file-versus-directory README, both occupied output namespaces and a linked root distinguish no-op, movement and refusal. Physical rename, rollback and platform-specific link admission have separate host owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_layout_migration_targets synchronously executes portable planning with declared root observations and native path construction, without creating a project or launching a migration host.
 */
export function test_production_layout_migration_targets(): void {
  TestValidator.equals(
    "a fresh project plans no move",
    run({
      generated: { kind: "entries", entries: [] },
      renders: { kind: "entries", entries: [readme] },
    }),
    [],
  );
  TestValidator.equals("absent output roots plan no move", run({}), []);

  const legacy: IMove[] = run({
    resident: [
      designEntry("models"),
      designEntry("production.json"),
      path.join(automovieRoot, "revision.json"),
    ],
    generated: {
      kind: "entries",
      entries: [
        { name: "shots.ts", isFile: true },
        { name: "film.ts", isFile: true },
      ],
    },
    renders: {
      kind: "entries",
      entries: [
        readme,
        { name: "preview", isFile: false },
        { name: "Final", isFile: false },
      ],
    },
  });
  TestValidator.equals(
    "a legacy layout moves its own records and namespaces each output entry",
    legacy,
    [
      {
        source: designEntry("models"),
        destination: path.join(automovieRoot, "design", "shared", "models"),
      },
      {
        source: designEntry("production.json"),
        destination: path.join(
          automovieRoot,
          "design",
          segment,
          "production.json",
        ),
      },
      {
        source: path.join(automovieRoot, "revision.json"),
        destination: path.join(
          automovieRoot,
          "productions",
          segment,
          "revision.json",
        ),
      },
      {
        source: path.join(generatedRoot, "film.ts"),
        destination: path.join(generatedRoot, segment, "film.ts"),
      },
      {
        source: path.join(generatedRoot, "shots.ts"),
        destination: path.join(generatedRoot, segment, "shots.ts"),
      },
      {
        source: path.join(renderRoot, "Final"),
        destination: path.join(renderRoot, segment, "Final"),
      },
      {
        source: path.join(renderRoot, "preview"),
        destination: path.join(renderRoot, segment, "preview"),
      },
    ],
  );
  TestValidator.equals(
    "no planned move publishes an entry inside its own source",
    legacy.filter((move: IMove): boolean => path.dirname(move.destination) === move.source),
    [],
  );

  TestValidator.equals(
    "a directory borrowing the render document name still moves",
    run({
      renders: { kind: "entries", entries: [{ ...readme, isFile: false }] },
    }),
    [
      {
        source: path.join(renderRoot, "README.md"),
        destination: path.join(renderRoot, segment, "README.md"),
      },
    ],
  );
  TestValidator.equals(
    "generated output reserves no document name",
    run({ generated: { kind: "entries", entries: [readme] } }),
    [
      {
        source: path.join(generatedRoot, "README.md"),
        destination: path.join(generatedRoot, segment, "README.md"),
      },
    ],
  );

  TestValidator.equals(
    "the tracked render document alone keeps the render root out of a real migration",
    run({
      resident: [designEntry("production.json")],
      renders: { kind: "entries", entries: [readme] },
    }),
    [
      {
        source: designEntry("production.json"),
        destination: path.join(
          automovieRoot,
          "design",
          segment,
          "production.json",
        ),
      },
    ],
  );

  TestValidator.predicate(
    "a render entry named like the namespace is refused",
    throwsError(
      (): IMove[] =>
        run({
          renders: {
            kind: "entries",
            entries: [readme, { name: segment, isFile: false }],
          },
        }),
      [
        renderRoot,
        path.join(renderRoot, segment),
        "Keep one authoritative copy",
      ],
    ),
  );
  TestValidator.predicate(
    "a generated entry named like the namespace is refused",
    throwsError(
      (): IMove[] =>
        run({
          generated: {
            kind: "entries",
            entries: [{ name: segment, isFile: true }],
          },
        }),
      [
        generatedRoot,
        path.join(generatedRoot, segment),
        "Keep one authoritative copy",
      ],
    ),
  );

  TestValidator.predicate(
    "a linked output root is refused before it is read",
    throwsError(
      (): IMove[] => run({ renders: { kind: "linked" } }),
      [renderRoot, "symlink or junction"],
    ),
  );
}

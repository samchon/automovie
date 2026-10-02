import { TestValidator } from "@nestia/e2e";

import { createHumanViewerRevisions } from "../../../scripts/human-viewer/createHumanViewerRevisions";

/**
 * A whole person consumes its compositor as well as the two isolated builders.
 *
 * Scenarios:
 * 1. Composition-only edits move person and browser, preserving isolated keys.
 * 2. Face and body edits each move person and their own isolated domain.
 * 3. An unrelated edit moves none; removal and recovery of a reached compositor
 *    invalidate person, and exact restoration returns the original authority.
 */
export const test_human_viewer_person_revisions = (): void => {
  const root = "/r";
  const directory = root + "/packages/playground/src";
  const files = new Map([
    [directory + "/face.ts", "export const Face = 1;"],
    [directory + "/body.ts", "export const Body = 1;"],
    [directory + "/compose.ts", "export const compose = 1;"],
    [directory + "/person.ts", 'import { Face } from "./face"; import { Body } from "./body"; import { compose } from "./compose"; export const Person = Face + Body + compose;'],
    [directory + "/page.ts", 'import { Person } from "./person"; export const frame = Person;'],
    [directory + "/unused.ts", "export const unused = 1;"],
  ]);
  const revisions = createHumanViewerRevisions({
    root,
    entries: { browser: [directory + "/page.ts"], face: [directory + "/face.ts"],
      body: [directory + "/body.ts"], person: [directory + "/person.ts"] },
    extra: [], bases: () => "published bases",
    io: { exists: (file) => files.has(file), read: (file) => files.get(file) },
  });
  const original = revisions.current();
  const edit = (name: string, source: string | undefined): string[] => {
    const file = directory + "/" + name + ".ts";
    if (source === undefined) files.delete(file); else files.set(file, source);
    return revisions.changed([file]).moved.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  };
  TestValidator.equals("composition is reached", revisions.reaches(directory + "/compose.ts"), true);
  TestValidator.equals("composition changes cached person", edit("compose", "export const compose = 2;"), ["browser", "person"]);
  TestValidator.equals("face remains independent", revisions.current().face, original.face);
  TestValidator.equals("body remains independent", revisions.current().body, original.body);
  TestValidator.equals("face affects person", edit("face", "export const Face = 2;"), ["browser", "face", "person"]);
  TestValidator.equals("body affects person", edit("body", "export const Body = 2;"), ["body", "browser", "person"]);
  TestValidator.equals("unread source stays outside authority", edit("unused", "export const unused = 2;"), []);
  TestValidator.equals("missing compositor invalidates", edit("compose", undefined), ["browser", "person"]);
  TestValidator.equals("missing compositor remains watched for recovery", revisions.reaches(directory + "/compose.ts"), true);
  TestValidator.equals("restored compositor invalidates again", edit("compose", "export const compose = 1;"), ["browser", "person"]);
  edit("face", "export const Face = 1;"); edit("body", "export const Body = 1;");
  TestValidator.equals("complete restoration returns authority", revisions.current(), original);
};

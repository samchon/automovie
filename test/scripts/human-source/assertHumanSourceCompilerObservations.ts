import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ITtscCompilerTransformation } from "ttsc";
import { createFilesystemPathIdentityContext } from "ttsc/path-identity";

import { compareHumanSourceNames } from "./compareHumanSourceNames.ts";

/**
 * Reobserve the native compiler's independent filesystem predicates before
 * treating its resolved graph as a producer snapshot.
 *
 * File existence and directory existence are different predicates: a path
 * can be a directory while its fileExists observation is false. ReadFile
 * hashes the UTF-8 decoded text returned to this repository's compiler;
 * raw file SHA remains a separate content-identity record. Realpath identity
 * is compared through ttsc's public filesystem identity API so physical
 * spelling and platform case rules retain the compiler's semantics. Missing
 * paths, failed reads and failed realpaths preserve their declared outcomes.
 * No source is rewritten to exercise these checks.
 */
export function assertHumanSourceCompilerObservations(
  graph: ITtscCompilerTransformation.IReferenceGraph,
  project: string,
  selected: ReadonlySet<string>,
  realized: ReadonlySet<string>,
): void {
  if (graph.inputObservations === undefined)
    throw new Error(
      "Source producer graph requires predicate-preserving filesystem observations.",
    );
  const identity = createFilesystemPathIdentityContext();
  const failures: string[] = [];
  const byPath = new Map(
    Object.entries(graph.inputObservations).map(([file, proof]) => [
      path.resolve(project, file),
      proof,
    ]),
  );
  for (const file of realized) {
    const proof = byPath.get(file);
    if (proof?.readFile?.ok !== true || proof.realpath?.ok !== true)
      failures.push(
        `${path.relative(project, file)}: realized file lacks read/physical identity proof`,
      );
  }
  for (const [name, expected] of Object.entries(graph.inputObservations)) {
    const file = path.resolve(project, name);
    if (!selected.has(file)) continue;
    let stat: fs.Stats | undefined;
    try {
      stat = fs.statSync(file);
    } catch {
      stat = undefined;
    }
    if (
      expected.fileExists !== undefined &&
      expected.fileExists !== (stat?.isFile() ?? false)
    )
      failures.push(`${name}: fileExists`);
    if (
      expected.directoryExists !== undefined &&
      expected.directoryExists !== (stat?.isDirectory() ?? false)
    )
      failures.push(`${name}: directoryExists`);
    if (
      expected.stat !== undefined &&
      expected.stat !==
        (stat === undefined
          ? "missing"
          : stat.isDirectory()
            ? "directory"
            : "file")
    )
      failures.push(`${name}: stat`);
    if (expected.readFile !== undefined) {
      let text: string | undefined;
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        text = undefined;
      }
      if (
        expected.readFile.ok !== (text !== undefined) ||
        (expected.readFile.ok &&
          text !== undefined &&
          crypto.createHash("sha256").update(text).digest("hex") !==
            expected.readFile.hash)
      )
        failures.push(`${name}: readFile`);
    }
    if (expected.realpath !== undefined) {
      let realpath: string | undefined;
      try {
        realpath = fs.realpathSync.native(file);
      } catch {
        realpath = undefined;
      }
      if (
        expected.realpath.ok !== (realpath !== undefined) ||
        (expected.realpath.ok &&
          realpath !== undefined &&
          identity.resolve(realpath).key !==
            identity.resolve(expected.realpath.path).key)
      )
        failures.push(`${name}: realpath`);
    }
    if (expected.accessibleEntries !== undefined) {
      const files: string[] = [];
      const directories: string[] = [];
      if (stat?.isDirectory()) {
        for (const entry of fs.readdirSync(file)) {
          try {
            const child = fs.statSync(path.join(file, entry));
            if (child.isDirectory()) directories.push(entry);
            else if (child.isFile()) files.push(entry);
          } catch {
            /* An inaccessible child is not an accessible entry. */
          }
        }
      }
      if (
        JSON.stringify(files.sort(compareHumanSourceNames)) !==
          JSON.stringify(
            [...expected.accessibleEntries.files].sort(compareHumanSourceNames),
          ) ||
        JSON.stringify(directories.sort(compareHumanSourceNames)) !==
          JSON.stringify(
            [...expected.accessibleEntries.directories].sort(
              compareHumanSourceNames,
            ),
          )
      )
        failures.push(`${name}: accessibleEntries`);
    }
  }
  if (failures.length !== 0)
    throw new Error(
      `Source producer graph filesystem observations changed: ${failures.join(", ")}`,
    );
}

import { createEvidenceConfig } from "@automovie/config";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Resolves package Evidence hosts from published entries.
 *
 * The fixture exposes a barrel alias, a subpath, a binary and named types from
 * explicit and inferred signatures. It also has a workspace-only entry and a
 * type read by an implementation or a private member. An ambient module
 * augmentation merges with a public type. Removing the binary source
 * invalidates the manifest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the publish entry variants, the contract type paths and the missing binary refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the shared configuration factory on a package distributed across real source paths and checks the actual claim selectors and manifest refusal.
 * @evidence contracts/development/testing.md#independent-expectations The authored publish map names two module entry points and a binary. The expected files follow their public APIs and signature references. The base handling of Request remains selected while the ambient declaration has no addressable host.
 */
export function test_evidence_sdk_public_selection(): void {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-evidence-package-"),
  );
  const files: Record<string, string> = {
    "package.json": JSON.stringify({
      main: "src/workspace.ts",
      publishConfig: {
        exports: {
          ".": { types: "./lib/index.d.ts" },
          "./capture": { types: "./lib/capture/index.d.mts" },
          "./package.json": "./package.json",
        },
        bin: { fixture: "./lib/bin.js" },
      },
    }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        rootDir: "src",
        outDir: "lib",
        module: "NodeNext",
        strict: true,
      },
      include: ["src"],
    }),
    "src/index.ts": [
      'import "./private/augmentRequest";',
      'export { FixtureApi as Api } from "./api/FixtureApi";',
    ].join("\n"),
    "src/workspace.ts": 'export { privateRead } from "./private/source";',
    "src/bin.ts": 'import { Api } from "./index"; void Api;',
    "src/api/FixtureApi.ts": [
      'import { createResult } from "../private/source";',
      'import type { Request } from "../protocol/deep/Request";',
      'import type { PrivateState } from "../private/PrivateState";',
      "export namespace FixtureApi {",
      "  export function read(request: Request) { return createResult(request); }",
      "  export class Channel { private stored?: PrivateState; }",
      "}",
    ].join("\n"),
    "src/capture/index.mts": "export function record(): number { return 1; }",
    "src/private/source.ts": [
      'import type { Request } from "../protocol/deep/Request";',
      'import type { Result } from "../protocol/deep/Result";',
      "export function createResult(request: Request): Result { return { frame: request.frame }; }",
      "export function privateRead(): number { return 3; }",
    ].join("\n"),
    "src/protocol/deep/Request.ts":
      'import type { Frame } from "./Frame"; export interface Request { frame: Frame; }',
    "src/protocol/deep/Result.ts":
      'import type { Frame } from "./Frame"; export interface Result { frame: Frame; }',
    "src/protocol/deep/Frame.ts": "export type Frame = number;",
    "src/private/PrivateState.ts":
      "export interface PrivateState { a: number; }",
    "src/private/augmentRequest.ts": [
      'import type {} from "../protocol/deep/Request";',
      'declare module "../protocol/deep/Request" {',
      '  interface Request { route?: "fixture"; }',
      "}",
    ].join("\n"),
  };
  try {
    for (const [name, content] of Object.entries(files)) {
      const destination: string = path.join(root, name);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content);
    }
    const expected: string[] = [
      "src/api/FixtureApi.ts",
      "src/capture/index.mts",
      "src/protocol/deep/Frame.ts",
      "src/protocol/deep/Request.ts",
      "src/protocol/deep/Result.ts",
    ];
    const config: ReturnType<typeof createEvidenceConfig> =
      createEvidenceConfig(root);
    assert.deepEqual(
      config.claims.map((claim) => claim.files),
      [expected, expected, expected],
    );
    assert.equal(config.claims[0]?.symbol, undefined);
    fs.unlinkSync(path.join(root, "src/bin.ts"));
    assert.throws(
      () => createEvidenceConfig(root),
      /Missing source for Evidence entry .*lib\/bin\.js/,
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}

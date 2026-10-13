import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { digestAutoMovieBytes } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";
import { throwsError } from "../internal/predicates";

const runtime = loadSourceModule<{
  readProductionPublicationInputFingerprint: <Authoring>(props: {
    snapshot: Readonly<Record<string, unknown>>;
    currentAuthoringEvidence?: () => Authoring;
    compile: (
      authoring: Authoring | undefined,
      current: (() => Authoring) | undefined,
    ) => Pick<
      IAutoMovieBuildProjectOutput,
      "success" | "builder" | "diagnostics"
    >;
  }) => string;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/productionPublicationSnapshot.ts",
  ),
);

/**
 * Terminal snapshots reopen current authoring even when source bytes stay fixed.
 *
 * Scenarios:
 *
 * 1. Repeated reads of unchanged source and exact owner addresses have equal identity.
 * 2. A target-only edit changes the owner address returned by the injected reader
 *    and changes publication identity without replacing source bytes.
 * 3. A source edit independently changes identity; source failure retains its
 *    diagnostic instead of producing a success-shaped fingerprint.
 * 4. An omitted reader remains omitted at the timed compile seam, while a
 *    throwing reader prevents compilation and preserves the actual error.
 *
 * @evidence contracts/testing.md#behavioral-verification Publication identity reopens the supplied current authoring reader and compiles with its current owner address; identity inequality and forwarded observations catch a retained stale authoring snapshot.
 * @evidence contracts/testing.md#independent-expectations Independently named hall and annex owner paths distinguish changed authored identity while the source byte string stays fixed; repeated identical inputs must keep equal identity. The test compares identity changes rather than verifying the digest algorithm independently.
 * @evidence contracts/testing.md#distinguishing-cases Fixed inputs, target-only and source-only edits, source refusal, absent reader and thrown reader failures separate freshness from compile and error boundaries; physical acquisition belongs to source-snapshot tests.
 * @evidence contracts/testing.md#execution-ownership This portable unit uses the publication helper's existing reader and compile ports without opening files, launching processes or installing a consumer; the function owns each scenario directly.
 */
export function test_production_publication_fresh_authoring(): void {
  let source: string = "unchanged source bytes";
  let targetPath: string = "docs/spaces/hall.md";
  let compiled: number = 0;
  let fail: boolean = false;
  const seen: Array<string | undefined> = [];
  const diagnostic: IAutoMovieDiagnostic = {
    code: "source-owner-mismatch",
    category: "error",
    phase: "source",
    target: "shot",
    path: "src/shot.ts",
    message: "The current owner address does not match the executed source.",
  };
  const currentAuthoringEvidence: () => {
    sourceOwners: {
        targetPath: string;
    }[];
} = (): {sourceOwners:{targetPath:string}[]} => ({ sourceOwners: [{ targetPath }] });
  const compile: (authoring: ReturnType<typeof currentAuthoringEvidence> | undefined, current: typeof currentAuthoringEvidence | undefined) => IAutoMovieBuildProjectOutput = (
    authoring: ReturnType<typeof currentAuthoringEvidence> | undefined,
    current: typeof currentAuthoringEvidence | undefined,
  ): IAutoMovieBuildProjectOutput => {
    compiled += 1;
    seen.push(authoring?.sourceOwners[0]?.targetPath);
    TestValidator.equals(
      "live reader forwarding is exact",
      current ===
        (authoring === undefined ? undefined : currentAuthoringEvidence),
      true,
    );
    return {
      success: !fail,
      revision: 1,
      builder: {
        version: "unit",
        inputFingerprint: digestAutoMovieBytes(
          Buffer.from(JSON.stringify({ source, authoring })),
        ),
      },
      diagnostics: fail ? [diagnostic] : [],
      materialized: [],
    };
  };
  const read: () => string = (): string =>
    runtime.readProductionPublicationInputFingerprint({
      snapshot: { generated: "same compiled bytes" },
      currentAuthoringEvidence,
      compile,
    });
  const initial: string = read();
  TestValidator.equals("unchanged publication identity", read(), initial);
  targetPath = "docs/spaces/annex.md";
  const changedTarget: string = read();
  TestValidator.equals(
    "fresh owner address changes identity",
    changedTarget !== initial,
    true,
  );
  TestValidator.equals("builder sees current owner address", seen, [
    "docs/spaces/hall.md",
    "docs/spaces/hall.md",
    "docs/spaces/annex.md",
  ]);
  targetPath = "docs/spaces/hall.md";
  source = "changed source bytes";
  TestValidator.equals(
    "source edit changes identity separately",
    read() !== initial,
    true,
  );
  fail = true;
  TestValidator.equals(
    "source refusal retains full diagnostic",
    throwsError(read, JSON.stringify([diagnostic])),
    true,
  );
  fail = false;
  runtime.readProductionPublicationInputFingerprint({ snapshot: {}, compile });
  TestValidator.equals(
    "timed builder missing reader retains its fallback input",
    seen.at(-1),
    undefined,
  );
  const before: number = compiled;
  TestValidator.equals(
    "reader failure propagates",
    throwsError(
      () =>
        runtime.readProductionPublicationInputFingerprint({
          snapshot: {},
          currentAuthoringEvidence: (): never => {
            throw new Error("target unavailable");
          },
          compile,
        }),
      "target unavailable",
    ),
    true,
  );
  TestValidator.equals("reader failure prevents a compile", compiled, before);
}

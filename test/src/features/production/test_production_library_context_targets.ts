import type { IAutoMovieMaterializedLibrary } from "@automovie/interface";
import { autoMovieLibraryArtifactSourceTargets } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Every owner-produced library artifact preserves its exact source target.
 *
 * Scenarios:
 *
 * 1. Environment, model, and context families from one owner resolve to the
 *    same branch and reviewed H2 while the aggregate index stays library-wide.
 * 2. Encoded context ids use the same portable segment rule as publication.
 * 3. An unowned or multiply owned artifact fails instead of falling back to the
 *    aggregate target.
 *
 * @evidence contracts/testing.md#behavioral-verification Projects library artifact paths through actual owner attribution, asserting the aggregate exception, environment/model/encoded-context ownership, optional-context omission and exact refusal of zero or multiple owners.
 * @evidence contracts/testing.md#independent-expectations The authored index assigns all three artifact ids to library:spaces:docs/spaces/hall.md#hall, while library/index.json is library-wide. Encoding the slash as %2F determines the context filename independently of the lookup result.
 * @evidence contracts/testing.md#distinguishing-cases Aggregate and three owned families contrast with an owner omitting contexts, an unowned context and duplicated ownership. Artifact bytes, source authentication and actual publication are outside this address-projection unit.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_library_context_targets directly invokes synchronous portable production attribution on an authored index, without filesystem reads, a build process or dynamic registration.
 */
export function test_production_library_context_targets(): void {
  const index: IAutoMovieMaterializedLibrary = {
    version: 1,
    builder: "automovie.production.v1",
    production: "library",
    inputFingerprint:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    owners: [
      {
        branch: "spaces",
        owner: "docs/spaces/hall.md#hall",
        source: "src/spaces/hall.ts",
        export: "hall",
        sourceDigest:
          "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        environments: ["hall"],
        models: ["bench"],
        contexts: ["site/entry"],
      },
    ],
  };
  const target: string = "library:spaces:docs/spaces/hall.md#hall";

  TestValidator.equals(
    "library artifact target projection is exact and fail closed",
    namedFacts([
      [
        "indexRemainsAggregate",
        (): boolean =>
          JSON.stringify(
            autoMovieLibraryArtifactSourceTargets("library/index.json", index),
          ) === '["library"]',
      ],
      [
        "environmentKeepsOwner",
        (): boolean =>
          autoMovieLibraryArtifactSourceTargets(
            "library/environments/hall.json",
            index,
          )[0] === target,
      ],
      [
        "modelKeepsOwner",
        (): boolean =>
          autoMovieLibraryArtifactSourceTargets(
            "models/bench.json",
            index,
          )[0] === target,
      ],
      [
        "encodedContextKeepsOwner",
        (): boolean =>
          autoMovieLibraryArtifactSourceTargets(
            "library/contexts/site%2Fentry.json",
            index,
          )[0] === target,
      ],
      [
        "ownerWithoutContextsStillOwnsItsModel",
        (): boolean => {
          const { contexts, ...withoutContexts }: IAutoMovieMaterializedLibrary["owners"][number] = index.owners[0]!;
          return (
            contexts !== undefined &&
            autoMovieLibraryArtifactSourceTargets("models/bench.json", {
              ...index,
              owners: [withoutContexts],
            })[0] === target
          );
        },
      ],
      [
        "unownedArtifactIsRefused",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof autoMovieLibraryArtifactSourceTargets> =>
              autoMovieLibraryArtifactSourceTargets(
                "library/contexts/other.json",
                index,
              ),
            "has no exact owner",
          ),
      ],
      [
        "multiplyOwnedArtifactIsRefused",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof autoMovieLibraryArtifactSourceTargets> =>
              autoMovieLibraryArtifactSourceTargets(
                "library/contexts/site%2Fentry.json",
                {
                  ...index,
                  owners: [index.owners[0]!, index.owners[0]!],
                },
              ),
            "has 2 owners",
          ),
      ],
    ]),
    {
      indexRemainsAggregate: true,
      environmentKeepsOwner: true,
      modelKeepsOwner: true,
      encodedContextKeepsOwner: true,
      ownerWithoutContextsStillOwnsItsModel: true,
      unownedArtifactIsRefused: true,
      multiplyOwnedArtifactIsRefused: true,
    },
  );
}

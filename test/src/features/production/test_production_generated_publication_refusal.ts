import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";
import { loadSourceModule } from "../internal/loadSourceModule";

const { planAutoMovieGeneratedPublication } = loadSourceModule<{
  planAutoMovieGeneratedPublication(
    props: ReturnType<typeof createGeneratedPublicationReader>,
  ): Array<{ path: string; content: Uint8Array | string | null }>;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/planAutoMovieGeneratedPublication.ts",
  ),
);

/**
 * A refused observation never yields a plan or disguises its original cause.
 *
 * Scenarios:
 * 1. Resolution, existence, member-read and ownership-read failures each leave
 *    the exact thrown Error as the caller's failure.
 * 2. No policy path treats an unreadable member or ownership record as absent.
 */
export const test_production_generated_publication_refusal = (): void => {
  for (const boundary of [
    "resolveMember",
    "exists",
    "readMember",
    "readManifest",
  ] as const) {
    const world = createGeneratedPublicationReader({
      previous: null,
      files: new Map([["ship", new Uint8Array([1])]]),
      resident: new Map([["ship", new Uint8Array([1])]]),
      serializedManifest: "ownership\n",
      manifest: new Uint8Array(),
    });
    const failure = new Error(`The ${boundary} observation is refused.`);
    const refused = {
      ...world,
      [boundary]: () => {
        throw failure;
      },
    };
    let caught: unknown;
    let returned = false;
    try {
      planAutoMovieGeneratedPublication(refused);
      returned = true;
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      "no plan follows a refused observation",
      returned === false,
    );
    TestValidator.predicate(
      "observation failure retains the exact cause",
      caught === failure,
    );
  }
};

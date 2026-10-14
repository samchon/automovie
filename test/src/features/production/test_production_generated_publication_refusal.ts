import { TestValidator } from "@nestia/e2e";
import { planAutoMovieGeneratedPublication } from "../../../../packages/production/src/production/planAutoMovieGeneratedPublication";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";

/**
 * A refused observation never yields a plan or disguises its original cause.
 *
 * Scenarios:
 * 1. Resolution, existence, member-read and ownership-read failures each leave
 *    the exact thrown Error as the caller's failure.
 * 2. No policy path treats an unreadable member or ownership record as absent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real planner with each declared observation callback throwing its own Error, requiring no returned plan and exact thrown-object identity; catches swallowed failures or absence fallbacks.
 * @evidence contracts/testing.md#independent-expectations A failed resolution/existence/member/manifest observation cannot authorize candidate writes, and the supplied Error is the independent failure identity. The test observes planning refusal, not rollback after physical writes.
 * @evidence contracts/testing.md#distinguishing-cases Each of the four read-boundary callbacks is exercised against otherwise identical candidate bytes; successful current/changed/missing-member observations have companion entries. Non-Error thrown values are not enumerated here.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_generated_publication_refusal synchronously invokes actual source with its declared callback port, replacing only the caller-owned fixture callback rather than globals or foreign methods.
 */
export function test_production_generated_publication_refusal(): void {
  for (const boundary of [
    "resolveMember",
    "exists",
    "readMember",
    "readManifest",
  ] as const) {
    const world: ReturnType<typeof createGeneratedPublicationReader> = createGeneratedPublicationReader({
      previous: null,
      files: new Map([["ship", new Uint8Array([1])]]),
      resident: new Map([["ship", new Uint8Array([1])]]),
      serializedManifest: "ownership\n",
      manifest: new Uint8Array(),
    });
    const failure: Error = new Error(`The ${boundary} observation is refused.`);
    const refused: typeof world = {
      ...world,
      [boundary]: (): never => {
        throw failure;
      },
    };
    let caught: unknown;
    let returned: boolean = false;
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
}

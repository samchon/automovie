import type { IScenarioSelection } from "./IScenarioSelection";
import { readTestArguments } from "./readTestArguments";

/**
 * Admit the complete test request before discovery. Only an explicit Human option imports its registry for name validation; ordinary include/exclude runs retain the existing generic path and do not import Human here.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The workspace Human selection question reaches this helper through the public filter and observes that invalid names refuse before its discovery callback while a valid request retains exact scenario membership.
 * @evidence contracts/development/testing.md#independent-expectations Literal valid/invalid registry names and independently authored alpha/beta basenames define the expected behavior; the supplied callback does not prove DynamicExecutor's actual filesystem import behavior.
 * @evidence contracts/development/testing.md#distinguishing-cases Explicit valid names and unknown or empty comma-list members cover registry admission; absent Human options retain the original parser path. The existing selection question owns generic discovery failures and scenario matching.
 * @evidence contracts/development/testing.md#execution-ownership This portable async preflight dynamically reads the real registry only for an explicit Human value, generates no person and starts no host; its discoverable workspace question owns the supplied discovery callback.
 */
export async function prepareTestArguments(
  argv: readonly string[],
): Promise<IScenarioSelection> {
  const request: ReturnType<typeof readTestArguments> = readTestArguments(argv);
  if (request.humanPeople !== undefined)
    throw new Error(
      "Human population selection was removed with the realistic Human body.",
    );
  return request.selection;
}

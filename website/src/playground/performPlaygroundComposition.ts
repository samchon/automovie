import type { IPlaygroundAdapter } from "./IPlaygroundAdapter";
import { PlaygroundAddress } from "./PlaygroundAddress";
import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";

/**
 * Admit a composition's address, publish it, then ask the take adapter for
 * its result. A rejected address, browser history write or adapter request
 * returns the page's existing error refusal so its building state can end.
 *
 * @param adapter The page's take adapter.
 * @param composition The current edited input, left untouched.
 * @param writeAddress Publish the admitted fragment in the page's address.
 * @returns The adapter's result, or the original failure message as an error.
 */
export async function performPlaygroundComposition(
  adapter: Pick<IPlaygroundAdapter, "perform">,
  composition: IPlaygroundComposition,
  writeAddress: (hash: string) => void,
): Promise<IPlaygroundAdapter.Result> {
  try {
    const hash: string = PlaygroundAddress.encode(composition);
    writeAddress(hash);
    return await adapter.perform(composition);
  } catch (error) {
    return {
      kind: "refusal",
      refusal: {
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
        performer: "",
        act: "",
        instance: 0,
        axis: "",
        value: undefined,
        feasible: null,
        alternatives: [],
        fix: "",
      },
    };
  }
}

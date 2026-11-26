import {
  IAutoMovieDefinedShot,
  IAutoMovieShotDefinition,
} from "@automovie/interface";

/**
 * Register one coding-agent-authored shot under `id`.
 *
 * Returns a new record of exactly id, scene, contract and build; the id
 * argument is authoritative and extra definition fields are dropped. The
 * builder is not called and values are not validated here; compileDefinedShot
 * owns those phases and their structured diagnostics. Reading definition fields
 * can invoke author-supplied accessors, so registration does not sandbox module
 * evaluation. The contract and builder are shared by reference.
 */
export function defineShot<Context>(
  id: string,
  definition: IAutoMovieShotDefinition<Context>,
): IAutoMovieDefinedShot<Context> {
  return {
    id,
    scene: definition.scene,
    contract: definition.contract,
    build: definition.build,
  };
}

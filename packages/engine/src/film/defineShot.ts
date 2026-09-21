import { IAutoMovieDefinedShot, IAutoMovieShotDefinition } from "@automovie/interface";

/**
 * Register one coding-agent-authored shot.
 *
 * This helper deliberately does not execute or validate the builder. Module
 * evaluation remains side-effect free; {@link compileDefinedShot} owns all
 * validation and converts author-visible failures into structured diagnostics.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Registers an ordinary TypeScript shot definition without executing it or creating hidden editor state.
 * @evidence requirements/staging/shot-contracts-and-deliveries.md#staging-shot-source-binding Keeps the shot id, scene id, contract beat, and source builder together as the one registered value later compilation must realize.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input defineShot keeps the shot identity and builder as explicit source input for the later builder boundary.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-contract-realization-acceptance-status Establishes the registered shot, scene, beat, and builder identity that realization checks against the compiled program.
 */
export const defineShot = <Context>(
  id: string,
  definition: IAutoMovieShotDefinition<Context>,
): IAutoMovieDefinedShot<Context> => ({ id, ...definition });

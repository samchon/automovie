import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanCanonicalBody } from "./AutoMovieHumanCanonicalBody";

/**
 * Prepared bodies for a parameter set, made once per process: what a caller
 * asks for when it needs a canonical polygon man to move, without paying the
 * seconds a preparation takes each time it asks.
 *
 * A body is prepared by `AutoMovieHumanCanonicalBody.prepare` from the
 * Human's parameters, the body's mass and the skeleton id. The same three
 * give the same body, so the first preparation is kept and every later ask
 * of the same three returns it; a different mass, id or parameter makes a new
 * body. The bodies are shared, so a caller must not change one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared, what keys a body, that it is shared and must not be changed.
 * @evidence contracts/development/design.md#principled-representation A body is a pure function of its parameters, its mass and its id, so a table keyed by the three holds each one once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, one count and one release; the preparation is the canonical body's, not restated.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person is named here: the parameters are the caller's.
 */
export namespace AutoMovieHumanBodies {
  /**
   * The prepared body for a parameter set, made on the first ask and kept.
   *
   * @param params The Human's parameters.
   * @param options The body's mass in kilograms and the skeleton id.
   * @returns The canonical body, shared with every caller of the same three.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the sharing and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The key is the id, the mass and the parameters written out, so two asks share a body exactly when the preparation would give the same one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one lookup and one preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is approximated: a body is reused only for the same parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms A preparation takes seconds and the key a few kilobytes of text, so every ask after the first costs one serialization.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The point of the table: one preparation per parameter set and process.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The table holds its bodies until `forget`; a process that prepares many people releases them there. The table has no other bound: it grows by one body for each distinct id, mass and parameter set asked.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    options: { mass: number; id: string },
  ): AutoMovieHumanCanonicalBody.IBody {
    const key: string = JSON.stringify([options.id, options.mass, params]);
    let body: AutoMovieHumanCanonicalBody.IBody | undefined = BODIES.get(key);
    if (body === undefined) {
      body = AutoMovieHumanCanonicalBody.prepare(params, options);
      BODIES.set(key, body);
    }
    return body;
  }

  /**
   * How many bodies the process keeps.
   *
   * @returns The count.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The table's own size.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function size(): number {
    return BODIES.size;
  }

  /**
   * Release every kept body; the next ask prepares again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is released and what follows.
   * @evidence contracts/development/implementation.md#principled-implementation The table is emptied, so its bodies are left to the collector once no caller holds them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clear.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the bodies kept.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The release of what `prepare` keeps.
   */
  export function forget(): void {
    BODIES.clear();
  }
}

/** The prepared bodies, by their id, mass and parameters. */
const BODIES: Map<string, AutoMovieHumanCanonicalBody.IBody> = new Map();

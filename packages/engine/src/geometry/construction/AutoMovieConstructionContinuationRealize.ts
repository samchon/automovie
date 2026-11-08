import type { IAutoMovieConstructionContinuation, AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieConstructionContinuation } from "./AutoMovieConstructionContinuation";
import { AutoMovieConstructionRing } from "./AutoMovieConstructionRing";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Retain a continuation only while both actual open ends survive its subtree.
 *
 * The host is realized first. The ordinary continuation override then admits
 * or re-expresses the part's endpoint before its surface is published. After
 * all part operations, both endpoints must still be available before one ring
 * is allocated. Failed numeric admission restores the host checkpoint and
 * records the continuation's name. Foreign errors restore it and propagate
 * unchanged. Nested continuations targeting another end of the same leaf
 * apply every enclosing pending boundary before their own boundary. Each
 * pending owner records its actual result, and the previous map entry is
 * restored even when a subtree throws.
 *
 * The call mutates the existing body/state. Its snapshot costs O(F+C) for
 * existing faces and cycles; operator, source and O(samples) ring work retain
 * their existing owners. The checkpoint and callbacks have call lifetime.
 */
export function AutoMovieConstructionContinuationRealize(
  node: IAutoMovieConstructionContinuation,
  body: AutoMovieSolidBody.IBody,
  state: AutoMovieConstructionState.IState,
  walk: (node: AutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
): void {
  walk(node.host);
  const hostIndex: number | undefined = state.faces.get(node.hostFace);
  const hostChain: IAutoMovieLoftChain | undefined = state.chains.get(node.hostFace);
  if (hostIndex === undefined || hostChain === undefined)
    return report(node.name, "host face", `the host face ${node.hostFace} was not realized`);
  const hostKind: "start" | "end" = node.hostEnd === "bottom" ? "start" : "end";
  if (cut(body, hostIndex, hostKind))
    return report(node.name, "shared end", `the host face's ${node.hostEnd} end is already cut away by a join or a trim`);
  const snapshot: AutoMovieConstructionState.ISnapshot = AutoMovieConstructionState.snap(body, state);
  const previous: AutoMovieConstructionState.IOverride | undefined = state.overrides.get(node.partFace);
  const override: AutoMovieConstructionState.IOverride = {
    apply: (chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string => {
      // Both ends of one leaf can belong to enclosing continuation nodes.
      // Preserve their endpoint transformations and their distinct outcomes.
      const inherited: IAutoMovieLoftChain | string = previous === undefined ? chain : previous.apply(chain);
      if (typeof inherited === "string") {
        previous!.error = inherited;
        return inherited;
      }
      if (previous !== undefined) previous.applied = true;
      return AutoMovieConstructionContinuation.apply(hostChain, node.hostEnd, inherited, node.partEnd);
    },
    applied: false,
    error: null,
  };

  /** Keep the diagnostic while discarding every post-checkpoint part effect. */
  const fail: (detail: string) => void = (detail: string): void => {
    report(node.name, "shared end", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  state.overrides.set(node.partFace, override);
  try {
    walk(node.part);
    const partIndex: number | undefined = state.faces.get(node.partFace);
    if (!override.applied || partIndex === undefined)
      return fail(override.error ?? `the part face ${node.partFace} was not realized`);
    const partKind: "start" | "end" = node.partEnd === "bottom" ? "start" : "end";
    if (cut(body, partIndex, partKind))
      return fail(`the part face's ${node.partEnd} end was cut away or shared by its subtree`);
    if (!(Number.isInteger(hostChain.samples) && hostChain.samples >= 3))
      return fail("the shared ring needs at least three host phase samples");
    const partChain: IAutoMovieLoftChain = state.chains.get(node.partFace)!;
    AutoMovieConstructionRing.create(body, {
      host: hostIndex,
      hostStation: end(hostChain, node.hostEnd),
      hostKind,
      part: partIndex,
      partStation: end(partChain, node.partEnd),
      partKind,
      count: hostChain.samples,
      sign: AutoMovieConstructionContinuation.sign(node.hostEnd, node.partEnd),
    });
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "shared end", error.message);
  } finally {
    if (previous === undefined) state.overrides.delete(node.partFace);
    else state.overrides.set(node.partFace, previous);
  }
}

/** Both a trimmed end and an existing shared end have consumed that boundary. */
function cut(body: AutoMovieSolidBody.IBody, index: number, kind: "start" | "end"): boolean {
  return body.faces[index]!.cycles.some((cycle: AutoMovieSolidCycle.ICycle): boolean => cycle.kind === kind);
}

/** The principal endpoint is already admitted as a regular open source station. */
function end(chain: IAutoMovieLoftChain, side: "bottom" | "top"): number {
  return chain.layers[side === "bottom" ? 0 : chain.layers.length - 1]!.y;
}

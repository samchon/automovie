import { rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";

/**
 * Resolve flexible line parts in attachment order, including lines on lines.
 *
 * @param archetype Producer identity used in physical dependency refusals.
 * @param spans Complete declarations with unique cylinder ids.
 * @param parts Current model parts before flexible lines are rebuilt.
 * @param read Shared endpoint-state owner, reading the current dependency pose.
 * @returns Current line geometry and states in declaration order.
 * @throws {AutoMovieArchetypeRefusal} For missing/non-cylinder line parts, duplicate declarations or cyclic line attachments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines dependency order, same-pose endpoint lookup, original declaration ordering, rigid cylinder ownership and unsupported cycles.
 * @evidence contracts/development/implementation.md#principled-implementation Kahn's topological traversal resolves a line only after every line carrying one of its endpoints. The shared endpoint reader sees an array whose predecessor cylinders already have their current transforms and lengths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Index declarations and parts, derive dependency counts, resolve each ready line once, and refuse any remaining cycle before returning states in the original order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No declaration-order guess, stale predecessor frame, missing line part or recursive cycle substitutes for a physical attachment. The injected reader is the existing shared state operation, avoiding a runtime module cycle and duplicate endpoint arithmetic.
 * @evidence contracts/development/implementation.md#efficient-algorithms Graph/index work is O(P+S); shared endpoint lookup remains O(S(P+A)) for parts, spans and contacts. O(P+S) call-local storage and an iterative queue avoid unbounded recursion.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each predecessor geometry and endpoint state is computed once and shared by its dependents and the held-frame emission operation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one new parts array and S states, sharing unchanged records; maps and queue are released after the call, with no retained model, sample cache or external resource.
 */
export function resolveArchetypeSpanParts(
  archetype: string,
  spans: readonly AutoMovieArchetypeSpan.ISpan[],
  parts: IAutoMovieModelPart[],
  read: (
    span: AutoMovieArchetypeSpan.ISpan,
    current: readonly IAutoMovieModelPart[],
  ) => AutoMovieArchetypeSpan.IState,
): { parts: IAutoMovieModelPart[]; states: AutoMovieArchetypeSpan.IState[] } {
  const indices: Map<string, number> = new Map();
  const partIndices: Map<string, number> = new Map(
    parts.map((part: IAutoMovieModelPart, index: number): [string, number] => [
      part.id,
      index,
    ]),
  );
  for (let index: number = 0; index < spans.length; index++) {
    const span: AutoMovieArchetypeSpan.ISpan = spans[index]!;
    if (indices.has(span.id))
      refuse(span.id, "a span id must be declared only once");
    const partIndex: number | undefined = partIndices.get(span.id);
    const part: IAutoMovieModelPart | undefined =
      partIndex === undefined ? undefined : parts[partIndex];
    if (
      part?.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder"
    )
      refuse(span.id, "a declared span requires its actual cylinder part");
    indices.set(span.id, index);
  }
  const incoming: number[] = spans.map((): number => 0);
  const followers: number[][] = spans.map((): number[] => []);
  for (let index: number = 0; index < spans.length; index++) {
    const dependencies: Set<number> = new Set();
    for (const end of [spans[index]!.from, spans[index]!.to]) {
      const dependency: number | undefined =
        end.part === undefined ? undefined : indices.get(end.part);
      if (dependency !== undefined) dependencies.add(dependency);
    }
    incoming[index] = dependencies.size;
    for (const dependency of dependencies) followers[dependency]!.push(index);
  }
  const ready: number[] = [];
  for (let index: number = 0; index < spans.length; index++)
    if (incoming[index] === 0) ready.push(index);
  const current: IAutoMovieModelPart[] = [...parts];
  const states: Map<string, AutoMovieArchetypeSpan.IState> = new Map();
  for (let cursor: number = 0; cursor < ready.length; cursor++) {
    const index: number = ready[cursor]!;
    const span: AutoMovieArchetypeSpan.ISpan = spans[index]!;
    const state: AutoMovieArchetypeSpan.IState = read(span, current);
    const partIndex: number = partIndices.get(span.id)!;
    const part: IAutoMovieModelPart = current[partIndex]!;
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder"
    )
      refuse(
        span.id,
        "the line's admitted primitive was lost during dependency resolution",
      );
    const from: IAutoMovieVector3 = state.from;
    const to: IAutoMovieVector3 = state.to;
    current[partIndex] = {
      ...part,
      geometry: {
        ...part.geometry,
        shape: {
          ...part.geometry.shape,
          radius: span.radius,
          height: state.length,
        },
      },
      transform: {
        translation: {
          x: midpoint(from.x, to.x),
          y: midpoint(from.y, to.y),
          z: midpoint(from.z, to.z),
        },
        rotation: rotationBetween(
          { x: 0, y: 1, z: 0 },
          {
            x: (to.x - from.x) / state.length,
            y: (to.y - from.y) / state.length,
            z: (to.z - from.z) / state.length,
          },
        ),
        scale: { x: 1, y: 1, z: 1 },
      },
    };
    states.set(span.id, state);
    for (const follower of followers[index]!) {
      incoming[follower] = incoming[follower]! - 1;
      if (incoming[follower] === 0) ready.push(follower);
    }
  }
  if (ready.length !== spans.length)
    refuse(
      "span",
      "cyclic span attachments have no independent current-frame solution",
    );
  return {
    parts: current,
    states: spans.map(
      (span: AutoMovieArchetypeSpan.ISpan): AutoMovieArchetypeSpan.IState =>
        states.get(span.id)!,
    ),
  };

  /** Preserve ordinary arithmetic order while avoiding an overflowing same-sign sum. */
  function midpoint(a: number, b: number): number {
    const sum: number = a + b;
    return Number.isFinite(sum) ? sum / 2 : a / 2 + b / 2;
  }

  /** A malformed physical dependency is a producer/request error, never a fallback pose. */
  function refuse(id: string, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: id,
      value: id,
      feasible: null,
      reason,
      fix: "declare unique cylinder spans with existing carriers and an acyclic attachment graph",
    });
  }
}

import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeSpan } from "../AutoMovieArchetypeSpan";

/*
 * Resolve flexible line parts in attachment order, including lines on lines.
 * Parameter archetype: Producer identity used in physical dependency refusals.
 * Parameter spans: Complete declarations with unique cylinder ids.
 * Parameter parts: Current model parts before flexible lines are rebuilt.
 * Parameter read: Shared endpoint-state owner, reading the current dependency pose.
 * Returns: Current line geometry and states in declaration order.
 * For missing/non-cylinder line parts,
 * duplicate declarations or cyclic line attachments.
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
        rotation: AutoMovieEngineMath.rotationBetween(
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

  /*
   * Preserve ordinary arithmetic order while avoiding an overflowing same-sign
   * sum.
   */
  function midpoint(a: number, b: number): number {
    const sum: number = a + b;
    // An overflowing sum halves each term instead.
    return sum !== Infinity && sum !== -Infinity ? sum / 2 : a / 2 + b / 2;
  }

  /*
   * A malformed physical dependency is a producer/request error, never a
   * fallback pose.
   */
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

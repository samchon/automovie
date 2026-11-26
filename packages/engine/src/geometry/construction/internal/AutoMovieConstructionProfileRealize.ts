import type {
  IAutoMovieConstructionProfileBody,
  IAutoMovieConstructionProfileRealize,
  IAutoMovieConstructionProfileSource,
  IAutoMovieConstructionState,
  IAutoMoviePreparedConstructionProfile,
  IAutoMovieSolidBody,
} from "@automovie/interface";

import { AutoMovieConstructionProfile } from "../AutoMovieConstructionProfile";
import { AutoMovieConstructionProfileBody } from "../AutoMovieConstructionProfileBody";
import { AutoMovieConstructionState } from "../AutoMovieConstructionState";

/**
 * Resolve one pure profile leaf to its actual invocation-owned original family.
 *
 * A detached declaration is compared structurally without property-order or
 * object-identity assumptions. Actual curve/frame functions then prepare the
 * retained atlas, physical2 grids and shared mesh boundaries once. Initial
 * source/preparation failures become a named leaf diagnostic, matching source
 * leaf admission; appended body/list changes roll back to the same checkpoint.
 * Exceptions from later retained readers keep their existing operator policy.
 */
export function AutoMovieConstructionProfileRealize(
  node: IAutoMovieConstructionProfileRealize.INode,
  context: ReadonlyMap<string, IAutoMovieConstructionProfileSource> | undefined,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  tolerance: number,
): void {
  const snapshot: IAutoMovieConstructionState.ISnapshot =
    AutoMovieConstructionState.snap(body, state);
  try {
    const source: IAutoMovieConstructionProfileSource | undefined =
      context?.get(node.name);
    const { type: _type, ...definition }: typeof node = node;
    if (source === undefined || !equal(definition, source.definition))
      throw new Error(
        "The invocation has no matching complete original profile declaration.",
      );
    const prepared: IAutoMoviePreparedConstructionProfile.IPrepared =
      AutoMovieConstructionProfile.create(source);
    const ends: IAutoMovieConstructionProfileBody.IEnd[] =
      AutoMovieConstructionProfileBody.append(body, prepared, tolerance);
    for (let index: number = snapshot.faces; index < body.faces.length; index++)
      state.faces.set(body.faces[index]!.surface.name, index);
    (state.profiles ??= []).push(prepared);
    (state.profileEnds ??= []).push(...ends);
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    state.diagnostics.push({
      node: node.name,
      contract: "profile source",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Pure AST equality ignores omitted optional undefined properties, preserving
 * array order and every actual scalar value.
 */
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value: unknown, index: number): boolean =>
        equal(value, b[index]),
      )
    );
  const left: Record<string, unknown> = a as Record<string, unknown>;
  const right: Record<string, unknown> = b as Record<string, unknown>;
  const keys: string[] = Object.keys(left)
    .filter((key: string): boolean => left[key] !== undefined)
    .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  const other: string[] = Object.keys(right)
    .filter((key: string): boolean => right[key] !== undefined)
    .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  return (
    keys.length === other.length &&
    keys.every(
      (key: string, index: number): boolean =>
        key === other[index] && equal(left[key], right[key]),
    )
  );
}

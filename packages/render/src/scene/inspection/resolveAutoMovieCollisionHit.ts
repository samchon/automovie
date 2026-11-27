import type { IAutoMovieSceneCollision as Collision } from "@automovie/interface";

import type { AutoMovieRenderInspectionGeometry } from "./AutoMovieRenderInspectionGeometry.js";
import { findAutoMovieCollisionWitness } from "./findAutoMovieCollisionWitness.js";

/**
 * Resolve one candidate pair of the Engine layer search into evidence.
 *
 * A permitted pair stays permitted. Exact shapes touching within the native
 * query's precision are clear. A confirmed exact pair keeps its measured
 * witness. Any other pair is decided by a drawn-surface witness, a complete
 * search proving clearance, an exhausted budget or an incomplete search.
 *
 * @param props The hit, the frame's parts and surfaces, the solid memo, the
 *   named windows and the shared budget.
 * @returns The resolution of the pair.
 */
export function resolveAutoMovieCollisionHit(
  props: resolveAutoMovieCollisionHit.IProps,
): resolveAutoMovieCollisionHit.IResolution {
  const { hit } = props;
  if (hit.status === "permitted") return { kind: "permitted" };
  if (hit.status === "candidate" && hit.basis === "displayed")
    return { kind: "clear" };
  if (hit.status === "confirmed")
    return {
      kind: "witness",
      point: hit.point!,
      separation: hit.separation!,
    };
  return findAutoMovieCollisionWitness({
    pair: hit,
    surfaces: props.surfaces,
    solidOf: props.solidOf,
    allowance: allowanceLaw(props.allowances, props.seconds, hit),
    budget: props.budget,
  });
}

/** Inputs and resolutions of one candidate pair. */
export namespace resolveAutoMovieCollisionHit {
  /** One hit and the frame state that decides it. */
  export interface IProps {
    /** The Engine search's observation of the pair. */
    readonly hit: Collision.IFinding;
    /** Lazy drawn surfaces by part. */
    readonly surfaces: AutoMovieRenderInspectionGeometry.IResult["surfaces"];
    /** Memoized solid of a part. */
    readonly solidOf: findAutoMovieCollisionWitness.IProps["solidOf"];
    /** The layer's named windows. */
    readonly allowances: readonly Collision.IAllowance[];
    /** Layer-local seconds of the placement. */
    readonly seconds: number;
    /** Comparisons and triangle visits the observation may still spend. */
    readonly budget: findAutoMovieCollisionWitness.IProps["budget"];
  }

  /** A permitted pair, or the witness search's outcome. */
  export type IResolution =
    | { readonly kind: "permitted" }
    | findAutoMovieCollisionWitness.IOutcome;
}

/**
 * The allowed depth of a witness on one part's surface: the tightest named
 * window active now for the pair whose scope admits the joint labelling the
 * witness on each side, or zero when none does. An unlabelled side meets only
 * windows that leave it unscoped.
 */
function allowanceLaw(
  allowances: readonly Collision.IAllowance[],
  seconds: number,
  pair: Pick<Collision.IFinding, "first" | "second">,
): findAutoMovieCollisionWitness.IProps["allowance"] {
  const active: Collision.IAllowance[] = allowances.filter(
    (entry: Collision.IAllowance): boolean =>
      seconds >= entry.startSeconds &&
      seconds < entry.endSeconds &&
      ((entry.first === pair.first && entry.second === pair.second) ||
        (entry.first === pair.second && entry.second === pair.first)),
  );
  const admits = (
    scope: readonly string[] | undefined,
    joint: string | undefined,
  ): boolean =>
    scope === undefined || (joint !== undefined && scope.includes(joint));
  return (
    mover: string,
    moverJoint: string | undefined,
    holderJoint: string | undefined,
  ): number => {
    let limit: number | null = null;
    for (const entry of active) {
      const moverScope: readonly string[] | undefined =
        entry.first === mover ? entry.firstJoints : entry.secondJoints;
      const holderScope: readonly string[] | undefined =
        entry.first === mover ? entry.secondJoints : entry.firstJoints;
      if (!admits(moverScope, moverJoint) || !admits(holderScope, holderJoint))
        continue;
      limit =
        limit === null
          ? entry.maxPenetration
          : Math.min(limit, entry.maxPenetration);
    }
    return limit ?? 0;
  };
}

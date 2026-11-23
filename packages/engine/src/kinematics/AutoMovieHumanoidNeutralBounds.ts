import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeBounds } from "../physics/physicalShapeBounds";

/**
 * Operation-owned exact neutral segment bounds for sequential body derivation.
 * Ordinary reads are fresh; an optional producer-issued handle shares only its
 * live profile's actual segments. Geometry stays unchanged until release.
 */
export namespace AutoMovieHumanoidNeutralBounds {
  /** Opaque ownership of one synchronous unchanged-profile epoch. */
  export interface IPrepared {
    /** Private nominal producer identity, also admitted by the live map. */
    readonly [BRAND]: true;
  }

  /**
   * Start a bounds epoch without calculating geometry or changing refusal
   * order.
   */
  export function prepare(profile: P): IPrepared {
    const handle: IPrepared = { [BRAND]: true };
    LIVE.set(handle, {
      profile,
      segments: new Set(profile.segments),
      bounds: new Map(),
    });
    return handle;
  }

  /** Read fresh independent vectors, optionally sharing a genuine epoch. */
  export function read(
    profile: P,
    segment: IAutoMoviePhysicalSegment,
    handle?: IPrepared,
  ): IBounds {
    if (handle === undefined) return calculate(segment);
    const state: IState | undefined = LIVE.get(handle);
    if (
      state === undefined ||
      state.profile !== profile ||
      !state.segments.has(segment)
    )
      throw new Error(
        "Neutral bounds need their live unchanged profile and segment",
      );
    let bounds: IBounds | undefined = state.bounds.get(segment);
    if (bounds === undefined) {
      bounds = calculate(segment);
      state.bounds.set(segment, bounds);
    }
    return { min: { ...bounds.min }, max: { ...bounds.max } };
  }

  /**
   * End the epoch and invalidate every later read; repeated release is
   * harmless.
   */
  export function release(handle: IPrepared): void {
    LIVE.delete(handle);
  }
}

/** Genuine-handle brand; callers receive neither it nor the state map. */
const BRAND: unique symbol = Symbol("AutoMovieHumanoidNeutralBounds");

/** Exact axis bounds in world metres; every outward copy owns its vectors. */
interface IBounds {
  /** Axis minima, world metres. */
  min: IAutoMovieVector3;

  /** Axis maxima, world metres. */
  max: IAutoMovieVector3;
}

/** One fixed profile epoch's permitted identities and completed numeric bounds. */
interface IState {
  /** Borrowed unchanged source for identity admission. */
  profile: P;

  /** Actual permitted segment objects, including duplicate-name entries. */
  segments: Set<IAutoMoviePhysicalSegment>;

  /** One private six-coordinate result per observed segment. */
  bounds: Map<IAutoMoviePhysicalSegment, IBounds>;
}

/** No strong module-owned profile or operation population remains after release. */
const LIVE: WeakMap<AutoMovieHumanoidNeutralBounds.IPrepared, IState> =
  new WeakMap();

/** Preserve the original component update order without a per-shape axis array. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/** Every original collider contributes in original shape/component order. */
function calculate(segment: IAutoMoviePhysicalSegment): IBounds {
  const bounds: IBounds = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  for (const shape of segment.shapes) {
    const next: IBounds = physicalShapeBounds(segment.neutral, shape);
    for (const axis of AXES) {
      bounds.min[axis] = Math.min(bounds.min[axis], next.min[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], next.max[axis]);
    }
  }
  return bounds;
}

import { type AutoMovieEnginePhysicsGjkTypes, AutoMovieEnginePhysics, Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEnginePlanarGeometry } from "@automovie/engine";

import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePlanarPoint,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { mountCastObstruction } from "./mountCastObstruction";

/** A range along the deck's forward axis, metres. */
type Span = readonly [number, number];

/** From the pelvis towards the deck, in the material axes. */
const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/** The seat's longitudinal translation axis in the material axes. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** Box face normals, one for each pair of parallel opposing faces. */
const BOX_AXES: readonly IAutoMovieVector3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  FORWARD,
];

/**
 * Roundoff for frame transforms, their support-plane witnesses, and their
 * pairwise differences. It scales with the deck and pelvis coordinates.
 */
const FRAME_ROUNDOFF: number = 64 * Number.EPSILON;

/**
 * A centred astride position supported on the actual seat deck. The pelvis
 * rests on its lowest feature and slides only along the deck's sagittal line.
 * A translated solid sweeps exactly its two-placement convex hull
 * (`AutoMovieEnginePhysics.physicalShapeGjkCast`, the cast hull of Bullet and Tesseract). Use its
 * whole-span separation and the disjoint projections of convex solids
 * (Gottschalk, Lin and Manocha 1996, §5) to bound each obstruction.
 * Tighten each obstruction by the exact prefix and suffix casts so an
 * angled ramp does not remove a clear interval. The centre of the widest such
 * interval gives a neutral bearing region (Elmeua González and Šarabon 2022,
 * Fig. 1C, https://doi.org/10.7717/peerj.14438).
 *
 * @param input The deck, the positioned pelvis at its socket and the solids
 *   around it, all in the deck's material axes.
 * @returns A clear region and its plane-bearing point, when found.
 */
export function prepareMountSeat(
  input: prepareMountSeat.IInput,
): prepareMountSeat.ISeat | undefined {
  const { deck, pelvis, obstacles } = input;
  const support = AutoMovieEnginePhysics.physicalShapeBounds(deck.pose, deck.shape);
  if (pelvis.length === 0 || support.min.x > 0 || support.max.x < 0)
    return undefined;
  const bodies = pelvis.map((part: prepareMountSeat.ISolid) => ({
    part,
    bounds: AutoMovieEnginePhysics.physicalShapeBounds(part.pose, part.shape),
  }));
  const rise: number =
    support.max.y - Math.min(...bodies.map(({ bounds }) => bounds.min.y));
  const tolerance: number = seatPrecision(support, rise);
  let clear: Span[] = [[support.min.z, support.max.z]];
  const surrounding = obstacles.map((part: prepareMountSeat.ISolid) => ({
    part,
    bounds: AutoMovieEnginePhysics.physicalShapeBounds(part.pose, part.shape),
    faces: boxFaces(part),
  }));
  for (const { part: body, bounds } of bodies) {
    const raised: IAutoMovieRigidTransform = {
      ...body.pose,
      position: Vector3.add(body.pose.position, { x: 0, y: rise, z: 0 }),
    };
    const solid: AutoMovieEnginePhysicsGjkTypes.ISolid = AutoMovieEnginePhysics.physicalShapeGjkSolid(
      raised,
      body.shape,
    );
    for (const { part: obstacle, bounds: limits, faces } of surrounding) {
      if (
        limits.max.x <= bounds.min.x ||
        limits.min.x >= bounds.max.x ||
        limits.max.y <= bounds.min.y + rise ||
        limits.min.y >= bounds.max.y + rise
      )
        continue;
      const from: number = Math.max(
        support.min.z,
        limits.min.z - bounds.max.z,
      );
      const to: number = Math.min(
        support.max.z,
        limits.max.z - bounds.min.z,
      );
      if (!(to > from)) continue;
      const blocked: Span | undefined = mountCastObstruction(
        solid,
        AutoMovieEnginePhysics.physicalShapeGjkSolid(obstacle.pose, obstacle.shape),
        FORWARD,
        [from, to],
        tolerance,
        faces,
      );
      if (blocked === undefined) continue;
      clear = clear.flatMap((range: Span): Span[] => without(range, ...blocked));
      if (clear.length === 0) return undefined;
    }
  }

  // A projected deck can overstate support for a curved top. Verify the
  // actual common lower-pelvis and deck-top feature at the chosen point.
  clear.sort(
    (a: Span, b: Span): number => b[1] - b[0] - (a[1] - a[0]),
  );
  for (const range of clear) {
    const z: number = AutoMovieEngineMath.midpoint(range[0], range[1]);
    const shift: IAutoMovieVector3 = { x: 0, y: rise, z };
    if (bearsPatch(deck, pelvis, shift, support.max.y, tolerance))
      return { point: shift, range };
  }
  return undefined;
}

/** The roundoff shared by sagittal admission and a single support witness. */
function seatPrecision(
  support: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds>,
  rise: number,
): number {
  return (
    FRAME_ROUNDOFF *
    Math.max(
      1,
      Math.abs(support.min.z),
      Math.abs(support.max.z),
      Math.abs(support.max.y),
      Math.abs(rise),
    )
  );
}

/** The real contact patch and its supported socket projection at one pose. */
function bearsPatch(
  deck: prepareMountSeat.ISolid,
  pelvis: readonly prepareMountSeat.ISolid[],
  point: IAutoMovieVector3,
  height: number,
  tolerance: number,
): boolean {
  const patch: IAutoMovieVector3[] = [];
  for (const body of pelvis)
    for (const witness of AutoMovieEnginePhysics.physicalShapeContactManifold(
      { ...body.pose, position: Vector3.add(body.pose.position, point) },
      body.shape,
      deck.pose,
      deck.shape,
      DOWN,
      tolerance,
    ))
      if (
        Math.abs(witness.pointA.y - height) <= tolerance &&
        Vector3.distance(witness.pointA, witness.pointB) <= tolerance
      )
        patch.push(witness.pointA);
  const polygon: IAutoMoviePlanarPoint[] = AutoMovieEngineMath.convexHull2D(patch).map(
    (p: IAutoMovieVector3): IAutoMoviePlanarPoint => ({ x: p.x, y: p.z }),
  );
  return (
    polygon.length >= 3 && AutoMovieEnginePlanarGeometry.pointInPolygon({ x: point.x, y: point.z }, polygon)
  );
}

/** A box's oriented feature axes, in the seat's material axes. */
function boxFaces(
  part: prepareMountSeat.ISolid,
): readonly IAutoMovieVector3[] | undefined {
  if (part.shape.kind !== "box") return undefined;
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    part.pose.rotation,
    part.shape.transform.rotation,
  );
  return BOX_AXES.map(
    (axis: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(turn, axis),
  );
}

/** Remove the interior of the remaining obstructed interval. */
function without(range: Span, from: number, to: number): Span[] {
  if (from >= range[1] || to <= range[0]) return [range];
  const kept: Span[] = [];
  if (from > range[0]) kept.push([range[0], from]);
  if (to < range[1]) kept.push([to, range[1]]);
  return kept;
}

/** Inputs and the prepared seat-domain result. */
export namespace prepareMountSeat {
  /**
   * Check the deck bearing at one already selected pelvis socket. The
   * opposing features must coincide at the actual deck top and their planar
   * contact patch must contain the socket's projection.
   *
   * @param input The deck and the pelvis solids relative to the zero socket.
   * @param point The selected socket in the deck's material axes, metres.
   * @returns Whether the common contact patch supports that socket.
   */
  export function bears(
    input: Pick<IInput, "deck" | "pelvis">,
    point: IAutoMovieVector3,
  ): boolean {
    const { deck, pelvis } = input;
    const support: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds> = AutoMovieEnginePhysics.physicalShapeBounds(
      deck.pose,
      deck.shape,
    );
    return bearsPatch(
      deck,
      pelvis,
      point,
      support.max.y,
      seatPrecision(support, point.y),
    );
  }

  /** An actual convex collider placed in the seat's material axes. */
  export interface ISolid {
    /** The collider's parent frame in the seat's axes. */
    pose: IAutoMovieRigidTransform;

    /** The independent shape in its parent's frame. */
    shape: IAutoMoviePhysicalShape;
  }

  /** One fixed loading orientation over the material's sagittal line. */
  export interface IInput {
    /** The finite seat deck whose exposed upper face bears the pelvis. */
    deck: ISolid;

    /** The pelvis colliders at its zero socket in the loading orientation. */
    pelvis: readonly ISolid[];

    /** The surrounding material, excluding the deck. */
    obstacles: readonly ISolid[];
  }

  /** A neutral bearing and the connected interval certified around it. */
  export interface ISeat {
    /** The anatomically posed socket in the seat's local frame, metres. */
    point: IAutoMovieVector3;

    /** The sagittal nonpenetration interval at the same height, metres. */
    range: Span;
  }
}

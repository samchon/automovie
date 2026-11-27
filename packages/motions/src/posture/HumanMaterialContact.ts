import { type AutoMovieEnginePhysicsGjkTypes, Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEnginePhysics } from "@automovie/engine";

import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanColliderPlacement } from "./HumanColliderPlacement";
import { poseBones } from "./internal/poseBones";
import { resolveHumanPosture } from "./internal/resolveHumanPosture";

/** Finite bearing faces and their paired contact with displayed Human shapes. */
export namespace HumanMaterialContact {
  /** Model-local plane with an ordered boundary in the local XZ plane. */
  export interface IFace {
    /** Frame carrying +Y out of the material. */
    frame: IAutoMovieRigidTransform;
    /** Boundary in the frame's local XZ plane, metres. */
    outline: readonly IAutoMovieVector3[];
    /** A prepared shape query in the face frame when the site owns one. */
    query?: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContactPrepare>;
  }

  /** A named finite feature whose geometry moves rigidly with its site. */
  export interface ISite {
    /** Support frame that receives the contact. */
    support: IAutoMovieMotionHumanContactWindow.Support;
    /** The face's origin, rotation and fixed finite perimeter at a second. */
    at(seconds: number): IFace;
  }

  /** Outward normal of every face, in its own frame. */
  export const NORMAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /**
   * Snapshot a named face's perimeter. A point-only site has no material
   * perimeter. Seat depth runs back from the front edge; a surface or tread is
   * centered. Site reads follow the displayed articulation at the same film
   * second without rebuilding the perimeter.
   */
  export function prepare(
    reader: IAutoMovieMotionHumanPropReader,
    id: string,
    seconds: number,
  ): ISite | undefined {
    const declarations: readonly IAutoMovieAffordance[] =
      reader.snapshot?.(seconds).posed.affordances ??
      reader.prop.affordances ??
      [];
    const named: IAutoMovieAffordance | undefined = declarations.find(
      (item: IAutoMovieAffordance): boolean => item.id === id,
    );
    if (named === undefined) return undefined;
    const outline: readonly IAutoMovieVector3[] | undefined = perimeter(named);
    if (outline === undefined) return undefined;
    const query: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContactPrepare> =
      AutoMovieEnginePhysics.physicalShapeFaceContactPrepare(
        {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
        outline,
      );
    const local: IAutoMovieRigidTransform = {
      position: named.frame.translation,
      rotation: named.frame.rotation,
    };
    return {
      support: { kind: "prop", subject: reader.prop.subject, point: id },
      at: (time: number): IFace => ({
        frame:
          reader.site?.(id, time) ??
          HumanPropFrame.compose(reader.frame(time), local),
        outline,
        query,
      }),
    };
  }

  /** The finite perimeter in the site's own frame, when the site defines one. */
  export function perimeter(
    named: IAutoMovieAffordance,
  ): readonly IAutoMovieVector3[] | undefined {
    const points: readonly IAutoMovieVector3[] | null | undefined =
      named.outline ??
      (named.extent === null ? null : AutoMovieEngineMath.convexHull2D(named.extent));
    const scale: IAutoMovieVector3 = named.frame.scale;
    if (points !== null && points !== undefined && points.length >= 3)
      return points.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: point.x * scale.x,
          y: 0,
          z: point.z * scale.z,
        }),
      );
    if (named.width === undefined || named.depth === undefined)
      return undefined;
    const half: number = (named.width * scale.x) / 2;
    const depth: number = named.depth * scale.z;
    const start: number = named.kind === "seat" ? -depth : -depth / 2;
    const end: number = named.kind === "seat" ? 0 : depth / 2;
    return [
      { x: -half, y: 0, z: start },
      { x: half, y: 0, z: start },
      { x: half, y: 0, z: end },
      { x: -half, y: 0, z: end },
    ];
  }

  /** Place a local point on a displayed face. */
  export function world(
    face: IFace,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      face.frame.position,
      Quaternion.rotateVector(face.frame.rotation, point),
    );
  }

  /** Place a world point in the displayed face's coordinate frame. */
  export function local(
    face: IFace,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(face.frame.rotation),
      Vector3.subtract(point, face.frame.position),
    );
  }

  /**
   * Project an already-posed physical effector onto the face, returning its
   * signed clearance when the projected point is inside the finite outline.
   */
  export function point(
    face: IFace,
    worldPoint: IAutoMovieVector3,
  ):
    | Pick<IAutoMovieMotionHumanContactWindow.IMaterial, "point" | "clearance">
    | undefined {
    const inFace: IAutoMovieVector3 = local(face, worldPoint);
    let inside: boolean = false;
    for (let i: number = 0; i < face.outline.length; ++i) {
      const a: IAutoMovieVector3 = face.outline[i]!;
      const b: IAutoMovieVector3 = face.outline[(i + 1) % face.outline.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const cross: number = dx * (inFace.z - a.z) - dz * (inFace.x - a.x);
      if (
        Math.abs(cross) <= 32 * Number.EPSILON * Math.hypot(dx, dz) &&
        inFace.x >= Math.min(a.x, b.x) &&
        inFace.x <= Math.max(a.x, b.x) &&
        inFace.z >= Math.min(a.z, b.z) &&
        inFace.z <= Math.max(a.z, b.z)
      ) {
        inside = true;
        break;
      }
      if (
        a.z > inFace.z !== b.z > inFace.z &&
        inFace.x < a.x + (dx * (inFace.z - a.z)) / dz
      )
        inside = !inside;
    }
    return inside
      ? { point: { x: inFace.x, y: 0, z: inFace.z }, clearance: inFace.y }
      : undefined;
  }

  /**
   * Bind the body exterior once. The read places only the selected colliders
   * and returns the lowest eligible contact in the displayed receiving frame.
   */
  export function prepareBody(
    body: IAutoMovieMotionHumanBody,
    names: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    face: IFace,
  ) => IAutoMovieMotionHumanContactWindow.IMaterial | undefined {
    const placed: ReturnType<typeof HumanColliderPlacement.preparePlaced> =
      HumanColliderPlacement.preparePlaced(body, names);
    return (bones, face) => {
      let best: IAutoMovieMotionHumanContactWindow.IMaterial | undefined;
      const query: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContactPrepare> =
        face.query ??
        AutoMovieEnginePhysics.physicalShapeFaceContactPrepare(face.frame, face.outline);
      for (const segment of placed(bones)) {
        const pose: IAutoMovieRigidTransform =
          face.query === undefined
            ? segment.pose
            : HumanPropFrame.relative(face.frame, segment.pose);
        for (const shape of segment.shapes) {
          const candidate: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> = query(
            pose,
            shape,
          );
          if (
            candidate !== undefined &&
            (best === undefined || candidate.clearance < best.clearance)
          )
            best = { ...candidate, bone: segment.bone, normal: NORMAL };
        }
      }
      return best;
    };
  }

  /** Bind a collider demand and the FK needed to read it on any given posture. */
  export function preparePosture(
    body: IAutoMovieMotionHumanBody,
    names: ReadonlySet<AutoMovieHumanoidBone> = body.colliders.bones,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    face: IFace,
  ) => IAutoMovieMotionHumanContactWindow.IMaterial | undefined {
    const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      names,
    );
    const material: ReturnType<typeof prepareBody> = prepareBody(body, names);
    return (posture, face) =>
      material(bones(resolveHumanPosture(body, posture)), face);
  }

  /** Bind actual Human exterior geometry against a horizontal unbounded floor. */
  export function prepareFloor(
    body: IAutoMovieMotionHumanBody,
    names: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    height: number,
  ) => IAutoMovieMotionHumanContactWindow.IMaterial | undefined {
    const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      names,
    );
    const placed: ReturnType<typeof HumanColliderPlacement.preparePlaced> =
      HumanColliderPlacement.preparePlaced(body, names);
    const down: IAutoMovieVector3 = Vector3.scale(NORMAL, -1);
    return (posture, height) => {
      let best: IAutoMovieMotionHumanContactWindow.IMaterial | undefined;
      for (const segment of placed(bones(resolveHumanPosture(body, posture)))) {
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(segment.pose.rotation),
          down,
        );
        for (const shape of segment.shapes) {
          const { point }: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeSurfaceAnchor> =
            AutoMovieEnginePhysics.physicalShapeSurfaceAnchor(segment.pose, shape, direction);
          const clearance: number = point.y - height;
          if (best === undefined || clearance < best.clearance)
            best = {
              bone: segment.bone,
              point: { ...point, y: 0 },
              normal: NORMAL,
              clearance,
            };
        }
      }
      return best;
    };
  }

  /**
   * Find a finite face's first downward crossing in a prepared flight. Brackets
   * are at most 1/120 s wide and refined to a microsecond after a sign change.
   * Entry through the side with an already embedded exterior gives no top-face
   * contact there.
   */
  export function arrival(
    duration: number,
    read: (
      seconds: number,
    ) => IAutoMovieMotionHumanContactWindow.IMaterial | undefined,
  ):
    | {
        seconds: number;
        material: IAutoMovieMotionHumanContactWindow.IMaterial;
      }
    | undefined {
    const sample = (time: number): number => read(time)?.clearance ?? 1;
    const count: number = Math.max(1, Math.ceil(duration * 120));
    let low: number = 0;
    let before: number = sample(low);
    if (before <= 0) return undefined;
    for (let i: number = 1; i <= count; ++i) {
      const high: number = duration * (i / count);
      const after: number = sample(high);
      if (before > 0 && after <= 0) {
        const seconds: number = AutoMovieEngineMath.bracketedCrossing({
          f: sample,
          low,
          high,
          known: { low: before, high: after },
          past: (clearance: number): boolean => clearance <= 0,
          tolerance: 1e-6,
        }).high;
        const material:
          | IAutoMovieMotionHumanContactWindow.IMaterial
          | undefined = read(seconds);
        if (material !== undefined && material.clearance >= -1e-4)
          return { seconds, material };
      }
      low = high;
      before = after;
    }
    return undefined;
  }

  /** Both material-local readings of one paired dry-body contact. */
  export interface IPair {
    /** The first body's exterior against the second body's material frame. */
    first: IAutoMovieMotionHumanContactWindow.IMaterial;
    /** The second body's exterior against the first body's material frame. */
    second: IAutoMovieMotionHumanContactWindow.IMaterial;
  }

  /** One closed interval of measured contact, seconds on the caller's clock. */
  export interface IInterval {
    /** Start with nonpositive signed gap. */
    from: number;
    /** End of the bearing interval. */
    to: number;
  }

  /**
   * Bracket dry contact intervals on a sampled action clock. A nonpositive gap
   * is bearing. Playback consumes the returned immutable intervals.
   */
  export function intervals(
    from: number,
    to: number,
    gap: (seconds: number) => number,
  ): IInterval[] {
    if (!(to > from)) return [];
    const count: number = Math.max(1, Math.ceil((to - from) * 120));
    let low: number = from;
    let before: number = gap(low);
    let open: number | undefined = before <= 0 ? from : undefined;
    const windows: IInterval[] = [];
    for (let i: number = 1; i <= count; ++i) {
      const high: number = i === count ? to : from + ((to - from) * i) / count;
      const after: number = gap(high);
      const entering: boolean = after <= 0;
      if (before <= 0 !== entering) {
        const at: ReturnType<typeof AutoMovieEngineMath.bracketedCrossing> = AutoMovieEngineMath.bracketedCrossing({
          f: gap,
          low,
          high,
          known: { low: before, high: after },
          past: (clearance: number): boolean => clearance <= 0 === entering,
          tolerance: 1e-6,
        });
        if (entering) open = at.high;
        else if (open !== undefined) {
          if (at.low > open) windows.push({ from: open, to: at.low });
          open = undefined;
        }
      }
      low = high;
      before = after;
    }
    if (open !== undefined && to > open) windows.push({ from: open, to });
    return windows;
  }

  /**
   * Bind two body exteriors. Read the nearest actual solids from their
   * displayed frames, and express the common pair in the receiving bones'
   * frames. Both outward directions must face each other.
   */
  export function preparePair(
    body: IAutoMovieMotionHumanBody,
    own: AutoMovieHumanoidBone,
    partner: IAutoMovieMotionHumanBody,
    other: AutoMovieHumanoidBone,
  ): (
    a: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    b: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ownNormal: IAutoMovieVector3,
    otherNormal: IAutoMovieVector3,
    tolerance: number,
  ) => IPair | undefined {
    const first: ReturnType<typeof HumanColliderPlacement.preparePlaced> =
      HumanColliderPlacement.preparePlaced(body, new Set([own]));
    const second: ReturnType<typeof HumanColliderPlacement.preparePlaced> =
      HumanColliderPlacement.preparePlaced(partner, new Set([other]));
    return (a, b, ownNormal, otherNormal, tolerance) => {
      if (Vector3.dot(ownNormal, otherNormal) >= 0) return undefined;
      const ownBone: IAutoMovieResolvedBone | undefined = a.get(own);
      const otherBone: IAutoMovieResolvedBone | undefined = b.get(other);
      if (ownBone === undefined || otherBone === undefined) return undefined;
      let best: number = Infinity;
      let pair: IPair | undefined;
      for (const x of first(a))
        for (const y of second(b))
          for (const sx of x.shapes)
            for (const sy of y.shapes) {
              const gap: number = AutoMovieEnginePhysics.physicalShapePairDistance(
                x.pose,
                sx,
                y.pose,
                sy,
              );
              if (Math.abs(gap) > tolerance || Math.abs(gap) >= best) continue;
              const support =
                (
                  pose: IAutoMovieRigidTransform,
                  shape: IAutoMoviePhysicalShape,
                ): AutoMovieEnginePhysicsGjkTypes.Support =>
                (direction: IAutoMovieVector3): IAutoMovieVector3 =>
                  AutoMovieEnginePhysics.physicalShapeSupport(pose, shape, direction);
              const ax: AutoMovieEnginePhysicsGjkTypes.Support = support(x.pose, sx);
              const by: AutoMovieEnginePhysicsGjkTypes.Support = support(y.pose, sy);
              const onOther: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeGjkWitness(
                ax,
                by,
                1e-8,
              ).point;
              const onOwn: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeGjkWitness(
                by,
                ax,
                1e-8,
              ).point;
              // The simplex's overlap witness can lie inside either solid.
              // Recover the actual exterior before publishing either frame.
              const receiving: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeNearest> =
                AutoMovieEnginePhysics.physicalShapeNearest(y.pose, sy, onOther, onOther);
              const held: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeNearest> =
                AutoMovieEnginePhysics.physicalShapeNearest(x.pose, sx, onOwn, onOwn);
              if (
                Vector3.dot(receiving.normal, otherNormal) < 0 ||
                Vector3.dot(held.normal, ownNormal) < 0
              )
                continue;
              const contact = (
                point: IAutoMovieVector3,
                normal: IAutoMovieVector3,
                supported: AutoMovieHumanoidBone,
                receiving: IAutoMovieResolvedBone,
              ): IAutoMovieMotionHumanContactWindow.IMaterial => {
                const inverse: IAutoMovieRigidTransform["rotation"] =
                  Quaternion.inverse(receiving.worldRotation);
                return {
                  bone: supported,
                  point: Quaternion.rotateVector(
                    inverse,
                    Vector3.subtract(point, receiving.worldPosition),
                  ),
                  normal: Quaternion.rotateVector(inverse, normal),
                  clearance: gap,
                };
              };
              pair = {
                first: contact(
                  receiving.point,
                  receiving.normal,
                  own,
                  otherBone,
                ),
                second: contact(held.point, held.normal, other, ownBone),
              };
              best = Math.abs(gap);
            }
      return pair;
    };
  }
}

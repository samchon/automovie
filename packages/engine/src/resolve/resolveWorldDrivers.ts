import {
  IAutoMovieAimDriver,
  IAutoMovieDriver,
  IAutoMovieIKDriver,
  IAutoMovieParentDriver,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { rotationBetween } from "../math/rotationBetween";
import { applyIterativeIK } from "./applyIterativeIK";
import { blendVec } from "./blendVec";
import { readWorld } from "./readWorld";
import { recompose } from "./recompose";
import { validateInfluence } from "./validateInfluence";

const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;

/**
 * Apply world-space aim, parent and analytic/iterative IK in producer order, updating matrices and recomposing affected descendants. Springs and malformed two-bone chains remain deferred. Geometry must be admitted finite/nondegenerate and TRS-decomposable; partial influence and epsilon reach shells are numerical policies rather than anatomical ROM guarantees.
 *
 * @evidence contracts/common.md#principled-implementation Apply aim, parent and analytic/iterative IK in producer order to composed matrices, recompose affected descendants and visibly defer springs/malformed two-bone chains.
 * @evidence contracts/common.md#clear-and-simple-design Shared readers, influence guards and blends support driver-specific geometry while iterative IK has its own solver owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aim skips undefined roll and two-bone reach uses epsilon shells; finite nondegenerate TRS geometry is a premise, not ROM or arbitrary overflow certification.
 * @evidence contracts/common.md#meaningful-documentation Docs identify world-map mutation, descendant effects, solver budgets and deferral; earlier drivers may have changed state before a later failure.
 * @evidence contracts/performance.md#efficient-algorithms D drivers add fixed aim/parent/two-bone work and descendant visits plus iterative I/C costs; overlapping subtrees may be recomposed repeatedly.
 * @evidence contracts/performance.md#reuse-equivalent-work All drivers share caller local/child maps and observe previous effects, so matching descriptors are not memoized as equivalent effectful work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns matrix updates/deferred array; vector temporaries release with each call and no host worker or handle survives.
 */
export const resolveWorldDrivers: (drivers: IAutoMovieDriver[], world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>) => IAutoMovieDriver[] = (
  drivers: IAutoMovieDriver[],
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): IAutoMovieDriver[] => {
  const deferred: IAutoMovieDriver[] = [];
  for (const d of drivers)
    if (d.type === "aim") applyAim(d, world, localById, childrenById);
    else if (d.type === "parent")
      applyParent(d, world, localById, childrenById);
    else if (d.type === "ik" && d.solver === "twoBone" && d.chain.length === 3)
      applyTwoBoneIK(d, world, localById, childrenById);
    else if (d.type === "ik" && (d.solver === "ccd" || d.solver === "fabrik"))
      applyIterativeIK(d, world, localById, childrenById);
    else deferred.push(d);
  return deferred;
};

const applyAim: (d: IAutoMovieAimDriver, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>) => void = (
  d: IAutoMovieAimDriver,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  validateInfluence("aim", d.influence);
  validateAimVector("aimAxis", d.aimAxis);
  validateAimVector("upAxis", d.upAxis);
  validateAimVector("worldUp", d.worldUp);
  const dec: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(readWorld(world, d.owner, "aim owner"));
  const dir: IAutoMovieVector3 = Vector3.subtract(
    Matrix4.position(readWorld(world, d.target, "aim target")),
    dec.position,
  );
  const aimed: IAutoMovieQuaternion = aimRotation(dir, d.aimAxis, d.upAxis, d.worldUp);
  const blended: IAutoMovieQuaternion = Quaternion.slerp(dec.rotation, aimed, d.influence);
  world.set(d.owner, Matrix4.compose(dec.position, blended, dec.scale));
  recompose(d.owner, world, localById, childrenById);
};

/**
 * Child-Of: the owner inherits the parent node's world frame, component by
 * component (translation / rotation / scale), keeping its own value for the
 * components the flags leave off. Then its subtree recomposes.
 */
const applyParent: (d: IAutoMovieParentDriver, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>) => void = (
  d: IAutoMovieParentDriver,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  validateParentFlag(d.translation, "translation");
  validateParentFlag(d.rotation, "rotation");
  validateParentFlag(d.scale, "scale");
  const own: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(readWorld(world, d.owner, "parent owner"));
  const par: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(readWorld(world, d.parent, "parent parent"));
  world.set(
    d.owner,
    Matrix4.compose(
      d.translation ? par.position : own.position,
      d.rotation ? par.rotation : own.rotation,
      d.scale ? par.scale : own.scale,
    ),
  );
  recompose(d.owner, world, localById, childrenById);
};

const validateParentFlag: (value: boolean, label: "translation" | "rotation" | "scale") => void = (
  value: boolean,
  label: "translation" | "rotation" | "scale",
): void => {
  if (typeof value !== "boolean")
    throw new Error(
      `world driver parent ${label} flag must be boolean, but was ${value}`,
    );
};

/**
 * Analytic two-bone IK: rotate a 3-node limb (`root → mid → tip`) so the tip
 * reaches `goal`, bending in the plane the pole picks (or the limb's current
 * plane). The interior angles come from the law of cosines over the two bone
 * lengths and the (reach-clamped) root→goal distance; the tip lands on the goal
 * exactly when the goal is reachable. Bone lengths are preserved, the result is
 * blended by `influence`, and the tip's subtree recomposes.
 *
 * Operates directly on the chain's world matrices (the renderer consumes world
 * transforms), so it needs no world→local round-trip.
 */
const applyTwoBoneIK: (d: IAutoMovieIKDriver, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>) => void = (
  d: IAutoMovieIKDriver,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  validateInfluence("two-bone IK", d.influence);
  if (d.pole !== null) validatePoleAngle(d.pole.angle);
  const rootId: string = d.chain[0]!;
  const midId: string = d.chain[1]!;
  const tipId: string = d.chain[2]!;
  const rootM: number[] = readWorld(world, rootId, "two-bone IK root");
  const midM: number[] = readWorld(world, midId, "two-bone IK mid");
  const tipM: number[] = readWorld(world, tipId, "two-bone IK tip");
  const rootP: IAutoMovieVector3 = Matrix4.position(rootM);
  const midP: IAutoMovieVector3 = Matrix4.position(midM);
  const tipP: IAutoMovieVector3 = Matrix4.position(tipM);
  const goalP: IAutoMovieVector3 = Matrix4.position(readWorld(world, d.goal, "two-bone IK goal"));

  const upper: IAutoMovieVector3 = Vector3.subtract(midP, rootP);
  const lower: IAutoMovieVector3 = Vector3.subtract(tipP, midP);
  const l1: number = Vector3.length(upper);
  const l2: number = Vector3.length(lower);
  if (!(l1 > 0))
    throw new Error(
      `world driver two-bone IK upper bone length must be > 0, but was ${l1}`,
    );
  if (!(l2 > 0))
    throw new Error(
      `world driver two-bone IK lower bone length must be > 0, but was ${l2}`,
    );

  const toGoal: IAutoMovieVector3 = Vector3.subtract(goalP, rootP);
  const goalLen: number = Vector3.length(toGoal);
  const reach: number = clamp(goalLen, Math.abs(l1 - l2) + 1e-5, l1 + l2 - 1e-5);
  const dir: IAutoMovieVector3 =
    goalLen < 1e-8
      ? Vector3.normalize(upper)
      : Vector3.scale(toGoal, 1 / goalLen);

  // Bend plane: from the pole (when one is wired) else the limb's current bend.
  const poleRef: IAutoMovieVector3 =
    d.pole !== null && d.pole.node !== null
      ? Vector3.subtract(
          Matrix4.position(readWorld(world, d.pole.node, "two-bone IK pole")),
          rootP,
        )
      : upper;
  let axis: IAutoMovieVector3 = Vector3.cross(dir, poleRef);
  if (Vector3.length(axis) < 1e-8) axis = anyPerp(dir);
  if (d.pole !== null && d.pole.angle !== 0)
    axis = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(dir, d.pole.angle),
      axis,
    );
  axis = Vector3.normalize(axis);

  const cosRoot: number = clamp(
    (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach),
    -1,
    1,
  );
  const bend: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    axis,
    (Math.acos(cosRoot) * 180) / Math.PI,
  );
  const newMid: IAutoMovieVector3 = Vector3.add(
    rootP,
    Vector3.scale(Quaternion.rotateVector(bend, dir), l1),
  );
  const newTip: IAutoMovieVector3 = Vector3.add(rootP, Vector3.scale(dir, reach));

  const rootDelta: IAutoMovieQuaternion = rotationBetween(
    Vector3.normalize(upper),
    Vector3.normalize(Vector3.subtract(newMid, rootP)),
  );
  const midDelta: IAutoMovieQuaternion = rotationBetween(
    Vector3.normalize(lower),
    Vector3.normalize(Vector3.subtract(newTip, newMid)),
  );
  const rootDec: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(rootM);
  const midDec: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(midM);
  const tipDec: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = Matrix4.decompose(tipM);
  const t: number = d.influence;

  world.set(
    rootId,
    Matrix4.compose(
      rootP,
      Quaternion.slerp(
        rootDec.rotation,
        Quaternion.multiply(rootDelta, rootDec.rotation),
        t,
      ),
      rootDec.scale,
    ),
  );
  world.set(
    midId,
    Matrix4.compose(
      blendVec(midP, newMid, t),
      Quaternion.slerp(
        midDec.rotation,
        Quaternion.multiply(midDelta, midDec.rotation),
        t,
      ),
      midDec.scale,
    ),
  );
  world.set(
    tipId,
    Matrix4.compose(blendVec(tipP, newTip, t), tipDec.rotation, tipDec.scale),
  );
  recompose(tipId, world, localById, childrenById);
};

const clamp: (x: number, lo: number, hi: number) => number = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, x));

const validatePoleAngle: (angle: number) => void = (angle: number): void => {
  if (!Number.isFinite(angle))
    throw new Error(
      `world driver two-bone IK pole angle must be finite, but was ${angle}`,
    );
};

const validateAimVector: (label: "aimAxis" | "upAxis" | "worldUp", value: IAutoMovieVector3) => void = (
  label: "aimAxis" | "upAxis" | "worldUp",
  value: IAutoMovieVector3,
): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(value[axis]))
      throw new Error(
        `world driver aim ${label}.${axis} must be finite, but was ${value[axis]}`,
      );
  if (Vector3.length(value) === 0)
    throw new Error(`world driver aim ${label} must be non-zero`);
};

/** Some unit vector perpendicular to `v` (for a straight limb's free bend). */
const anyPerp: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 => {
  const c: IAutoMovieVector3 = Vector3.cross(v, { x: 0, y: 1, z: 0 });
  return Vector3.length(c) > 1e-6
    ? Vector3.normalize(c)
    : Vector3.normalize(Vector3.cross(v, { x: 1, y: 0, z: 0 }));
};

/**
 * The world-space orientation that points `aimAxis` (owner-local) along `dir`,
 * then twists about `dir` to bring `upAxis` as close as possible to `worldUp`
 * (the standard two-step aim constraint). If `worldUp` (or the rolled up
 * vector) is parallel to `dir` the roll is undefined and skipped.
 */
const aimRotation: (dir: IAutoMovieVector3, aimAxis: IAutoMovieVector3, upAxis: IAutoMovieVector3, worldUp: IAutoMovieVector3) => IAutoMovieQuaternion = (
  dir: IAutoMovieVector3,
  aimAxis: IAutoMovieVector3,
  upAxis: IAutoMovieVector3,
  worldUp: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const f: IAutoMovieVector3 = Vector3.normalize(dir);
  const r1: IAutoMovieQuaternion = rotationBetween(Vector3.normalize(aimAxis), f);

  const desired: IAutoMovieVector3 = projectPerp(worldUp, f);
  const current: IAutoMovieVector3 = projectPerp(Quaternion.rotateVector(r1, upAxis), f);
  const dl: number = Vector3.length(desired);
  const cl: number = Vector3.length(current);
  if (dl < 1e-8 || cl < 1e-8) return r1;

  const du: IAutoMovieVector3 = Vector3.scale(desired, 1 / dl);
  const cu: IAutoMovieVector3 = Vector3.scale(current, 1 / cl);
  const cos: number = Math.max(-1, Math.min(1, Vector3.dot(cu, du)));
  const sin: number = Vector3.dot(Vector3.cross(cu, du), f);
  const r2: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    f,
    (Math.atan2(sin, cos) * 180) / Math.PI,
  );
  return Quaternion.multiply(r2, r1);
};

/** Component of `v` perpendicular to the unit axis `f`. */
const projectPerp: (v: IAutoMovieVector3, f: IAutoMovieVector3) => IAutoMovieVector3 = (
  v: IAutoMovieVector3,
  f: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.subtract(v, Vector3.scale(f, Vector3.dot(v, f)));

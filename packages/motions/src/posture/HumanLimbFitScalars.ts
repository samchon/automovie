import type { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

/**
 * Admit only closed plain scalar pose records for compact fit-memory storage.
 * Unknown metadata, prototypes, inherited fields, accessors or sparse arrays
 * require the original complete-result clone. Snapshot/joint retain exact
 * untouched nullable values and field order when the existing grid key agrees
 * for slightly different scalars. Missing/undefined clinical fields remain
 * outside this schema and retain ordinary admission/refusal or full fallback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the exact own-data schema, required fields, scalar snapshot/order codes, cached-joint matching/materialization, pose header order and rich-metadata fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Complete nullable scalar vectors and base-five own-field codes retain cached clinical values and order without B joint objects; joint borrows current records only on exact agreement and otherwise recreates cached values. Required pose/root/vector/bone/clinical fields are own normal data, aliasing selects full fallback, and pose preserves all six closed-header orders.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner supplies schema checks and exact scalar representation only; HumanLimbFitMemory owns the unchanged key/lookup/solver and its owned edit payload, while public issuers retain result isolation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key rounding, clinical coercion, threshold, solve or result verdict changes. Required fields must be own normal data on plain records; arbitrary graphs/prototypes/accessors decline to complete cloning rather than lose metadata or trust inherited values.
 * @evidence contracts/development/implementation.md#efficient-algorithms Schema checks/snapshotting visit B records. Snapshot owns three B-value scalar slots, B bone names and B short order codes; exact matches borrow only current caller records internally, while only mismatching cached records allocate objects. Pose header ordering is constant work; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact Object.is values and own-field codes establish record equivalence independently of the coarser key. Null, signed zero and field order remain exact; missing/undefined or inherited required fields decline scalar storage. Snapshots are independent of caller mutation, and shared-object graphs select complete cloning.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A private cache entry owns its bounded scalar arrays/order codes; materialized mismatches and public edit copies belong to the current consumer. This module has no global body/query/result collection and returns no borrowed cache record.
 */
export function HumanLimbFitScalars(pose: IAutoMoviePose): boolean {
  try {
    const seen: Set<object> = new Set();
    const node: (value: object) => boolean = (value: object): boolean => {
      if (seen.has(value)) return false;
      seen.add(value); return true;
    };
    if (!container(pose, ["skeleton", "root", "joints"]) || typeof pose.skeleton !== "string" ||
      !Array.isArray(pose.joints) || Object.getPrototypeOf(pose.joints) !== Array.prototype ||
      Reflect.ownKeys(pose.joints).length !== pose.joints.length + 1) return false;
    if (!node(pose) || !node(pose.joints)) return false;
    if (pose.root !== null && (!container(pose.root, ["translation", "rotation", "scale"]) ||
      !node(pose.root) || !node(pose.root.translation) || !node(pose.root.rotation) || !node(pose.root.scale) ||
      !numbers(pose.root.translation, ["x", "y", "z"]) ||
      !numbers(pose.root.rotation, ["x", "y", "z", "w"]) || !numbers(pose.root.scale, ["x", "y", "z"]))) return false;
    for (let i: number = 0; i < pose.joints.length; ++i) {
      const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(pose.joints, String(i));
      const value: unknown = field?.value;
      if (!normal(field) || value === null || typeof value !== "object" || !node(value) || code(value) < 0) return false;
    }
    return true;
  } catch { return false; }
}

/**
 * Exact scalar cache records and their reconstruction, separate from fit policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Snapshot stores cached bones/three clinical scalars/own-key codes; equal/joint preserve exact record shape, fields/pose preserve the closed pose header, and IHeader holds its already owned root.
 * @evidence contracts/development/design.md#principled-representation Flat nullable primitive arrays and short field-order codes represent admitted complete clinical records losslessly; rich/shared graphs, absent required fields and undefined clinical values remain outside this representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the limb-memory and its internal apply helper consume snapshot, equal, joint, fields and pose; no new solver, cache key, goal or public resolved state is represented.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable caller record or approximate equality supplies stored values; reconstruction returns the exact selected cached record when the current record differs under a quantized-equal key.
 */
export namespace HumanLimbFitScalars {
  /** Owned scalar payload for every output slot; numeric field codes retain presence and order. */
  export interface ISnapshot {
    /** Cached output bone name at each original ordered joint slot. */
    bones: IAutoMovieJointPose["bone"][];
    /** Three exact nullable clinical scalars per admitted joint slot. */
    values: (number | null)[];
    /** Base-five exact own-field sequence for each admitted complete clinical record. */
    order: Uint16Array;
  }
  /** The three closed pose fields in their original own-property order. */
  export type IField = "skeleton" | "root" | "joints";
  /** Owned header data; no private cache root is lent to an external consumer. */
  export type IHeader = Pick<IAutoMoviePose, "skeleton" | "root">;

  /** Copy primitive values and field-presence/order codes once at the actual cache miss. */
  export function snapshot(joints: readonly IAutoMovieJointPose[]): ISnapshot {
    const values: (number | null)[] = [];
    const order: Uint16Array = new Uint16Array(joints.length);
    const bones: IAutoMovieJointPose["bone"][] = [];
    joints.forEach((joint: IAutoMovieJointPose, i: number): void => {
      bones.push(joint.bone); values.push(joint.flexion, joint.abduction, joint.twist); order[i] = code(joint);
    });
    return { bones, values, order };
  }

  /** Exact field shape and scalar equality; the memory grid is deliberately not used here. */
  export function equal(a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean {
    if (a === b) return true;
    return code(a) === code(b) && a.bone === b.bone && Object.is(a.flexion, b.flexion) &&
      Object.is(a.abduction, b.abduction) && Object.is(a.twist, b.twist);
  }

  /** Reuse a current caller record only on exact agreement; otherwise materialize the cached scalar record. */
  export function joint(saved: ISnapshot, i: number, current?: IAutoMovieJointPose): IAutoMovieJointPose {
    if (current !== undefined && code(current) === saved.order[i] && current.bone === saved.bones[i] &&
      Object.is(current.flexion, saved.values[3 * i]) && Object.is(current.abduction, saved.values[3 * i + 1]) &&
      Object.is(current.twist, saved.values[3 * i + 2])) return current;
    const out: IAutoMovieJointPose = { bone: saved.bones[i]!, flexion: null, abduction: null, twist: null };
    for (const name of NAMES) Reflect.deleteProperty(out, name);
    const names: number[] = [];
    let encoded: number = saved.order[i]!;
    while (encoded > 0) { names.push(encoded % 5); encoded = Math.floor(encoded / 5); }
    for (let k: number = names.length - 1; k >= 0; --k) {
      const field: number = names[k]!;
      Object.defineProperty(out, NAMES[field - 1]!, { enumerable: true, writable: true, configurable: true,
        value: field === 1 ? saved.bones[i] : saved.values[3 * i + field - 2] });
    }
    return out;
  }

  /** The validated closed pose's exact header order, retained independently of input object identity. */
  export function fields(value: IAutoMoviePose): IField[] {
    const out: IField[] = [];
    for (const key of Object.keys(value)) if (key === "skeleton" || key === "root" || key === "joints") out.push(key);
    return out;
  }

  /** Recreate the original closed pose field order around owned header and actual ordered joints. */
  export function pose(header: IHeader, order: readonly IField[], joints: IAutoMovieJointPose[]): IAutoMoviePose {
    const { skeleton, root }: IHeader = header;
    if (order[0] === "skeleton") return order[1] === "root" ? { skeleton, root, joints } : { skeleton, joints, root };
    if (order[0] === "root") return order[1] === "skeleton" ? { root, skeleton, joints } : { root, joints, skeleton };
    return order[1] === "root" ? { joints, root, skeleton } : { joints, skeleton, root };
  }
}

/** Normal own data excludes inherited fields, accessors and nonstandard descriptor metadata. */
function normal(value: PropertyDescriptor | undefined): boolean {
  return value !== undefined && "value" in value && value.enumerable === true && value.writable === true && value.configurable === true;
}

/** Required containers have exactly these own fields and the ordinary plain-record prototype. */
function container(value: object, names: readonly string[]): boolean {
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  const keys: readonly (string | symbol)[] = Reflect.ownKeys(value);
  return keys.length === names.length && keys.every((key: string | symbol): boolean =>
    typeof key === "string" && names.includes(key) && normal(Object.getOwnPropertyDescriptor(value, key)));
}

/** Every vector/quaternion component is required own finite numeric data. */
function numbers(value: object, names: readonly string[]): boolean {
  return container(value, names) && names.every((key: string): boolean =>
    typeof Object.getOwnPropertyDescriptor(value, key)!.value === "number" && Number.isFinite(Object.getOwnPropertyDescriptor(value, key)!.value));
}

/** Base-five codes retain every present field, its order, undefined/null form and required own bone. */
function code(value: object): number {
  if (Object.getPrototypeOf(value) !== Object.prototype) return -1;
  const fields: readonly (string | symbol)[] = Reflect.ownKeys(value);
  if (fields.length !== 4) return -1;
  let out: number = 0;
  let bone: boolean = false;
  for (const key of fields) {
    if (typeof key !== "string") return -1;
    const at: number = NAMES.indexOf(key);
    const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(value, key);
    if (at < 0 || !normal(field)) return -1;
    const scalar: unknown = field!.value;
    if (at === 0) { if (typeof scalar !== "string") return -1; bone = true; }
    else if (scalar !== null && (typeof scalar !== "number" || !Number.isFinite(scalar))) return -1;
    out = out * 5 + at + 1;
  }
  return bone ? out : -1;
}

/** The only clinical record fields admitted to scalar storage, in code order. */
const NAMES: readonly string[] = ["bone", "flexion", "abduction", "twist"];

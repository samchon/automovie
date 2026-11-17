import type { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

/**
 * Admit only closed plain scalar pose records for compact fit-memory storage.
 * Unknown metadata, prototypes, inherited fields, accessors or sparse arrays
 * require the original complete-result clone. The snapshot retains exact
 * cached nullable values and field order when the existing grid key agrees
 * for slightly different scalars. Missing/undefined clinical fields remain
 * outside this schema and retain ordinary admission/refusal or full fallback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the exact own-data schema, required fields, one-pass scalar snapshot/order codes, complete cached-joint materialization, pose header order and rich-metadata fallback. Member facts: constructed: Defines constructor-only clinical records, exact numeric/null values and literal bone/flexion/abduction/twist order; arbitrary rich or borrowed records use the inspecting main function.
 * @evidence contracts/development/implementation.md#principled-implementation Complete nullable scalar vectors and base-five own-field codes retain exact cached values/order without B retained joint objects. joint always creates an independent cached record; required pose/root/vector/bone/clinical fields are own normal data, aliasing selects full fallback and pose preserves all six closed-header orders. Member facts: constructed: Base-free assembleHumanPosture constructs native own-data clinical literals, and native clamp/mirror/chain writers preserve that property. A shared cache can supply older rich copied metadata, so exact current top/joint key order is still checked before direct scalar capture; a mismatch retains the general schema/copy path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner supplies schema checks and exact scalar representation only; HumanLimbFitMemory owns the unchanged key/lookup/solver and its owned cache payload, while public issuers retain result isolation. Member facts: constructed: The private constructed fitting entry alone chooses this capture; the general capture retains full schema, alias and metadata checks for rich/base/public sources and any rich entry crossing the shared cache boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key rounding, clinical coercion, threshold, solve or result verdict changes. Required fields must be own normal data on plain records; arbitrary graphs/prototypes/accessors decline to complete cloning rather than lose metadata or trust inherited values. Member facts: constructed: No mutable-input equality, reader identity, caller-set prepared bit, rounded value, bone lookup or omitted coordinate proves provenance; the actual base-free assembly-to-fit call path supplies these records.
 * @evidence contracts/development/implementation.md#efficient-algorithms One private native-output inspection visits B records and produces 3B scalar slots, B names/order codes and header order. Cache insertion consumes that snapshot directly; hits construct B independent records without reflecting any current input. Ordinary clinical field order uses one literal and other orders use exact field reconstruction. Speedup is unmeasured. Member facts: constructed: One O(B) pass checks native key arrays and copies B names/3B exact numeric-null values into flat owned storage plus one typed order array, without per-field descriptor objects or alias-set entries. All required numerical admission/solving already ran; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same synchronous native-output inspection supplies schema admission and exact stored scalar/order data, never a persistent verdict about mutable current input. Null, signed zero and field order remain exact; missing/undefined/inherited fields and shared graphs select complete cloning. Public raw inputs are not inspected by this helper. Member facts: constructed: Uses the same exact cached-value reconstruction as the inspecting capture. Constructor-known field order is shared, while every current scalar is copied and no caller or previous result is borrowed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A private cache entry owns its bounded scalar arrays/order codes; all materialized cached records belong to the current consumer. This module has no global body/query/result collection and returns no borrowed cache record. Member facts: constructed: Returns one independent O(B) primitive snapshot; it retains no source joint, pose, root, callback or resource, and body memory retains only its existing bounded entries.
 */
export function HumanLimbFitScalars(pose: IAutoMoviePose): HumanLimbFitScalars.ISnapshot | undefined {
  try {
    const fields: HumanLimbFitScalars.IField[] | undefined = HumanLimbFitScalars.header(pose);
    if (fields === undefined || !Array.isArray(pose.joints) || Object.getPrototypeOf(pose.joints) !== Array.prototype ||
      Reflect.ownKeys(pose.joints).length !== pose.joints.length + 1) return undefined;
    const out: HumanLimbFitScalars.ISnapshot = { bones: [], values: [], order: new Uint16Array(pose.joints.length), fields };
    const seen: Set<object> = new Set();
    for (let i: number = 0; i < pose.joints.length; ++i) {
      const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(pose.joints, String(i));
      const value: unknown = field?.value;
      if (!normal(field) || value === null || typeof value !== "object" || seen.has(value)) return undefined;
      seen.add(value);
      const order: number = code(value, out, i);
      if (order < 0) return undefined;
      out.order[i] = order;
    }
    return out;
  } catch { return undefined; }
}

/**
 * Exact scalar cache records and their reconstruction, separate from fit policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The inspection stores cached bones/three clinical scalars/own-key codes/header order; joint materializes that exact snapshot and header/pose preserve the closed header around its owned root.
 * @evidence contracts/development/design.md#principled-representation Flat nullable primitive arrays and short field-order codes represent admitted complete clinical records losslessly; rich/shared graphs, absent required fields and undefined clinical values remain outside this representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only limb-memory consumes the inspection, joint, header and pose; no new solver, cache key, goal, persistent admission certificate or public resolved state is represented.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable caller record or approximate equality supplies stored values; reconstruction always creates the exact selected cached record without observing current input under a quantized-equal key.
 */
export namespace HumanLimbFitScalars {
  /**
   * Capture records actually produced by the base-free canonical assembler
   * and the native limb writers, whose literal field order is known.
   *
   * Defines constructor-only clinical records, exact numeric/null values and literal bone/flexion/abduction/twist order; arbitrary rich or borrowed records use the inspecting main function.
   * Base-free assembleHumanPosture constructs native own-data clinical literals, and native clamp/mirror/chain writers preserve that property. A shared cache can supply older rich copied metadata, so exact current top/joint key order is still checked before direct scalar capture; a mismatch retains the general schema/copy path.
   * The private constructed fitting entry alone chooses this capture; the general capture retains full schema, alias and metadata checks for rich/base/public sources and any rich entry crossing the shared cache boundary.
   * No mutable-input equality, reader identity, caller-set prepared bit, rounded value, bone lookup or omitted coordinate proves provenance; the actual base-free assembly-to-fit call path supplies these records.
   * One O(B) pass checks native key arrays and copies B names/3B exact numeric-null values into flat owned storage plus one typed order array, without per-field descriptor objects or alias-set entries. All required numerical admission/solving already ran; speedup is unmeasured.
   * Uses the same exact cached-value reconstruction as the inspecting capture. Constructor-known field order is shared, while every current scalar is copied and no caller or previous result is borrowed.
   * Returns one independent O(B) primitive snapshot; it retains no source joint, pose, root, callback or resource, and body memory retains only its existing bounded entries.
   */
  export function constructed(pose: IAutoMoviePose): ISnapshot | undefined {
    const fields: string[] = Object.keys(pose);
    if (fields.length !== 3 || fields[0] !== "skeleton" || fields[1] !== "root" || fields[2] !== "joints") return undefined;
    const out: ISnapshot = {
      bones: new Array<IAutoMovieJointPose["bone"]>(pose.joints.length),
      values: new Array<number | null>(3 * pose.joints.length),
      order: new Uint16Array(pose.joints.length),
      fields: ["skeleton", "root", "joints"],
    };
    out.order.fill(CLINICAL_ORDER);
    for (let i: number = 0; i < pose.joints.length; ++i) {
      const joint: IAutoMovieJointPose = pose.joints[i]!;
      const keys: string[] = Object.keys(joint);
      if (keys.length !== 4 || keys[0] !== "bone" || keys[1] !== "flexion" || keys[2] !== "abduction" || keys[3] !== "twist") return undefined;
      out.bones[i] = joint.bone;
      out.values[3 * i] = joint.flexion;
      out.values[3 * i + 1] = joint.abduction;
      out.values[3 * i + 2] = joint.twist;
    }
    return out;
  }

  /** Owned scalar payload for every output slot; numeric field codes retain presence and order. */
  export interface ISnapshot {
    /** Cached output bone name at each original ordered joint slot. */
    bones: IAutoMovieJointPose["bone"][];
    /** Three exact nullable clinical scalars per admitted joint slot. */
    values: (number | null)[];
    /** Base-five exact own-field sequence for each admitted complete clinical record. */
    order: Uint16Array;
    /** The validated closed pose's original own-property order. */
    fields: IField[];
  }
  /** The three closed pose fields in their original own-property order. */
  export type IField = "skeleton" | "root" | "joints";
  /** Owned header data; no private cache root is lent to an external consumer. */
  export type IHeader = Pick<IAutoMoviePose, "skeleton" | "root">;

  /** Materialize a fresh exact cached record without reading any current caller record. */
  export function joint(saved: ISnapshot, i: number): IAutoMovieJointPose {
    if (saved.order[i] === CLINICAL_ORDER) return { bone: saved.bones[i]!,
      flexion: saved.values[3 * i]!, abduction: saved.values[3 * i + 1]!, twist: saved.values[3 * i + 2]! };
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

  /** Validate the constant-size own-data header; distinct component schemas cannot alias a clinical record. */
  export function header(value: IAutoMoviePose): IField[] | undefined {
    try {
      if (!container(value, ["skeleton", "root", "joints"]) || typeof value.skeleton !== "string") return undefined;
      if (value.root !== null && (!container(value.root, ["translation", "rotation", "scale"]) ||
        value.root.translation === value.root.scale || !numbers(value.root.translation, ["x", "y", "z"]) ||
        !numbers(value.root.rotation, ["x", "y", "z", "w"]) || !numbers(value.root.scale, ["x", "y", "z"]))) return undefined;
      return Object.keys(value) as IField[];
    } catch { return undefined; }
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
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  const keys: readonly (string | symbol)[] = Reflect.ownKeys(value);
  return keys.length === names.length && keys.every((key: string | symbol): boolean => {
    if (typeof key !== "string" || !names.includes(key)) return false;
    const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(value, key);
    return normal(field) && typeof field!.value === "number" && Number.isFinite(field!.value);
  });
}

/** Base-five codes retain every required field, its exact order and nullable scalar form. */
function code(value: object, saved: HumanLimbFitScalars.ISnapshot, slot: number): number {
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
    if (at === 0) {
      if (typeof scalar !== "string") return -1;
      saved.bones[slot] = scalar as IAutoMovieJointPose["bone"];
      bone = true;
    } else {
      if (scalar !== null && (typeof scalar !== "number" || !Number.isFinite(scalar))) return -1;
      saved.values[3 * slot + at - 1] = scalar;
    }
    out = out * 5 + at + 1;
  }
  return bone ? out : -1;
}

/** The only clinical record fields admitted to scalar storage, in code order. */
const NAMES: readonly string[] = ["bone", "flexion", "abduction", "twist"];

/** Base-five field IDs 1,2,3,4 encode the ordinary bone/flexion/abduction/twist literal order. */
const CLINICAL_ORDER: number = ((1 * 5 + 2) * 5 + 3) * 5 + 4;

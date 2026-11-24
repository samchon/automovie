import type { RigidCarrierSample } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { createHumanBody } from "../body/createHumanBody";
import { prepareHumanPostureRigCheck } from "../posture/prepareHumanPostureRigCheck";

type Body = IAutoMovieMotionHumanBody;
type Seeded = IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
type Posture = IAutoMovieMotionHumanPosture;
type Check = () => boolean;
type Hold = RigidCarrierSample.IHold;
type Read = () => WorkingSeatTerminal.IResult | undefined;
type Seen = Set<object>;

/**
 * Full display fits prepared at the finite stopped events of one working seat.
 * Each later reading needs the same event, current native body data and exact
 * world demands. Each query owns its mutable output and runs the other display
 * stages as usual.
 */
export class WorkingSeatTerminal {
  /** A stopped interval is prepared once from its authored representative. */
  readonly #held: Map<Hold, IHeld> = new Map();

  /** The working seat's body and its authored stopped interval fits. */
  constructor(private readonly body: Body) {}

  /** Discard an older placement's event fits before preparing it again. */
  clear(): void {
    this.#held.clear();
  }

  /** Prepare a stopped event using its actual representative demands. */
  prepare(
    event: Hold,
    frame: IAutoMovieRigidTransform,
    posture: Posture,
    read: Read,
  ): void {
    if (this.#held.has(event)) return;
    const current: Check | undefined = prepareBodyCheck(this.body);
    if (current === undefined) return;
    const copiedFrame: IAutoMovieRigidTransform | undefined = copyOwned(frame);
    const copiedPosture: Posture | undefined = copyOwned(posture);
    if (copiedFrame === undefined || copiedPosture === undefined) return;
    const result: WorkingSeatTerminal.IResult | undefined = read();
    if (result === undefined) return;
    if (trusted(current)) {
      const copied: WorkingSeatTerminal.IResult | undefined = copyOwned(result);
      if (copied !== undefined)
        this.#held.set(event, {
          frame: copiedFrame,
          posture: copiedPosture,
          bodyCurrent: current,
          result: copied,
        });
    }
  }

  /** Copy the prepared event's fit only when the actual demands are unchanged. */
  read(
    event: Hold,
    frame: IAutoMovieRigidTransform,
    posture: Posture,
  ): WorkingSeatTerminal.IResult | undefined {
    const held: IHeld | undefined = this.#held.get(event);
    return held !== undefined &&
      trusted(
        (): boolean =>
          held.bodyCurrent() &&
          sameData(held.frame, frame, new Map(), new Set()) &&
          sameData(held.posture, posture, new Map(), new Set()),
      )
      ? structuredClone(held.result)
      : undefined;
  }
}

/** The immutable inputs and result kept for one plan's actual terminal hold. */
interface IHeld {
  frame: IAutoMovieRigidTransform;
  posture: Posture;
  bodyCurrent: Check;
  result: WorkingSeatTerminal.IResult;
}

/** The data private to one completed stopped event evaluation. */
export namespace WorkingSeatTerminal {
  /** The selected raw posture and its canonical bare leaf fit. */
  export interface IResult {
    /** The posture after the working-seat variant has been selected. */
    posture: Posture;
    /** The exact fitted joint pose and continuation seeds for this posture. */
    fit: Seeded;
  }
}

/**
 * Shared aliases matter to the collision reader, which groups equal shape
 * records.
 */
type Pairs = Map<object, object>;

/**
 * Compare normal data, in own field order, with signed zeros and shared object
 * links intact.
 */
function sameData(
  previous: unknown,
  current: unknown,
  pairs: Pairs,
  targets: Seen,
): boolean {
  if (
    typeof previous === "function" ||
    typeof current === "function" ||
    typeof previous === "symbol" ||
    typeof current === "symbol"
  )
    return false;
  if (
    previous === null ||
    current === null ||
    typeof previous !== "object" ||
    typeof current !== "object"
  )
    return Object.is(previous, current);
  const prototype: unknown = Object.getPrototypeOf(previous);
  if (
    (prototype !== Object.prototype && prototype !== Array.prototype) ||
    Object.getPrototypeOf(current) !== prototype
  )
    return false;
  const known: object | undefined = pairs.get(previous);
  if (known !== undefined) return known === current;
  if (targets.has(current)) return false;
  pairs.set(previous, current);
  targets.add(current);
  const a: readonly PropertyKey[] = Reflect.ownKeys(previous);
  const b: readonly PropertyKey[] = Reflect.ownKeys(current);
  return (
    a.length === b.length &&
    a.every((key: PropertyKey, i: number): boolean => {
      if (key !== b[i] || typeof key !== "string") return false;
      const left: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(previous, key);
      const right: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(current, key);
      return (
        left !== undefined &&
        right !== undefined &&
        "value" in left &&
        "value" in right &&
        left.enumerable === right.enumerable &&
        sameData(left.value, right.value, pairs, targets)
      );
    })
  );
}

/**
 * Clone only an ordinary authored graph, without accepting getters or foreign
 * callable data: a graph `sameData` admits holds only plain records, arrays and
 * primitives, which `structuredClone` copies without error.
 */
function copyOwned<T extends object>(data: T): T | undefined {
  return sameData(data, data, new Map(), new Set())
    ? structuredClone(data)
    : undefined;
}

/**
 * Additional proof reads, which return their verdict from the fields they read
 * and never stand in for a refusal of the original fit.
 */
function trusted(check: Check): boolean {
  return check();
}

/** A changed or foreign rig always falls through to its ordinary solve. */
function prepareBodyCheck(body: Body): Check | undefined {
  return bodyCheck(body);
}

/**
 * Capture the live inputs of the full bilateral leaf, including the body
 * profile.
 */
function bodyCheck(body: Body): Check | undefined {
  if (!createHumanBody.owns(body)) return undefined;
  const rig: Check | undefined = prepareHumanPostureRigCheck(body);
  if (rig === undefined) return undefined;
  const checks: Check[] = [];
  const seen: Seen = new Set();
  // The cold arm path places the actual profile's colliders and reads all four
  // chains. It does not consult the mass, standing or balance workspace.
  for (const key of [
    "skeleton",
    "topology",
    "profile",
    "measure",
    "surfaces",
    "poseResolution",
    "chains",
    "projection",
    "settled",
    "reads",
    "rest",
    "bones",
    "hanging",
  ] as const)
    if (!captureField(body, key, checks, seen)) return undefined;
  return (): boolean =>
    createHumanBody.owns(body) &&
    rig() &&
    checks.every((check: Check): boolean => check());
}

/**
 * Capture and later verify one current own data field without invoking an
 * accessor.
 */
function captureField(
  owner: object,
  key: PropertyKey,
  checks: Check[],
  seen: Seen,
): boolean {
  const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
    owner,
    key,
  );
  if (field === undefined || !("value" in field)) return false;
  const data: unknown = field.value;
  checks.push((): boolean => {
    const current: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(owner, key);
    return (
      current !== undefined &&
      "value" in current &&
      current.enumerable === field.enumerable &&
      Object.is(current.value, data)
    );
  });
  return capture(data, checks, seen);
}

/**
 * Snapshot geometry, ranges and ordered rig tables reached through this owned
 * data.
 */
function capture(data: unknown, checks: Check[], seen: Seen): boolean {
  if (data === null || (typeof data !== "object" && typeof data !== "function"))
    return true;
  if (seen.has(data)) return true;
  seen.add(data);
  const prototype: unknown = Object.getPrototypeOf(data);
  checks.push((): boolean => Object.getPrototypeOf(data) === prototype);

  if (data instanceof Map && prototype === Map.prototype) {
    const entries: [unknown, unknown][] = [...data];
    checks.push((): boolean => sameMap(data, entries));
    for (const [key, value] of entries)
      if (!capture(key, checks, seen) || !capture(value, checks, seen))
        return false;
  } else if (data instanceof Set && prototype === Set.prototype) {
    const entries: unknown[] = [...data];
    checks.push((): boolean => sameSet(data, entries));
    for (const value of entries)
      if (!capture(value, checks, seen)) return false;
  } else if (
    prototype !== Object.prototype &&
    prototype !== Array.prototype &&
    prototype !== null &&
    prototype !== Function.prototype
  )
    return false;

  const keys: readonly PropertyKey[] =
    typeof data === "function" ? Object.keys(data) : Reflect.ownKeys(data);
  checks.push((): boolean => {
    const live: readonly PropertyKey[] =
      typeof data === "function" ? Object.keys(data) : Reflect.ownKeys(data);
    return (
      keys.length === live.length &&
      keys.every((key: PropertyKey, i: number): boolean => key === live[i])
    );
  });
  return keys.every((key: PropertyKey): boolean =>
    captureField(data, key, checks, seen),
  );
}

/**
 * Each table's order and reference identities belong to the canonical rig
 * values.
 */
function sameMap(
  table: Map<unknown, unknown>,
  entries: readonly (readonly [unknown, unknown])[],
): boolean {
  if (table.size !== entries.length) return false;
  let i: number = 0;
  for (const [key, value] of table) {
    const entry: readonly [unknown, unknown] = entries[i++]!;
    if (!Object.is(key, entry[0]) || !Object.is(value, entry[1])) return false;
  }
  return true;
}

/** Each membership and the order the reader would see must remain identical. */
function sameSet(table: Set<unknown>, members: readonly unknown[]): boolean {
  if (table.size !== members.length) return false;
  let i: number = 0;
  for (const value of table) if (!Object.is(value, members[i++])) return false;
  return true;
}

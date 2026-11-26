import LZString from "lz-string";
import { AutoMovieEngineScheduleCut } from "@automovie/engine";

import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";

/**
 * The composition in the page's address, so a link reproduces a performance.
 *
 * The composition is JSON, compressed with lz-string, in the fragment under the
 * key `c`. The query is left to the inspector, which keeps its own request
 * there and refuses a key it does not know.
 */
export namespace PlaygroundAddress {
  /** The newest composition format; versions 1 and 2 remain readable. */
  export const VERSION: IPlaygroundComposition["version"] = 3;

  /** Every version this page reads. */
  const READS: readonly number[] = [1, 2, 3];

  /** The fragment key the composition is kept under. */
  const KEY: string = "c";

  /**
   * Write a composition as a fragment.
   *
   * @param composition The composition.
   * @returns The fragment, with its leading `#`.
   * @throws {Error} When a cut is malformed, authored forces are damaged or
   *   need version 3.
   */
  export function encode(composition: IPlaygroundComposition): string {
    admitForces(composition);
    const canonical: IPlaygroundComposition = normalizeCuts(composition);
    return `#${KEY}=${LZString.compressToEncodedURIComponent(JSON.stringify(canonical))}`;
  }

  /**
   * Read the composition of a fragment.
   *
   * @param hash The address's fragment, with or without its leading `#`.
   * @returns The composition with numeric object seeds, or null when the
   *   fragment carries none. A saved text seed is read as the same number that
   *   the former model producer received.
   * @throws {Error} When the fragment's composition or a cut cannot be read,
   *   or is of another version, naming the version it needs.
   */
  export function decode(hash: string): IPlaygroundComposition | null {
    const text: string | null = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash,
    ).get(KEY);
    if (text === null || text === "") return null;

    let value: unknown;
    try {
      value = JSON.parse(
        LZString.decompressFromEncodedURIComponent(text) ?? "",
      );
    } catch {
      throw new Error("The address carries a composition that cannot be read");
    }
    if (typeof value !== "object" || value === null)
      throw new Error("The address carries a composition that cannot be read");

    const version: unknown = (value as { version?: unknown }).version;
    if (typeof version !== "number" || !READS.includes(version))
      throw new Error(
        `The address carries a composition of version ${String(version)}; this page reads versions ${READS.join(" and ")}`,
      );
    const composition: IPlaygroundComposition = value as IPlaygroundComposition;
    const objects: IPlaygroundComposition.IObject[] | undefined = readObjects(
      composition.objects,
    );
    if (
      typeof composition.seed !== "string" ||
      !Array.isArray(composition.performers) ||
      !composition.performers.every(performer) ||
      !Array.isArray(composition.mutuals) ||
      !composition.mutuals.every(
        (mutual: unknown): boolean =>
          record(mutual) &&
          typeof mutual.name === "string" &&
          record(mutual.cast) &&
          record(mutual.params),
      )
    )
      throw new Error("The address carries a composition that cannot be read");
    admitForces(composition);
    return normalizeCuts({
      ...composition,
      ...(objects === undefined ? {} : { objects }),
    });
  }

  /** Canonicalize cuts without changing a saved composition's other data. */
  function normalizeCuts(
    composition: IPlaygroundComposition,
  ): IPlaygroundComposition {
    return {
      ...composition,
      performers: composition.performers.map(
        (person: IPlaygroundComposition.IPerformer) => ({
          ...person,
          actions: person.actions.map(normalizeAction),
        }),
      ),
    };
  }

  /** Normalize one action and every action nested in its overlays. */
  function normalizeAction(
    action: IPlaygroundComposition.IAction,
  ): IPlaygroundComposition.IAction {
    return {
      ...action,
      ...(action.until === undefined
        ? {}
        : { until: AutoMovieEngineScheduleCut.normalize(action.until) }),
      ...(action.over === undefined
        ? {}
        : { over: action.over.map(normalizeAction) }),
    };
  }

  /**
   * Admit the object list with legacy text seeds converted at the address
   * boundary.
   */
  function readObjects(
    value: unknown,
  ): IPlaygroundComposition.IObject[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value))
      throw new Error("The address carries a composition that cannot be read");
    const objects: unknown[] = value.map(migrateObjectSeed);
    if (!objects.every(object))
      throw new Error("The address carries a composition that cannot be read");
    return objects;
  }

  /** Numeric conversion formerly done by the producer for saved text seeds. */
  function migrateObjectSeed(value: unknown): unknown {
    if (!record(value) || (!token(value.seed) && value.seed !== ""))
      return value;
    return { ...value, seed: Number(value.seed) };
  }

  /**
   * Refuse lost force capabilities and malformed impulses before JSON or
   * playback can discard them.
   */
  function admitForces(composition: IPlaygroundComposition): void {
    if (composition.forces === undefined) return;
    if (composition.version !== 3)
      throw new Error("Authored impulses require composition version 3");
    if (
      !Array.isArray(composition.forces) ||
      !composition.forces.every(
        (value: unknown): boolean =>
          impulse(value) &&
          record(value) &&
          composition.performers.some(
            (person: IPlaygroundComposition.IPerformer): boolean =>
              person.subject === value.subject,
          ),
      )
    )
      throw new Error(
        "The address carries an authored impulse that cannot be read",
      );
  }

  /** Whether a value is a plain object, which every record of a composition is. */
  const record: (value: unknown) => value is Record<string, unknown> = (
    value: unknown,
  ): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  /**
   * Whether a subject or anatomical token names something rather than empty
   * text.
   */
  const token: (value: unknown) => boolean = (value: unknown): boolean =>
    typeof value === "string" && value.trim().length !== 0;

  /**
   * Whether a value is a finite world vector, so damaged impulse data cannot
   * turn into an unforced stance.
   */
  const vector: (value: unknown) => boolean = (value: unknown): boolean =>
    record(value) &&
    ["x", "y", "z"].every(
      (axis: string): boolean =>
        typeof value[axis] === "number" && Number.isFinite(value[axis]),
    );

  /**
   * Check the serialized shape; the public type owns the authored region and
   * bone vocabulary.
   */
  const impulse: (value: unknown) => boolean = (value: unknown): boolean =>
    record(value) &&
    value.kind === "impulse" &&
    token(value.subject) &&
    typeof value.seconds === "number" &&
    Number.isFinite(value.seconds) &&
    (token(value.at) ||
      (record(value.at) && token(value.at.bone) && vector(value.at.point))) &&
    vector(value.impulse);

  /**
   * Whether a value has the members the editor reads of an action, through the
   * actions performed over it.
   */
  const action: (value: unknown) => boolean = (value: unknown): boolean =>
    record(value) &&
    typeof value.name === "string" &&
    record(value.params) &&
    (value.over === undefined ||
      (Array.isArray(value.over) && value.over.every(action)));

  /** Whether a value is a quaternion's four numbers. */
  const quaternion: (value: unknown) => boolean = (value: unknown): boolean =>
    record(value) &&
    ["x", "y", "z", "w"].every(
      (k: string): boolean => typeof value[k] === "number",
    );

  /** Admit a serialized native path before the SDK validates its geometry. */
  function course(value: unknown): boolean {
    return (
      record(value) &&
      (value.kind === undefined || value.kind === "course") &&
      Number.isFinite(value.cruise) &&
      Array.isArray(value.legs) &&
      value.legs.every(
        (leg: unknown): boolean =>
          record(leg) &&
          (leg.kind === "straight"
            ? Number.isFinite(leg.length)
            : leg.kind === "turn" &&
              Number.isFinite(leg.radius) &&
              Number.isFinite(leg.angle)),
      ) &&
      ["acceleration", "deceleration", "startSpeed", "endSpeed", "at"].every(
        (field: string): boolean =>
          value[field] === undefined || Number.isFinite(value[field]),
      ) &&
      (value.speeds === undefined ||
        (Array.isArray(value.speeds) && value.speeds.every(Number.isFinite)))
    );
  }

  const object: (value: unknown) => value is IPlaygroundComposition.IObject = (
    value: unknown,
  ): value is IPlaygroundComposition.IObject =>
    record(value) &&
    typeof value.subject === "string" &&
    typeof value.producer === "string" &&
    (value.kind === undefined || typeof value.kind === "string") &&
    (value.seed === undefined || typeof value.seed === "number") &&
    (value.params === undefined ||
      (record(value.params) &&
        Object.values(value.params).every(
          (n: unknown): boolean =>
            typeof n === "number" || typeof n === "string",
        ))) &&
    typeof value.x === "number" &&
    typeof value.z === "number" &&
    (value.y === undefined || typeof value.y === "number") &&
    (value.rotation === undefined || quaternion(value.rotation)) &&
    (value.course === undefined || course(value.course)) &&
    (value.aidWalk === undefined ||
      (record(value.aidWalk) && token(value.aidWalk.subject))) &&
    (value.joints === undefined ||
      (value.course !== undefined &&
        record(value.joints) &&
        Object.values(value.joints).every(
          (keys: unknown) =>
            Array.isArray(keys) &&
            keys.every(
              (key: unknown) =>
                record(key) &&
                Number.isFinite(key.seconds) &&
                Number.isFinite(key.value),
            ),
        ))) &&
    (value.worn === undefined ||
      (record(value.worn) &&
        typeof value.worn.subject === "string" &&
        typeof value.worn.bone === "string" &&
        record(value.worn.offset) &&
        record(value.worn.offset.position) &&
        ["x", "y", "z"].every(
          (k: string): boolean =>
            typeof (
              value.worn as { offset: { position: Record<string, unknown> } }
            ).offset.position[k] === "number",
        ) &&
        quaternion(value.worn.offset.rotation))) &&
    (value.fixed === undefined || typeof value.fixed === "boolean") &&
    (value.sheath === undefined ||
      (record(value.sheath) &&
        value.worn === undefined &&
        ["carrier", "mouth", "tip", "handle"].every(
          (k: string): boolean =>
            typeof (value.sheath as Record<string, unknown>)[k] === "string",
        ) &&
        typeof value.sheath.clearance === "number")) &&
    typeof value.yaw === "number";

  /** Whether a value has the members the editor reads of a performer. */
  const performer: (value: unknown) => boolean = (value: unknown): boolean =>
    record(value) &&
    typeof value.subject === "string" &&
    typeof value.body === "string" &&
    typeof value.x === "number" &&
    typeof value.z === "number" &&
    typeof value.yaw === "number" &&
    typeof value.proficiency === "string" &&
    Array.isArray(value.actions) &&
    value.actions.every(action);
}

import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { supportContact } from "./supportContact";

/** A support point in world metres, or an unnamed floor place. */
type Point = IAutoMovieVector3 | null;

/** A contact whose floor location is read in a solved key. */
interface IFloorDatum {
  id: string;
  part: IAutoMovieMotionHumanSupport.Part;
}

/** A placed contact compares the entry's achieved floor point to micrometre precision. */
const SAME_PLACE: number = 1e-6;

/** A support sequence's own instantaneous floor targets. */
interface IFloor {
  inherited: readonly IAutoMovieMotionHumanSupport.IContact[];
  laid: ReadonlyMap<string, IAutoMovieVector3>;
  recordFloors(posture: IAutoMovieMotionHumanPosture, contacts: readonly IAutoMovieMotionHumanSupport.IContact[]): void;
}

/**
 * Record floor support frames at entry and at the keys that first hold them.
 *
 * @param body The same body at every key.
 * @param entryState The actual displayed entry and its support report.
 * @param contacts The first stance's contacts.
 * @param at The first stance's initial named target lookup, world metres.
 * @returns The inherited contacts and the sequence-local floor placements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States entry ownership, target units and the support history returned.
 * @evidence contracts/development/implementation.md#principled-implementation Keep the entry datum if the same part already bears on the same surface. Otherwise read the first solved stance where it bears.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry selection uses one actual ground-point read; each key registers only new named placements.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both faces of a lying body share a window identifier, so the actual trunk orientation distinguishes them.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bone demand per key with unobserved contacts; no repeated remeasurement of a held contact.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One solved key supplies all its new ground positions.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One sequence-local map owns achieved floor positions until plan release. No sampled posture or FK reader is retained.
 */
export function prepareSupportFloor(
  body: IAutoMovieMotionHumanBody,
  entryState: IAutoMovieMotionHumanEntryState,
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  at: (contact: IAutoMovieMotionHumanSupport.IContact) => Point,
): IFloor {
  // A bearing support held across stances does not slide: one without a
  // place keeps where its first key laid it, or its entry place for a part
  // the body already rests on as it enters.
  const entry: IAutoMovieMotionHumanPosture = entryState.posture;
  const laid: Map<string, IAutoMovieVector3> = new Map();
  /** Read each newly held floor datum once on this exact key, preserving first contact identity. */
  const recordFloors: (
    posture: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  ) => void = (
    posture: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  ): void => {
    const pending: Set<string> = new Set();
    const added: IFloorDatum[] = [];
    for (const contact of contacts) {
      if (contact.target !== undefined) continue;
      const id: string = supportContact.id(contact);
      if (laid.has(id) || pending.has(id)) continue;
      pending.add(id);
      added.push({ id, part: contact.part });
    }
    const points: IAutoMovieVector3[] = supportContact.onFloors(
      body,
      posture,
      added.map(
        (item: (typeof added)[number]): IAutoMovieMotionHumanSupport.Part => item.part,
      ),
    );
    for (let i: number = 0; i < added.length; ++i)
      laid.set(added[i]!.id, points[i]!);
  };
  // The film names the lying window "back" in every orientation. Its
  // world support identifies the ground, and the displayed trunk tells
  // which surface is already bearing on it.
  const frontUp: number = entryState.base.kind === "lying"
    ? Quaternion.rotateVector(resolveHumanPosture.heading(entry), { x: 0, y: 0, z: 1 }).y
    : 0;
  const candidates: IAutoMovieMotionHumanSupport.IContact[] = contacts.filter(
    (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
      contact.step !== true &&
      (contact.part !== "front" || frontUp < 0) &&
      (contact.part !== "back" || frontUp > 0) &&
      entryState.supports.some(
        (bearing: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          bearing.part === supportContact.window(contact.part) &&
          bearing.support.kind === "ground",
      ),
  );
  const initial: Point[] = candidates.map(at);
  const datum: IAutoMovieVector3[] = initial.some((point: Point): boolean => point !== null)
    ? supportContact.points(body, entry, candidates.map(
        (contact: IAutoMovieMotionHumanSupport.IContact, k: number): Parameters<typeof supportContact.points>[2][number] => ({ contact, at: initial[k]! }),
      ))
    : [];
  const inherited: IAutoMovieMotionHumanSupport.IContact[] = candidates.filter(
    (_: IAutoMovieMotionHumanSupport.IContact, k: number): boolean => {
      const aim: Point = initial[k]!;
      return aim === null || (supportContact.onFloorTarget(aim) &&
        Math.hypot(aim.x - datum[k]!.x, aim.z - datum[k]!.z) <= SAME_PLACE);
    },
  );
  recordFloors(entry, inherited);
  return { inherited, laid, recordFloors };
}

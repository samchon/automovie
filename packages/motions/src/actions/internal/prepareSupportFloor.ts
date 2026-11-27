import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { supportContact } from "./supportContact";
import { supportWindows } from "./supportWindows";

/*
 * Identify inherited support at entry and record unnamed floor placements.
 * Parameter body: The same body at every key.
 * Parameter entryState: The actual displayed entry and its support report.
 * Parameter contacts: The first stance's contacts.
 * Parameter at: The first stance's initial named target lookup, world metres.
 * Parameter context: The performing subject and shared `on` target.
 * Returns: The inherited contacts and the sequence-local floor placements.
 */
export function prepareSupportFloor(
  body: IAutoMovieMotionHumanBody,
  entryState: IAutoMovieMotionHumanEntryState,
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  at: (contact: IAutoMovieMotionHumanSupport.IContact) => Point,
  context: Parameters<typeof supportWindows.bearing>[0],
): IFloor {
  // A bearing support held across stances does not slide: one without a
  // place keeps where its first key laid it, or its entry place for a part
  // the body already rests on as it enters.
  const entry: IAutoMovieMotionHumanPosture = entryState.posture;
  const laid: Map<string, IAutoMovieVector3> = new Map();
  /*
   * Read each newly held floor datum once on this exact key, preserving first
   * contact identity.
   */
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
        (item: (typeof added)[number]): IAutoMovieMotionHumanSupport.Part =>
          item.part,
      ),
    );
    for (let i: number = 0; i < added.length; ++i)
      laid.set(added[i]!.id, points[i]!);
  };
  // The film names the lying window "back" in every orientation. Its
  // world support identifies the ground, and the displayed trunk tells
  // which surface is already bearing on it.
  const frontUp: number =
    entryState.base.kind === "lying"
      ? Quaternion.rotateVector(humanPostureHeading(entry), {
          x: 0,
          y: 0,
          z: 1,
        }).y
      : 0;
  const matched: Set<IAutoMovieMotionHumanSupport.IContact> = new Set();
  const named: IPrepareSupportFloorNamedItem[] = [];
  for (const contact of contacts) {
    if (
      contact.step === true ||
      (contact.part === "front" && frontUp >= 0) ||
      (contact.part === "back" && frontUp <= 0)
    )
      continue;
    const identity: ReturnType<typeof supportWindows.bearing> =
      supportWindows.bearing(context, contact);
    if (
      identity === undefined ||
      !entryState.supports.some(
        (bearing: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          bearing.part === identity.part &&
          bearing.kind === identity.kind &&
          sameFrame(bearing.support, identity.support),
      )
    )
      continue;
    const target: Point = at(contact);
    const ground: boolean = identity.support.kind === "ground";
    if (target === null) {
      if (ground) matched.add(contact);
    } else if (!ground || supportContact.onFloorTarget(target))
      named.push({ contact, at: target, ground });
  }
  const datum: IAutoMovieVector3[] = supportContact.points(body, entry, named);
  named.forEach((observation: (typeof named)[number], index: number): void => {
    const achieved: IAutoMovieVector3 = datum[index]!;
    const target: IAutoMovieVector3 = observation.at;
    if (
      Math.hypot(
        target.x - achieved.x,
        observation.ground ? 0 : target.y - achieved.y,
        target.z - achieved.z,
      ) <= SAME_PLACE
    )
      matched.add(observation.contact);
  });
  const inherited: IAutoMovieMotionHumanSupport.IContact[] = contacts.filter(
    (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
      matched.has(contact),
  );
  recordFloors(entry, inherited);
  return { inherited, laid, recordFloors };
}

/*
 * A support point in world metres, or an unnamed floor place.
 */
type Point = IAutoMovieVector3 | null;

/*
 * A contact whose floor location is read in a solved key.
 */
interface IFloorDatum {
  id: string;
  part: IAutoMovieMotionHumanSupport.Part;
}

/*
 * A placed contact compares the entry's achieved point to micrometre precision.
 */
const SAME_PLACE: number = 1e-6;

/*
 * Test the structural support frame identity, independent of point offsets and
 * event labels.
 */
function sameFrame(
  a: IAutoMovieMotionHumanContactWindow.Support,
  b: IAutoMovieMotionHumanContactWindow.Support,
): boolean {
  if (a.kind === "ground") return b.kind === "ground";
  if (a.kind === "prop")
    return (
      b.kind === "prop" &&
      a.subject === b.subject &&
      (a.point === undefined || b.point === undefined || a.point === b.point)
    );
  return (
    b.kind === "person" &&
    a.subject === b.subject &&
    ("region" in a
      ? "region" in b && a.region === b.region
      : "bone" in b && a.bone === b.bone)
  );
}
/*
 * A support sequence's own instantaneous floor targets.
 */
interface IFloor {
  inherited: readonly IAutoMovieMotionHumanSupport.IContact[];
  laid: ReadonlyMap<string, IAutoMovieVector3>;
  recordFloors(
    posture: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  ): void;
}

/*
 * The record of `IPrepareSupportFloorNamedItem`'s site.
 */
type IPrepareSupportFloorNamedItem = {
  contact: IAutoMovieMotionHumanSupport.IContact;
  at: IAutoMovieVector3;
  ground: boolean;
};

import * as THREE from "three";

import { createPaperFall } from "../props/createPaperFall";
import { createCharacterPerformance } from "./createCharacterPerformance";
import { createFootControls } from "./createFootControls";
import { createDeparturePerformance } from "./createDeparturePerformance";
import { createForeheadContact } from "./createForeheadContact";
import type { createHumanActor } from "./createHumanActor";
import type { createNoteGrip } from "./createNoteGrip";
import { evaluateSharedReach } from "./evaluateSharedReach";
import { measureOfferClearance } from "./measureOfferClearance";
import { resolveSharedContact } from "./resolveSharedContact";

/** Current measured event/contact state; absent values retain the pending boundary. */
interface CoupledInteraction {
  calibrated: boolean; event?: { time: number; progress: number }; release?: { time: number; lastAttachedFrame: number; velocity: number[]; contactSeconds: number };
  paperPhase: string; paperFloorMinimum?: number; forehead?: ReturnType<ReturnType<typeof createForeheadContact>>;
  floorClearance?: { carina: ReturnType<typeof measureOfferClearance>; harry: ReturnType<typeof measureOfferClearance> }; measurementCount?: number;
  departure?: object;
}

/**
 * Couple both real performances to actual paper loss and a measured shared stop.
 *
 * @evidence contracts/common.md#implementation-and-ownership Preserves the accepted0–36 action, actual full-floor/arm fitting and finite-paper pinch. Each actor's neutral full-floor/contact descriptor is prepared once before any calibration pose, then injected unchanged into every trial and final performer. First measured pinch loss detaches the last attached transform; prior displacement supplies Engine gravity/impact velocity. The grounded note becomes a fixed reach target. Original head-surface measurements resolve one shared bend extent/event consumed by both actors' stop/recovery. Final bounded caches use those actual inputs. No successful event is inferred merely from requested time or grip weight.
 * @evidence contracts/common.md#authoring-interface Owns bounded pose/interaction caches and event data, borrowing actors/grip/paper without disposing them. The accepted0–48 actor caches retain their original duration/inputs. A separate final-stage owner receives cloned actual48s poses and the settled note; its prepare gathers actual pickup, receive-before-give and departure failures. Unprepared future seeks expose the accepted ending with explicit unprepared metadata, never export approval; preparation refuses any failed stage. apply uses the adopted24fps states and actual ownership. No soundtrack or whole-film approval is implied by source assembly.
 */
export function createCoupledPerformance(carina: ReturnType<typeof createHumanActor>, harry: ReturnType<typeof createHumanActor>, grip: ReturnType<typeof createNoteGrip>, paper: THREE.Mesh, duration: number): {
  apply: (seconds: number) => ReturnType<ReturnType<typeof createCharacterPerformance>["apply"]> & { harry: ReturnType<ReturnType<typeof createCharacterPerformance>["apply"]>; note: number[]; noteOwner: string; interaction: CoupledInteraction; actualPaperContact?: ReturnType<ReturnType<typeof createNoteGrip>["update"]>["contact"]; offer?: ReturnType<typeof measureOfferClearance> };
  prepare: (progress?: (done: number, total: number) => void) => Promise<void>;
} {
  type Performer = ReturnType<typeof createCharacterPerformance>;
  const feet: { carina: ReturnType<typeof createFootControls>; harry: ReturnType<typeof createFootControls> } = { carina: createFootControls(carina), harry: createFootControls(harry) };
  let event: { time: number; progress: number } = { time: 40.5, progress: 1 };
  let ground: THREE.Vector3 = new THREE.Vector3(-1.75, 0.001, 0.05);
  let release: { time: number; fall: ReturnType<typeof createPaperFall>; velocity: number[]; lastAttachedFrame: number } | undefined;
  let contact: ReturnType<typeof createForeheadContact> | undefined;
  let measurements: Awaited<ReturnType<typeof resolveSharedContact>> | undefined;
  let calibrated: boolean = false;
  let preparation: Promise<void> | undefined;
  let departure: ReturnType<typeof createDeparturePerformance> | undefined;
  let departureError: string | undefined;
  const offers: Map<number, ReturnType<typeof measureOfferClearance>> = new Map();
  const clearances: Map<number, { carina: ReturnType<typeof measureOfferClearance>; harry: ReturnType<typeof measureOfferClearance> }> = new Map();

  /** Each immutable event/ground choice owns separate bounded fitted states. */
  function performers(chosen: { time: number; progress: number }, centre: THREE.Vector3): { carina: Performer; harry: Performer } {
    const action: (person: "carina" | "harry", seconds: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }) => ReturnType<typeof evaluateSharedReach> =
      (person, seconds, reference) => evaluateSharedReach(person, seconds, reference, chosen, centre);
    return { carina: createCharacterPerformance(carina, "carina", Math.min(duration, 48), grip, action, feet.carina), harry: createCharacterPerformance(harry, "harry", Math.min(duration, 48), undefined, action, feet.harry) };
  }
  let cast: ReturnType<typeof performers> = performers(event, ground);

  /** Read actual hand/paper bounds and source triangles once per immutable frame. */
  function hover(frame: number, giver: ReturnType<Performer["apply"]>, receiver: ReturnType<Performer["apply"]>): ReturnType<typeof measureOfferClearance> {
    let value: ReturnType<typeof offers.get> = offers.get(frame);
    if (value === undefined) {
      value = measureOfferClearance(paper, carina.rightHandParts, harry.rightHandParts, new THREE.Vector3(...giver.handPoint), new THREE.Vector3(...receiver.handPoint), new THREE.Vector3(...receiver.palmNormal!));
      offers.set(frame, value);
    }
    return value;
  }

  /** Own attachment/fall explicitly after both real actors have been placed. */
  function place(seconds: number): { owner: string; phase: string; pinch?: ReturnType<ReturnType<typeof createNoteGrip>["update"]>["contact"]; minimum?: number } {
    if (release === undefined || seconds < release.time) { const held: ReturnType<typeof grip.update> = grip.update(paper); return { owner: "carina", phase: "held", pinch: held.contact }; }
    const falling: ReturnType<ReturnType<typeof createPaperFall>["at"]> = release.fall.at(seconds - release.time);
    paper.position.copy(falling.position); paper.quaternion.copy(falling.quaternion); paper.updateWorldMatrix(true, false);
    return { owner: falling.state === "falling" ? "falling" : "floor", phase: falling.state, minimum: falling.floorMinimum };
  }

  /** Calibrate from actual release/contact geometry before making final caches. */
  async function initialize(): Promise<void> {
    let previous: { frame: number; position: THREE.Vector3; quaternion: THREE.Quaternion } | undefined;
    let earlier: typeof previous;
    for (let frame: number = Math.floor(37.1 * 24); frame <= 38 * 24; frame++) {
      cast.carina.apply(frame / 24); cast.harry.apply(frame / 24);
      const actual: ReturnType<typeof grip.update> = grip.update(paper);
      if (!actual.contact.admitted && frame / 24 >= 37.2) {
        if (previous === undefined || earlier === undefined) throw new Error("Paper loss lacks two actual attached frames");
        const velocity: THREE.Vector3 = previous.position.clone().sub(earlier.position).multiplyScalar(24 / (previous.frame - earlier.frame));
        paper.position.copy(previous.position); paper.quaternion.copy(previous.quaternion);
        release = { time: frame / 24, fall: createPaperFall(paper, velocity), velocity: velocity.toArray(), lastAttachedFrame: previous.frame };
        ground = release.fall.at(2).position;
        break;
      }
      if (!actual.contact.admitted) throw new Error(`Pinch lost before the requested release at${frame}`);
      earlier = previous; previous = { frame, position: paper.position.clone(), quaternion: paper.quaternion.clone() };
      await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
    }
    if (release === undefined) throw new Error("Actual opening fingers did not release the paper");
    contact = createForeheadContact(carina, harry);
    const observer: ReturnType<typeof createForeheadContact> = contact;
    measurements = await resolveSharedContact(async (progress: number): Promise<ReturnType<typeof observer>> => {
      const trial: ReturnType<typeof performers> = performers({ time: 40.5, progress: progress === 0 ? 1 : progress }, ground);
      const seconds: number = progress === 0 ? 39 : 40.5;
      const first: ReturnType<Performer["apply"]> = trial.carina.apply(seconds);
      const second: ReturnType<Performer["apply"]> = trial.harry.apply(seconds);
      const value: ReturnType<typeof observer> = observer();
      await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
      const measured: ReturnType<typeof observer> & { supportAdmitted: boolean; supportErrors: number[]; armErrors: number[] } = { ...value,
        supportAdmitted: first.status === "admitted" && second.status === "admitted", supportErrors: [first.error, second.error], armErrors: [first.armError, second.armError] };
      return measured;
    });
    event = { time: measurements.time, progress: measurements.progress };
    cast = performers(event, ground); offers.clear(); clearances.clear(); calibrated = true;
  }

  /** Place one exact frame with truthful event/ownership diagnostics. */
  function apply(seconds: number): ReturnType<ReturnType<typeof createCoupledPerformance>["apply"]> {
    if (seconds > 48 && departure !== undefined) {
      const value: ReturnType<ReturnType<typeof createDeparturePerformance>["apply"]> = departure.apply(seconds);
      return { ...value.carina, harry: value.harry, note: value.note, noteOwner: value.noteOwner, actualPaperContact: value.actualPaperContact,
        interaction: { calibrated, event, release: release === undefined ? undefined : { time: release.time, lastAttachedFrame: release.lastAttachedFrame, velocity: release.velocity, contactSeconds: release.fall.contactSeconds },
          paperPhase: "departure", paperFloorMinimum: value.paperFloorMinimum, departure: value.record } };
    }
    const giver: ReturnType<Performer["apply"]> = cast.carina.apply(seconds);
    const receiver: ReturnType<Performer["apply"]> = cast.harry.apply(seconds);
    const time: number = giver.frame / 24;
    const placed: ReturnType<typeof place> = place(time);
    const offer: ReturnType<typeof measureOfferClearance> | undefined = giver.frame >= 29 * 24 && placed.owner === "carina" ? hover(giver.frame, giver, receiver) : undefined;
    let floor: ReturnType<typeof clearances.get>;
    if (time >= 39 && placed.owner === "floor") {
      floor = clearances.get(giver.frame);
      if (floor === undefined) {
        floor = { carina: measureOfferClearance(paper, harry.rightHandParts, carina.rightHandParts, ground, new THREE.Vector3(...giver.handPoint), new THREE.Vector3(0, 1, 0)),
          harry: measureOfferClearance(paper, carina.rightHandParts, harry.rightHandParts, ground, new THREE.Vector3(...receiver.handPoint), new THREE.Vector3(0, 1, 0)) };
        clearances.set(giver.frame, floor);
      }
    }
    return { ...giver, harry: receiver, note: paper.position.toArray(), noteOwner: placed.owner,
      ...(placed.pinch === undefined ? {} : { actualPaperContact: placed.pinch }), ...(offer === undefined ? {} : { offer }),
      interaction: { calibrated, event: calibrated ? event : undefined, release: release === undefined ? undefined : { time: release.time, lastAttachedFrame: release.lastAttachedFrame, velocity: release.velocity, contactSeconds: release.fall.contactSeconds },
        paperPhase: placed.phase, paperFloorMinimum: placed.minimum, forehead: time >= 39 ? contact?.() : undefined, floorClearance: floor, measurementCount: measurements?.measurements.length,
        ...(seconds > 48 ? { departure: { state: "unprepared", error: departureError, observedFrame: giver.frame } } : {}) } };
  }
  return { apply, prepare: (progress?: (done: number, total: number) => void): Promise<void> => {
    if (preparation === undefined) preparation = (async (): Promise<void> => {
      const failures: string[] = [];
      try { await initialize(); } catch (error) { failures.push(`Interaction calibration:${error instanceof Error ? error.message : String(error)}`); }
      for (const performer of [cast.carina, cast.harry]) { try { await performer.prepare(progress); } catch (error) { failures.push(error instanceof Error ? error.message : String(error)); } }
      if (duration > 48) {
        try {
          cast.carina.apply(48); cast.harry.apply(48); place(48);
          departure = createDeparturePerformance({ carina: { actor: carina, feet: feet.carina, boundary: cast.carina.snapshot(48) }, harry: { actor: harry, feet: feet.harry, boundary: cast.harry.snapshot(48) }, paper, event, ground });
          await departure.prepare(progress);
        } catch (error) { departureError = error instanceof Error ? error.message : String(error); failures.push(`Departure:${departureError}`); }
      }
      for (let frame: number = 0; frame <= duration * 24; frame++) {
        try {
          const value: ReturnType<typeof apply> = apply(frame / 24);
          if (value.actualPaperContact !== undefined && !value.actualPaperContact.admitted) failures.push(`Actual attached paper contact failed:${frame}`);
          if (value.offer !== undefined && !value.offer.untouched) failures.push(`Untouched retry failed:${frame}:${JSON.stringify(value.offer)}`);
          if (frame >= Math.ceil(31.8 * 24) && frame <= Math.floor(32.6 * 24) && !value.offer?.admitted) failures.push(`Settled offer failed:${frame}`);
          const detail: { forehead?: ReturnType<ReturnType<typeof createForeheadContact>>; floorClearance?: { carina: ReturnType<typeof measureOfferClearance>; harry: ReturnType<typeof measureOfferClearance> }; paperFloorMinimum?: number } = value.interaction;
          if (detail.paperFloorMinimum !== undefined && detail.paperFloorMinimum < -1e-8) failures.push(`Paper entered paving:${frame}`);
          if (detail.floorClearance !== undefined && (!detail.floorClearance.carina.untouched || !detail.floorClearance.harry.untouched)) failures.push(`Grounded paper/shared hands clearance failed:${frame}:${JSON.stringify(detail.floorClearance)}`);
          if (frame / 24 >= 39 && frame / 24 <= 43.3 && detail.forehead !== undefined && detail.forehead.gap < -0.001) failures.push(`Head contact passed through:${frame}:${JSON.stringify(detail.forehead)}`);
          if (calibrated && frame / 24 >= event.time && frame / 24 <= event.time + 0.28 && !detail.forehead?.admitted) failures.push(`Measured shared stop lost contact:${frame}:${JSON.stringify(detail.forehead)}`);
        } catch (error) { failures.push(`Frame${frame}:${error instanceof Error ? error.message : String(error)}`); }
        if (frame % 8 === 0) await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
      }
      apply(0);
      if (failures.length !== 0) throw new Error(failures.join("\n"));
    })();
    return preparation;
  } };
}

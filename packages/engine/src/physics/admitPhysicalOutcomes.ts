import type { auditPhysicalOutcomes as Audit } from "./auditPhysicalOutcomes";
import { samplePhysicalContactEvents } from "./samplePhysicalContactEvents";

/** Refuse invalid event windows, observed times and receipt authority before evaluating outcome promises. */
export function admitPhysicalOutcomes(input: Audit.IInput): void {
  const name: (value: string) => boolean = (value: string): boolean =>
    typeof value === "string" && !!value.trim();
  const time: (seconds: number, tolerance: number) => boolean = (
    seconds: number,
    tolerance: number,
  ): boolean =>
    Number.isFinite(seconds) &&
    seconds >= 0 &&
    Number.isFinite(tolerance) &&
    tolerance >= 0;
  if (
    !Array.isArray(input.actions) ||
    !Array.isArray(input.falls) ||
    !Array.isArray(input.contacts) ||
    !input.observedFalls ||
    Array.isArray(input.observedFalls) ||
    typeof input.missDistance !== "function" ||
    typeof input.allowUnplanned !== "function"
  )
    throw new Error("Invalid physical outcome population");
  for (const action of input.actions)
    if (
      !action ||
      !name(action.id) ||
      !time(action.seconds, action.tolerance) ||
      !name(action.actor) ||
      !name(action.target) ||
      !["contact", "miss"].includes(action.expected) ||
      !["geometric", "solver"].includes(action.source) ||
      !Array.isArray(action.actorShapes) ||
      !action.actorShapes.length ||
      !Array.from(action.actorShapes).every(name) ||
      !Array.isArray(action.targetShapes) ||
      !action.targetShapes.length ||
      !Array.from(action.targetShapes).every(name)
    )
      throw new Error("Invalid physical outcome promise");
  for (const fall of input.falls)
    if (
      !fall ||
      !name(fall.id) ||
      !name(fall.body) ||
      !time(fall.seconds, fall.tolerance)
    )
      throw new Error("Invalid physical fall promise");
  for (const [body, seconds] of Object.entries(input.observedFalls))
    if (!name(body) || !Number.isFinite(seconds) || seconds < 0)
      throw new Error("Invalid observed physical fall time");
  for (const receipt of input.contacts) samplePhysicalContactEvents(receipt, 0);
}

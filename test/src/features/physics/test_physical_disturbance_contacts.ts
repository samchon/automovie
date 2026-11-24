import {
  preparePhysicalDisturbanceSpan as Span,
  recordPhysicalSpanContacts,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSupportWrench,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The body's mass, kilograms. */
const MASS: number = 75;

/** The cache's rate and the substeps per step. */
const RATE: number = 120;
const SUBSTEPS: number = 32;

/**
 * While a push response plays, the floor's reaction is recorded from its curves
 * (`recordPhysicalSpanContacts`) as the linear inverted pendulum's: the record
 * the momentum audit reads holds the weight and only the planted feet carry it.
 *
 * Scenarios, the two-foot biped of `test_physical_disturbance_span` pushed
 * forward at 1.2 m/s after a 0.1 s reaction, recorded substep by substep from
 * the push to the end of the first swing:
 *
 * 1. Momentum: every step's floor normal impulses sum to m g / rate, the
 *    weight's impulse; with the centre of mass's height held, Newton's second
 *    law leaves no vertical momentum unaccounted.
 * 2. Provenance: every receipt joins the floor to a foot, and while one foot
 *    swings it receives no sample.
 * 3. Wrench: every recorded support wrench asks and is allocated the weight up,
 *    with no residual.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the record and the three conditions it must meet.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `recordPhysicalSpanContacts` substep by substep on an in-memory binding and reads the receipts and wrenches it writes.
 * @evidence contracts/development/testing.md#independent-expectations The weight's impulse m g dt is Newton's second law for a body whose height is held; an unloaded swing foot and a floor-to-foot receipt are the definitions of single support and provenance.
 * @evidence contracts/development/testing.md#distinguishing-cases A share that does not sum to one fails 1, a load on the swinging foot or a receipt on another bone fails 2, and a wrench that drops the weight fails 3; the curves are `test_physical_disturbance_span`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on an in-memory binding; no world, simulation, viewer or file host.
 */
export function test_physical_disturbance_contacts(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const t0: number = 0.2;
  const rectangle = [
    { x: -0.12, y: -0.05 },
    { x: 0.12, y: -0.05 },
    { x: 0.12, y: 0.05 },
    { x: -0.12, y: 0.05 },
  ];
  const input: Span.IInput = {
    seconds: t0,
    center: { x: 0, y: 0.9, z: 0 },
    velocity: { x: 0, y: 0, z: 1.2 },
    omega,
    mass: MASS,
    gravity: 9.81,
    feet: [
      {
        bone: "left",
        side: "left",
        frame: { origin: { x: 0.1, z: 0 }, forward: { x: 0, z: 1 } },
        polygon: rectangle,
      },
      {
        bone: "right",
        side: "right",
        frame: { origin: { x: -0.1, z: 0 }, forward: { x: 0, z: 1 } },
        polygon: rectangle,
      },
    ],
    authored: { position: { x: 0, z: 0 }, velocity: { x: 0, z: 0 } },
    maximumStep: 0.6,
    reactionSeconds: 0.1,
    floor: 0,
  };
  const span: Span.ISpan = Span(input);
  const trigger = span.branches.find((branch) => branch.kind === "trigger");
  const touchdown = span.branches.find((branch) => branch.kind === "touchdown");
  TestValidator.predicate("the push steps", !!trigger && !!touchdown);
  if (!trigger || !touchdown) return;
  const collider = (body: string, bone: string) => ({
    body,
    bone,
    shape: bone,
    material: body === "floor" ? "floor" : "sole",
  });
  const body = {
    id: "biped",
    mode: { kind: "dynamic" },
    profile: { joints: [] },
  };
  const bound = {
    colliders: new Map([
      [0, collider("floor", "floor")],
      [1, collider("biped", "left")],
      [2, collider("biped", "right")],
    ]),
    spans: new Map(),
    segments: new Map(),
    supportWrenches: [] as IAutoMoviePhysicalSupportWrench[],
  };
  const contacts: IAutoMovieContactReceipt[] = [];
  const active: Map<string, IAutoMovieContactReceipt> = new Map();
  const first: number = Math.floor(t0 * RATE) + 1;
  const last: number = Math.ceil(touchdown.seconds * RATE);
  for (let step: number = first; step <= last; step++) {
    const found: Set<string> = new Set();
    for (let substep: number = 1; substep <= SUBSTEPS; substep++)
      recordPhysicalSpanContacts({
        settings: { rate: RATE, substeps: SUBSTEPS, bodies: [body] } as never,
        bound: bound as never,
        recovery: { biped: { last: "supported", steps: [], offsets: {}, span: input } } as never,
        instant: ((step - 1) * SUBSTEPS + substep) / (RATE * SUBSTEPS),
        seconds: step / RATE,
        step,
        contacts,
        active,
        found,
      });
    for (const key of active.keys()) if (!found.has(key)) active.delete(key);
  }
  const failures: string[] = [];
  // 1. Each fully played step carries the weight's impulse.
  const weight: number = MASS * 9.81;
  for (let step: number = first + 1; step <= last - 1; step++) {
    let impulse: number = 0;
    for (const receipt of contacts)
      for (const sample of receipt.samples ?? [])
        if (Math.round(sample.seconds * RATE) === step) impulse += sample.impulse;
    if (Math.abs(impulse - weight / RATE) > 1e-9 * weight)
      failures.push(`step ${step}: floor impulse ${impulse} N s, weight ${weight / RATE} N s`);
  }
  // 2. Floor to foot only; nothing on the swinging foot.
  for (const receipt of contacts) {
    const ends: string[] = [receipt.a, receipt.b].map((end) => `${end.body}/${end.bone}`);
    if (!ends.includes("floor/floor") || !ends.some((end) => end === "biped/left" || end === "biped/right"))
      failures.push(`a receipt joins ${ends}`);
    const bone: string = receipt.a.body === "biped" ? receipt.a.bone : receipt.b.bone;
    if (bone === trigger.bone)
      for (const sample of receipt.samples ?? [])
        if (
          sample.seconds > trigger.seconds + 1 / RATE &&
          sample.seconds < touchdown.seconds - 1 / RATE
        )
          failures.push(`the swinging ${bone} carries ${sample.impulse} N s at ${sample.seconds} s`);
  }
  // 3. The wrench is the reaction, the weight up, borne whole.
  for (const wrench of bound.supportWrenches)
    if (
      Math.abs(wrench.requested.force.y - weight) > 1e-9 * weight ||
      Math.abs(wrench.allocated.force.y - weight) > 1e-9 * weight ||
      Math.hypot(wrench.residual.force.x, wrench.residual.force.y, wrench.residual.force.z) > 1e-12
    )
      failures.push(`a wrench at ${wrench.seconds} s: ${JSON.stringify(wrench.allocated.force)}`);
  TestValidator.predicate("wrenches recorded", bound.supportWrenches.length > 0);
  TestValidator.equals("span contacts", failures.slice(0, 8), []);
}

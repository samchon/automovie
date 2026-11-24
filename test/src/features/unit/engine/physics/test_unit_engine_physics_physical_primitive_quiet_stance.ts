import { AutoMovieXpbdWorld, advancePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../../../internal/PhysicalBalanceReplay";

/** The quiet stance's recording: the four-support primitive standing unpushed. */
const QUIET: string = "quad_p0_z.json";

/**
 * The four-support primitive's balance controller takes no recovery step at
 * quiet stance: a step out of a fall is a stated push's prepared response, and
 * an unpushed stance prepares none.
 *
 * At the last quiet frame of the unpushed recording (`quad_p0_z`), under the
 * same internal actuation as the Human, `advancePhysicalBalance` is called on
 * the recorded inputs and the recorded bodies' states.
 *
 * Scenarios:
 *
 * 1. Without a stated push, the controller stays supported at full root strength,
 *    with no step, no swing and no prepared response.
 * 2. Given the same frame as the substep after a stated push, it prepares the
 *    response from the body's state at that instant.
 */
export async function test_unit_engine_physics_physical_primitive_quiet_stance(): Promise<void> {
  const fixture: PhysicalBalanceReplay.IFixture =
    await PhysicalBalanceReplay.load(QUIET);
  const profile: IAutoMoviePhysicalProfile =
    await PhysicalBalanceReplay.stored(fixture);
  const record: PhysicalBalanceReplay.IAdvanceRecord | undefined = [
    ...fixture.records,
  ]
    .reverse()
    .find(
      (
        candidate: PhysicalBalanceReplay.IRecord,
      ): candidate is PhysicalBalanceReplay.IAdvanceRecord =>
        candidate.kind === "advance",
    );
  if (record === undefined)
    throw new Error(`${QUIET} holds no balance controller call`);

  const quiet: IAutoMovieAdvancePhysicalBalance.IResult = advance(
    fixture,
    record,
    profile,
  );
  const pushed: IAutoMovieAdvancePhysicalBalance.IResult = advance(
    fixture,
    record,
    profile,
    { pushes: [] },
  );
  TestValidator.equals(
    "four-support quiet stance prepares no recovery",
    {
      quiet: {
        last: quiet.state.last,
        steps: quiet.state.steps.length,
        swing: quiet.swing !== undefined,
        span: quiet.state.span !== undefined,
        rootStrength: quiet.rootStrength,
      },
      pushed: pushed.state.span?.seconds ?? null,
    },
    {
      quiet: {
        last: "supported",
        steps: 0,
        swing: false,
        span: false,
        rootStrength: 1,
      },
      pushed: record.seconds,
    },
  );
}

/**
 * Call the controller on one `advance` record's inputs, a stated push's or
 * none.
 */
function advance(
  fixture: PhysicalBalanceReplay.IFixture,
  record: PhysicalBalanceReplay.IAdvanceRecord,
  profile: IAutoMoviePhysicalProfile,
  disturbance?: Parameters<typeof advancePhysicalBalance>[0]["disturbance"],
): IAutoMovieAdvancePhysicalBalance.IResult {
  const input: PhysicalBalanceReplay.IAdvanceInput = structuredClone(
    record.input,
  );
  return advancePhysicalBalance({
    // The controller reads no solver state but the recorded segments.
    world: new AutoMovieXpbdWorld(fixture.settings.gravity),
    body: fixture.body.id,
    profile,
    segments: PhysicalBalanceReplay.segments(input.segments),
    colliders: new Map(),
    contacts: [],
    policy: structuredClone(fixture.body.balance)!,
    state: input.state ?? {
      last: "supported",
      steps: [],
      offsets: Object.create(null),
    },
    targets: input.targets,
    ...(input.velocities ? { velocities: input.velocities } : {}),
    ...(input.unavailable ? { unavailable: input.unavailable } : {}),
    seconds: input.seconds,
    dt: input.dt,
    gravity: input.gravity,
    floor: input.floor,
    ...(input.actuation ? { actuation: new Map(input.actuation) } : {}),
    supports: input.supports,
    ...(disturbance ? { disturbance } : {}),
  });
}

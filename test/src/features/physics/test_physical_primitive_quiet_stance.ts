import { advancePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the replayed frame, the two calls and what each must show.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `advancePhysicalBalance` on the recorded inputs and reads the state it leaves and the result it returns.
 * @evidence contracts/development/testing.md#independent-expectations An unpushed stance has nothing to recover from, so the supported state, the full root strength and the empty step list follow from the contract; the prepared response's instant is the call's own second.
 * @evidence contracts/development/testing.md#distinguishing-cases The same frame with and without a stated push, the branch that alone starts a recovery step; a controller that prepared a response unpushed, withdrew the root or swung a limb fails 1, one that ignored the push fails 2. The response's own steps are `test_physical_disturbance_span`'s; the root tracker's support task is `test_physical_primitive_quiet_support`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over one fixture file in the repository; the primitive's profile is built in closed form, and no native world, viewer or simulation runs.
 */
export function test_physical_primitive_quiet_stance(): void {
  const fixture: PhysicalBalanceReplay.IFixture =
    PhysicalBalanceReplay.load(QUIET);
  const profile: IAutoMoviePhysicalProfile =
    PhysicalBalanceReplay.stored(fixture);
  let index: number = fixture.records.length - 1;
  while (index >= 0 && fixture.records[index]!.kind !== "advance") index--;
  if (index < 0) throw new Error(`${QUIET} holds no balance controller call`);
  const record: PhysicalBalanceReplay.IRecord = fixture.records[index]!;

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
  record: PhysicalBalanceReplay.IRecord,
  profile: IAutoMoviePhysicalProfile,
  disturbance?: Parameters<typeof advancePhysicalBalance>[0]["disturbance"],
): IAutoMovieAdvancePhysicalBalance.IResult {
  const input: Record<string, any> = structuredClone(record.input);
  return advancePhysicalBalance({
    world: undefined as never,
    body: fixture.body.id,
    profile,
    segments: PhysicalBalanceReplay.segments(input.segments) as never,
    colliders: new Map(),
    contacts: [],
    policy: structuredClone(
      fixture.body.balance,
    ) as IAutoMoviePhysicalRecoveryPolicy,
    state: (input.state as IAutoMoviePhysicalRecoveryState | undefined) ?? {
      last: "supported",
      steps: [],
      offsets: Object.create(null),
    },
    targets: input.targets as Record<string, IAutoMovieRigidTransform>,
    ...(input.velocities ? { velocities: input.velocities } : {}),
    ...(input.unavailable ? { unavailable: input.unavailable } : {}),
    seconds: input.seconds,
    dt: input.dt,
    gravity: input.gravity,
    floor: input.floor,
    ...(input.actuation
      ? {
          actuation: new Map(input.actuation as [string, IAutoMovieVector3][]),
        }
      : {}),
    supports: input.supports as IAutoMovieCollectPhysicalSupports.ISupport[],
    ...(disturbance ? { disturbance } : {}),
  });
}

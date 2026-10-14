import { simulateFluidDomain } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { exactArray, fluidDomain } from "../internal/fluidFixtures";
import { nclose } from "../internal/predicates";

/**
 * Compare the first two shallow-water steps with independently hand-computed
 * dyadic momentum and flux values in this CPU runtime.
 *
 * The two displayed updates use small dyadic values representable exactly in binary64; this does not extend to arbitrary dyadic inputs or unbounded integration. Expectations come from the equations by hand rather than recorded product output. Running this entry on one platform does not observe another platform or a GPU implementation.
 *
 * Two cells, `dx = dz = 1 m`, `g = 8 m/s²`, `dt = 1/8 s`, no drag, walls all
 * round, `h = [1.5, 0.5]` over a flat bed.
 *
 * Step 1 momentum, `u ← u − dt·g·Δη/dx`: `u = 0 − 0.125·8·(0.5 − 1.5)/1 = +1`.
 * Step 1 flux, upwind from the deeper donor: `Q = u·h·dz·dt = 1·1.5·1·0.125 =
 * 0.1875 m³`, so `h = [1.3125, 0.6875]`.
 *
 * Step 2 momentum: `u = 1 − 0.125·8·(0.6875 − 1.3125)/1 = 1.625`. Flux
 * `1.625·1.3125·1·0.125 = 0.2666015625 m³`, so `h = [1.0458984375,
 * 0.9541015625]`.
 *
 * Scenarios:
 *
 * 1. Step 0 is the authored state at rest: the depths as written, every face
 *    velocity exactly zero, volume exactly 2 m³.
 * 2. Step 1 equals the hand-computed depths and the single interior face velocity,
 *    with both walls pinned to zero.
 * 3. Step 2 equals the hand-computed depths and velocity, proving the momentum
 *    term accumulates across steps rather than restarting.
 * 4. A closed basin holds exactly 2 m³ at all three observed steps; source, drain and outflow ledger entries are exactly zero at step 2, whose domain and absolute step identity are also retained.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the shallow-water solver at steps zero, one and two and compares hand-derived depth, face velocity, volume, time and ledger values, catching wrong momentum accumulation, donor flux or closed-wall booking.
 * @evidence contracts/testing.md#independent-expectations The documented two-cell dyadic equations independently yield velocities 1 and 1.625 and depths 1.3125/0.6875 then 1.0458984375/0.9541015625; no product snapshot is the oracle, and one CPU run does not prove another platform.
 * @evidence contracts/testing.md#distinguishing-cases Keeps authored rest, first and second updates, reflecting X/Z faces and empty source/drain/outflow ledgers; drag, dry cells, source/drain windows and open rims have separate entries.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns the three portable CPU solves and strict numerical observations through engine calls, without building native artifacts or starting a process, browser or GPU.
 */
export function test_fluid_shallow_water_hand_math(): void {
  const domain: ReturnType<typeof fluidDomain> = fluidDomain();

  const initial: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 0);
  TestValidator.predicate("step 0 authored depth", exactArray(initial.depth, [1.5, 0.5]) && initial.depth.every((value: number, index: number): boolean => nclose(value, [1.5, 0.5][index]!, 0)));
  TestValidator.predicate("step 0 X faces at rest", exactArray(initial.velocityX, [0, 0, 0]) && initial.velocityX.every((value: number): boolean => nclose(value, 0, 0)));
  TestValidator.predicate("step 0 Z faces at rest", exactArray(initial.velocityZ, [0, 0, 0, 0]) && initial.velocityZ.every((value: number): boolean => nclose(value, 0, 0)));
  TestValidator.predicate("step 0 volume", Object.is(initial.volume, 2) && nclose(initial.volume, 2, 0));
  TestValidator.predicate("step 0 time", Object.is(initial.time, 0) && nclose(initial.time, 0, 0));

  const first: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 1);
  TestValidator.predicate("step 1 hand-computed depth", exactArray(first.depth, [1.3125, 0.6875]) && first.depth.every((value: number, index: number): boolean => nclose(value, [1.3125, 0.6875][index]!, 0)));
  TestValidator.predicate("step 1 hand-computed X velocity", exactArray(first.velocityX, [0, 1, 0]) && first.velocityX.every((value: number, index: number): boolean => nclose(value, [0, 1, 0][index]!, 0)));
  TestValidator.predicate("step 1 closed Z faces", exactArray(first.velocityZ, [0, 0, 0, 0]) && first.velocityZ.every((value: number): boolean => nclose(value, 0, 0)));
  TestValidator.predicate("step 1 volume", Object.is(first.volume, 2) && nclose(first.volume, 2, 0));
  TestValidator.predicate("step 1 time", Object.is(first.time, 0.125) && nclose(first.time, 0.125, 0));

  const second: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 2);
  TestValidator.predicate("step 2 accumulated depth", exactArray(second.depth, [1.0458984375, 0.9541015625]) && second.depth.every((value: number, index: number): boolean => nclose(value, [1.0458984375, 0.9541015625][index]!, 0)));
  TestValidator.predicate("step 2 accumulated X momentum", exactArray(second.velocityX, [0, 1.625, 0]) && second.velocityX.every((value: number, index: number): boolean => nclose(value, [0, 1.625, 0][index]!, 0)));
  TestValidator.predicate("step 2 volume", Object.is(second.volume, 2) && nclose(second.volume, 2, 0));

  TestValidator.predicate("closed source ledger", Object.is(second.sourceVolume, 0) && nclose(second.sourceVolume, 0, 0));
  TestValidator.predicate("closed drain ledger", Object.is(second.drainVolume, 0) && nclose(second.drainVolume, 0, 0));
  TestValidator.predicate("closed outflow ledger", Object.is(second.outflowVolume, 0) && nclose(second.outflowVolume, 0, 0));
  TestValidator.equals("absolute state identity", { domain: second.domain, step: second.step }, { domain: "pond", step: 2 });
}

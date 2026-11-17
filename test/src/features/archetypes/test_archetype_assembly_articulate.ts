import {
  ArchetypeAssembly,
  ArchetypeFrame,
  ArchetypeRefusal,
  createDoor,
  createSeat,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCarriage } from "../internal/archetypeCarriage";
import { qclose, vclose } from "../internal/predicates";

/** A hall of two doors and a bench. */
type Hall = {
  /** A door hinged on its left. */
  left: ArchetypeAssembly.IMember<createDoor.Affordance, createDoor.Dimension>;

  /** A door hinged on its right. */
  right: ArchetypeAssembly.IMember<createDoor.Affordance, createDoor.Dimension>;

  /** A bench facing the doors. */
  bench: ArchetypeAssembly.IMember<createSeat.Affordance, createSeat.Dimension>;
};

/**
 * An assembly articulates each member by prefixed ids, moving only that member, and couples an articulation of one member to another's only through its own couplings.
 *
 * Scenarios, for a hall of two hinged doors and a bench:
 * 1. Opening `left/hinge` 40 degrees moves the left door's parts exactly as the door's own articulation, placed, moves them, within 1e-9 m and in rotation, and leaves the right door's and the bench's parts as they were; `member("left")` is the door opened 40 degrees.
 * 2. An unprefixed `hinge` and an unknown `left/ghost` are refused, listing the assembly's prefixed articulations.
 * 3. Coupling `left/hinge` to follow `right/hinge` by a ratio of 1, opening the right door 30 degrees opens the left by 30, the coupled assembly is admitted by the engine, the members' own models are unchanged, and `member("left")` is the left door at 30 degrees.
 * 4. In the coupled assembly, setting `left/hinge` is refused with `right/hinge` as its leader, coupling it again is refused, and coupling the bench's seat, which does not travel, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Articulates and couples real assemblies and reads their parts and members; a member moved by another's id, a prefix ignored, an unknown id admitted, a coupling that does not drive its follower or that changes a member's own model is caught.
 * @evidence contracts/development/testing.md#independent-expectations The expected parts are the member's own articulation composed under its placement, computed here with `ArchetypeFrame.compose`; a ratio of 1 makes the follower's travel its leader's.
 * @evidence contracts/development/testing.md#distinguishing-cases A moved and two unmoved members, prefixed, unprefixed and unknown ids, a coupling and the three ways a coupling is refused; the assembly's admission and mass belong to `test_archetype_assembly_valid`, and following inside one model to `test_archetype_contract_follows`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_assembly_articulate(): void {
  const findings: string[] = [];
  const members: Hall = {
    left: {
      archetype: createDoor({ hinge: "left" }, 3),
      placement: archetypeCarriage.placement(-1, 0, 0, 0),
    },
    right: {
      archetype: createDoor({ hinge: "right" }, 3),
      placement: archetypeCarriage.placement(1, 0, 0, 0),
    },
    bench: {
      archetype: createSeat({ kind: "bench" }, 3),
      placement: archetypeCarriage.placement(0, 0, 2, 180),
    },
  };
  const hall: ArchetypeAssembly<Hall> = ArchetypeAssembly.of(
    "hall",
    "hall",
    members,
  );
  const part = (
    parts: readonly IAutoMovieModelPart[],
    id: string,
  ): IAutoMovieTransform =>
    parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!.transform!;
  const placedLike = (
    assembly: ArchetypeAssembly<Hall>,
    key: "left" | "right" | "bench",
    own: readonly IAutoMovieModelPart[],
    label: string,
  ): void => {
    for (const p of own) {
      const expected: IAutoMovieTransform = ArchetypeFrame.compose(
        members[key].placement,
        p.transform!,
      );
      const got: IAutoMovieTransform = part(assembly.parts, `${key}/${p.id}`);
      if (
        !vclose(got.translation, expected.translation, 1e-9) ||
        !qclose(got.rotation, expected.rotation, 1e-12)
      )
        findings.push(`${label}: ${key}/${p.id}`);
    }
  };

  // 1. One member moves.
  const opened: ArchetypeAssembly<Hall> = hall.articulate({
    "left/hinge": 40,
  });
  placedLike(opened, "left", members.left.archetype.articulate({ hinge: 40 }).parts, "opened");
  placedLike(opened, "right", members.right.archetype.parts, "opened");
  placedLike(opened, "bench", members.bench.archetype.parts, "opened");
  if (opened.member("left").state.hinge !== 40)
    findings.push("the left member is not posed at 40 degrees");

  // 2. Unprefixed and unknown ids.
  for (const id of ["hinge", "left/ghost"]) {
    const thrown: unknown = caught(() =>
      hall.articulate({ [id]: 10 } as Partial<
        Record<ArchetypeAssembly.Ids<Hall>, number>
      >),
    );
    if (
      !(thrown instanceof ArchetypeRefusal) ||
      thrown.feasible?.kind !== "alternatives" ||
      !thrown.feasible.values.includes("left/hinge") ||
      thrown.feasible.values.some((v: string): boolean => !v.includes("/"))
    )
      findings.push(`${id}: ${String(thrown)}`);
  }

  // 3. A coupling across members.
  const before: string = JSON.stringify(members.left.archetype);
  const coupled: ArchetypeAssembly<Hall> = hall.couple("left/hinge", {
    id: "right/hinge",
    ratio: 1,
  });
  const both: ArchetypeAssembly<Hall> = coupled.articulate({
    "right/hinge": 30,
  });
  placedLike(both, "left", members.left.archetype.articulate({ hinge: 30 }).parts, "coupled");
  placedLike(both, "right", members.right.archetype.articulate({ hinge: 30 }).parts, "coupled");
  if (!validateModel({ model: both }).success)
    findings.push("the coupled assembly is not admitted");
  if (JSON.stringify(members.left.archetype) !== before)
    findings.push("coupling changed the member's own model");
  if (both.member("left").state.hinge !== 30)
    findings.push("the coupled member is not posed at 30 degrees");

  // 4. Refused couplings and states.
  const set: unknown = caught(() => coupled.articulate({ "left/hinge": 10 }));
  const again: unknown = caught(() =>
    coupled.couple("left/hinge", { id: "right/hinge", ratio: 1 }),
  );
  const still: unknown = caught(() =>
    hall.couple("bench/seat", { id: "right/hinge", ratio: 1 }),
  );
  if (
    !(set instanceof ArchetypeRefusal) ||
    set.feasible?.kind !== "alternatives" ||
    set.feasible.values.join() !== "right/hinge"
  )
    findings.push(`setting a coupled follower: ${String(set)}`);
  if (!(again instanceof ArchetypeRefusal) || again.axis !== "left/hinge")
    findings.push(`coupling twice: ${String(again)}`);
  if (!(still instanceof ArchetypeRefusal) || still.kind !== "articulation")
    findings.push(`coupling a seat: ${String(still)}`);
  TestValidator.equals("an assembly articulates by member", findings, []);
}

/** Run an operation and return what it throws, or undefined. */
function caught(operation: () => unknown): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
}

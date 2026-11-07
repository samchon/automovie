import type { IAutoMoviePhysicalContactBinding as Binding } from "@automovie/interface";
import assert from "node:assert/strict";

import { boutContactGroups } from "../../../src/physics/boutContactGroups";

/** Relationship references finalize receivers first, preserve genuine mutual-contact groups, and ignore inactive declarations without dropping any solver rows. */
export function test_bout_contact_groups(): void {
  const binding: (target: string, weight?: number) => Binding = (
    target: string,
    weight: number = 1,
  ): Binding => ({
    id: "declared-relationship",
    kind: "contact",
    source: { bone: "tip", shape: "sphere" },
    target: { body: target, bone: "root", shape: "sphere" },
    chain: ["tip"],
    weight,
    compression: 0,
    iterations: 1,
    tolerance: 0.000025,
  });
  const input: Parameters<typeof boutContactGroups>[0] = {
    a: { bindings: [binding("b")] },
    b: { bindings: [binding("referee")] },
    referee: { bindings: [] },
  };
  const original: string = JSON.stringify(input);
  assert.deepEqual(boutContactGroups(input), [["referee"], ["b"], ["a"]]);
  assert.deepEqual(
    boutContactGroups({ referee: input.referee, b: input.b, a: input.a }),
    [["referee"], ["b"], ["a"]],
  );
  const cyclic: ReturnType<typeof boutContactGroups> = boutContactGroups({
    ...input,
    b: { bindings: [binding("a"), binding("referee")] },
  });
  assert.deepEqual(cyclic[0], ["referee"]);
  assert.deepEqual(new Set(cyclic[1]), new Set(["a", "b"]));
  const inactive: ReturnType<typeof boutContactGroups> = boutContactGroups({
    ...input,
    b: { bindings: [binding("a", 0)] },
  });
  assert.ok(
    inactive.findIndex((group: string[]): boolean => group.includes("b")) <
    inactive.findIndex((group: string[]): boolean => group.includes("a")),
  );
  assert.equal(JSON.stringify(input), original);
}

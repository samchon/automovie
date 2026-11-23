import {
  AutoMovieArchetypeFrame,
  type createJumpRope,
  createJumpRopeHandle,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Each standalone handle mounts from its grip and meets the moving cord at the end of its barrel.
 *
 * Scenarios:
 * 1. Each of Rogue's three handle families yields one barrel with the measured length and grip diameter.
 * 2. Each grip sits at the origin along the barrel and each cord socket points out from the positive Z face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the measured models and the moving cord's mounting frame.
 * @evidence contracts/development/testing.md#behavioral-verification Observes body geometry and local affordance positions from the built model.
 * @evidence contracts/development/testing.md#independent-expectations States Rogue's handle lengths of 5.25, 6.75 and 7.5 inches and 7/8 inch grip diameter in metres independently of the producer.
 * @evidence contracts/development/testing.md#distinguishing-cases Measures all three families and distinguishes the socket's positive tip from the opposite end and the grip centre.
 * @evidence contracts/development/testing.md#execution-ownership The exported unit uses local in-memory archetypes and starts no host.
 */
export function test_archetype_jump_rope_handle(): void {
  const models: Readonly<Record<createJumpRope.Handle, number>> = {
    "SR-1S": 0.13335,
    "SR-1": 0.17145,
    "SR-1L": 0.1905,
  };
  const diameter: number = 0.022225;
  for (const handle of Object.keys(models) as createJumpRope.Handle[]) {
    const length: number = models[handle];
    const model: ReturnType<typeof createJumpRopeHandle> = createJumpRopeHandle(
      {
        handle,
      },
    );
    const span: ReturnType<typeof archetypeExtent> = archetypeExtent(
      model,
      "z",
    );
    const grip: IAutoMovieAffordance = model.affordance("grip");
    const socket: IAutoMovieAffordance = model.affordance("cordSocket");
    TestValidator.equals(`${handle} has one barrel`, model.shapes().length, 1);
    TestValidator.predicate(
      `${handle} has the measured dimensions`,
      nclose(span.low, -length / 2) &&
        nclose(span.high, length / 2) &&
        nclose(model.dimensions.handleLength!, length) &&
        nclose(archetypeExtent(model, "x").size, diameter) &&
        nclose(archetypeExtent(model, "y").size, diameter),
    );
    TestValidator.predicate(
      `${handle} grip and cord have their mounting positions`,
      grip.kind === "handle" &&
        vclose(grip.frame.translation, { x: 0, y: 0, z: 0 }) &&
        vclose(AutoMovieArchetypeFrame.axis(grip.frame, "x"), {
          x: 0,
          y: 0,
          z: 1,
        }) &&
        nclose(grip.length!, length) &&
        nclose(grip.aperture!, diameter) &&
        socket.kind === "socket" &&
        vclose(socket.frame.translation, { x: 0, y: 0, z: span.high }) &&
        vclose(AutoMovieArchetypeFrame.axis(socket.frame, "y"), {
          x: 0,
          y: 0,
          z: 1,
        }),
    );
  }
}

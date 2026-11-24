import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `HumanSignature.sole` reads a foot's lowest sole socket (heel, ball or toe).
 *
 * Scenario, the average man's quiet stance raised 0.1 m: each foot's sole is
 * one of its sockets, none lower, and lies 0.1 m above that foot's lowest
 * socket in the stance on the floor.
 *
 * The body is built whole (`humanFixtureBody`): the sockets are placed on the
 * body's displayed foot bones.
 */
export async function test_unit_motions_audit_human_signature_sole(): Promise<void> {
  // Reads the body's foot sole geometry (`HumanFoot.sockets`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const raised = auditStanceMotion(body, {
    shift: () => ({ x: 0, y: 0.1, z: 0 }),
  });
  const floor = auditStanceMotion(body);
  TestValidator.predicate(
    "the lowest socket",
    (["left", "right"] as const).every((side: "left" | "right"): boolean => {
      const sole: IAutoMovieVector3 = HumanSignature.sole(
        HumanSignature(raised, "a", body, 0),
        0,
        side,
      );
      const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        raised.bones("a", 0),
        side,
      );
      const low: number = Math.min(
        ...HumanFoot.sockets(body, floor.bones("a", 0), side).map(
          (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.y,
        ),
      );
      return (
        sockets.some(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.point.y === sole.y && s.point.z === sole.z,
        ) &&
        sockets.every(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.point.y >= sole.y,
        ) &&
        Math.abs(sole.y - low - 0.1) <= 1e-9
      );
    }),
  );
}

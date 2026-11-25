import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanToolTurn, useToolCycle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const LEFT: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const ROUNDING: number = 1e-12;

/**
 * Evaluate the four tool cycles from a fixed grip and a known local face.
 * Check their face at contact, the saw's excursion, the hammer's windup,
 * the screwdriver's axis, and the spoon's path halfway up the vessel.
 */
export function test_motions_tasks_tool_cycle(): void {
  const held: useToolCycle.IPrepared["pose"] = {
    grip: ORIGIN,
    rotation: IDENTITY,
    axis: FORWARD,
  };
  const prepare = (
    kind: Exclude<useToolCycle.IPrepared["kind"], "stir">,
    turn?: useToolCycle.IPrepared["turn"],
  ): ReturnType<typeof useToolCycle> =>
    useToolCycle({
      kind,
      turn,
      pose: held,
      m: { forearm: 0.24 },
      work: { on: FORWARD, radius: 0 },
      forward: FORWARD,
      left: LEFT,
    });
  const face = (
    hand: Pick<typeof held, "grip" | "rotation">,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(hand.grip, Quaternion.rotateVector(hand.rotation, local));

  const hammer = prepare("hammer", HumanToolTurn(held, LEFT, ORIGIN));
  const angle: number = (70 * Math.PI) / 180;
  TestValidator.predicate(
    "the hammer returns its raised face to the work point",
    vclose(
      face(hammer(0.5), FORWARD),
      { x: 0, y: Math.sin(angle), z: Math.cos(angle) },
      ROUNDING,
    ) &&
      vclose(face(hammer(1), FORWARD), FORWARD, ROUNDING) &&
      vclose(face(hammer(0), FORWARD), FORWARD, ROUNDING),
  );

  const saw = prepare("saw");
  TestValidator.predicate(
    "the saw travels a quarter forearm to each side of the work point",
    vclose(face(saw(0.25), FORWARD), { x: 0, y: 0, z: 1.06 }, ROUNDING) &&
      vclose(face(saw(0.75), FORWARD), { x: 0, y: 0, z: 0.94 }, ROUNDING) &&
      vclose(face(saw(0), FORWARD), FORWARD, ROUNDING),
  );

  const driver = prepare("screwdriver", HumanToolTurn(held, FORWARD, FORWARD));
  const turned = driver(0.25);
  TestValidator.predicate(
    "the screwdriver turns 30 degrees about its fixed face",
    vclose(face(turned, FORWARD), FORWARD, ROUNDING) &&
      vclose(
        Quaternion.rotateVector(turned.rotation, LEFT),
        { x: Math.sqrt(3) / 2, y: 0.5, z: 0 },
        ROUNDING,
      ) &&
      vclose(face(driver(0), FORWARD), FORWARD, ROUNDING),
  );

  // Inside radius 0.1 m, floor at 0.8 m and rim at 1 m, centered at (1, 2).
  const stir = useToolCycle({
    kind: "stir",
    turn: undefined,
    pose: {
      grip: { x: 1, y: 1.1, z: 1.95 },
      rotation: IDENTITY,
      axis: { x: 0, y: -1, z: 0 },
    },
    m: { forearm: 0.24 },
    work: { on: { x: 1, y: 0.9, z: 1.95 }, radius: 0.05 },
    forward: FORWARD,
    left: LEFT,
  });
  const spoon: IAutoMovieVector3 = { x: 0, y: -0.2, z: 0 };
  const circle: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0.9, z: 1.95 },
    { x: 1.05, y: 0.9, z: 2 },
    { x: 1, y: 0.9, z: 2.05 },
    { x: 0.95, y: 0.9, z: 2 },
  ];
  TestValidator.predicate(
    "the spoon keeps the face on the horizontal circle inside the vessel",
    circle.every((point, i) => vclose(face(stir(i / 4), spoon), point, ROUNDING)) &&
      vclose(face(stir(1), spoon), circle[0]!, ROUNDING),
  );
}

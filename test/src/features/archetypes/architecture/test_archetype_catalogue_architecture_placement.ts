import {
  createAtm,
  createCrosstie,
  createCrowdBarrier,
  createFireHydrant,
  createJerseyBarrier,
  createMicrowave,
  createRefrigerator,
  createRopeStanchions,
  createSandbag,
  createShower,
  createToilet,
  createWashbasin,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypePlaced } from "../../internal/archetypePlaced";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Millimetre allowance for placed contact and collider alignment. */
const MM: number = 1e-3;

/**
 * The named fixtures and barriers retain the physical geometry read by their
 * scene contacts and the step-over action.
 *
 * Scenarios:
 *
 * 1. Place open kitchen, bathroom, service and street models as named props
 *    through the SDK, with rotated placements and a microwave on a counter.
 * 2. Compare a refrigerator shelf and handle, a shower seat, basin mixer and ATM
 *    and hydrant controls with their independent collider geometry or cited
 *    measurements.
 * 3. Cross a real crosstie and sandbag with two feet; refuse the Jersey and crowd
 *    barriers at the public obstacle boundary. Check that rope and rail keep
 *    distinct contact offers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, placed fixtures and action/refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public prop seam and actual collider extents. Measures the actor's sole geometry across the occupied region.
 * @evidence contracts/development/testing.md#independent-expectations The seat and shelf must coincide with their actual colliders. NCR records the key at 786 mm and 89 mm behind the shelf edge. The Darling drawing puts the pumper 18 in up and 8.84 in out.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers fixed and articulated fixture parts, three different control kinds, counter and floor placements, two accepted low crossing models, a high ledge and a boundary without a ledge.
 * @evidence contracts/development/testing.md#execution-ownership In-memory fixture models, one actor's body for the action, and the reusable placement audit.
 */
export function test_archetype_catalogue_architecture_placement(): void {
  const fridge: ReturnType<typeof createRefrigerator> = createRefrigerator(
    {},
    8,
  );
  const opened: ReturnType<typeof createRefrigerator> = fridge.articulate({
    fridgeDoor: 90,
  });
  const shower: ReturnType<typeof createShower> = createShower({}, 8);
  const basin: ReturnType<typeof createWashbasin> = createWashbasin({}, 8);
  const atm: ReturnType<typeof createAtm> = createAtm({}, 8);
  const hydrant: ReturnType<typeof createFireHydrant> = createFireHydrant(
    {},
    8,
  );
  const crowd: ReturnType<typeof createCrowdBarrier> = createCrowdBarrier(
    {},
    8,
  );
  const stanchions: ReturnType<typeof createRopeStanchions> =
    createRopeStanchions({}, 8);
  TestValidator.equals(
    "named fixtures and boundaries retain their support and contact points when installed",
    archetypePlaced([
      { name: "kitchen-fridge", archetype: opened, yaw: 90 },
      {
        name: "counter-microwave",
        archetype: createMicrowave(),
        on: 0.9,
        yaw: 90,
      },
      { name: "bathroom-basin", archetype: basin, yaw: 90 },
      { name: "bathroom-toilet", archetype: createToilet(), yaw: -90 },
      { name: "bathroom-shower", archetype: shower, yaw: 180 },
      { name: "lobby-atm", archetype: atm, yaw: -90 },
      { name: "street-hydrant", archetype: hydrant, yaw: 135 },
      { name: "crowd-barrier", archetype: crowd, yaw: 45 },
      { name: "rope-boundary", archetype: stanchions, yaw: -45 },
    ]),
    [],
  );

  const shelf: IAutoMovieAffordance = opened.affordance("shelf1");
  const hinge: IAutoMovieAffordance = opened.affordance("fridgeDoor");
  TestValidator.predicate(
    "open fridge offers a fixed shelf surface and a handle carried by the door",
    shelf.kind === "stack-top" &&
      nclose(
        shelf.frame.translation.y,
        archetypeExtent(opened, "y", ["shelf-1"]).high,
        MM,
      ) &&
      vclose(
        shelf.frame.translation,
        fridge.affordance("shelf1").frame.translation,
      ) &&
      opened.affordance("fridgeHandle").frame.translation.z >
        hinge.frame.translation.z + fridge.dimensions.width! / 2,
  );
  const seat: IAutoMovieAffordance = shower.affordance("seat");
  const control: IAutoMovieAffordance = shower.affordance("control");
  TestValidator.predicate(
    "seat support is on the shower's seat collider and the valve is opposite",
    seat.kind === "seat" &&
      nclose(
        seat.frame.translation.y,
        archetypeExtent(shower, "y", ["seat"]).high,
        MM,
      ) &&
      nclose(
        seat.frame.translation.x,
        archetypeExtent(shower, "x", ["seat"]).low,
        MM,
      ) &&
      control.kind === "knob" &&
      nclose(control.frame.translation.x, -0.915 / 2, MM),
  );
  const lifted: ReturnType<typeof createWashbasin> = basin.articulate({
    lift: 39,
  });
  TestValidator.predicate(
    "washbasin lift raises the actual mixer lever over the stationary rim",
    archetypeExtent(lifted, "y", ["tap-lever"]).high >
      archetypeExtent(basin, "y", ["tap-lever"]).high + 0.02 &&
      vclose(
        lifted.affordance("rim").frame.translation,
        basin.affordance("rim").frame.translation,
      ),
  );
  const key: IAutoMovieAffordance = atm.affordance("key5");
  const pumper: IAutoMovieAffordance = hydrant.affordance("pumper");
  TestValidator.predicate(
    "the ATM button and hydrant nozzle retain their different measured working frames",
    key.kind === "button" &&
      nclose(key.frame.translation.y, 0.786, MM) &&
      nclose(
        archetypeExtent(atm, "z", ["shelf"]).high - key.frame.translation.z,
        0.089,
        MM,
      ) &&
      pumper.kind === "socket" &&
      vclose(
        pumper.frame.translation,
        { x: 0, y: 18 * 0.0254, z: 8.84 * 0.0254 },
        MM,
      ) &&
      hydrant.affordance("nut").kind === "knob",
  );
  TestValidator.predicate(
    "the boundary models expose their own upper rail and separate rope and posts",
    crowd.affordances.length === 1 &&
      crowd.affordance("rail").kind === "bar" &&
      stanchions.affordance("rope").kind === "bar" &&
      stanchions.affordance("leftPost").frame.translation.x >
        stanchions.affordance("rightPost").frame.translation.x,
  );

  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const approach: number = 0.3;
  for (const [model, admitsCrossing] of [
    [createCrosstie(), true],
    [createSandbag(), true],
    [createJerseyBarrier(), false],
    [crowd, false],
  ] as const) {
    const depth: number = archetypeExtent(model, "z").size;
    const far: number = approach + depth;
    let performance: HumanPerformance | undefined;
    let caught: unknown;
    try {
      performance = new HumanPerformance({
        seed: "named-crossing",
        performers: [
          {
            subject: "actor",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("obstacle", model, {
            at: { x: 0, y: 0, z: far },
            yaw: 180,
          }),
        ],
        composition: HumanChain.subject("actor").stepOver({
          obstacle: "obstacle",
        }).node,
      });
    } catch (error) {
      caught = error;
    }
    if (!admitsCrossing) {
      TestValidator.predicate(
        model.name + " is refused as a crossing",
        caught instanceof HumanRefusal && caught.axis === "obstacle",
      );
      continue;
    }
    if (performance === undefined) throw caught;
    const top: number = archetypeExtent(model, "y").high;
    let clearance: number = Infinity;
    for (let t: number = 0; t <= performance.duration; t += 1 / 60)
      for (const sole of HumanFoot.base(body, performance.bones("actor", t)))
        if (sole.z > approach && sole.z < far)
          clearance = Math.min(clearance, sole.y - top);
    const terminal: ReturnType<HumanPerformance["bones"]> = performance.bones(
      "actor",
      performance.duration,
    );
    TestValidator.predicate(
      model.name + " clears the real occupied volume with both feet",
      clearance !== Infinity &&
        clearance > 0 &&
        terminal.get("leftFoot")!.worldPosition.z > far &&
        terminal.get("rightFoot")!.worldPosition.z > far,
    );
  }
}

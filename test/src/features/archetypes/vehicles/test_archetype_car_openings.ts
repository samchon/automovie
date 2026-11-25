import { createCar } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A car. */
type Car = ReturnType<typeof createCar>;

/**
 * Every opening a car's class has articulates through its range in the sense its kind states, and a window's opening grows as its glass goes down.
 *
 * Scenarios, for each of the four classes at two seeds:
 * 1. Every hinge and slider the class has (the side doors, the windows, the seat backs, the bonnet, a boot lid or tailgate, a van's sliding door, a pickup's tailgate) is admitted at its full travel and at half of it, and the car then passes `validateModel`; the van lacks the rear doors, the rear seat and the boot, the pickup the boot, and the sedan and the hatchback the van's and the pickup's parts.
 * 2. At full travel each leaf moves the way the thing opens: a side door's free edge goes outward, the bonnet's front edge and a boot lid's rear edge or a hatchback's tailgate's foot rise, a pickup's tailgate's top drops and goes back, a seat back's top goes back, a van's sliding door goes back along the side, and a window's glass goes down by its travel.
 * 3. Each window's opening, riding its glass, has its threshold lowered by the glass's travel: its clear height, the window frame's top less the threshold, is 0 shut and its full `height` open, within 1e-9 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Articulates produced cars and reads their moved parts and frames and the engine's admission; a leaf that opens inward or down, a window that rises, an opening that does not follow its glass, a part left behind, or a class carrying another's parts is caught.
 * @evidence contracts/development/testing.md#independent-expectations The senses are the things': doors open outward, bonnets and boot lids lift, a pickup's tailgate drops, a reclining back tips back, a sliding door runs back; the clear height of a window is its frame's top less the glass's top edge, plane geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Four classes, each opening at rest, half and full travel, and the ids each class lacks; the steering and spin belong to `test_archetype_ride_car` and `test_archetype_car_wheel_spin`, the bands to `test_archetype_car_kinds_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_car_openings(): void {
  const findings: string[] = [];
  const has = (car: Car, id: string): boolean =>
    car.affordances.some((a: IAutoMovieAffordance): boolean => a.id === id);
  const centre = (car: Car, part: string): IAutoMovieVector3 =>
    car.parts.find((p: IAutoMovieModelPart): boolean => p.id === part)!.transform!.translation;
  const lacks: Readonly<Record<createCar.Kind, readonly createCar.Affordance[]>> = {
    sedan: ["slidingDoor", "cargo", "tailgate", "bed"],
    hatchback: ["slidingDoor", "cargo", "tailgate", "bed"],
    van: ["rearLeftDoor", "rearRightDoor", "rearSeat", "boot", "load", "tailgate", "bed"],
    pickup: ["boot", "load", "slidingDoor", "cargo"],
  };
  for (const kind of createCar.KINDS)
    for (const seed of [2, 9]) {
      const car: Car = createCar({ kind }, seed);
      const label: string = `${kind}@${seed}`;
      for (const id of lacks[kind])
        if (has(car, id)) findings.push(`${label} has ${id}`);

      // 1 and 2. Each opening at half and full travel, and the way its leaf goes.
      const openings: readonly (readonly [createCar.Affordance, string, (rest: IAutoMovieVector3, open: IAutoMovieVector3) => boolean])[] = [
        ["driverDoor", "door-driver", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => Math.abs(o.x) > Math.abs(r.x)],
        ["passengerDoor", "door-passenger", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => Math.abs(o.x) > Math.abs(r.x)],
        ["rearLeftDoor", "door-rear-left", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.x > r.x],
        ["rearRightDoor", "door-rear-right", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.x < r.x],
        ["driverWindow", "window-driver", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.y < r.y],
        ["rearLeftWindow", "window-rear-left", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.y < r.y],
        ["driverSeatBack", "backrest-driver", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.z < r.z],
        ["rearSeatBack", "backrest-rear", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.z < r.z],
        ["bonnet", "bonnet-lid", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.y > r.y],
        ["boot", "boot-lid", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.y > r.y],
        ["slidingDoor", "door-sliding", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.z < r.z],
        ["tailgate", "tailgate", (r: IAutoMovieVector3, o: IAutoMovieVector3): boolean => o.y < r.y && o.z < r.z],
      ];
      for (const [id, part, opens] of openings) {
        if (!has(car, id)) continue;
        const travel: number = car.affordance(id).travel!;
        for (const share of [0.5, 1]) {
          const posed: Car = car.articulate({ [id]: travel * share });
          if (!validateModel({ model: posed }).success)
            findings.push(`${label}: not admitted with ${id} at ${share} of its travel`);
          if (share === 1 && !opens(centre(car, part), centre(posed, part)))
            findings.push(`${label}: ${id} opens the wrong way`);
        }
      }

      // 3. The window openings follow their glass.
      for (const window of ["driverWindow", "passengerWindow", "rearLeftWindow", "rearRightWindow"] as const) {
        if (!has(car, window)) continue;
        const opening: createCar.Affordance = `${window}Opening`;
        const top: number = car.affordance(opening).frame.translation.y;
        const height: number = car.affordance(opening).height!;
        const travel: number = car.affordance(window).travel!;
        for (const share of [0, 0.5, 1]) {
          const threshold: number = car
            .articulate({ [window]: travel * share })
            .affordance(opening).frame.translation.y;
          if (Math.abs(top - threshold - height * share) > 1e-9)
            findings.push(`${label}: ${opening} is ${top - threshold} m clear at ${share} of its travel`);
        }
      }
    }
  TestValidator.equals("a car's openings open", findings, []);
}

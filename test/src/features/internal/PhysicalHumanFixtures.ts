import { AutoMovieHumanPhysicalProfile as Provider } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalProfile";
import { HumanPeople } from "./HumanPeople";

/** Build the actual person inside each calling case, without cross-test state. */
export namespace PhysicalHumanFixtures {
  /** Bare eighty-kilogram reference body and its exact public numerical evaluator. */
  export function get(
    name: string = "m1",
  ): ReturnType<typeof Provider.prepare> {
    return Provider.prepare(HumanPeople.params(name), {
      mass: 80,
      frequency: 20,
      dampingRatio: 1,
      torquePerKg: 50,
      passiveRate: 5,
      equipment: [],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      skin: "skin",
    });
  }
}

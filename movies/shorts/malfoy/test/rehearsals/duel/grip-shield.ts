import { AutoMovieComposition } from "@automovie/engine";

import { carinaMalfoy } from "../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../src/entities/cast/student/Student";
import { FallingMasonry } from "../../../src/entities/props/falling-masonry/FallingMasonry";
import { TrainingCourt } from "../../../src/entities/sets/training-court/TrainingCourt";
import { StageEffects } from "../../../src/consequences/effects/StageEffects";
import type { IFilm } from "../../../src/IFilm";
import { rehearsal } from "../internal/rehearsal";

/**
 * The duel's arm work: on guard, Carina sprints in with her wand low, Harry
 * grips her wand wrist, she turns under the joined hands and he lets go;
 * then she casts a jinx, he sweeps it aside, and she raises a shield. Views
 * alternate every second between the south (profile of the pair) and the
 * south-east (three-quarter).
 */
export function gripShield(): IFilm {
  const court = new TrainingCourt();
  const carina = new Student(carinaMalfoy);
  const harry = new Student(harryPotter);
  const cap = new FallingMasonry();
  return rehearsal({
    set: court,
    students: [carina, harry],
    props: [cap],
    duration: 10,
    effects: StageEffects.duel({ cap, seed: "0123456789abcdef" }),
    compose: (camera) =>
      AutoMovieComposition.parallel(
        carina
          .enter("centre.southWest", { facing: harry, holds: { right: "wand-carina" } })
          .onGuard(harry)
          .runAt(harry, { pace: "sprint", wand: "low", start: 0.5 })
          .turnUnder({ start: 2.1 })
          .onGuard(harry, { start: 3.6 })
          .retreat(harry, { steps: 2 })
          .jinx(harry, { aim: "wand-hand", contact: 6.0 })
          .shield(2, { start: 7.2 })
          .until(10),
        harry
          .enter("centre.northEast", { facing: carina, holds: { right: "wand-harry" } })
          .onGuard(carina)
          .grip(carina, { part: "wrist", contact: 2.05 })
          .letGo({ contact: 3.0 })
          .onGuard(carina, { start: 3.6 })
          .deflect("floor")
          .until(10),
        ...Array.from({ length: 10 }, (_, k) => camera.shot([carina, harry], { size: "full", from: k % 2 === 0 ? "south" : "southEast", start: k })),
      ),
  });
}

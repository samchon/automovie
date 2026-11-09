import { AutoMovieComposition } from "@automovie/engine";

import { carinaMalfoy } from "../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../src/entities/cast/student/Student";
import { SideCourtyard } from "../../../src/entities/sets/side-courtyard/SideCourtyard";
import type { IFilm } from "../../../src/IFilm";
import { rehearsal } from "../internal/rehearsal";

/**
 * Walking, sitting and rising, with a walk bent around a standing person:
 * Harry walks from the starting place to the bench and sits (turning to the
 * seat over his last step), rises, and walks east past Carina, who stands
 * in his straight line. Views alternate every second between the open south
 * (profile) and the east end (front).
 */
export function walkSit(): IFilm {
  const yard = new SideCourtyard();
  const carina = new Student(carinaMalfoy);
  const harry = new Student(harryPotter);
  return rehearsal({
    set: yard,
    students: [carina, harry],
    props: [],
    duration: 12,
    compose: (camera) =>
      AutoMovieComposition.parallel(
        harry.enter("startingPlace").walkTo("bench.centre").sit("bench.centre").hold(0.6).stand().walkTo({ x: 6.0, y: 0, z: 1.2 }).until(12),
        carina.enter({ x: 4.2, y: 0, z: 1.0 }, { heading: 0 }).until(12),
        ...Array.from({ length: 12 }, (_, k) => camera.shot([harry], { size: "full", from: k % 2 === 0 ? "openSouth" : "eastEnd", start: k })),
      ),
  });
}

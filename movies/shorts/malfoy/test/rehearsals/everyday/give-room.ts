import { AutoMovieComposition } from "@automovie/engine";

import { carinaMalfoy } from "../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../src/entities/cast/student/Student";
import { SideCourtyard } from "../../../src/entities/sets/side-courtyard/SideCourtyard";
import type { IFilm } from "../../../src/IFilm";
import { sameGap } from "../../../src/interactions/everyday/sameGap";
import { rehearsal } from "../internal/rehearsal";

/**
 * Give-room and the near miss: Harry gives Carina room from 0.7 m (palms
 * up in front of the chest as he steps back), walks back, then steps into
 * her path so she stops a hand's breadth from him and he gives room again.
 * Views alternate every second between the open south (profile) and the
 * south-west (his three-quarter front).
 */
export function giveRoom(): IFilm {
  const yard = new SideCourtyard();
  const carina = new Student(carinaMalfoy);
  const harry = new Student(harryPotter);
  const p = (x: number, z: number) => ({ x, y: 0, z });
  return rehearsal({
    set: yard,
    students: [carina, harry],
    props: [],
    duration: 12,
    compose: (camera) =>
      AutoMovieComposition.parallel(
        AutoMovieComposition.sequence(
          AutoMovieComposition.parallel(carina.enter(p(3.0, 2.2), { facing: p(5, 2.2) }).hold(0.5), harry.enter(p(3.7, 2.2), { facing: p(1, 2.2) }).hold(0.5)),
          AutoMovieComposition.parallel(harry.giveRoom(carina, { start: 1.0 }).walkTo(p(4.4, 2.6), { facing: p(1, 2.2) }), carina.hold(1.5).walkTo(p(5.6, 2.2), { facing: p(1, 2.2) })),
          sameGap(carina, harry, { start: 7.0 }),
          AutoMovieComposition.parallel(harry.giveRoom(carina).until(12), carina.until(12)),
        ),
        ...Array.from({ length: 12 }, (_, k) => camera.shot([carina, harry], { size: "full", from: k % 2 === 0 ? "openSouth" : "southWest", start: k })),
      ),
  });
}

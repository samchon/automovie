import { AutoMovieComposition } from "@automovie/engine";

import { carinaMalfoy } from "../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../src/entities/cast/student/Student";
import { InvitationNote } from "../../../src/entities/props/invitation-note/InvitationNote";
import { SideCourtyard } from "../../../src/entities/sets/side-courtyard/SideCourtyard";
import type { IFilm } from "../../../src/IFilm";
import { rehearsal } from "../internal/rehearsal";

/**
 * Handing over, dropping, bending and picking up: Harry offers the note,
 * Carina takes it with a tug and he lets go; she drops it; both bend toward
 * it to a lean, straighten, then he bends fully and picks it up from the
 * floor. Views alternate every second between the open south (profile) and
 * the south-east (three-quarter).
 */
export function handoverBend(): IFilm {
  const yard = new SideCourtyard();
  const carina = new Student(carinaMalfoy);
  const harry = new Student(harryPotter);
  const note = new InvitationNote();
  const p = (x: number, z: number) => ({ x, y: 0, z });
  return rehearsal({
    set: yard,
    students: [carina, harry],
    props: [note],
    duration: 14,
    compose: (camera) =>
      AutoMovieComposition.parallel(
        harry
          .enter(p(3.0, 2.2), { facing: p(5, 2.2), holds: { right: note.id } })
          .offer(note, carina, { start: 0.5 })
          .release(note, { contact: 1.6 })
          .bend(note, { depth: "lean", start: 4.0 })
          .straighten()
          .bend(note, { start: 7.0 })
          .pickUp(note)
          .straighten()
          .until(14),
        carina
          .enter(p(3.8, 2.2), { facing: p(1, 2.2) })
          .receive(note, harry, { pull: true, contact: 1.3 })
          .drop(note, { start: 2.8 })
          .bend(note, { depth: "lean", start: 4.0 })
          .straighten()
          .until(14),
        ...Array.from({ length: 14 }, (_, k) => camera.shot([harry, carina], { size: "full", from: k % 2 === 0 ? "openSouth" : "southEast", start: k })),
      ),
  });
}

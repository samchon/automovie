import { AutoMovieComposition } from "@automovie/engine";

import { carinaMalfoy } from "../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../src/entities/cast/student/Student";
import { Broom } from "../../../src/entities/props/broom/Broom";
import { QuidditchPitch } from "../../../src/entities/sets/quidditch-pitch/QuidditchPitch";
import type { IFilm } from "../../../src/IFilm";
import { rehearsal } from "../internal/rehearsal";

/**
 * Hanging and the transfer into tandem: Harry slips and hangs one-handed
 * below his broom, pushes up his glasses with the free hand, Carina comes in
 * wide and settles alongside on his free side, he closes his free hand on
 * her rear section, swings across to hang two-handed below it, brings his
 * chest over the shaft and his leg over into the rear seat; his old broom
 * flies on riderless. Views alternate every second between riding alongside
 * on the left and straight behind.
 */
export function hangTransfer(): IFilm {
  const pitch = new QuidditchPitch();
  const carina = new Student(carinaMalfoy);
  const harry = new Student(harryPotter);
  return rehearsal({
    set: pitch,
    students: [carina, harry],
    props: [new Broom("broom-harry", "gryffindor"), new Broom("broom-carina", "slytherin")],
    duration: 14,
    compose: (camera) =>
      AutoMovieComposition.parallel(
        harry
          .enter("eastSouthGap.south", { riding: "broom-harry", heading: Math.PI / 2 })
          .fly(["eastRunoff.chase"], { speed: 12 })
          .slip({ start: 1.0 })
          .pushGlasses({ hand: "left", start: 2.0 })
          .transfer(carina, { contact: 6.0 })
          .until(14),
        carina.enter("eastSouthGap.north", { riding: "broom-carina", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).offerRear(harry, { start: 2.8 }).until(14),
        ...Array.from({ length: 14 }, (_, k) =>
          camera.alongside([harry, carina], { start: k, view: k % 2 === 0 ? "side" : "behind", side: "left", distance: k % 2 === 0 ? 5 : 6, above: 1.0 }),
        ),
      ),
  });
}

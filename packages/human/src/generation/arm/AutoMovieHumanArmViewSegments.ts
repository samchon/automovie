import { AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmLandmarks } from "./AutoMovieHumanArmLandmarks";
import type { AutoMovieHumanArmSegmentFrames } from "./AutoMovieHumanArmSegmentFrames";
import type { AutoMovieHumanArmViewCurves } from "./AutoMovieHumanArmViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The arm's view-curve segments and site sections: each segment's own zero,
 * owned walk interval and view directions in its own frame (humerus, forearm,
 * hand), and the conic shoulder that closes a girth site's tape on its box
 * (`AutoMovieViewSection.solve`). Each segment's lateral is fixed in its own
 * frame, so its view curves do not move when a parent joint turns: the
 * humerus and hand take their own -medial Z; the forearm takes the humerus
 * -medial Z, which elbow flexion (about the humerus Z) leaves fixed in the
 * forearm frame.
 */
export namespace AutoMovieHumanArmViewSegments {
  /**
   * Each segment's own zero, owned interval and view directions in its own frame.
   *
   * @param frames The posed segment frames.
   * @param landmarks The landmarks built on them.
   */
  export function create(frames: AutoMovieHumanArmSegmentFrames.IOutput, landmarks: AutoMovieHumanArmLandmarks.IOutput): AutoMovieHumanArmViewCurves.ISegment[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const m: 1 | -1 = frames.medial;
    const c: AutoMovieHumanArmLandmarks.IOutput["course"] = landmarks.course;
    const toForearm: AutoMovieHumanArmCurveSpec.ITransform = S.inverse(frames.forearm.relative);
    const toHand: AutoMovieHumanArmCurveSpec.ITransform = S.compose(S.inverse(frames.hand.relative), toForearm);
    const elbow: Vec3 = frames.points.elbow;
    const wrist: Vec3 = frames.points.wrist;
    const directions: (distalH: Vec3, map: AutoMovieHumanArmCurveSpec.ITransform, lateralOwn: Vec3) => [Vec3, Vec3, Vec3] = (
      distalH: Vec3,
      map: AutoMovieHumanArmCurveSpec.ITransform,
      lateralOwn: Vec3,
    ): [Vec3, Vec3, Vec3] => {
      const d: Vec3 = S.unit(S.rotate(map, distalH));
      const l: Vec3 = S.unit(sub(lateralOwn, scale(d, S.dot(lateralOwn, d))));
      const a: Vec3 = scale(S.cross(d, l), m);
      return [d, l, a];
    };
    const own: Vec3 = [0, 0, -m];
    const [hd, hl, ha]: [Vec3, Vec3, Vec3] = directions([0, -1, 0], S.IDENTITY, own);
    const [fd, fl, fa]: [Vec3, Vec3, Vec3] = directions(S.unit(sub(wrist, elbow)), toForearm, S.rotate(toForearm, own));
    const [nd, nl, na]: [Vec3, Vec3, Vec3] = directions(S.unit(sub(landmarks.points.end, wrist)), toHand, own);
    return [
      { name: "humerus", frame: frames.humerus.name, walk: c.port, interval: [c.dome, c.elbow], origin: [0, 0, 0], distal: hd, lateral: hl, anterior: ha },
      { name: "forearm", frame: frames.forearm.name, walk: c.elbow, interval: [c.elbow, c.wrist], origin: S.apply(toForearm, elbow), distal: fd, lateral: fl, anterior: fa },
      { name: "hand", frame: frames.hand.name, walk: c.wrist, interval: [c.wrist, c.web], origin: S.apply(toHand, wrist), distal: nd, lateral: nl, anterior: na },
    ];
  }

  /**
   * Conic shoulder of a box (half extents lateral, medial, anterior, posterior) whose section closes the tape.
   *
   * @param name The site, for diagnostics.
   * @param box Half extents lateral, medial, anterior, posterior, mm.
   * @param girth The tape, mm.
   */
  export function shoulder(name: string, box: [number, number, number, number], girth: number): number {
    const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(`arm ${name}`, { extents: [box[0], box[3], box[1], box[2]] }, girth);
    if (solved.section === null || solved.diagnostics.length !== 0)
      throw new Error(`arm ${name}: no conic closes the tape ${girth} on the box [${box.join(", ")}]: ${solved.diagnostics.map((d: { detail: string }): string => d.detail).join("; ")}`);
    return solved.section.shoulders[0];
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

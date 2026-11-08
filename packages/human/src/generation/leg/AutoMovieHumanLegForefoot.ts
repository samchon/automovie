import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The forefoot's closure in plan on the leg's front pair: from the metatarsal
 * heads to the closing pole through the toes' web stations, along the
 * oblique metatarsal cascade, so every toe leaves the forefoot through its
 * distal surface rather than inside a transverse dome.
 *
 * Datums, each an offset from the foot course's centre along the section's
 * lateral direction, at the course's height:
 * - head V (lateral) and head I (medial): the foot breadth's skin ends over
 *   the heads' eminences, about the long axis through the second toe
 *   (`AutoMovieHumanFootToeRoots.edges`; ANSUR II foot breadth);
 * - each toe's web station, its head plus half its proximal phalanx (Gray
 *   1918: the web reaches the middle of the proximal phalanx): the outline on
 *   the toe's side of the course passes through the toe's axis there, so the
 *   toe's tube crosses the forefoot's surface around its web. Toes lateral of
 *   the course (III, IV, V) set the lateral outline, the hallux the medial
 *   one; toe II stands on the course and carries the closing pole.
 */
export namespace AutoMovieHumanLegForefoot {
  /** One forefoot datum of the front pair. */
  export interface IDatum {
    /** Site name (`head V`, `toe 5 web`, ...). */
    site: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** Unsigned offset from the course centre, mm. */
    value: number;

    /** `max` at a head's skin end (the foot breadth is the widest across the heads), else null. */
    sense: "max" | null;

    /** The datum's rule. */
    rule: string;
  }

  /** The front pair's forefoot datums, each proximal to distal. */
  export interface IOutput {
    /** Lateral outline datums. */
    lateral: IDatum[];

    /** Medial outline datums. */
    medial: IDatum[];
  }

  /** Read the forefoot datums from the neutral landmarks. */
  export function create(landmarks: AutoMovieHumanLegLandmarks.IOutput, medial: 1 | -1): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const pole: Vec3 = AutoMovieHumanLegLandmarks.get(landmarks, "web").point;
    const t: Vec3 = S.unit(pole);
    const l0: Vec3 = [0, 0, -medial];
    const lateralDirection: Vec3 = S.unit(sub(l0, scale(t, S.dot(l0, t))));
    // A plan point (x, z) carried to the course's height over x: its walk and its lateral offset from the course centre.
    const offset: (x: number, z: number) => { walk: number; value: number } = (x: number, z: number): { walk: number; value: number } => {
      const p: Vec3 = [x, (t[1] / t[0]) * x, z];
      const along: number = S.dot(p, t);
      return { walk: landmarks.course.im + along, value: S.dot(sub(p, scale(t, along)), lateralDirection) };
    };
    const first: Vec3 = AutoMovieHumanLegLandmarks.get(landmarks, "metatarsal head I").point;
    const fifth: Vec3 = AutoMovieHumanLegLandmarks.get(landmarks, "metatarsal head V").point;
    const headV: { walk: number; value: number } = offset(fifth[0], fifth[2]);
    const headI: { walk: number; value: number } = offset(first[0], first[2]);
    // The foot breadth is the widest breadth across the heads (ANSUR II, ISO 8559-1 5.5.6): each head's skin end is its outline's maximum.
    const lateral: IDatum[] = [{ site: "head V", walk: headV.walk, value: headV.value, sense: "max", rule: "value, max (head V's lateral skin end of the foot breadth)" }];
    const medialList: IDatum[] = [{ site: "head I", walk: headI.walk, value: -headI.value, sense: "max", rule: "value, max (head I's medial skin end of the foot breadth)" }];
    landmarks.roots.forEach((root: { exit: number; z: number }, k: number): void => {
      const web: { walk: number; value: number } = offset(root.exit, root.z);
      const rule: string = "value (the toe's axis at its web station, head + half the proximal phalanx, Gray 1918)";
      if (web.value > 1e-9) lateral.push({ site: `toe ${k + 1} web`, walk: web.walk, value: web.value, sense: null, rule });
      else if (web.value < -1e-9) medialList.push({ site: `toe ${k + 1} web`, walk: web.walk, value: -web.value, sense: null, rule });
    });
    const byWalk: (a: IDatum, b: IDatum) => number = (a: IDatum, b: IDatum): number => a.walk - b.walk;
    return { lateral: lateral.sort(byWalk), medial: medialList.sort(byWalk) };
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

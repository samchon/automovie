import type { IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadFaceRelief } from "./AutoMovieHumanHeadFaceRelief";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadJawRelief } from "./AutoMovieHumanHeadJawRelief";
import { AutoMovieHumanHeadMassAids } from "./AutoMovieHumanHeadMassAids";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import { AutoMovieHumanHeadMassTapes } from "./AutoMovieHumanHeadMassTapes";
import { AutoMovieHumanHeadMidfaceRelief } from "./AutoMovieHumanHeadMidfaceRelief";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import { AutoMovieHumanHeadProfile } from "./AutoMovieHumanHeadProfile";
import type { AutoMovieHumanHeadThroat } from "./AutoMovieHumanHeadThroat";

type Knot = AutoMovieHumanHeadMassCurves.IKnot;

/**
 * head.mass's complete original view curves: the datum-fixed outlines
 * (`AutoMovieHumanHeadMassCurves`), the euryon station and the fullness laws
 * solved from their tapes (`AutoMovieHumanHeadMassTapes`), and the
 * construction aids (`AutoMovieHumanHeadMassAids`), all on the head/neck
 * course (`AutoMovieHumanHeadNeckCourse`).
 */
export namespace AutoMovieHumanHeadMass {
  /** The view curves. */
  export interface IOutput {
    /** Vertex station, the pole, mm. */
    length: number;

    /** Port station, the open end, mm. */
    start: number;

    /** Named stations of the datums, the solved euryon included, mm. */
    stations: Record<string, number>;

    /** Outlines by label. */
    outlines: Record<AutoMovieHumanHeadMassCurves.Label, Knot[]>;

    /** Conic shoulder of the anterior quarters (0 and 3) and the posterior quarters (1 and 2), knots in station. */
    fullness: { anterior: Knot[]; posterior: Knot[] };

    /** The closed tapes. */
    tapes: AutoMovieHumanHeadMassCurves.ITape[];

    /** Checks read on the analytic family. */
    checks: { name: string; station: number; value: number; detail: string }[];

    /** Solver notes; empty when every tape closed. */
    diagnostics: string[];

    /** The nose-lip-chin midline profile's points and the features' sampled midlines, head frame. */
    profile: { points: Record<AutoMovieHumanHeadProfile.Name, AutoMovieHumanArmCurveSpec.Vec3>; midline: AutoMovieHumanArmCurveSpec.Vec3[] };

    /** Reliefs over the mass (the jaw, the orbits and malar eminences, the nose, the lips, the chin), stations in the head frame. */
    reliefs: IAutoMovieLoftRelief[];

    /** Construction aids, head frame. */
    aids: AutoMovieHumanArmCurveSpec.IAid[];

    /** Stage times, ms: datums, tapes, profile and face reliefs, jaw and midface reliefs, aids. */
    ms: Record<string, number>;
  }

  /** Build every original curve of head.mass on the course, its front from the head's throat contour (head frame), the neck's half breadth under the jaw from the public neck girth. */
  export function create(head: AutoMovieHumanHeadFrankfort.IOutput, course: AutoMovieHumanHeadNeckCourse.IOutput, throat: AutoMovieHumanHeadThroat.IOutput, neckGirth: number): IOutput {
    const t0: number = performance.now();
    const datums: AutoMovieHumanHeadMassCurves.IDatums = AutoMovieHumanHeadMassCurves.create(head, course, throat, neckGirth);
    const t1: number = performance.now();
    const tapes: AutoMovieHumanHeadMassTapes.IOutput = AutoMovieHumanHeadMassTapes.solve({ head, course, anterior: datums.anterior, posterior: datums.posterior, lateral: datums.lateral, stations: datums.stations });
    const t2: number = performance.now();
    const outlines: Record<AutoMovieHumanHeadMassCurves.Label, Knot[]> = { anterior: datums.anterior, posterior: datums.posterior, lateral: tapes.lateral };
    const profile: AutoMovieHumanHeadProfile.IOutput = AutoMovieHumanHeadProfile.create(head);
    const face: AutoMovieHumanHeadFaceRelief.IOutput = AutoMovieHumanHeadFaceRelief.create({ head, course, length: datums.length, outlines, fullness: tapes.fullness, profile });
    const t3: number = performance.now();
    const jaw: IAutoMovieLoftRelief[] = AutoMovieHumanHeadJawRelief.create({ head, course, length: datums.length, outlines, fullness: tapes.fullness, neckGirth });
    const midface: IAutoMovieLoftRelief[] = AutoMovieHumanHeadMidfaceRelief.create({ head, course, length: datums.length, outlines, fullness: tapes.fullness });
    const t4: number = performance.now();
    const aids: AutoMovieHumanArmCurveSpec.IAid[] = AutoMovieHumanHeadMassAids.create(head, course, throat, outlines, datums.gonion, tapes.euryon);
    const t5: number = performance.now();
    return {
      length: datums.length,
      start: course.start,
      stations: { ...datums.stations, eu: tapes.euryon },
      outlines,
      fullness: tapes.fullness,
      tapes: tapes.tapes,
      checks: tapes.checks,
      diagnostics: [...datums.notes, ...tapes.diagnostics],
      profile: { points: profile.points, midline: face.midline },
      reliefs: [...jaw, ...midface, ...face.reliefs],
      aids,
      ms: { datums: t1 - t0, tapes: t2 - t1, face: t3 - t2, jaw: t4 - t3, aids: t5 - t4 },
    };
  }
}

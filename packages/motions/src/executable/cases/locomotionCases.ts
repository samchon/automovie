import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieVector3,
} from "@automovie/interface";

import { run } from "../../actions/run";
import { walk } from "../../actions/walk";
import { createHumanBody } from "../../body/createHumanBody";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { locomotionCase } from "./locomotionCase";

/** The record of `ILocomotionCasesAllItem`'s site. */
type ILocomotionCasesAllItem = {
  gait: locomotionCase.IGait;
  froude: number;
  label: string;
  to: IAutoMovieVector3;
  extra: Omit<IAutoMovieMotionHumanWalkParams, AllExtraItem>;
};

/** The alternatives of `AllExtraItem`'s site. */
type AllExtraItem = "to" | "pace";

/** The record of `ILocomotionCasesPrepared`'s site. */
type ILocomotionCasesPrepared = {
  men: humanPolygonMan.IPolygonMan[];
  bodies: IAutoMovieMotionHumanBody[];
};

/** The alternatives of `LocomotionCasesKind`'s site. */
type LocomotionCasesKind = "walk" | "run";

/**
 * Capture cases of the walk law on the polygon man (E0): every body of
 * `MotionBodies.SWEEP` walks 4 m ahead alone, one case per body and pace
 * (`walk-<pace>-<body>`), the same bodies running 10 m at a jog, a run and a
 * sprint (`run-<pace>-<body>`, judged by the same verdicts against the gait's
 * Froude speed), and the average body walking a bent path through a via point,
 * turning to face +X at the end with a shorter stride, a wider arm swing and
 * the elbows out (`walk-path-m-average`), whose verdicts add passing within 15
 * cm of the via point and the final heading within 3°; its steady speed is not
 * judged, the path being bent.
 *
 * Instants are every 0.2 s, every heel strike and toe-off, and the end. The
 * overlays are each ankle's trail and a drift marker for every 24 Hz sample of
 * the planted point in stance, coloured against the 5 mm slip limit; each
 * walker's destination is marked. The verdicts are the ones a walk must keep:
 * the planted point, the lowest of heel, ball and toe pad (the heel in the heel
 * rocker, the toe pad in the forefoot rocker), while it touches the floor
 * (within 1 cm) in stance, slides under 5 mm across it from where it first was
 * the planted point of that stance ({@link FootSlip}), the foot-skate measure of
 * Kovar, Schreiner and Gleicher (2002), since the ankle itself moves as the
 * foot rolls over its rockers; no heel, ball or toe sinks more than 5 mm under
 * the floor; every displayed ankle meets its IK goal within 2 mm and every
 * swinging foot its goal rotation within 1 degree, so a range-of-motion clamp
 * shows, and every stance foot too, except that a goal naming a contact
 * declares the heel-off of `HumanFoot.heelOff`, so such a foot may be more
 * toes-down than asked while its heading, roll and any toes-up miss still
 * count; the walker stops within 2 cm of the destination; and the steady speed,
 * the pelvis between the first and the second-to-last left heel strikes, lies
 * within 10 % of the pace's Froude speed `sqrt(Fr g l)`; and every displayed
 * channel, the root translation and every clinical angle, is continuous at
 * every heel strike and toe-off, within 0.5 degree and the root within 0.5 mm
 * from 1 microsecond before the event to 1 after. Each failing verdict names
 * the walker, foot, point and second of its worst sample.
 *
 * @param kind Walking or running cases.
 * @param only Keeps the cases whose name it accepts, the others not being
 *   built; every case when absent.
 * @returns The cases, each built as it is read.
 */
export function* locomotionCases(
  kind: LocomotionCasesKind,
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  for (const who of MotionBodies.SWEEP) {
    const names = [who] as const;
    // The bodies are prepared on the first case the filter keeps.
    let prepared: ILocomotionCasesPrepared | undefined;
    const prepare = (): NonNullable<typeof prepared> => {
      if (prepared === undefined) {
        const men: humanPolygonMan.IPolygonMan[] = names.map((name) =>
          MotionBodies.population(name),
        );
        prepared = {
          men,
          bodies: men.map((man) =>
            createHumanBody(man.body.skeleton, man.body.profile),
          ),
        };
      }
      return prepared;
    };
    const all: ILocomotionCasesAllItem[] = [
      ...(["slow", "normal", "fast"] as const).map((pace) => ({
        gait: { law: "walk", pace } satisfies locomotionCase.IGait,
        froude: walk.FROUDE[pace],
        label: pace,
        to: { x: 0, y: 0, z: 4 },
        extra: {},
      })),
      ...(["jog", "run", "sprint"] as const).map((pace) => ({
        gait: { law: "run", pace } satisfies locomotionCase.IGait,
        froude: run.GAITS[pace].froude,
        label: pace,
        to: { x: 0, y: 0, z: 10 },
        extra: {},
      })),
      ...(who === "m-average"
        ? [
            {
              gait: {
                law: "walk",
                pace: "normal",
              } satisfies locomotionCase.IGait,
              froude: walk.FROUDE.normal,
              label: "path",
              to: { x: 1.5, y: 0, z: 4 },
              extra: {
                via: [{ x: 1.5, y: 0, z: 1.5 }],
                face: 90,
                stride: 0.9,
                armSwing: 1.5,
                elbows: 10,
              },
            },
          ]
        : []),
    ];
    for (const { gait, froude: fr, label, to, extra } of all) {
      if (gait.law !== kind) continue;
      if (only !== undefined && !only(`${gait.law}-${label}-${who}`)) continue;
      const { men, bodies } = prepare();
      yield locomotionCase({
        who,
        names,
        gait,
        froude: fr,
        label,
        to,
        extra,
        men,
        bodies,
      });
    }
  }
}

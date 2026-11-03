import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import type { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadEarChains } from "./AutoMovieHumanHeadEarChains";
import { AutoMovieHumanHeadEarRoots } from "./AutoMovieHumanHeadEarRoots";
import { AutoMovieHumanHeadEyeMargin } from "./AutoMovieHumanHeadEyeMargin";
import { AutoMovieHumanHeadLandmarkPublication } from "./AutoMovieHumanHeadLandmarkPublication";
import { AutoMovieHumanHeadLandmarks } from "./AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadLipBoundary } from "./AutoMovieHumanHeadLipBoundary";
import { AutoMovieHumanHeadMouthPlacement } from "./AutoMovieHumanHeadMouthPlacement";
import { AutoMovieHumanHeadNostril } from "./AutoMovieHumanHeadNostril";
import { AutoMovieHumanHeadPass } from "./AutoMovieHumanHeadPass";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import { AutoMovieHumanHeadSkin } from "./AutoMovieHumanHeadSkin";
import { AutoMovieHumanHeadSolve } from "./AutoMovieHumanHeadSolve";
import { AutoMovieHumanHeadStationDensity } from "./AutoMovieHumanHeadStationDensity";
import { AutoMovieHumanHeadStationSolve } from "./AutoMovieHumanHeadStationSolve";
import { AutoMovieHumanHeadStations } from "./AutoMovieHumanHeadStations";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadBuilt } from "./IAutoMovieHumanHeadBuilt";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadCorrections } from "./IAutoMovieHumanHeadCorrections";
import type { IAutoMovieHumanHeadGenerated } from "./IAutoMovieHumanHeadGenerated";
import type { IAutoMovieHumanHeadSetup } from "./IAutoMovieHumanHeadSetup";
import type { IAutoMovieHumanHeadSides } from "./IAutoMovieHumanHeadSides";

/**
 * The whole head from its pieces: solves the inputs' measures on the skin,
 * cuts the three head chains and the ears' chains, places the eyes, openings
 * and mouth, and publishes the landmarks other parts attach to.
 */
export namespace AutoMovieHumanHeadGenerate {
  /** The whole head. */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: AutoMovieHumanHeadConstruction.IInputs,
  ): IAutoMovieHumanHeadGenerated {
    const neckChain: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    )!;
    const setup: IAutoMovieHumanHeadSetup = AutoMovieHumanHeadPass.prepare(neckChain, inputs);
    const compiled: IAutoMovieHumanHeadCompiled = setup.compiled;
    const prior: AutoMovieHumanHeadPrior.IPrior = compiled.prior;
    const level: number = setup.neck.level;
    const scale: number = setup.scale;

    // Each pass builds the head from the landmarks, reads on its skin the
    // measures the inputs name, and moves the key each measure owns.
    let fix: IAutoMovieHumanHeadCorrections = { ...AutoMovieHumanHeadLandmarks.NONE };
    let built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(setup, fix);
    for (let pass: number = 1; pass < AutoMovieHumanHeadSolve.PASSES; pass++) {
      fix = AutoMovieHumanHeadSolve.solved(built.surface, inputs, fix);
      built = AutoMovieHumanHeadPass.build(setup, fix);
    }
    const { plan, surface, left, right, seat } = built;

    // One ring ends each chain, so the two ears share their joins, each one
    // inside both ears.
    const lower: number = Math.max(left.lower, right.lower);
    const upper: number = Math.min(left.upper, right.upper);
    const leftEar: AutoMovieHumanEarConstruction.IEar = { ...left, lower, upper };
    const rightEar: AutoMovieHumanEarConstruction.IEar = {
      ...right,
      lower,
      upper,
    };

    // Each chain's stations follow the surface's own curvature along the
    // height (`AutoMovieHumanHeadStationDensity`): the nose's base, which
    // crosses the lower and middle chains' join, the lips, the chin and the
    // crown crowd their own layers, and every chain keeps its quads isotropic
    // to its ring sampling.
    const lowerStations: number[] = AutoMovieHumanHeadStationDensity.stations(surface, level, lower, AutoMovieHumanHeadStations.SAMPLES_LOWER);
    const middleStations: number[] = AutoMovieHumanHeadStationDensity.stations(surface, lower, upper, AutoMovieHumanHeadStations.SAMPLES_MIDDLE);
    const upperStations: number[] = AutoMovieHumanHeadStationDensity.stations(
      surface,
      upper,
      plan.vertex - AutoMovieHumanHeadStations.CROWN * scale,
      AutoMovieHumanHeadStations.SAMPLES_UPPER,
    );
    const weight: (p: Vec3) => number = AutoMovieHumanHeadStations.gathered(plan);
    const plain = (
      name: string,
      samples: number,
      stations: readonly number[],
    ): IAutoMovieHumanLoftChain =>
      AutoMovieHumanHorizontalChain.build(
        { name, order: AutoMovieHumanHeadStations.ORDER, samples, rule: "sagittal" },
        stations.map((s: number): Vec3[] => {
          const c: IAutoMovieHumanHeadSides = AutoMovieHumanHeadSkin.sides(surface, s);
          return AutoMovieHumanHeadStations.sagittal(c.left, c.right, AutoMovieHumanHeadStations.ORDER, weight);
        }),
      );
    const eared = (s: number): Vec3[] => {
      const c: IAutoMovieHumanHeadSides = AutoMovieHumanHeadSkin.sides(surface, s);
      const a: Vec3[] = AutoMovieHumanHeadEarRoots.spliced(leftEar, c.left, 1, s, weight);
      const b: Vec3[] = AutoMovieHumanHeadEarRoots.spliced(rightEar, c.right, -1, s, weight);
      return [...a.slice(0, AutoMovieHumanHeadEarRoots.ORDER_MIDDLE / 2), ...b.slice(1).reverse()];
    };
    const half: number = AutoMovieHumanHeadEarRoots.ORDER_MIDDLE / 2;
    const frontPhase: number = (Math.PI * AutoMovieHumanHeadEarRoots.SPLICE[0]!) / half;
    const backPhase: number =
      (Math.PI * (AutoMovieHumanHeadEarRoots.SPLICE[0]! + AutoMovieHumanHeadEarRoots.SPLICE[1]! + AutoMovieHumanHeadEarRoots.SPLICE[2]!)) / half;
    const middleRings: Vec3[][] = middleStations.map(eared);
    const middle: IAutoMovieHumanLoftChain = AutoMovieHumanHorizontalChain.build(
      {
        name: "head.middle",
        order: AutoMovieHumanHeadEarRoots.ORDER_MIDDLE,
        samples: AutoMovieHumanHeadStations.SAMPLES_MIDDLE,
        rule: "sagittal",
      },
      middleRings,
    );
    const earLeft = AutoMovieHumanHeadEarChains.earChains(surface, leftEar, "left", 1);
    const earRight = AutoMovieHumanHeadEarChains.earChains(surface, rightEar, "right", -1);
    const two: number = 2 * Math.PI;
    const splits = (
      head: string,
      left: string,
      right: string,
    ): IAutoMovieHumanBodyCalibration.ISplit[] => [
      {
        child: head,
        arcs: [
          [backPhase, two - backPhase],
          [two - frontPhase, frontPhase],
        ],
      },
      { child: left, arcs: [[frontPhase, backPhase]] },
      { child: right, arcs: [[two - backPhase, two - frontPhase]] },
    ];
    const eye = (
      side: "left" | "right",
      sign: 1 | -1,
    ): IAutoMovieHumanBodyCalibration.IEye => ({
      side,
      centre: [
        seat - prior.face.marginForward * scale,
        plan.eye + prior.face.globeRise * scale,
        sign * plan[side].place,
      ],
      radius: prior.face.radius * scale,
    });
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = [
      eye("left", 1),
      eye("right", -1),
    ];
    const mouth: AutoMovieHumanMouth.IOutput = AutoMovieHumanHeadMouthPlacement.mouthOf(surface);
    const margins: IAutoMovieHumanLoftAperture[] = [
      AutoMovieHumanHeadEyeMargin.margin(plan, prior.face, eyes[0]!, plan.left, 1),
      AutoMovieHumanHeadEyeMargin.margin(plan, prior.face, eyes[1]!, plan.right, -1),
    ];
    return {
      landmarks: AutoMovieHumanHeadLandmarkPublication.landmarksOf(surface, margins, leftEar, rightEar),
      stature: scale * inputs.height,
      chains: [
        AutoMovieHumanHeadStationSolve.continuous(plain("head.lower", AutoMovieHumanHeadStations.SAMPLES_LOWER, lowerStations), neckChain),
        AutoMovieHumanHeadStationSolve.continuous(middle, null),
        AutoMovieHumanHeadStationSolve.continuous(plain("head.upper", AutoMovieHumanHeadStations.SAMPLES_UPPER, upperStations), null),
        ...earLeft.chains,
        ...earRight.chains,
      ],
      events: [
        {
          parent: "head.middle",
          direction: "down",
          splits: splits("head.lower", "ear.lobe.left", "ear.lobe.right"),
        },
        {
          parent: "head.middle",
          direction: "up",
          splits: splits("head.upper", "ear.helix.left", "ear.helix.right"),
        },
        ...earLeft.events,
        ...earRight.events,
      ],
      poles: [
        {
          chain: "head.upper",
          end: "top",
          critical: true,
          point: [AutoMovieHumanHeadSection.section(compiled, plan, plan.vertex).axis, plan.vertex, 0],
        },
        ...earLeft.poles,
        ...earRight.poles,
      ],
      apertures: [
        AutoMovieHumanHeadNostril.nostril(surface, 1),
        AutoMovieHumanHeadNostril.nostril(surface, -1),
        ...margins,
        mouth.aperture,
      ],
      eyes,
      lips: AutoMovieHumanHeadLipBoundary.lipSpans(surface),
      mouth: mouth.mouth,
    };
  }
}

/** A point. */
type Vec3 = [number, number, number];


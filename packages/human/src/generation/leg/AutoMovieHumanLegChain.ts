import { AutoMovieHumanLoftContract } from "../../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSeamStation } from "../../lofting/AutoMovieHumanSeamStation";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanLegConstruction } from "../AutoMovieHumanLegConstruction";
import type { AutoMovieHumanSkeletonLaw } from "../AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLimbRootStrip } from "../AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegCentreLine } from "./AutoMovieHumanLegCentreLine";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegMassPrior } from "./AutoMovieHumanLegMassPrior";
import { AutoMovieHumanLegReflection } from "./AutoMovieHumanLegReflection";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegSection } from "./AutoMovieHumanLegSection";
import { AutoMovieHumanLegSectionLaw } from "./AutoMovieHumanLegSectionLaw";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { lerp, norm, sub } = AutoMovieHumanLegVector;

/**
 * One leg's chain `leg.<side>`: the layers between the ankle ring and the
 * crotch ring, each the section of {@link AutoMovieHumanLegSection} at its
 * station with its station derivative, in the left leg's canonical frame and
 * the side's reflection.
 *
 * Central differences inside, one-sided of second order at the ends: nothing
 * exists past the rings. The skin depths at the joints (the distance from each
 * joint to the skin nearest it) size the joints' bends, over which the frames
 * turn and the rows are spaced.
 */
export namespace AutoMovieHumanLegChain {
  /** The hip, knee and ankle of a side, read in the canonical frame. */
  export function joints(
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
    side: "left" | "right",
    sign: 1 | -1,
  ): AutoMovieHumanLegAxis.IJoints {
    const at: (name: string) => Vec3 = (name: string): Vec3 => {
      const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === `${side}${name}`);
      if (bone === undefined) throw new Error(`The skeleton lacks the ${side} ${name}`);
      return [bone.position[0], bone.position[1], sign * bone.position[2]];
    };
    return { hip: at("UpperLeg"), knee: at("LowerLeg"), ankle: at("Foot") };
  }

  /**
   * One leg's chain.
   *
   * @param calibration Calibration holding `trunk` and the feet.
   * @param side The leg's side.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the leg is lofted on.
   * @param diagnostics The list a broken contract is recorded in; the chain is still made, its broken rows replaced by their valid neighbours and a broken relief left out.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    inputs: AutoMovieHumanLegConstruction.IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [],
  ): IAutoMovieHumanLoftChain {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const bones: AutoMovieHumanLegAxis.IJoints = joints(skeleton, side, sign);
    const heights: AutoMovieHumanLegStations.IBones = { hip: bones.hip[1], knee: bones.knee[1], ankle: bones.ankle[1] };
    const law: AutoMovieHumanLegSectionLaw.ILaw = AutoMovieHumanLegSectionLaw.of(calibration, side, sign, inputs, heights, diagnostics);
    const root: AutoMovieHumanLegCrotchRoot.IRoot = law.root;
    const s0: number = law.bottom;
    const s1: number = law.top;

    // Skin depths at the joints: the distance from each joint to the skin
    // nearest it there. The centre line crosses the knee on its joint, so the
    // tube's chart origin there is the knee centre.
    const kneeDepth: number = Math.min(...AutoMovieHumanLegSectionLaw.radii(law.tube(bones.knee[1])));
    const ankleDepth: number = Math.min(...law.ankleWorld.map((p: Vec3): number => norm(sub(p, bones.ankle))));
    const hipDepth: number = Math.min(
      ...root.arc.map((p: Vec3): number => norm(sub(p, bones.hip))),
      ...[0, 0.25, 0.5, 0.75, 1].map((f: number): number => norm(sub(lerp(root.arc[root.arc.length - 1]!, root.arc[0]!, f), bones.hip))),
    );
    const BEND: number = AutoMovieHumanLegStations.BEND;
    const frames: AutoMovieHumanLegAxis.IFrames = AutoMovieHumanLegAxis.of(bones, s0, s1, BEND * kneeDepth, law.ankleReach, law.crotchReach);

    // The sections' centres ahead of the bone by the limb's mass prior, at
    // its rows where the law's own sections stand (between the two rings'
    // reaches): the tube's reach ahead of and behind its centre at phases 0
    // and pi places the bone at the prior's front share of the depth.
    const half: number = AutoMovieHumanLegSampling.ORDER / 2;
    const rows: (prior: readonly AutoMovieHumanLegMassPrior.IRow[], top: number, bottom: number) => { at: number; offset: number }[] = (
      prior: readonly AutoMovieHumanLegMassPrior.IRow[],
      top: number,
      bottom: number,
    ): { at: number; offset: number }[] =>
      prior
        .map((r: AutoMovieHumanLegMassPrior.IRow): { at: number; front: number } => ({ at: top - r.share * (top - bottom), front: r.front }))
        .filter((r: { at: number; front: number }): boolean => r.at > s0 + law.ankleReach && r.at < s1 - law.crotchReach)
        .map((r: { at: number; front: number }): { at: number; offset: number } => {
          const radii: number[] = AutoMovieHumanLegSectionLaw.radii(law.tube(r.at));
          return { at: r.at, offset: AutoMovieHumanLegMassPrior.offset(r.front, radii[0]!, radii[half]!) };
        });
    const centre: (s: number) => [number, number] = AutoMovieHumanLegCentreLine.of({
      frames,
      ankle: { at: s0, point: law.ankleCentre },
      crotch: { at: s1, point: law.crotchCentre },
      knee: bones.knee[1],
      mass: [...rows(AutoMovieHumanLegMassPrior.THIGH, bones.hip[1], bones.knee[1]), ...rows(AutoMovieHumanLegMassPrior.SHANK, bones.knee[1], bones.ankle[1])],
    });
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk")!;
    const placed: number[] = AutoMovieHumanLegStations.layers({
      bottom: s0,
      top: s1,
      bends: [
        { at: bones.ankle[1], half: BEND * ankleDepth, range: AutoMovieHumanLegStations.range("ankle.dorsiflexion") },
        { at: bones.knee[1], half: BEND * kneeDepth, range: AutoMovieHumanLegStations.range("knee.flexion") },
        { at: bones.hip[1], half: BEND * hipDepth, range: AutoMovieHumanLegStations.range("hip.flexion") },
      ],
      first: trunk.layers[1]!.y - trunk.layers[0]!.y,
      coarsest: AutoMovieHumanLegStations.COARSEST * inputs.scale,
    });

    // The leg's rows meet the layer contract every chain hands its
    // neighbours: finite and rising by at least the least layer gap, so a
    // spline over them never divides by a vanishing gap. A row that breaks it
    // is left out and recorded; its neighbours carry the leg there.
    const stations: number[] = kept(`leg.${side}`, placed, diagnostics);

    // The root strip from the trunk's crotch ring, with the trunk's jet, to the
    // law's own section at the crotch reach, with the law's own jet there.
    const reach: number = law.crotchReach;
    const own: Map<number, Vec3[]> = new Map<number, Vec3[]>();
    const ownAt: (run: number) => Vec3[] = (run: number): Vec3[] => {
      let found: Vec3[] | undefined = own.get(run);
      if (found === undefined) {
        const s: number = law.top - run;
        own.set(run, (found = AutoMovieHumanLegSectionLaw.points(law, s, AutoMovieHumanLegAxis.frameAt(frames, s), centre(s))));
      }
      return found;
    };
    const strip: AutoMovieHumanLimbRootStrip.IStrip = AutoMovieHumanLimbRootStrip.strip({
      start: AutoMovieHumanLegCrotchRoot.start(root),
      end: ownAt(reach).map(
        (_: Vec3, m: number): AutoMovieHumanLimbRootStrip.IJet => AutoMovieHumanLimbRootStrip.jet((run: number): Vec3 => ownAt(run)[m]!, reach, CURVE_STEP),
      ),
    });
    const section: (s: number) => AutoMovieHumanLegSection.ISection = (s: number): AutoMovieHumanLegSection.ISection => AutoMovieHumanLegSection.of(law, frames, centre, strip, s);
    const last: number = stations.length - 1;
    const built: (IAutoMovieHumanLoftChain.ILayer | null)[] = stations.map((s: number, k: number): IAutoMovieHumanLoftChain.ILayer | null => {
      const here: AutoMovieHumanLegSection.ISection = section(s);

      // The station derivative of every point.
      const rate: Vec3[] =
        k === 0 || k === last
          ? ((): Vec3[] => {
              const d: number = k === 0 ? STEP : -STEP;
              const a: AutoMovieHumanLegSection.ISection = section(s + d);
              const b: AutoMovieHumanLegSection.ISection = section(s + 2 * d);
              return here.local.map(
                (p: Vec3, m: number): Vec3 =>
                  [0, 1, 2].map((c: number): number => (-3 * p[c]! + 4 * a.local[m]![c]! - b.local[m]![c]!) / (2 * d)) as Vec3,
              );
            })()
          : ((): Vec3[] => {
              const a: AutoMovieHumanLegSection.ISection = section(s - STEP);
              const b: AutoMovieHumanLegSection.ISection = section(s + STEP);
              return here.local.map(
                (_: Vec3, m: number): Vec3 => [0, 1, 2].map((c: number): number => (b.local[m]![c]! - a.local[m]![c]!) / (2 * STEP)) as Vec3,
              );
            })();
      const values: { coefficients: number[]; lift: number[] } = AutoMovieHumanLegReflection.sided(here.local, sign);
      const slopes: { coefficients: number[]; lift: number[] } = AutoMovieHumanLegReflection.sided(rate, sign);

      // Every value and slope of the layer is finite, so a defect in a piece
      // is named at this layer and not where the skin is charted; a broken
      // layer is recorded and takes its nearest valid neighbour's row.
      const where: string = `leg.${side} layer ${k} at ${s.toFixed(2)} mm`;
      try {
        AutoMovieHumanLoftContract.jet(`${where} coefficients`, values.coefficients, AutoMovieHumanLoftContract.FINITE);
        AutoMovieHumanLoftContract.jet(`${where} lift`, values.lift, AutoMovieHumanLoftContract.FINITE);
        AutoMovieHumanLoftContract.jet(`${where} slopes`, slopes.coefficients, AutoMovieHumanLoftContract.FINITE);
        AutoMovieHumanLoftContract.jet(`${where} lift slopes`, slopes.lift, AutoMovieHumanLoftContract.FINITE);
      } catch (error) {
        diagnostics.push({ producer: `leg.${side}`, level: 2, contract: "a leg layer's values and slopes are finite", detail: error instanceof Error ? error.message : String(error) });
        return null;
      }
      return {
        y: s,
        frame: AutoMovieHumanLegReflection.placed(here.frame, sign),
        frameSlopes: AutoMovieHumanLegReflection.placed(AutoMovieHumanLegAxis.frameRate(frames, s, k === 0 ? 1 : k === last ? -1 : 0), sign),
        coefficients: values.coefficients,
        slopes: slopes.coefficients,
        lift: values.lift,
        liftSlopes: slopes.lift,
      };
    });
    const layers: IAutoMovieHumanLoftChain.ILayer[] = neighboured(built, stations);

    // The two rings' layers carry their own second derivatives, one-sided
    // into the leg (second order over CURVE_STEP), so the chain can be made
    // C2 along its stations with its ends kept: the trunk and the foot are
    // C2 chains, and a leg joined by its layers' slopes alone steps its
    // curvature at every layer, a band of shading at each row.
    const curvature: (k: 0 | 1) => number[] = (k: 0 | 1): number[] => {
      const s: number = stations[k === 0 ? 0 : last]!;
      const d: number = k === 0 ? CURVE_STEP : -CURVE_STEP;
      const [p, a, b, c]: AutoMovieHumanLegSection.ISection[] = [0, 1, 2, 3].map((i: number): AutoMovieHumanLegSection.ISection => section(s + i * d));
      const second: Vec3[] = p!.local.map(
        (q: Vec3, m: number): Vec3 =>
          [0, 1, 2].map((e: number): number => (2 * q[e]! - 5 * a!.local[m]![e]! + 4 * b!.local[m]![e]! - c!.local[m]![e]!) / (d * d)) as Vec3,
      );
      return AutoMovieHumanLegReflection.sided(second, sign).coefficients;
    };
    const loose: IAutoMovieHumanLoftChain = {
      name: `leg.${side}`,
      basis: "spline",
      order: AutoMovieHumanLegSampling.ORDER,
      rule: "polar",
      samples: AutoMovieHumanLegSampling.SAMPLES,
      layers: layers.map((l: IAutoMovieHumanLoftChain.ILayer, k: number): IAutoMovieHumanLoftChain.ILayer =>
        k === 0 ? { ...l, curvatures: curvature(0) } : k === last ? { ...l, curvatures: curvature(1) } : l,
      ),
    };

    // A chain the station spline cannot carry stays joined by its slopes,
    // and the broken contract is recorded.
    try {
      return AutoMovieHumanSeamStation.continuous(loose, [0, last]);
    } catch (error) {
      diagnostics.push({
        producer: `leg.${side}`,
        level: 2,
        contract: "the leg chain is C2 along its stations",
        detail: error instanceof Error ? error.message : String(error),
      });
      return loose;
    }
  }

  /** Station step of the section differences, mm. */
  export const STEP: number = 0.05;

  /**
   * Station step of the rings' one-sided second differences, mm: ten section
   * steps, so the second difference stands well over the section's own
   * rounding and stays within the first millimetre past each ring.
   */
  export const CURVE_STEP: number = 10 * STEP;

  /**
   * The stations that keep the layer contract: finite and each at least the
   * least layer gap over the last one kept. When the list breaks it, the
   * broken rows are left out and the contract's message is recorded once.
   *
   * @param producer The chain, for the message.
   * @param stations The placed stations, mm.
   * @param diagnostics The list a broken contract is recorded in.
   */
  export function kept(producer: string, stations: readonly number[], diagnostics: AutoMovieHumanLoftContract.IDiagnostic[]): number[] {
    try {
      AutoMovieHumanLoftContract.stations(producer, stations, AutoMovieHumanLoftContract.LEAST_LAYER_GAP);
      return [...stations];
    } catch (error) {
      diagnostics.push({
        producer,
        level: 2,
        contract: `layers finite and at least ${AutoMovieHumanLoftContract.LEAST_LAYER_GAP} mm apart`,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    // The two rings are the chain's ends and stay; a row too near the top
    // ring gives way to it.
    const gap: number = AutoMovieHumanLoftContract.LEAST_LAYER_GAP;
    const top: number = stations[stations.length - 1]!;
    const out: number[] = [];
    for (const s of stations.slice(0, -1)) if (Number.isFinite(s) && (out.length === 0 || s - out[out.length - 1]! >= gap)) out.push(s);
    while (out.length > 1 && !(top - out[out.length - 1]! >= gap)) out.pop();
    out.push(top);
    return out;
  }

  /**
   * Layers with each broken one replaced by its nearest valid neighbour's
   * row at its own station: the base row rule of the totality contract, so a
   * broken layer leaves a flat band and never an undefined surface.
   *
   * @param built The layers, a broken one as null.
   * @param stations Their stations, mm.
   * @throws When no layer is valid, since no neighbour can then stand in.
   */
  export function neighboured(built: readonly (IAutoMovieHumanLoftChain.ILayer | null)[], stations: readonly number[]): IAutoMovieHumanLoftChain.ILayer[] {
    const valid: number[] = built.flatMap((l: IAutoMovieHumanLoftChain.ILayer | null, k: number): number[] => (l === null ? [] : [k]));
    if (valid.length === 0) throw new Error("No leg layer keeps its contract");
    return built.map((l: IAutoMovieHumanLoftChain.ILayer | null, k: number): IAutoMovieHumanLoftChain.ILayer => {
      if (l !== null) return l;
      const near: number = valid.reduce((a: number, b: number): number => (Math.abs(b - k) < Math.abs(a - k) ? b : a));
      return { ...built[near]!, y: stations[k]! };
    });
  }
}

import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanFootBreadth,
  IAutoMovieHumanFootConnection,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootHost,
  IAutoMovieHumanFootInterim,
  IAutoMovieHumanFootPart,
  IAutoMovieHumanFootSource,
  IAutoMovieHumanFootToeSources,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanToePart,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanFootArch } from "../AutoMovieHumanFootArch";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanFootBreadth } from "./AutoMovieHumanFootBreadth";
import { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";
import { AutoMovieHumanFootDorsum } from "./AutoMovieHumanFootDorsum";
import { AutoMovieHumanFootHost } from "./AutoMovieHumanFootHost";
import { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";
import { AutoMovieHumanFootSource } from "./AutoMovieHumanFootSource";
import { AutoMovieHumanFootToeSources } from "./AutoMovieHumanFootToeSources";

/**
 * Independent foot and toe originals. The person's heel-to-ball length
 * places the first metatarsal head. The Maestro cascade places the others,
 * and public breadth closes against the combined horizontal supports.
 * The shared foot host supplies the original outlines on those stations.
 *
 * The actual leg contact and the standing arch measurement drive the dorsal
 * curve. Each toe begins on the parent's native field with its position and
 * vertical derivatives. Distal length uses the phalanx pattern and ends at
 * the person's foot-length constraint. The nominal transverse partition
 * infers proximal breadth and distal depth from the neighbouring toe axes.
 */
export namespace AutoMovieHumanFootInterim {
  /** Actual production names; enumeration performs no geometry or full-parent request. */
  export function names(side: "left" | "right"): readonly string[] {
    return AutoMovieHumanFootToeSources.names(side);
  }

  /**
   * Define the foot and its toe attachments in one shared source frame.
   * Head-u is transferred from its retained global forefoot support fraction,
   * not interpreted as a fraction of each root's local cut. This is a
   * normalized placement convention, not recovery of an old rigid frame.
   * One positive transverse scale closes the entire host-plus-toe source
   * region, because the retained FOOT envelope already includes toe loops.
   * The leg's independent tape and sagittal contacts are never scaled by it.
   * Local chord heights may change when the native across field changes;
   * only the original horizontal guides are an across-homogeneous family.
   * Root-u first transfers into the retained host supports; after the common
   * scale it is not a newly measured fraction of the group's final extrema.
   *
   * @throws {Error} If a required source, affine/chart premise or positive finite group breadth is unavailable. This is a construction failure, not proof that a supplied anatomical measurement is invalid; no normalized definition or substituted shape is returned.
   *
   * @evidence contracts/common.md#principled-implementation Builds the actual foot input once, then derives each skin root and distal proxy in that input's heel/axis/support datum.
   * @evidence contracts/common.md#clear-and-simple-design A single result supplies the production foot and five digit builders with the same source objects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no measured joint claim, person correction, old-frame registration, skin readback or root clamp.
   * @evidence contracts/common.md#meaningful-documentation States retained global head-u transfer and separates source skin points from skeletal landmarks and final support acceptance.
   * @evidence contracts/performance.md#efficient-algorithms Prepares a fixed-size unit-across source family, reads its shared continuous-source critical candidates once, then constructs that family's final scale without running a loft.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares one frame, station plan and retained host-support preparation between the unit and final source definitions; all toes then share the final host record.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned records without a cache, sampler or realized skin reference.
   */
  export function prepare(
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    ankle: AutoMovieVector3Tuple,
    leg:
      | IAutoMovieHumanLegWalk.IDefinition
      | IAutoMovieHumanFootInterim.IAnkleSource,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IAutoMovieHumanFootInterim.IPrepared {
    if (!("source" in leg) && leg.part === null)
      throw new Error(`The ${name} foot needs its actual prepared leg source`);
    const anchor: AutoMovieVector3Tuple = (
      "source" in leg
        ? (leg.source.axis ?? leg.source.part.axis)
        : leg.part!.axis
    ).at(leg.ankleStation).origin;
    const mismatch: number = Math.hypot(
      ...anchor.map(
        (value: number, coordinate: number): number =>
          value - ankle[coordinate]!,
      ),
    );
    const roundoff: number =
      64 *
      Number.EPSILON *
      Math.max(1, ...anchor.map(Math.abs), ...ankle.map(Math.abs));
    if (!Number.isFinite(mismatch) || mismatch > roundoff)
      throw new Error(
        `The ${name} public ankle misses its actual leg source by ${mismatch} mm`,
      );
    const frame: IAutoMovieHumanFootHost.IFrame = AutoMovieHumanFootHost.place(
      name,
      d,
      anchor,
      scale,
    );
    const owner: IAutoMovieHumanFootSource.ISource =
      "source" in leg
        ? leg.source
        : AutoMovieHumanFootSource.prepare(leg.part!);
    const connection: IAutoMovieHumanFootConnection.IAnkle =
      AutoMovieHumanFootConnection.ankle(owner, leg.ankleStation, frame.along);
    const plan: IAutoMovieHumanFootHost.IPlan =
      AutoMovieHumanFootHost.sourcePlan(d, measures, scale, frame.back);
    const support: IAutoMovieHumanFootHost.ITransverse =
      AutoMovieHumanFootHost.acrossSupport(d, plan);

    // Horizontal guides scale together. The local parent field owns Y;

    // native fullness does not promise anisotropic chord-height invariance.
    const unit: IAutoMovieHumanFootPart.IInput = AutoMovieHumanFootHost.create(
      name,
      d,
      frame,
      plan,
      support,
      1,
    );
    const unitDefinition: IAutoMovieHumanSiteControls.IOutput = roof(
      unit,
      connection,
      measures,
      scale,
    );
    const raw: IAutoMovieHumanFootBreadth.ISupport | string =
      AutoMovieHumanFootBreadth.measure(
        unit,
        AutoMovieHumanFootToeSources.create(unit, unitDefinition).map(
          (
            toe: IAutoMovieHumanFootToeSources.ICandidate,
          ): IAutoMovieHumanToePart.IInput => toe.part,
        ),
        unitDefinition,
      );
    if (typeof raw === "string")
      throw new Error(
        `The ${name} metatarsal source cannot own public breadth: ${raw}`,
      );
    const transverse: number = d.breadth / raw.breadth;
    if (!(transverse > 0) || !Number.isFinite(transverse))
      throw new Error(
        `The ${name} metatarsal source needs a finite positive transverse scale`,
      );
    const foot: IAutoMovieHumanFootPart.IInput = AutoMovieHumanFootHost.create(
      name,
      d,
      frame,
      plan,
      support,
      transverse,
    );
    const controls: IAutoMovieHumanSiteControls.IOutput = roof(
      foot,
      connection,
      measures,
      scale,
    );
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    let retained: IAutoMovieHumanSourceDefinition | undefined;
    return {
      foot,
      controls,
      toes: AutoMovieHumanFootToeSources.create(foot, controls),
      diagnostics,
      definition(): IAutoMovieHumanSourceDefinition {
        retained ??= AutoMovieHumanSiteViewPart.fromControls(controls);
        return retained;
      },
    };
  }

  /** Explicit original-parent publication preserves the previous public definition contract. */
  export function define(
    ...args: IAutoMovieHumanFootInterim.DefineArgs
  ): IAutoMovieHumanFootInterim.IDefinition {
    const shared: IAutoMovieHumanFootInterim.IPrepared = prepare(...args);
    return {
      foot: shared.foot,
      definition: shared.definition(),
      toes: shared.toes,
      diagnostics: shared.diagnostics,
    };
  }

  /**
   * The foot part's input.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The foot part's input.
   */
  export function of(
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    ankle: AutoMovieVector3Tuple,
    leg: IAutoMovieHumanLegWalk.IDefinition,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IAutoMovieHumanFootPart.IInput {
    return prepare(name, d, ankle, leg, measures, scale).foot;
  }

  /**
   * The toes' walks, the hallux first.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns Each toe's walk.
   */
  export function toes(
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    ankle: AutoMovieVector3Tuple,
    leg: IAutoMovieHumanLegWalk.IDefinition,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IAutoMovieHumanToePart.IInput[] {
    return prepare(name, d, ankle, leg, measures, scale).toes.map(
      (
        toe: IAutoMovieHumanFootToeSources.ICandidate,
      ): IAutoMovieHumanToePart.IInput => toe.part,
    );
  }

  /** Author only the replacement dorsal scalar from the actual ankle contact; the foot and toes share these original coefficients. */
  function roof(
    foot: IAutoMovieHumanFootPart.IInput,
    connection: IAutoMovieHumanFootConnection.IAnkle,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IAutoMovieHumanSiteControls.IOutput {
    const base: IAutoMovieHumanSiteControls.IOutput =
      AutoMovieHumanFootPart.controls(foot);
    if (base.controls === null)
      throw new Error(
        base.diagnostics
          .map(
            (diagnostic: IAutoMovieLoftContract.IDiagnostic): string =>
              diagnostic.detail,
          )
          .join("; "),
      );
    foot.dorsal = AutoMovieHumanFootDorsum.create({
      part: base.controls.scalars,
      heel: foot.heel,
      along: foot.along,
      length: foot.length,
      height: foot.height,
      arch: AutoMovieHumanFootArch.dorsum(measures) * scale,
      ankle: connection,
    });
    foot.ankle = connection;
    return AutoMovieHumanFootPart.controls(foot, base);
  }
}

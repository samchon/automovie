import type { AutoMovieHumanFootConstruction } from "../AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootArch } from "../AutoMovieHumanFootArch";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";
import { AutoMovieHumanFootBreadth } from "./AutoMovieHumanFootBreadth";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanFootToeSources } from "./AutoMovieHumanFootToeSources";
import type { AutoMovieHumanLegWalk } from "../leg/AutoMovieHumanLegWalk";
import type { AutoMovieHumanToePart } from "./AutoMovieHumanToePart";
import { AutoMovieHumanFootSource } from "./AutoMovieHumanFootSource";
import { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";
import { AutoMovieHumanFootDorsum } from "./AutoMovieHumanFootDorsum";
import type { AutoMovieLoftContract } from "@automovie/engine";
import { AutoMovieHumanFootHost } from "./AutoMovieHumanFootHost";

type Vec3 = [number, number, number];

/**
 * A foot and its toes from the person's foot dimensions and the reference set's
 * foot outline (`AutoMovieHumanReferenceOutlines.FOOT`: lateral and medial
 * edges about the heel-to-toe axis and the dorsum's and sole's heights, per
 * foot length; `AutoMovieHumanFootPlaces`: the foot's yaw, the ankle's place
 * along it, the toes' along maxima and across loop means; estimated from the private reference set, no
 * published source gives a foot's outline).
 *
 * The foot's axis turns out by its yaw from the heel, which stands behind the
 * ankle centre by the ankle's place. Its sites are the heel half-way to the
 * ankle's place, the ankle's place, the instep and the ball (`instepLength`,
 * `ballOfFootLength`), plus all distinct outline-table rows. The
 * axis stands at half the lowest dorsum among the sites, and each site's box
 * is the table's edges about the axis there. The forefoot closes half-way
 * from the ball to the shortest toe's tip, where the toes have taken over.
 *
 * Each toe runs from its retained cascade/root-u proxy to a generated distal apex. That apex
 * combines its retained foremost along reach with its first accepted loop's
 * vertex-mean across position: these are different observations, not a
 * measured three-dimensional tip or MTP/PIP/DIP landmarks.
 * Its breadth is a packing proxy: the mean gap to its neighbours' across means,
 * or the one gap at either end, since the toes fill the
 * forefoot side by side. The actual leg's sagittal cut replaces the retained
 * ankle-cut envelope in the dorsal source. Each toe root and hidden start
 * read the final parent's complete native field at their own across place.
 * The resulting local vertical chord owns proximal centre and depth, with
 * its available physical derivatives and original frame retained explicitly.
 * Distal depth belongs to the individual toe: the retained FootPrior D/B
 * ratio times its across-gap breadth in the original per-L pattern, before
 * the common transverse scale. That ratio's extraction site is unverified,
 * and its transfer to this foot-axis chart is a modelling proxy. The FOOT
 * dorsum envelope includes all toes and cannot supply an individual depth.
 * The moving origin height and signed plantar edge share one angle clock,
 * knot partition and jets; their sum is the authored nonnegative absolute
 * plantar curve. This local transfer does not assert identical parent and
 * child contact arcs or world C2. The midpoint and hidden inner start are generating stations,
 * not measured phalangeal joint centres; the latter remains owed.
 */
export namespace AutoMovieHumanFootInterim {

  /** A real leg-family ankle capability, without claiming that its upper parent is already complete. */
  export interface IAnkleSource {

    /** Original physical ankle station, calibration mm. */

    ankleStation: number;

    /** Same retained distal authority with an explicit full-parent resolver. */

    source: AutoMovieHumanFootSource.ISource;
  }

  /** Actual production names; enumeration performs no geometry or full-parent request. */
  export function names(side: "left" | "right"): readonly string[] {
    return AutoMovieHumanFootToeSources.names(side);
  }

  /** Actual original toe input and its separate skin-attachment/terminal datums. */
  export type IToe = AutoMovieHumanFootToeSources.ICandidate;

  /**
   * The foot input and all five toe sources sharing its actual floor frame
   * and metatarsal support origin, before loft or skin construction.
   *
   * @evidence contracts/common.md#principled-implementation Makes the actual foot's heel, axis and regional supports the source for every toe.
   * @evidence contracts/common.md#clear-and-simple-design Owns one foot input and five explicit attachment records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not recover placement from a generated course or reuse the old skeletal foot's different yaw and origin.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes source inputs from a realized foot, and skin attachments from skeletal centres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type declares no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The define owner determines how the records are shared.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generating call owns the finite result without global retention.
   */
  export interface IDefinition {

    /** The actual foot builder input, including its shared regional support datum. */
    foot: AutoMovieHumanFootPart.IInput;

    /** Same final original read by the attachments, metric owner and production loft. */
    definition: AutoMovieHumanSiteViewPart.IDefinition;

    /** Hallux first, each with its actual generated attachment and walk. */
    toes: IToe[];

    /** Nonfatal attachment-premise diagnostics retained before any join or skin. An unavailable breadth source throws before a normalized record can be returned. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Shared local source controls and child inputs; actual parent publication stays an explicit method. */
  export interface IPrepared extends Omit<IDefinition, "definition"> {

    /** Same original scalar/frame controls consumed by the foot and its toe contacts. */
    controls: AutoMovieHumanSiteControls.IOutput;

    /** Publish the actual foot only on explicit original/assembly demand, retaining one identical result. */
    definition(): AutoMovieHumanSiteViewPart.IDefinition;
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
  export function prepare(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, leg: AutoMovieHumanLegWalk.IDefinition | IAnkleSource, measures: IAutoMovieHumanBodyMeasures, scale: number): IPrepared {
    if (!("source" in leg) && leg.part === null) throw new Error(`The ${name} foot needs its actual prepared leg source`);
    const anchor: Vec3 = ("source" in leg ? leg.source.axis ?? leg.source.part.axis : leg.part!.axis).at(leg.ankleStation).origin;
    const mismatch: number = Math.hypot(...anchor.map((value: number, coordinate: number): number => value - ankle[coordinate]!));
    const roundoff: number = 64 * Number.EPSILON * Math.max(1, ...anchor.map(Math.abs), ...ankle.map(Math.abs));
    if (!Number.isFinite(mismatch) || mismatch > roundoff) throw new Error(`The ${name} public ankle misses its actual leg source by ${mismatch} mm`);
    const frame: AutoMovieHumanFootHost.IFrame = AutoMovieHumanFootHost.place(name, d, anchor, scale);
    const owner: AutoMovieHumanFootSource.ISource = "source" in leg ? leg.source : AutoMovieHumanFootSource.prepare(leg.part!);
    const connection: AutoMovieHumanFootConnection.IAnkle = AutoMovieHumanFootConnection.ankle(owner, leg.ankleStation, frame.along);
    const plan: AutoMovieHumanFootHost.IPlan = AutoMovieHumanFootHost.sourcePlan(d, measures, scale, frame.back);
    const support: AutoMovieHumanFootHost.ITransverse = AutoMovieHumanFootHost.acrossSupport(d, plan);

    // Horizontal guides scale together. The local parent field owns Y;

    // native fullness does not promise anisotropic chord-height invariance.
    const unit: AutoMovieHumanFootPart.IInput = AutoMovieHumanFootHost.create(name, d, frame, plan, support, 1);
    const unitDefinition: AutoMovieHumanSiteControls.IOutput = roof(unit, connection, measures, scale);
    const raw: AutoMovieHumanFootBreadth.ISupport | string = AutoMovieHumanFootBreadth.measure(unit, AutoMovieHumanFootToeSources.create(unit, unitDefinition).map((toe: IToe): AutoMovieHumanToePart.IInput => toe.part), unitDefinition);
    if (typeof raw === "string") throw new Error(`The ${name} metatarsal source cannot own public breadth: ${raw}`);
    const transverse: number = d.breadth / raw.breadth;
    if (!(transverse > 0) || !Number.isFinite(transverse)) throw new Error(`The ${name} metatarsal source needs a finite positive transverse scale`);
    const foot: AutoMovieHumanFootPart.IInput = AutoMovieHumanFootHost.create(name, d, frame, plan, support, transverse);
    const controls: AutoMovieHumanSiteControls.IOutput = roof(foot, connection, measures, scale);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    let retained: AutoMovieHumanSiteViewPart.IDefinition | undefined;
    return {
      foot, controls, toes: AutoMovieHumanFootToeSources.create(foot, controls), diagnostics,
      definition(): AutoMovieHumanSiteViewPart.IDefinition {
        retained ??= AutoMovieHumanSiteViewPart.fromControls(controls);
        return retained;
      },
    };
  }

  /** Explicit original-parent publication preserves the previous public definition contract. */
  export function define(...args: Parameters<typeof prepare>): IDefinition {
    const shared: IPrepared = prepare(...args);
    return { foot: shared.foot, definition: shared.definition(), toes: shared.toes, diagnostics: shared.diagnostics };
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
  export function of(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, leg: AutoMovieHumanLegWalk.IDefinition, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanFootPart.IInput {
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
  export function toes(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, leg: AutoMovieHumanLegWalk.IDefinition, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanToePart.IInput[] {
    return prepare(name, d, ankle, leg, measures, scale).toes.map((toe: IToe): AutoMovieHumanToePart.IInput => toe.part);
  }

  /** Author only the replacement dorsal scalar from the actual ankle contact; the foot and toes share these original coefficients. */
  function roof(foot: AutoMovieHumanFootPart.IInput, connection: AutoMovieHumanFootConnection.IAnkle, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanSiteControls.IOutput {
    const base: AutoMovieHumanSiteControls.IOutput = AutoMovieHumanFootPart.controls(foot);
    if (base.controls === null)
      throw new Error(base.diagnostics.map((diagnostic: AutoMovieLoftContract.IDiagnostic): string => diagnostic.detail).join("; "));
    foot.dorsal = AutoMovieHumanFootDorsum.create({
      part: base.controls.scalars, heel: foot.heel, along: foot.along, length: foot.length,
      height: foot.height, arch: AutoMovieHumanFootArch.dorsum(measures) * scale, ankle: connection,
    });
    foot.ankle = connection;
    return AutoMovieHumanFootPart.controls(foot, base);
  }

}

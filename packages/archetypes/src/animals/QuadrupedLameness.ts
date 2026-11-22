import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeRefusal } from "../core";
import { EquinePitch } from "./EquinePitch";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedGait } from "./QuadrupedGait";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * An authored forelimb or hindlimb lameness at the walk or trot: the head and pelvis movement asymmetry of a lame horse.
 *
 * Rhodin et al. 2018 (Vertical movement symmetry of the withers in horses with induced forelimb and hindlimb lameness at trot, Equine Vet J 50:818, https://pmc.ncbi.nlm.nih.gov/articles/PMC6175082/) describe the pattern this follows:
 * - a lame forelimb shows as the head dropping less during that limb's stance (head asymmetry HDmin);
 * - a lame hindlimb shows as the pelvis dropping less during that limb's stance (PDmin), with the withers moving 0.55 mm toward the contralateral side per mm of PDmin;
 * - a compensatory head nod can mimic an ipsilateral forelimb lameness.
 *
 * A forelimb case nods the head up about the neck's root, peaking at the lame fore's mid-stance. A hindlimb case pitches the trunk nose-down during the lame hind's stance about the lateral axis that gives that withers-to-pelvis ratio of −0.55. That pitch lowers the head too, by its lever ahead of the axis; the head asymmetry the literature measures is the head's whole vertical movement (a poll sensor), so a compensatory nod supplies only the measured head asymmetry less that passive part. The grade's rows are in `head` and `pelvis`. Its stance timing is left as the gait's: Rhodin et al. report no stance-duration change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, its three findings, the mechanism and what stays unchanged.
 * @evidence contracts/development/design.md#principled-representation A limb, a closed grade and an optional compensation flag; rows are millimetres of the cited asymmetry measures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's nod and body placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Canter, gallop and other gaits are refused; no unmeasured stance change is invented.
 */
export namespace QuadrupedLameness {
  /**
   * The lameness grades.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three grades of Rhodin et al.'s clinical scoring.
   * @evidence contracts/development/design.md#principled-representation A closed literal union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `head` and `pelvis`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Grade = "subtle" | "mild" | "moderate";

  /**
   * An authored lameness.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The lame limb, its grade and whether a hindlimb case shows a compensatory head nod.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried on the quadruped course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ILameness {
    /** The lame limb. */
    limb: QuadrupedBody.Limb;
    /** Its grade. */
    grade: Grade;
    /** For a hindlimb, also nod the head as if the ipsilateral fore were lame. */
    compensation?: boolean;
  }

  /**
   * The head's vertical asymmetry of a forelimb grade, metres. The subtle grade is Rhodin et al.'s 6 mm HDmin inclusion threshold; mild and moderate are its double and quadruple, authored and provisional, because the paper scores grades subjectively and reports no per-grade values.
   *
   * @param grade The grade.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each value's origin.
   * @evidence contracts/development/implementation.md#principled-implementation The cited threshold and its stated multiples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored multiples are labelled provisional.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function head(grade: Grade): number {
    return 0.006 * multiple(grade);
  }

  /**
   * The pelvis's vertical asymmetry of a hindlimb grade, metres. The subtle grade is Rhodin et al.'s 3 mm PDmin inclusion threshold; mild and moderate are its double and quadruple, authored and provisional.
   *
   * @param grade The grade.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each value's origin.
   * @evidence contracts/development/implementation.md#principled-implementation The cited threshold and its stated multiples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored multiples are labelled provisional.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pelvis(grade: Grade): number {
    return 0.003 * multiple(grade);
  }

  /**
   * The head nod and trunk tilt of a lame stride at one phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidence contracts/development/design.md#principled-representation A nod change in degrees, positive nose-down, and a body tilt.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's nod and placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IOffset {
    /** Nod change, degrees, positive nose-down. */
    nod: number;
    /** Trunk tilt. */
    tilt: EquinePitch.ITilt;
  }

  /**
   * A prepared lameness for one animal's ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the reader takes and returns.
   * @evidence contracts/development/design.md#principled-representation A pure function of the stride plan, the phase and each limb's duty.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Called by the ride per sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Offset = (
    strides: QuadrupedStridePlan.IPlan,
    phase: number,
    timing: QuadrupedGait.ITiming,
  ) => IOffset;

  /**
   * Admit a lameness and prepare its offsets from the animal's neutral geometry.
   *
   * @param archetype The archetype name, for refusals.
   * @param lameness The authored lameness, if any.
   * @param legs The course's legs.
   * @param fallback The gait an unnamed leg is checked as: the ride's gait, else the fastest it could reach.
   * @param parts The animal's neutral parts.
   * @param limbs The actual neutral limb chains.
   * @returns The offset reader, or undefined without a lameness.
   * @throws {ArchetypeRefusal} For a gait other than walk or trot, an unknown grade or a malformed record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The nod angle δ raises the head's centre by its asymmetry: δ = asin((A + y)/R) − atan2(y, z) for the centre at (y, z) from the neck's root, R its distance. The hind tilt turns about the pivot z_c = (z_w + 0.55 z_p)/1.55 between the withers (the shoulder joints) and the pelvis (the hindquarters' centre), by the angle that lifts the pelvis by its asymmetry; it lowers the head's centre (y, z) by (z − z_c) sin θ − y (cos θ − 1), which a compensatory nod's asymmetry is reduced by. Both follow sin² of the stance share, peaking at mid-stance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, measure the neutral geometry once, then return the reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No speed or gait the source did not cover is admitted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stride plan's landings and the pitch helper.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains a few neutral measurements.
   */
  export function prepare(
    archetype: string,
    lameness: ILameness | undefined,
    legs: readonly rideQuadruped.ILeg[],
    fallback: QuadrupedGait.Gait,
    parts: readonly IAutoMovieModelPart[],
    limbs: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>,
  ): Offset | undefined {
    if (lameness === undefined) return undefined;
    if (
      lameness === null ||
      typeof lameness !== "object" ||
      !(lameness.limb in limbs) ||
      !["subtle", "mild", "moderate"].includes(lameness.grade)
    )
      refuse("Name a limb and one of the grades subtle, mild or moderate");
    if (
      legs.some((leg: rideQuadruped.ILeg): boolean => {
        const gait: QuadrupedGait.Gait = leg.gait ?? fallback;
        return gait !== "walk" && gait !== "trot";
      })
    )
      refuse(
        "Lameness is measured at the walk and trot only; name walk or trot on every leg",
      );
    const fore: boolean = lameness.limb.endsWith("Fore");
    const side: string = lameness.limb.startsWith("left") ? "left" : "right";
    const nodder: QuadrupedBody.Limb | undefined = fore
      ? lameness.limb
      : lameness.compensation === true
        ? (`${side}Fore` as QuadrupedBody.Limb)
        : undefined;
    const withers: number = (limbs.leftFore[0]!.z + limbs.rightFore[0]!.z) / 2;
    const rear: IAutoMovieVector3 = centre(parts, "hindquarters");
    const pivot: number = (withers + 0.55 * rear.z) / 1.55;
    const tiltAngle: number = fore
      ? 0
      : Math.asin(pelvis(lameness.grade) / (pivot - rear.z));
    // The hind's pitch already lowers the head during the lame hind's stance, the ipsilateral fore's half-stride away; a compensatory nod adds only what the measured head asymmetry wants beyond it.
    const skull: IAutoMovieVector3 = centre(parts, "head");
    const passive: number =
      (skull.z - pivot) * Math.sin(tiltAngle) -
      skull.y * (Math.cos(tiltAngle) - 1);
    const nodAngle: number =
      nodder === undefined
        ? 0
        : raise(parts, fore ? head(lameness.grade) : head("subtle") - passive);
    return (
      strides: QuadrupedStridePlan.IPlan,
      phase: number,
      timing: QuadrupedGait.ITiming,
    ): IOffset => {
      const duty = (limb: QuadrupedBody.Limb): number =>
        limb.endsWith("Fore") ? timing.duty : (timing.hindDuty ?? timing.duty);
      const nodShare: number =
        nodder === undefined ? 0 : share(strides, phase, nodder, duty(nodder));
      const tiltShare: number = fore
        ? 0
        : share(strides, phase, lameness.limb, duty(lameness.limb));
      return {
        nod: (-nodAngle * nodShare * 180) / Math.PI,
        tilt: EquinePitch.about({ y: 0, z: pivot }, -tiltAngle * tiltShare),
      };
    };

    /** Report an inadmissible lameness. */
    function refuse(reason: string): never {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "lameness",
        value: lameness,
        feasible: null,
        reason,
        fix: "Ride the lame horse at the walk or trot with a declared grade.",
      });
    }
  }

  /** The sin² weight of a limb's current stance, zero in swing. */
  function share(
    strides: QuadrupedStridePlan.IPlan,
    phase: number,
    limb: QuadrupedBody.Limb,
    duty: number,
  ): number {
    const landed: number = strides.landing(limb, strides.latest(limb, phase));
    const u: number = (phase - landed) / duty;
    return u >= 0 && u <= 1 ? Math.sin(Math.PI * u) ** 2 : 0;
  }

  /** The nod angle, radians, that lifts the head's centre by a height. */
  function raise(parts: readonly IAutoMovieModelPart[], lift: number): number {
    const root: IAutoMovieVector3 = end(parts, "neck");
    const head: IAutoMovieVector3 = Vector3.subtract(
      centre(parts, "head"),
      root,
    );
    const reach: number = Math.hypot(head.y, head.z);
    return Math.asin((lift + head.y) / reach) - Math.atan2(head.y, head.z);
  }

  /** A part's centre, model metres. */
  function centre(
    parts: readonly IAutoMovieModelPart[],
    id: string,
  ): IAutoMovieVector3 {
    const part: IAutoMovieModelPart | undefined = parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (part?.transform === undefined || part.transform === null)
      throw new RangeError(`The animal has no placed ${id}`);
    return part.transform.translation;
  }

  /** A bar's lower end along its local -Y, model metres: the neck's root. */
  function end(
    parts: readonly IAutoMovieModelPart[],
    id: string,
  ): IAutoMovieVector3 {
    const part: IAutoMovieModelPart = parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    )!;
    const half: number =
      part.geometry.type === "primitive" && "height" in part.geometry.shape
        ? part.geometry.shape.height / 2
        : 0;
    return Vector3.add(
      part.transform!.translation,
      Quaternion.rotateVector(part.transform!.rotation, {
        x: 0,
        y: -half,
        z: 0,
      }),
    );
  }

  /** The grade's multiple of the detection threshold: 1, 2 and 4, authored and provisional above the subtle grade. */
  function multiple(grade: Grade): number {
    switch (grade) {
      case "subtle":
        return 1;
      case "mild":
        return 2;
      case "moderate":
        return 4;
    }
  }
}

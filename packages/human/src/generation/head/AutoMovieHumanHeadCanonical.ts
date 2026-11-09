import {
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanNeckConstruction } from "../AutoMovieHumanNeckConstruction";
import type { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadCaliper } from "./AutoMovieHumanHeadCaliper";
import { AutoMovieHumanHeadEarFrame } from "./AutoMovieHumanHeadEarFrame";
import { AutoMovieHumanHeadEarPlate } from "./AutoMovieHumanHeadEarPlate";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadMassSource } from "./AutoMovieHumanHeadMassSource";
import { AutoMovieHumanHeadNeckLayout } from "./AutoMovieHumanHeadNeckLayout";
import { AutoMovieHumanHeadTape } from "./AutoMovieHumanHeadTape";

/**
 * One canonical original closes calipers and its actual brow-seat tape.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing actual posterior caliper solve, unchanged ear attachment originals and native-source tape closure before publishing the selected mass.
 * @evidence contracts/common.md#clear-and-simple-design One invocation owns the original family, selected part, witness and separate mechanism timings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cached personal coefficient, proxy tape, substitute lower head, failed-source fallback or post-fit deformation closes the input.
 * @evidence contracts/common.md#meaningful-documentation The existing G brow seat is an adopted placement convention, not an independently measured individual brow datum or a global-course certificate.
 * @evidence contracts/performance.md#efficient-algorithms One caliper solve and one bounded actual tape solve precede regional authoring; neither constructs a loft.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned actual selected part is consumed directly by Composer, its raw supplier and source leaves, without reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial sources are synchronous and call-owned; only the selected original and fixed-size witness/timings escape.
 */
export namespace AutoMovieHumanHeadCanonical {
  /**
   * Observed outcome of this immutable family's one explicit full-closure attempt.
   *
   * @evidence contracts/common.md#principled-implementation Distinguishes an unrequested source from a successful closure and its original thrown failure; inspecting the record never requests geometry.
   * @evidence contracts/common.md#clear-and-simple-design One discriminant carries the original unknown error only after failure, while result remains the separate successful-source observer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failure is neither a successful partial source nor a replacement error; even undefined thrown values retain an explicit failed state.
   * @evidence contracts/common.md#meaningful-documentation The state belongs to one prepared immutable input/curve family; changed parametric inputs require a fresh preparation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This readonly union schedules no computation.
   * @evidence contracts/performance.md#reuse-equivalent-work Original and raw consumers observe the same family-owned attempt rather than maintaining separate retries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A failed family retains its original error until that caller-owned family is released, with no global or cross-input cache.
   */
  export type IClosureAttempt =
    | { readonly state: "unrequested" }
    | { readonly state: "succeeded" }
    | { readonly state: "failed"; readonly error: unknown };

  /**
   * One original family, with independent guides/lower material and a lazy upper closure.
   * @evidence contracts/common.md#principled-implementation The caliper layout and exact lower interval belong to the same original family whose selected full source closes the public tape.
   * @evidence contracts/common.md#clear-and-simple-design Guide-only records cannot masquerade as a complete section source; explicit full closure returns the selected actual part.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No second completed head, old success, proxy final source or silent failed solve is published.
   * @evidence contracts/common.md#meaningful-documentation The tape family preserves every guide and the complete source below nasion; lower material does not require the upper numerical choice.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data schedules no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers retain this invocation's one generating family and original axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the original base, one requested lower adapter and one requested closed source.
   */
  export interface IPrepared {
    /** Public caliper/neck layout before the upper fullness parameter is selected. */
    layout: IAutoMovieHumanHeadLayout;
    /** Actual eager stages; reading this does not request the upper closure or a loft. */
    readonly preparationMilliseconds: Readonly<{
      /** Existing selected-tragion placement, elapsed ms. */
      placement: number;
      /** Complete unchanged original neck solves and declarations, elapsed ms. */
      neckOriginal: number;
      /** Cranial caliper alone, excluding the preceding neck stage, elapsed ms. */
      cranialCaliper: number;
      /** Actual base mass and original edge preparation, elapsed ms. */
      massAndGuides: number;
    }>;
    /** Actual unchanged source guides and axis; no fullness or complete geometry is claimed. */
    guides: Pick<
      IAutoMovieViewPart,
      "name" | "axis" | "stations" | "front" | "side" | "pole"
    >;
    /** Prepared original edges, independent of section/fullness admission. */
    readonly curves: AutoMovieViewCurves.IResult;
    /**
     * The family's pre-closure member and its layout, exact on and below nasion.
     *
     * The upper tape closure varies only `cranialTapePower`. In
     * `AutoMovieHumanHeadMassSource.prepare` that power enters two scalar
     * outlines and nothing else: the fullness shoulder, through its knots at
     * nasion (`vault`), frontotemporale (`cranial`) and the last station, and
     * the face departure, through its frontotemporale knot (`frontal -
     * cranial`). The front, back and side support outlines, the axis, the
     * stations and the pole are built once before the power is read. Every
     * shoulder and departure knot carries explicit zero first and second jets,
     * so `AutoMovieViewOutline` interpolates each knot span by its own quintic
     * Hermite: a span's values and station derivatives depend only on its two
     * end knots. On and below nasion both members share the spans `gonion ->
     * nasion` (shoulder constant `vault`; the pre-closure member's single span
     * `gonion -> last` is the same constant) and `zygion -> nasion` (departure
     * constant `face - vault`), with every lower knot identical. Their native
     * sections, frames and first/second station derivatives are therefore
     * bit-identical at every station at or below nasion, and differ only above
     * it. The layout differs only by that power, which no regional consumer
     * reads. A consumer whose every mass read lies at or below nasion may use
     * this member without the closure; a consumer reading above nasion (the
     * ears, whose top lies above it, and the orbital domes, whose footprint
     * reaches it) must still request the closed member.
     */
    readonly tapeInvariant: {
      /** The pre-closure layout, equal to the closed plan except `cranialTapePower`. */
      plan: IAutoMovieHumanHeadLayout;

      /** The pre-closure mass, exact on and below nasion only. */
      part: IAutoMovieViewPart;
    };

    /** Actual attempt snapshot; reading it requests no source and preserves an original failure. */
    readonly closureAttempt: IClosureAttempt;
    /** Already resolved full closure, or null; reading this never computes it. */
    readonly result: IOutput | null;
    /**
     * Borrow the exact lower original interval once, without the upper solve.
     * @evidence contracts/common.md#principled-implementation Existing restriction reads the unchanged family's original values, parameter jets and axis below nasion.
     * @evidence contracts/common.md#clear-and-simple-design The output is an explicit regular adapter interval, never a second full head.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An upper request or a different placement context is rejected; no old source or missing derivative is substituted.
     * @evidence contracts/common.md#meaningful-documentation Placement retains its actual calibration-mm domain; the independent upper tape parameter is not read.
     * @evidence contracts/performance.md#efficient-algorithms One requested interval scalar restriction and engine loft, then constant-time reuse.
     * @evidence contracts/performance.md#reuse-equivalent-work Returns the same adapter for the same immutable placement and generating family.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only one placement identity and its actual adapter survive with this preparation.
     */
    lower(
      placement: AutoMovieHumanNeckSource.IOutput,
    ): AutoMovieHumanNeckConstruction.IOutput;
    /** Borrow the same lower original before either consumer requests a loft. */
    lowerSource(
      placement: AutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieViewPart;
    /**
     * Resolve the actual complete original once when its upper field is needed.
     * @evidence contracts/common.md#principled-implementation Solves the original family's actual tape and returns its selected part/witness unchanged.
     * @evidence contracts/common.md#clear-and-simple-design Full-source demand is explicit and independent of guide/lower consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Every source failure propagates; no cached coefficient or incomplete source is returned as closed.
     * @evidence contracts/common.md#meaningful-documentation Stage observations record actual work, excluding time spent waiting before this demand.
     * @evidence contracts/performance.md#efficient-algorithms The full closure is attempted once per immutable preparation, including a failed attempt, without a raw loft; retained reads return its result or rethrow its original failure.
     * @evidence contracts/performance.md#reuse-equivalent-work Production, original sections and raw readers borrow that identical selected part or observe the same original failure; a new input context owns a fresh attempt.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The result or original error and immutable source dependencies live with this one invocation, without a global failure cache.
     */
    closed(): IOutput;
  }
  /**
   * Actual canonical original and its independently named calibration stages.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the same source that produced the public-input tape witness.
   * @evidence contracts/common.md#clear-and-simple-design Source, witness and elapsed stage observations have distinct fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A source result establishes neither loft nor final merge success.
   * @evidence contracts/common.md#meaningful-documentation Stage times are elapsed milliseconds, not isolated CPU costs or renderer costs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers borrow this result rather than repeating calibration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The owning head preparation retains the selected original's immutable dependencies.
   */
  export interface IOutput {
    /** Exact selected original and its public-input witness. */
    tape: AutoMovieHumanHeadTape.IResult;
    /** Retained aggregate neck placement/original and cranial-caliper elapsed time, milliseconds. */
    caliperMilliseconds: number;
    /** Actual unchanged base-source and ear-datum preparation elapsed time, milliseconds. */
    attachmentMilliseconds: number;
    /** Actual full scalar tape closure elapsed time, milliseconds. */
    tapeMilliseconds: number;
  }

  /**
   * Calibrate the original once, preserving public guides and lower material.
   *
   * @evidence contracts/common.md#principled-implementation Ear attachment datums come from actual unchanged original plates; each scalar member changes only the existing cranial fullness control.
   * @evidence contracts/common.md#clear-and-simple-design Caliper, attachment and tape stages are sequential and the selected part is the sole output mass.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No exception is hidden and no saturated bracket, remembered f1 value or metadata-only source is returned.
   * @evidence contracts/common.md#meaningful-documentation Optional placements retain the lane's calibration-mm semantics; stage times include the actual work in this invocation.
   * @evidence contracts/performance.md#efficient-algorithms One base original and two existing plates precede the bounded tape family solve, without raw loft preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Every trial borrows the same closed calipers, neck source, placement laws and actual ear datums; Composer retains the returned part itself.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No global registry or cross-person cache is introduced; unselected trial closures end with this call.
   */
  export function of(
    input: IAutoMovieHumanHeadLayout,
    bottom: number | undefined,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    places?: {
      tragion?: number;
      ears?: { left: number; right: number };
      faceExponent?: number;
      neckOriginal?: AutoMovieHumanHeadNeckLayout.IOutput;
    },
  ): IOutput {
    return prepare(input, bottom, ears, places).closed();
  }

  /**
   * Prepare the shared family without forcing an unused upper tape solve.
   * @evidence contracts/common.md#principled-implementation Calipers and original guides precede the independent cranial fullness choice; the existing lower restriction is invariant across that family.
   * @evidence contracts/common.md#clear-and-simple-design A call-owned lower supplier and full-source supplier share one immutable family.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither guides nor lower adapter are presented as a closed complete head, and an upper failure remains an original error.
   * @evidence contracts/common.md#meaningful-documentation Full head/top/raw requests must consume closed(); lower-only records can use the preserved layout, axis and explicit interval.
   * @evidence contracts/performance.md#efficient-algorithms Only caliper and original-guide preparations run eagerly; bounded upper closure and lower loft run on their respective explicit first demands.
   * @evidence contracts/performance.md#reuse-equivalent-work Both suppliers borrow the same base source and placement laws and retain only their actual requested results.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All retained objects belong to this preparation; no global source or person cache is introduced.
   */
  export function prepare(
    input: IAutoMovieHumanHeadLayout,
    bottom: number | undefined,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    places?: {
      tragion?: number;
      ears?: { left: number; right: number };
      faceExponent?: number;
      neckOriginal?: AutoMovieHumanHeadNeckLayout.IOutput;
    },
  ): IPrepared {
    const start: number = performance.now();
    const authored: AutoMovieHumanHeadNeckLayout.IOutput =
      places?.neckOriginal ??
      AutoMovieHumanHeadNeckLayout.create(
        input,
        bottom,
        AutoMovieHumanHeadMassPart.SPACING,
        places?.tragion,
      );
    if (
      places?.neckOriginal !== undefined &&
      (authored.layout !== input ||
        (authored.definition !== null &&
          authored.definition.input.bottom !== bottom))
    )
      throw new Error(
        "Shared original neck preparation does not own this head layout/bottom",
      );
    const caliperStart: number = performance.now();
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadCaliper.close(
      authored.layout,
      bottom,
      places?.faceExponent,
    );
    const caliperDone: number = performance.now();
    const caliperMilliseconds: number = caliperDone - start;
    const attachmentStart: number = performance.now();
    const mass: (power?: number) => IAutoMovieViewPart =
      AutoMovieHumanHeadMassSource.prepare(
        plan,
        {
          spacing: AutoMovieHumanHeadMassPart.SPACING,
          order: AutoMovieHumanHeadMassPart.ORDER,
          samples: AutoMovieHumanHeadMassPart.SAMPLES,
        },
        places?.faceExponent,
        bottom,
      );
    const base: IAutoMovieViewPart = mass(plan.cranialTapePower);
    const curves: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(base);
    const baseMilliseconds: number = performance.now() - attachmentStart;
    let completed: IOutput | undefined;
    let attempt: IClosureAttempt = Object.freeze({ state: "unrequested" });
    let lower:
      | {
          placement: AutoMovieHumanNeckSource.IOutput;
          value: AutoMovieHumanNeckConstruction.IOutput;
        }
      | undefined;
    let lowerOriginal:
      | {
          placement: AutoMovieHumanNeckSource.IOutput;
          part: IAutoMovieViewPart;
        }
      | undefined;
    const lowerSource: (
      placement: AutoMovieHumanNeckSource.IOutput,
    ) => IAutoMovieViewPart = (
      placement: AutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieViewPart => {
      if (placement.head.backLevel > plan.nasion)
        throw new Error(
          "Canonical lower interval must stay within the tape-invariant material below nasion",
        );
      if (lowerOriginal !== undefined) {
        if (lowerOriginal.placement !== placement)
          throw new Error(
            "Canonical lower interval belongs to a different immutable placement context",
          );
        return lowerOriginal.part;
      }
      const part: IAutoMovieViewPart = AutoMovieHumanNeckConstruction.define(
        base,
        placement,
      );
      lowerOriginal = { placement, part };
      return part;
    };
    const closed: () => IOutput = (): IOutput => {
      if (completed !== undefined) return completed;
      if (attempt.state === "failed") throw attempt.error;
      try {
        const earStart: number = performance.now();
        const attachments: [number, number][] = (
          ["left", "right"] as const
        ).map((side: "left" | "right"): [number, number] => {
          const frame: AutoMovieHumanHeadEarFrame.IFrame =
            AutoMovieHumanHeadEarFrame.of(
              plan,
              base,
              side === "left" ? 1 : -1,
              ears[side],
              places?.ears?.[side],
            );
          const plate: AutoMovieHumanHeadEarPlate.IOutput =
            AutoMovieHumanHeadEarPlate.of(plan, base, frame, side);
          const point: [number, number, number] = plate.point(
            plate.attachment,
            false,
          );
          return [point[0], point[1]];
        });
        const attachmentMilliseconds: number =
          baseMilliseconds + performance.now() - earStart;
        const tapeStart: number = performance.now();
        const tape: AutoMovieHumanHeadTape.IResult =
          AutoMovieHumanHeadTape.close(
            plan,
            (
              power: number,
            ): {
              plan: IAutoMovieHumanHeadLayout;
              part: IAutoMovieViewPart;
            } => {
              const changed: IAutoMovieHumanHeadLayout = {
                ...plan,
                cranialTapePower: power,
              };
              return {
                plan: changed,
                part: mass(power),
              };
            },
            attachments,
          );
        completed = {
          tape,
          caliperMilliseconds,
          attachmentMilliseconds,
          tapeMilliseconds: performance.now() - tapeStart,
        };
        attempt = Object.freeze({ state: "succeeded" });
        return completed;
      } catch (error: unknown) {
        attempt = Object.freeze({ state: "failed", error });
        throw error;
      }
    };
    return {
      layout: plan,
      preparationMilliseconds: Object.freeze({
        ...authored.milliseconds,
        cranialCaliper: caliperDone - caliperStart,
        massAndGuides: baseMilliseconds,
      }),
      guides: {
        name: base.name,
        axis: base.axis,
        stations: base.stations,
        front: base.front,
        side: base.side,
        ...(base.pole === undefined ? {} : { pole: base.pole }),
      },
      curves,
      closed,
      tapeInvariant: { plan, part: base },
      lowerSource,
      get closureAttempt(): IClosureAttempt {
        return attempt;
      },
      get result(): IOutput | null {
        return completed ?? null;
      },
      lower: (
        placement: AutoMovieHumanNeckSource.IOutput,
      ): AutoMovieHumanNeckConstruction.IOutput => {
        if (placement.head.backLevel > plan.nasion)
          throw new Error(
            "Canonical lower interval must stay within the tape-invariant material below nasion",
          );
        if (lower !== undefined) {
          if (lower.placement !== placement)
            throw new Error(
              "Canonical lower interval belongs to a different immutable placement context",
            );
          return lower.value;
        }
        const part: IAutoMovieViewPart = lowerSource(placement);
        const value: AutoMovieHumanNeckConstruction.IOutput = {
          part,
          loft: AutoMovieViewLoft.create(part),
        };
        lower = { placement, value };
        return value;
      },
    };
  }
}

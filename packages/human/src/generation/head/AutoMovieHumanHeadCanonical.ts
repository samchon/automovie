import { AutoMovieViewCurves, AutoMovieViewLoft } from "@automovie/engine";
import type {
  IAutoMovieHumanEar,
  IAutoMovieHumanHeadCanonical,
  IAutoMovieHumanHeadEarFrame,
  IAutoMovieHumanHeadEarPlate,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadNeckLayout,
  IAutoMovieHumanHeadTape,
  IAutoMovieHumanNeckConstruction,
  IAutoMovieHumanNeckSource,
  IAutoMovieHumanPair,
  IAutoMovieViewCurves,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanNeckConstruction } from "../AutoMovieHumanNeckConstruction";
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
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    places?: IAutoMovieHumanHeadCanonical.IOfPlaces,
  ): IAutoMovieHumanHeadCanonical.IOutput {
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
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    places?: IAutoMovieHumanHeadCanonical.IOfPlaces,
  ): IAutoMovieHumanHeadCanonical.IPrepared {
    const start: number = performance.now();
    const authored: IAutoMovieHumanHeadNeckLayout.IOutput =
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
    const curves: IAutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(base);
    const baseMilliseconds: number = performance.now() - attachmentStart;
    let completed: IAutoMovieHumanHeadCanonical.IOutput | undefined;
    let attempt: IAutoMovieHumanHeadCanonical.IClosureAttempt = Object.freeze({
      state: "unrequested",
    });
    let lower:
      | {
          placement: IAutoMovieHumanNeckSource.IOutput;
          value: IAutoMovieHumanNeckConstruction.IOutput;
        }
      | undefined;
    let lowerOriginal:
      | {
          placement: IAutoMovieHumanNeckSource.IOutput;
          part: IAutoMovieViewPart;
        }
      | undefined;
    const lowerSource: (
      placement: IAutoMovieHumanNeckSource.IOutput,
    ) => IAutoMovieViewPart = (
      placement: IAutoMovieHumanNeckSource.IOutput,
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
    const closed: () => IAutoMovieHumanHeadCanonical.IOutput =
      (): IAutoMovieHumanHeadCanonical.IOutput => {
        if (completed !== undefined) return completed;
        if (attempt.state === "failed") throw attempt.error;
        try {
          const earStart: number = performance.now();
          const attachments: [number, number][] = (
            ["left", "right"] as const
          ).map((side: "left" | "right"): [number, number] => {
            const frame: IAutoMovieHumanHeadEarFrame.IFrame =
              AutoMovieHumanHeadEarFrame.of(
                plan,
                base,
                side === "left" ? 1 : -1,
                ears[side],
                places?.ears?.[side],
              );
            const plate: IAutoMovieHumanHeadEarPlate.IOutput =
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
          const tape: IAutoMovieHumanHeadTape.IResult =
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
      get closureAttempt(): IAutoMovieHumanHeadCanonical.IClosureAttempt {
        return attempt;
      },
      get result(): IAutoMovieHumanHeadCanonical.IOutput | null {
        return completed ?? null;
      },
      lower: (
        placement: IAutoMovieHumanNeckSource.IOutput,
      ): IAutoMovieHumanNeckConstruction.IOutput => {
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
        const value: IAutoMovieHumanNeckConstruction.IOutput = {
          part,
          loft: AutoMovieViewLoft.create(part),
        };
        lower = { placement, value };
        return value;
      },
    };
  }
}

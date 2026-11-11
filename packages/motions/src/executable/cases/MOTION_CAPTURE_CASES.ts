import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import { affectionCases } from "./affectionCases";
import { crouchCases } from "./crouchCases";
import { everydayCases } from "./everydayCases";
import { galleryCases } from "./galleryCases";
import { handToFaceCases } from "./handToFaceCases";
import { handlingCases } from "./handlingCases";
import { jumpCases } from "./jumpCases";
import { locomotionCases } from "./locomotionCases";
import { reactionCases } from "./reactionCases";
import { selfCases } from "./selfCases";
import { stairsCases } from "./stairsCases";
import { throwCases } from "./throwCases";
import { standCases } from "./standCases";
import { strikingCases } from "./strikingCases";
import { variationCases } from "./variationCases";

/**
 * Every capture case by name: each factory builds one or more cases, so a
 * sweep or a proficiency fan expands into several outputs from one name. A
 * factory may read the harness's name filter and skip building the cases it
 * rejects; the harness filters again, so ignoring it is correct too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a factory returns.
 * @evidence contracts/development/design.md#principled-representation A closed table of named pure factories.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the capture harness only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No case data lives here, only the registry.
 */
export const MOTION_CAPTURE_CASES: Readonly<
  Record<
    string,
    (only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>
  >
> = {
  gallery: (): IMotionCaptureCase[] =>
    galleryCases().filter(
      (c: IMotionCaptureCase): boolean => c.name === "gallery",
    ),
  bodies: (): IMotionCaptureCase[] =>
    galleryCases().filter(
      (c: IMotionCaptureCase): boolean => c.name === "bodies",
    ),
  walk: (only?: (name: string) => boolean): Iterable<IMotionCaptureCase> =>
    locomotionCases("walk", only),
  run: (only?: (name: string) => boolean): Iterable<IMotionCaptureCase> =>
    locomotionCases("run", only),
  "jump-e1": function* (): Iterable<IMotionCaptureCase> {
    // One body at a time, so each body's sheets and verdicts are written as it finishes.
    for (const who of ["f-small", "m-average", "m-tall"] as const)
      yield* jumpCases(who);
  },
  "jump-e1-f-small": (): IMotionCaptureCase[] => jumpCases("f-small"),
  "jump-e1-m-average": (): IMotionCaptureCase[] => jumpCases("m-average"),
  "jump-e1-m-tall": (): IMotionCaptureCase[] => jumpCases("m-tall"),
  "jump-e1-sweep": function* (): Iterable<IMotionCaptureCase> {
    for (const who of MotionBodies.SWEEP) yield* jumpCases(who);
  },
  stand: (): IMotionCaptureCase[] => standCases(),
  "stand-sweep": (): IMotionCaptureCase[] =>
    standCases(MotionBodies.SWEEP, "stand-sweep"),
  "everyday-approach": (): IMotionCaptureCase[] => everydayCases("approach"),
  "everyday-look": (): IMotionCaptureCase[] => everydayCases("look"),
  "everyday-gesture": (): IMotionCaptureCase[] => everydayCases("gesture"),
  "everyday-rest": (): IMotionCaptureCase[] => everydayCases("rest"),
  "everyday-seat": (): IMotionCaptureCase[] => everydayCases("seat"),
  "everyday-bend": (): IMotionCaptureCase[] => everydayCases("bend"),
  "everyday-step": (): IMotionCaptureCase[] => everydayCases("step"),
  "everyday-brace": (): IMotionCaptureCase[] => everydayCases("brace"),
  "everyday-type": (): IMotionCaptureCase[] => everydayCases("type"),
  "everyday-approach-sweep": (): IMotionCaptureCase[] =>
    everydayCases("approach", MotionBodies.SWEEP),
  "everyday-look-sweep": (): IMotionCaptureCase[] =>
    everydayCases("look", MotionBodies.SWEEP),
  "everyday-gesture-sweep": (): IMotionCaptureCase[] =>
    everydayCases("gesture", MotionBodies.SWEEP),
  "everyday-rest-sweep": (): IMotionCaptureCase[] =>
    everydayCases("rest", MotionBodies.SWEEP),
  "everyday-seat-sweep": (): IMotionCaptureCase[] =>
    everydayCases("seat", MotionBodies.SWEEP),
  "everyday-bend-sweep": (): IMotionCaptureCase[] =>
    everydayCases("bend", MotionBodies.SWEEP),
  "everyday-step-sweep": (): IMotionCaptureCase[] =>
    everydayCases("step", MotionBodies.SWEEP),
  "everyday-brace-sweep": (): IMotionCaptureCase[] =>
    everydayCases("brace", MotionBodies.SWEEP),
  "everyday-type-sweep": (): IMotionCaptureCase[] =>
    everydayCases("type", MotionBodies.SWEEP),
  reaction: (): IMotionCaptureCase[] => reactionCases(),
  "reaction-sweep": (): IMotionCaptureCase[] =>
    reactionCases(MotionBodies.SWEEP),
  "handling-handshake": (): IMotionCaptureCase[] => handlingCases("handshake"),
  "handling-grasp": (): IMotionCaptureCase[] => handlingCases("grasp"),
  "handling-handover": (): IMotionCaptureCase[] => handlingCases("handover"),
  striking: (only?: (name: string) => boolean): Iterable<IMotionCaptureCase> =>
    strikingCases(undefined, only),
  "striking-jab-cover": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-jab-cover", only),
  "striking-crosses": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-crosses", only),
  "striking-kicks": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-kicks", only),
  "striking-redirect": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-redirect", only),
  "striking-fooled": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-fooled", only),
  "striking-knee": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-knee", only),
  "striking-air": (
    only?: (name: string) => boolean,
  ): Iterable<IMotionCaptureCase> => strikingCases("striking-air", only),
  variation: (only?: (name: string) => boolean): Iterable<IMotionCaptureCase> =>
    variationCases(only),
  "hand-face": (): IMotionCaptureCase[] => handToFaceCases(),
  "hand-face-sweep": (): IMotionCaptureCase[] =>
    handToFaceCases(MotionBodies.SWEEP),
  crouch: (): IMotionCaptureCase[] => crouchCases(),
  "crouch-sweep": (): IMotionCaptureCase[] => crouchCases(MotionBodies.SWEEP),
  stairs: (): IMotionCaptureCase[] => stairsCases(),
  "stairs-sweep": (): IMotionCaptureCase[] => stairsCases(MotionBodies.SWEEP),
  throw: (): IMotionCaptureCase[] => throwCases(),
  "throw-sweep": (): IMotionCaptureCase[] => throwCases(MotionBodies.SWEEP),
  affection: (): IMotionCaptureCase[] => affectionCases(),
  "affection-sweep": (): IMotionCaptureCase[] =>
    affectionCases(MotionBodies.SWEEP),
  self: (): IMotionCaptureCase[] => selfCases(),
  "self-sweep": (): IMotionCaptureCase[] => selfCases(MotionBodies.SWEEP),
};

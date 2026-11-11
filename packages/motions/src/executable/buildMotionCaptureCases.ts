import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { MOTION_CAPTURE_CASES } from "./cases/MOTION_CAPTURE_CASES";

/**
 * Build the motion cases a harness run names: every case of each named factory of `MOTION_CAPTURE_CASES`, in order, kept when its own name matches `only`.
 *
 * A factory that reads the filter builds no case it rejects; the filter is applied again, so a factory that ignores it is correct too. It throws for a name no factory has, naming it, and when nothing matches.
 *
 * @param names Factory names, such as `walk` or `handling-handover`.
 * @param only Pattern a case's name must match, or null for every case.
 * @returns The cases built.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is built, the filter's two applications and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The registry's factories are pure functions of their filter, so building is the whole of turning names into cases.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the names, shared by the capture harness and the props writer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown name or an empty selection throws instead of building nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cases the factories build.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the cases and keeps nothing.
 */
export function buildMotionCaptureCases(names: readonly string[], only: RegExp | null): IMotionCaptureCase[] {
  const cases: IMotionCaptureCase[] = [];
  for (const name of names) {
    const factory: ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>) | undefined =
      MOTION_CAPTURE_CASES[name];
    if (factory === undefined) throw new Error(`Unknown case ${name}`);
    const filter: ((name: string) => boolean) | undefined =
      only === null ? undefined : (candidate: string): boolean => only.test(candidate);
    for (const capture of factory(filter))
      if (filter === undefined || filter(capture.name)) cases.push(capture);
  }
  if (cases.length === 0) throw new Error("No case matches --case and --only");
  return cases;
}

import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { MOTION_CAPTURE_CASES } from "./cases/MOTION_CAPTURE_CASES";

/**
 * Build the motion cases a harness run names, one at a time: every case of each named factory of `MOTION_CAPTURE_CASES`, in order, kept when its own name matches `only`.
 *
 * Every name is checked when the function is called, so an unknown name throws, naming it, before any browser or case is made. Cases are then built as the caller iterates, so a run captures, writes or reports each case as it is built and keeps none it has finished, and a factory that yields body by body has each body's output written as it finishes. A factory that reads the filter builds no case it rejects; the filter is applied again, so a factory that ignores it is correct too. The iteration throws after the last name when nothing matched.
 *
 * @param names Factory names, such as `walk` or `handling-handover`.
 * @param only Pattern a case's name must match, or null for every case.
 * @returns The cases, built on demand; iterate once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is built, when names are checked and cases built, the filter's two applications and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The registry's factories are pure functions of their filter returning iterables, and they are consumed as iterables, so building is the whole of turning names into cases.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the names, then one loop over their factories, shared by the capture harness and the props writer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown name or an empty selection throws instead of building nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cases the factories build.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no case once the caller asks for the next, so a run of every case keeps one case's data at a time.
 */
export function buildMotionCaptureCases(names: readonly string[], only: RegExp | null): Iterable<IMotionCaptureCase> {
  const factories: ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>)[] = names.map(
    (name: string): ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>) => {
      const factory: ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>) | undefined =
        MOTION_CAPTURE_CASES[name];
      if (factory === undefined) throw new Error(`Unknown case ${name}`);
      return factory;
    },
  );
  const filter: ((name: string) => boolean) | undefined =
    only === null ? undefined : (candidate: string): boolean => only.test(candidate);
  return (function* (): Generator<IMotionCaptureCase, void, undefined> {
    let built: number = 0;
    for (const factory of factories)
      for (const capture of factory(filter))
        if (filter === undefined || filter(capture.name)) {
          ++built;
          yield capture;
        }
    if (built === 0) throw new Error("No case matches --case and --only");
  })();
}

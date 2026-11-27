import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { MOTION_CAPTURE_CASES } from "../cases/MOTION_CAPTURE_CASES";

/*
 * Build the motion cases a harness run names, one at a time: every case of each
 * named factory of `MOTION_CAPTURE_CASES`, in order, kept when its own name
 * matches `only`.
 *
 * Every name is checked when the function is called, so an unknown name throws,
 * naming it, before any browser or case is made. Cases are then built as the
 * caller iterates, so a run captures, writes or reports each case as it is
 * built and keeps none it has finished, and a factory that yields body by body
 * has each body's output written as it finishes. A factory that reads the
 * filter builds no case it rejects; the filter is applied again, so a factory
 * that ignores it is correct too. The iteration throws after the last name when
 * nothing matched.
 * Parameter names: Factory names, such as `walk` or `handling-handover`.
 * Parameter only: Pattern a case's name must match, or null for every case.
 * Returns: The cases, built on demand; iterate once.
 */
export function buildMotionCaptureCases(
  names: readonly string[],
  only: RegExp | null,
): Iterable<IMotionCaptureCase> {
  const factories: ((
    only?: (name: string) => boolean,
  ) => Iterable<IMotionCaptureCase>)[] = names.map(
    (
      name: string,
    ): ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>) => {
      const factory:
        | ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>)
        | undefined = MOTION_CAPTURE_CASES[name];
      if (factory === undefined) throw new Error(`Unknown case ${name}`);
      return factory;
    },
  );
  const filter: ((name: string) => boolean) | undefined =
    only === null
      ? undefined
      : (candidate: string): boolean => only.test(candidate);
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

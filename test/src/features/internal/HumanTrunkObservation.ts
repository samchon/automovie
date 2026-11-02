import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanTrunkObservation as Source } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkObservation";
import type { AutoMovieHumanThoracicCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCourse";
import type { AutoMovieHumanSkinCourse as Physical } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters as Parameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanSkinPathAudit as Skin } from "./HumanSkinPathAudit";

/** Optional local evidence sink; it observes the maintained test without replacing any producer. */
export namespace HumanTrunkObservation {
  /** Portable case milestones; all file/process ownership remains outside the test. */
  export type Event =
    | { kind: "start"; person: string; parameters: Parameters }
    | { kind: "source"; person: string; event: Source.IEvent }
    | { kind: "body"; person: string; body: Body }
    | { kind: "skin"; person: string; skin: Surface.IOutput }
    | { kind: "measurement"; person: string; expected: number; source: Course.IReading | Physical.IReading; skin: Skin.IReading }
    | { kind: "failure"; person: string; error: unknown }
    | { kind: "end"; person: string; milliseconds: number };

  /** Single operation-scoped sink; ordinary discovery has no listener or I/O. */
  let listener: ((event: Event) => void) | undefined;

  /** Ordinary discovery avoids constructing producer observation events. */
  export function listening(): boolean {
    return listener !== undefined;
  }

  /** Install one observer, then release its captured artifacts and state in finally. */
  export function listen(next: (event: Event) => void): () => void {
    if (listener !== undefined) throw new Error("A trunk case already has an evidence observer");
    listener = next;
    return (): void => { listener = undefined; };
  }

  /** Deliver unchanged actual data; the sink must not mutate its nested source objects. */
  export function publish(event: Event): void {
    listener?.(event);
  }
}

import { motionPrepared } from "../../compose/internal/motionPrepared";
import { humanPreparationReads } from "./humanPreparationReads";
import { prepareHumanPerformanceOrder } from "./prepareHumanPerformanceOrder";

/*
 * Prepare plans after placement and reprepare the dependent performers after
 * a stop or flight changes the display. Own the observed reads for this one
 * construction. Opaque callbacks use the full preparation on every pass.
 */
export function prepareHumanPerformancePlans(
  self: IPreparationState,
  tracked: boolean,
): (changed?: ReadonlySet<string>) => void {
  const dependencies: Map<string, Set<string>> = new Map();
  return (changed?: ReadonlySet<string>): void => {
    if (tracked && changed?.size === 0) return;
    const dirty: ReadonlySet<string> | undefined =
      tracked && changed !== undefined
        ? affected(dependencies, changed)
        : undefined;
    let reads: Set<string> | undefined;
    const run = (): void =>
      motionPrepared.evaluate(
        (): void =>
          prepareHumanPerformanceOrder(
            self.people.values(),
            (person: IPreparationPerson): readonly IPreparationAction[] =>
              dirty === undefined || dirty.has(person.performer.subject)
                ? [...person.segments, ...person.overlays]
                : [],
            (person: IPreparationPerson, segment: IPreparationAction): void => {
              if (segment.plan.prepare === undefined) return;
              if (!tracked) return segment.plan.prepare();
              const subject: string = person.performer.subject;
              const previous: Set<string> | undefined = reads;
              reads = dependencies.get(subject)!;
              for (const source of humanPreparationReads.anchors(
                self,
                segment.context,
              ) ?? [])
                reads.add(source);
              try {
                segment.plan.prepare();
              } finally {
                reads = previous;
              }
            },
            (segment: IPreparationAction, seconds: number): boolean =>
              motionPrepared.needed(
                segment.plan,
                Math.max(seconds, segment.entryTime),
              ),
          ),
        tracked,
      );
    if (!tracked) return run();
    for (const subject of dirty ?? self.people.keys())
      dependencies.set(subject, new Set());
    humanPreparationReads.watch(
      self,
      (subject: string): void => {
        reads?.add(subject);
      },
      run,
    );
  };
}

/* The fixed cast and its preparation hooks after schedule placement. */
interface IPreparationState {
  people: ReadonlyMap<string, IPreparationPerson>;
}

interface IPreparationPerson extends prepareHumanPerformanceOrder.IPerson {
  performer: { subject: string };
  segments: readonly IPreparationAction[];
  overlays: readonly IPreparationAction[];
}

interface IPreparationAction extends prepareHumanPerformanceOrder.IAction {
  context: object;
  plan: { prepare?(): void };
}

/* Walk the reverse performer dependencies, including cycles, once per pass. */
function affected(
  dependencies: ReadonlyMap<string, ReadonlySet<string>>,
  changed: ReadonlySet<string>,
): ReadonlySet<string> {
  const readers: Map<string, string[]> = new Map();
  for (const [reader, reads] of dependencies)
    for (const source of reads) {
      const rest: string[] = readers.get(source) ?? [];
      rest.push(reader);
      readers.set(source, rest);
    }
  const dirty: Set<string> = new Set(changed);
  for (const source of dirty)
    for (const reader of readers.get(source) ?? []) dirty.add(reader);
  return dirty;
}

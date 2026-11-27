import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, AutoMovieMotionHumanVerdicts } from "@automovie/motions";
import { AutoMovieRenderFrameGrid } from "@automovie/render";

import { PlaygroundPerformance } from "../../playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../playground/structures/IPlaygroundRefusal";
import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";
import type { IPlaygroundVerdicts } from "../../playground/structures/IPlaygroundVerdicts";
import { SceneTrack } from "../../scenes/SceneTrack";
import { SceneArchetype } from "../../scenes/package/SceneArchetype";
import type { ITake } from "../structures/ITake";
import type { ITakeRequest } from "../structures/ITakeRequest";
import type { ITakeResponse } from "../structures/ITakeResponse";

/**
 * What the take worker computes with the packages: a composition's take and its
 * verdicts. The scene views, the playground and the build's bake reach the
 * packages only through here, so a scene shows the performance the playground
 * shows for the same composition.
 *
 * Nothing here touches the page or the worker's scope, so a Node test calls it
 * directly.
 */
export namespace TakeCompute {
  /** The entry name of a prop's frame in a track. */
  export const PROP: string = "frame";

  /** Each body's rest bones and track order, read once per worker. */
  const rests: Map<string, { bones: ITake.IFigure["bones"]; order: string[] }> =
    new Map();

  /** An optional observation of the build and frame stages of this take. */
  export type Observe = (
    performance: IAutoMovieMotionHumanPerformance,
    preparationMs: number,
    samplingMs: number,
  ) => void;

  /**
   * The performance built last, which a verdict request on the same composition
   * reads without building it again.
   */
  let last: {
    key: string;
    performance: IAutoMovieMotionHumanPerformance;
  } | null = null;

  /**
   * Answer one request.
   *
   * @param request The request.
   * @returns The answer, and the buffers to transfer with it.
   */
  export function answer(request: ITakeRequest): {
    response: ITakeResponse;
    transfer: ArrayBuffer[];
  } {
    try {
      if (request.kind === "verdicts")
        return {
          response: {
            kind: "verdicts",
            id: request.id,
            verdicts: verdicts(request.composition),
          },
          transfer: [],
        };
      const made: ITake | IPlaygroundRefusal = take(
        request.composition,
        request.fps,
      );
      return "track" in made
        ? {
            response: { kind: "take", id: request.id, take: made },
            transfer: [made.track.values.buffer as ArrayBuffer],
          }
        : {
            response: { kind: "refusal", id: request.id, refusal: made },
            transfer: [],
          };
    } catch (error) {
      return {
        response: {
          kind: "error",
          id: request.id,
          message: error instanceof Error ? error.message : String(error),
        },
        transfer: [],
      };
    }
  }

  /**
   * Compute a composition's take: plan it, then pose every figure and place
   * every prop at each frame of the rate and at the exact end.
   *
   * Planning costs seconds and each pose tens of milliseconds, which is why
   * this runs in a worker and the rate is a parameter.
   *
   * @param composition The composition.
   * @param fps Frames a second of the track.
   * @param observe An optional local measurement of the built performance and
   *   of the two stages that produced its frame samples.
   * @returns The take, or the refusal the packages gave while planning it or
   *   posing a frame.
   */
  export function take(
    composition: IPlaygroundComposition,
    fps: number,
    observe?: Observe,
  ): ITake | IPlaygroundRefusal {
    let built: PlaygroundPerformance.IBuilt;
    const frames: SceneTrack.IPlacement[][][] = [];
    const objects: IPlaygroundComposition.IObject[] = composition.objects ?? [];
    const props: string[] = objects.map(
      (o: IPlaygroundComposition.IObject): string => o.subject,
    );

    // A law may refuse while a frame is posed as well as while the chain is
    // planned; both are the composition's refusal.
    const started: number = observe === undefined ? 0 : performance.now();
    let prepared: number = 0;
    try {
      built = PlaygroundPerformance.build(composition);
      if (observe !== undefined) prepared = performance.now();
      last = {
        key: JSON.stringify(composition),
        performance: built.performance,
      };
      const duration: number = built.performance.duration;
      const readers: ((seconds: number) => SceneTrack.IPlacement[])[] =
        objects.map(propReader(built.performance));
      const lastFrame: number = AutoMovieRenderFrameGrid.last(duration, fps);
      for (let k: number = 0; k <= lastFrame; k++) {
        const seconds: number = AutoMovieRenderFrameGrid.time(k, duration, fps);
        frames.push([
          ...built.figures.map(
            (figure: PlaygroundPerformance.IFigure): SceneTrack.IPlacement[] =>
              AutoMovieHumanCanonicalBody.display(
                figure.canonical,
                built.performance.pose(figure.subject, seconds),
              ).posed,
          ),

          ...readers.map(
            (
              read: (seconds: number) => SceneTrack.IPlacement[],
            ): SceneTrack.IPlacement[] => read(seconds),
          ),
        ]);
      }
    } catch (error) {
      return refusal(error);
    }
    observe?.(
      built.performance,
      prepared - started,
      performance.now() - prepared,
    );

    const figures: ITake.IFigure[] = built.figures.map(
      (figure: PlaygroundPerformance.IFigure): ITake.IFigure => ({
        subject: figure.subject,
        body: figure.body,
        bones: rest(figure).bones,
      }),
    );
    const orders: string[][] = [
      ...built.figures.map(
        (figure: PlaygroundPerformance.IFigure): string[] => rest(figure).order,
      ),
      ...frames[0]!
        .slice(figures.length)
        .map((group: SceneTrack.IPlacement[]): string[] =>
          group.map((entry: SceneTrack.IPlacement): string => entry.bone),
        ),
    ];
    return {
      duration: built.performance.duration,
      track: {
        fps,
        frames: frames.length,
        duration: built.performance.duration,
        orders,
        values: SceneTrack.encode(frames, orders),
      },
      reflection: [...AutoMovieHumanCanonicalBody.REFLECTION],
      figures,
      props,
      timeline: timeline(built.performance, composition),
    };
  }

  /**
   * Read a prop's world frame and the local frames of the parts its native
   * articulation moves. The performance keeps each degree's last written value
   * at the end, so props with no written state need no part tracks.
   */
  function propReader(
    performance: IAutoMovieMotionHumanPerformance,
  ): (
    object: IPlaygroundComposition.IObject,
  ) => (seconds: number) => SceneTrack.IPlacement[] {
    return (object: IPlaygroundComposition.IObject) => {
      const subject: string = object.subject;
      const driven: boolean =
        Object.keys(performance.state(subject, performance.duration)).length !==
        0;
      const model: SceneArchetype.Model | null = driven
        ? SceneArchetype.model(object)
        : null;
      const moving: Set<string> = new Set(
        model?.affordances.flatMap(
          (affordance: IAutoMovieAffordance): readonly string[] =>
            affordance.parts ?? [],
        ) ?? [],
      );
      let previous: string | undefined;
      let parts: SceneTrack.IPlacement[] = [];
      return (seconds: number): SceneTrack.IPlacement[] => {
        const frame: IAutoMovieRigidTransform = performance.prop(
          subject,
          seconds,
        );
        if (model !== null && moving.size !== 0) {
          const state: Record<string, number> = performance.state(
            subject,
            seconds,
          );
          const key: string = JSON.stringify(state);
          if (key !== previous) {
            const posed: SceneArchetype.Model =
              Object.keys(state).length === 0 ? model : model.articulate(state);
            parts = posed.parts
              .filter((part: IAutoMovieModelPart): boolean =>
                moving.has(part.id),
              )
              .map((part: IAutoMovieModelPart): SceneTrack.IPlacement => {
                const transform: IAutoMovieModelPart["transform"] =
                  part.transform;
                return {
                  bone: SceneTrack.PROP_PART + part.id,
                  position:
                    transform === null
                      ? [0, 0, 0]
                      : [
                          transform.translation.x,
                          transform.translation.y,
                          transform.translation.z,
                        ],
                  rotation:
                    transform === null
                      ? [0, 0, 0, 1]
                      : [
                          transform.rotation.x,
                          transform.rotation.y,
                          transform.rotation.z,
                          transform.rotation.w,
                        ],
                };
              });
            previous = key;
          }
        }
        return [
          {
            bone: PROP,
            position: [frame.position.x, frame.position.y, frame.position.z],
            rotation: [
              frame.rotation.x,
              frame.rotation.y,
              frame.rotation.z,
              frame.rotation.w,
            ],
          },
          ...parts,
        ];
      };
    };
  }

  /**
   * Read every physical bound on a composition's performance. This samples the
   * whole film and can take from seconds to minutes.
   *
   * @param composition The composition, built again unless it was built last.
   * @returns The report.
   * @throws {AutoMovieMotionHumanRefusal} When the packages refuse the composition.
   */
  export function verdicts(
    composition: IPlaygroundComposition,
  ): IPlaygroundVerdicts {
    const key: string = JSON.stringify(composition);
    const performance: IAutoMovieMotionHumanPerformance =
      last !== null && last.key === key
        ? last.performance
        : PlaygroundPerformance.build(composition).performance;
    last = { key, performance };
    const report: IAutoMovieMotionHumanVerdicts.IReport =
      AutoMovieMotionHumanVerdicts.read(performance);
    return {
      clean: report.clean,
      text: AutoMovieMotionHumanVerdicts.describe(report),
      findings: report.findings.map(
        (
          finding: IAutoMovieMotionHumanVerdicts.IFinding,
        ): IPlaygroundVerdicts.IFinding => ({
          ...finding,
        }),
      ),
    };
  }

  /** A figure's rest bones and the order its placements come in. */
  function rest(figure: PlaygroundPerformance.IFigure): {
    bones: ITake.IFigure["bones"];
    order: string[];
  } {
    const known:
      | { bones: ITake.IFigure["bones"]; order: string[] }
      | undefined = rests.get(figure.body);
    if (known !== undefined) return known;
    const display: ReturnType<typeof AutoMovieHumanCanonicalBody.display> =
      AutoMovieHumanCanonicalBody.display(figure.canonical);
    const made: { bones: ITake.IFigure["bones"]; order: string[] } = {
      bones: display.bones,
      order: display.posed.map((p: { bone: string }): string => p.bone),
    };
    rests.set(figure.body, made);
    return made;
  }

  /**
   * A thrown value as the playground's refusal: a `AutoMovieMotionHumanRefusal` field for
   * field, anything else as an error with its message.
   */
  function refusal(error: unknown): IPlaygroundRefusal {
    if (error instanceof AutoMovieMotionHumanRefusal)
      return {
        kind: error.kind,
        message: error.message,
        performer: error.performer,
        act: error.act,
        instance: error.instance,
        axis: error.axis,
        value: error.value,
        feasible:
          error.feasible === null
            ? null
            : AutoMovieMotionHumanRefusal.describe(error.feasible),
        alternatives:
          error.feasible !== null && error.feasible.kind === "alternatives"
            ? [...error.feasible.values]
            : [],
        fix: error.fix,
      };
    return {
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
      performer: "",
      act: "",
      instance: 0,
      axis: "",
      value: undefined,
      feasible: null,
      alternatives: [],
      fix: "",
    };
  }

  /**
   * The placed actions of every performer, with each action's named instants
   * inside its span.
   */
  function timeline(
    performance: IAutoMovieMotionHumanPerformance,
    composition: IPlaygroundComposition,
  ): IPlaygroundTimeline {
    const span: (
      segment: IAutoMovieMotionHumanSegment,
      overlay: boolean,
    ) => IPlaygroundTimeline.ISpan = (
      segment: IAutoMovieMotionHumanSegment,
      overlay: boolean,
    ): IPlaygroundTimeline.ISpan => ({
      name: segment.name,
      id: segment.id,
      from: segment.entryTime,
      to: segment.end,
      overlay,
      events: segment.plan.events
        .map(
          (event: {
            name: string;
            share: number;
          }): IPlaygroundTimeline.IEvent => ({
            name: event.name,
            seconds: segment.start + event.share * segment.plan.duration,
          }),
        )
        .filter(
          (event: IPlaygroundTimeline.IEvent): boolean =>
            event.seconds >= segment.entryTime - 1e-9 &&
            event.seconds <= segment.end + 1e-9,
        ),
    });

    // `overlays` exists only on releases whose chain has `over`.
    const overlays:
      | ((subject: string) => readonly IAutoMovieMotionHumanSegment[])
      | undefined = (
      performance as unknown as {
        overlays?: (subject: string) => readonly IAutoMovieMotionHumanSegment[];
      }
    ).overlays;
    return {
      duration: performance.duration,
      tracks: composition.performers.map(
        (
          performer: IPlaygroundComposition.IPerformer,
        ): IPlaygroundTimeline.ITrack => ({
          subject: performer.subject,
          spans: [
            ...performance
              .segments(performer.subject)
              .map(
                (s: IAutoMovieMotionHumanSegment): IPlaygroundTimeline.ISpan =>
                  span(s, false),
              ),
            ...(overlays === undefined
              ? []
              : overlays
                  .call(performance, performer.subject)
                  .map(
                    (
                      s: IAutoMovieMotionHumanSegment,
                    ): IPlaygroundTimeline.ISpan => span(s, true),
                  )),
          ],
        }),
      ),
    };
  }
}

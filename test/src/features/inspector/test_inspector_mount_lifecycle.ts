import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/render";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorScene,
  type IAutoMovieInspectorSceneHost,
  type IAutoMovieInspectorSubject,
  mountAutoMovieInspectorScene,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * The inspector's scene mount keeps one renderer and one frame loop alive across mount, dispose and mount on one canvas, draws only when something changed, and answers a refused request with the request it still draws.
 *
 * Scenarios:
 *
 * 1. As StrictMode runs an effect: mount, dispose before the instance arrives, mount again, then both instances arrive. The first instance is disposed on arrival without a renderer; the second gets the one renderer, one pending frame and one `ready` report listing its object and mark paths, the marks of its first second and the named views.
 * 2. The first frame renders once at the address's second; a frame with nothing changed renders nothing; a new canvas size resizes the renderer and renders again.
 * 3. Playing, frames 500 ms apart advance the playhead half a second each and seek the instance there; past the end the playhead stops at the duration.
 * 4. A request whose mark pattern matches no kind is refused with the request still drawn; a request asking for the supplied kind at a new second is applied, its legend reported, the playhead sought to that second, and drawn on the next frame.
 * 5. Dispose cancels the pending frame, removes the inspection's objects from the scene, disposes the renderer and the instance once; a second dispose and a later frame do nothing. A third mount on the same host leaves exactly one renderer alive.
 * 6. A subject whose creation fails, and one whose duration is zero, report the reason, create no renderer that stays alive and dispose the instance they got.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public mount against a recording host (renderer, frame clock and size) and a subject double with a real three.js scene, and asserts the host's and subject's records and the reports.
 * @evidence contracts/development/testing.md#independent-expectations The expected counts follow from the lifecycle the scenario performs (one live mount, one pending frame per live mount), the expected seconds from the frame times and the subject's two-second duration, and the expected scene children from the scene the test built.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a dispose before arrival against after, a changed against an unchanged frame, playing against the end, a refused against an accepted request, a first against a repeated dispose, and a failing creation against an invalid instance.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_mount_lifecycle`; the renderer and frame clock are recording doubles, so no browser, WebGL or React runs. Pictures belong to review.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export async function test_inspector_mount_lifecycle(): Promise<void> {
  const host: RecordingHost = new RecordingHost();
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  const request: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress("at=0.25");

  // 1. Mount, dispose before arrival, mount again.
  const first: RecordingSubject = new RecordingSubject(2);
  const firstReport: RecordingReport = new RecordingReport();
  mountAutoMovieInspectorScene({ subject: first, request, playhead, host, report: firstReport }).dispose();
  const second: RecordingSubject = new RecordingSubject(2);
  const report: RecordingReport = new RecordingReport();
  const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({ subject: second, request, playhead, host, report });
  await first.arrive();
  await second.arrive();
  TestValidator.equals("the early instance is disposed on arrival", first.disposed, 1);
  TestValidator.equals("one renderer, one pending frame", [host.renderers.length, host.frames.size], [1, 1]);
  TestValidator.equals("the disposed mount reports nothing", firstReport.facts.length, 0);
  TestValidator.equals("one ready report", report.facts.length, 1);
  const facts: IAutoMovieInspectorScene.IFacts = report.facts[0]!;
  TestValidator.equals("object and mark paths", facts.paths, ["hero", "prop", "hero/axis"]);
  TestValidator.predicate(
    "the first second's supplied marks",
    facts.marks.length === 1 && facts.marks[0]!.kind === "curve/axis",
  );
  TestValidator.predicate("named views", facts.views.includes("front"));
  TestValidator.equals("the playhead takes the duration and the address's second", [playhead.getSnapshot().durationSeconds, playhead.getSnapshot().seconds], [2, 0.25]);

  // 2. Draw only on change.
  const renderer: RecordingRenderer = host.renderers[0]!;
  host.run(0);
  TestValidator.equals("the first frame renders", renderer.renders, 1);
  TestValidator.equals("at the address's second", second.instance!.seeks.at(-1), 0.25);
  host.run(16);
  TestValidator.equals("an unchanged frame renders nothing", renderer.renders, 1);
  host.width = 800;
  host.run(32);
  TestValidator.equals("a new size resizes and renders", [renderer.sizes.at(-1), renderer.renders], [[800, 360], 2]);

  // 3. Playback.
  playhead.play();
  host.run(532);
  TestValidator.equals("half a second later", second.instance!.seeks.at(-1), 0.75);
  host.run(10_000);
  TestValidator.equals("the end stops playback", [playhead.getSnapshot().seconds, playhead.getSnapshot().playing], [2, false]);

  // 4. Refused and accepted requests.
  const refused: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress("marks=nothing");
  mounted.apply(refused);
  TestValidator.equals("a refused request is reported", report.refusals.length, 1);
  TestValidator.predicate("with the request still drawn", report.refusals[0]![0] === request);
  const marked: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress("marks=curve/*&at=1");
  mounted.apply(marked);
  TestValidator.equals("an accepted request is not refused", report.refusals.length, 1);
  TestValidator.predicate(
    "its legend is reported",
    report.legends.at(-1)!.some((entry: IAutoMovieInspectionLegendEntry): boolean => entry.label === "curve/axis" && entry.count === 1),
  );
  TestValidator.equals("the request's new second is sought", playhead.getSnapshot().seconds, 1);
  const drawn: number = renderer.renders;
  host.run(10_100);
  TestValidator.equals("and drawn on the next frame", renderer.renders, drawn + 1);

  // 5. Dispose and mount again.
  mounted.dispose();
  TestValidator.equals("no frame pending", host.frames.size, 0);
  TestValidator.equals("only the two quads the test built remain", second.instance!.scene.children.map((child: THREE.Object3D): string => child.name), ["hero", "prop"]);
  TestValidator.equals("renderer and instance disposed once", [renderer.disposed, second.disposed], [1, 1]);
  mounted.dispose();
  TestValidator.equals("a second dispose does nothing", [renderer.disposed, second.disposed], [1, 1]);
  const third: RecordingSubject = new RecordingSubject(2);
  const again: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({ subject: third, request, playhead, host, report: new RecordingReport() });
  await third.arrive();
  TestValidator.equals(
    "one renderer alive after mounting again",
    host.renderers.filter((candidate: RecordingRenderer): boolean => candidate.disposed === 0).length,
    1,
  );
  TestValidator.equals("one frame pending", host.frames.size, 1);
  again.dispose();

  // 6. Failures.
  const failing: RecordingSubject = new RecordingSubject(2);
  const failed: RecordingReport = new RecordingReport();
  mountAutoMovieInspectorScene({ subject: failing, request, playhead, host, report: failed });
  await failing.fail(new Error("no such film"));
  TestValidator.equals("a failed creation is reported", failed.errors, ["no such film"]);
  const empty: RecordingSubject = new RecordingSubject(0);
  const invalid: RecordingReport = new RecordingReport();
  mountAutoMovieInspectorScene({ subject: empty, request, playhead, host, report: invalid });
  await empty.arrive();
  TestValidator.predicate("a zero duration is reported", invalid.errors.length === 1 && invalid.errors[0]!.includes("duration"));
  TestValidator.equals("and its instance disposed", empty.disposed, 1);
  TestValidator.equals(
    "no renderer stays alive",
    host.renderers.filter((candidate: RecordingRenderer): boolean => candidate.disposed === 0).length,
    0,
  );
}

/** A renderer that counts what it is asked to do. */
class RecordingRenderer implements IAutoMovieInspectorSceneHost.IRenderer {
  public localClippingEnabled: boolean = false;
  public renders: number = 0;
  public disposed: number = 0;
  public readonly sizes: [number, number][] = [];

  public render(): void {
    ++this.renders;
  }

  public setPixelRatio(): void {}

  public setSize(width: number, height: number): void {
    this.sizes.push([width, height]);
  }

  public dispose(): void {
    ++this.disposed;
  }
}

/** A host whose frames run when the test says, with a settable size. */
class RecordingHost implements IAutoMovieInspectorSceneHost {
  public readonly renderers: RecordingRenderer[] = [];
  public readonly frames: Map<number, (nowMs: number) => void> = new Map();
  public width: number = 640;
  private next_: number = 1;

  public createRenderer(): RecordingRenderer {
    const renderer: RecordingRenderer = new RecordingRenderer();
    this.renderers.push(renderer);
    return renderer;
  }

  public requestFrame(callback: (nowMs: number) => void): number {
    this.frames.set(this.next_, callback);
    return this.next_++;
  }

  public cancelFrame(handle: number): void {
    this.frames.delete(handle);
  }

  public size(): IAutoMovieInspectorSceneHost.ISize {
    return { width: this.width, height: 360, pixelRatio: 1 };
  }

  /** Run every pending frame at one time. */
  public run(nowMs: number): void {
    const pending: ((nowMs: number) => void)[] = [...this.frames.values()];
    this.frames.clear();
    for (const callback of pending) callback(nowMs);
  }
}

/** One instance of the recording subject: two named quads and one supplied mark. */
class RecordingInstance implements IAutoMovieInspectorSubject.IInstance {
  public readonly scene: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("hero", -2),
    InspectionScene.quad("prop", 2),
  );
  public readonly camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  public readonly width: number = 640;
  public readonly height: number = 360;
  public readonly seeks: number[] = [];

  public constructor(
    public readonly durationSeconds: number,
    private readonly owner_: RecordingSubject,
  ) {
    this.camera.position.set(0, 0, 8);
  }

  public marks = (): ReturnType<NonNullable<IAutoMovieInspectorSubject.IInstance["marks"]>> => [
    InspectionScene.mark("hero/axis", "curve/axis", 0x00a0ff, { type: "polyline", points: [-2, -1, 0, -2, 1, 0], closed: false }),
  ];

  public seek(seconds: number): void {
    this.seeks.push(seconds);
  }

  public dispose(): void {
    ++this.owner_.disposed;
  }
}

/** A subject whose creation the test settles. */
class RecordingSubject implements IAutoMovieInspectorSubject {
  public readonly name: string = "recorded";
  public disposed: number = 0;
  public instance: RecordingInstance | undefined;
  private settle_: ((instance: RecordingInstance) => void) | undefined;
  private reject_: ((error: Error) => void) | undefined;
  private promise_: Promise<RecordingInstance> | undefined;

  public constructor(private readonly duration_: number) {}

  public create(): Promise<RecordingInstance> {
    this.promise_ = new Promise<RecordingInstance>(
      (resolve: (instance: RecordingInstance) => void, reject: (error: Error) => void): void => {
        this.settle_ = resolve;
        this.reject_ = reject;
      },
    );
    return this.promise_;
  }

  /** Deliver the instance and let the mount take it. */
  public async arrive(): Promise<void> {
    this.instance = new RecordingInstance(this.duration_, this);
    this.settle_!(this.instance);
    await this.promise_;
    await Promise.resolve();
  }

  /** Fail the creation and let the mount hear it. */
  public async fail(error: Error): Promise<void> {
    this.reject_!(error);
    await this.promise_!.catch((): void => {});
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
}

/** A report that keeps every event. */
class RecordingReport implements IAutoMovieInspectorScene.IReport {
  public readonly facts: IAutoMovieInspectorScene.IFacts[] = [];
  public readonly legends: IAutoMovieInspectionLegendEntry[][] = [];
  public readonly errors: string[] = [];
  public readonly refusals: [IAutoMovieCapturePlanRequest, string][] = [];

  public ready(facts: IAutoMovieInspectorScene.IFacts): void {
    this.facts.push(facts);
  }

  public legend(entries: IAutoMovieInspectionLegendEntry[]): void {
    this.legends.push(entries);
  }

  public labels(): void {}

  public error(message: string | null): void {
    if (message !== null) this.errors.push(message);
  }

  public refused(request: IAutoMovieCapturePlanRequest, message: string): void {
    this.refusals.push([request, message]);
  }
}

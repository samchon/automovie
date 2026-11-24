import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorScene,
  mountAutoMovieInspectorScene,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { InspectorMountRecording } from "../../../internal/InspectorMountRecording";

/**
 * The inspector's scene mount keeps one renderer and one frame loop alive
 * across mount, dispose and mount on one canvas, draws only when something
 * changed, and answers a refused request with the request it still draws.
 *
 * Scenarios:
 *
 * 1. Mount, dispose before arrival, and mount again. The second mount admits a
 *    declared contact kind before any contact mark appears and gives its name
 *    to the selection panel.
 * 2. The first frame renders once at the address's second; a frame with nothing
 *    changed renders nothing; a new canvas size resizes the renderer and
 *    renders again.
 * 3. Playing, frames 500 ms apart advance the playhead half a second each and seek
 *    the instance there; past the end the playhead stops at the duration.
 * 4. A request whose mark pattern matches no kind is refused with the request
 *    still drawn. A declared contact pattern is accepted on a silent frame,
 *    then gains one legend entry at the requested contact second.
 * 5. A pending seek blocks other seeks and drawing. The completed seek draws the
 *    expired contact frame with an empty legend, then the next frame seeks to
 *    the newest second.
 * 6. Dispose with a seek pending cancels the pending frame, removes the
 *    inspection's objects from the scene, disposes the renderer and the
 *    instance once, and the seek resolving afterwards draws nothing; a second
 *    dispose does nothing. A third mount on the same host leaves exactly one
 *    renderer alive.
 * 7. A subject whose creation fails, and one whose duration is zero, report the
 *    reason, create no renderer that stays alive and dispose the instance they
 *    got.
 */
export async function test_unit_viewer_inspector_mount_lifecycle(): Promise<void> {
  const host: InspectorMountRecording.Host = new InspectorMountRecording.Host();
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  const request: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress(
    "marks=contact&at=0.25",
  );

  // 1. Mount, dispose before arrival, mount again.
  const first: InspectorMountRecording.Subject =
    new InspectorMountRecording.Subject(2);
  const firstReport: InspectorMountRecording.Report =
    new InspectorMountRecording.Report();
  mountAutoMovieInspectorScene({
    name: "recorded",
    subject: first,
    request,
    playhead,
    host,
    report: firstReport,
  }).dispose();
  const second: InspectorMountRecording.Subject =
    new InspectorMountRecording.Subject(2);
  const report: InspectorMountRecording.Report =
    new InspectorMountRecording.Report();
  const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
    name: "recorded",
    subject: second,
    request,
    playhead,
    host,
    report,
  });
  await first.arrive();
  await second.arrive();
  TestValidator.equals(
    "the early instance is disposed on arrival",
    first.disposed,
    1,
  );
  TestValidator.equals(
    "one renderer, one pending frame",
    [host.renderers.length, host.frames.size],
    [1, 1],
  );
  TestValidator.equals(
    "the disposed mount reports nothing",
    firstReport.facts.length,
    0,
  );
  TestValidator.equals("one ready report", report.facts.length, 1);
  TestValidator.equals("silent contact is admitted", report.refusals, []);
  const facts: IAutoMovieInspectorScene.IFacts = report.facts[0]!;
  TestValidator.equals("silent contact is selectable", facts.markKinds, [
    "contact",
  ]);
  TestValidator.equals("object and mark paths", facts.paths, [
    "hero",
    "prop",
    "hero/axis",
  ]);
  TestValidator.predicate(
    "the first second's supplied marks",
    facts.marks.length === 1 && facts.marks[0]!.kind === "curve/axis",
  );
  TestValidator.predicate("named views", facts.views.includes("front"));
  TestValidator.equals(
    "the playhead takes the duration and the address's second",
    [playhead.getSnapshot().durationSeconds, playhead.getSnapshot().seconds],
    [2, 0.25],
  );

  // 2. Draw only on change.
  const renderer: InspectorMountRecording.Renderer = host.renderers[0]!;
  await host.run(0);
  TestValidator.equals("the first frame renders", renderer.renders, 1);
  TestValidator.equals(
    "at the address's second",
    second.instance!.seeks.at(-1),
    0.25,
  );
  await host.run(16);
  TestValidator.equals(
    "an unchanged frame renders nothing",
    renderer.renders,
    1,
  );
  host.width = 800;
  await host.run(32);
  TestValidator.equals(
    "a new size resizes and renders",
    [renderer.sizes.at(-1), renderer.renders],
    [[800, 360], 2],
  );

  // 3. Playback.
  playhead.play();
  await host.run(532);
  TestValidator.equals(
    "half a second later",
    second.instance!.seeks.at(-1),
    0.75,
  );
  await host.run(10_000);
  TestValidator.equals(
    "the end stops playback",
    [playhead.getSnapshot().seconds, playhead.getSnapshot().playing],
    [2, false],
  );

  // 4. Refused and accepted requests.
  const refused: IAutoMovieCapturePlanRequest =
    readAutoMovieInspectorAddress("marks=nothing");
  mounted.apply(refused);
  TestValidator.equals(
    "a refused request is reported",
    report.refusals.length,
    1,
  );
  TestValidator.predicate(
    "with the request still drawn",
    report.refusals[0]![0] === request,
  );
  const marked: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress(
    "marks=contact*&at=1",
  );
  mounted.apply(marked);
  TestValidator.equals(
    "an accepted request is not refused",
    report.refusals.length,
    1,
  );
  TestValidator.equals("no contact before seek", report.legends.at(-1), []);
  TestValidator.equals(
    "the request's new second is sought",
    playhead.getSnapshot().seconds,
    1,
  );
  const drawn: number = renderer.renders;
  await host.run(10_100);
  TestValidator.equals(
    "and drawn on the next frame",
    renderer.renders,
    drawn + 1,
  );
  TestValidator.predicate(
    "the contact second reports one actual mark",
    report.legends
      .at(-1)!
      .some(
        (entry: IAutoMovieInspectionLegendEntry): boolean =>
          entry.label === "contact" && entry.count === 1,
      ),
  );

  // 5. A seek that resolves late.
  const instance: InspectorMountRecording.Instance = second.instance!;
  instance.hold = true;
  playhead.seek(1.5);
  await host.run(10_200);
  TestValidator.equals("a slow seek starts", instance.seeks.at(-1), 1.5);
  TestValidator.equals("and draws nothing yet", renderer.renders, drawn + 1);
  playhead.seek(1.75);
  const started: number = instance.seeks.length;
  await host.run(10_216);
  TestValidator.equals(
    "no second seek starts while one is pending",
    instance.seeks.length,
    started,
  );
  instance.hold = false;
  await instance.settle();
  TestValidator.equals("no expired contact", report.legends.at(-1), []);
  TestValidator.equals(
    "the picture is drawn when the seek resolves",
    renderer.renders,
    drawn + 2,
  );
  await host.run(10_232);
  TestValidator.equals(
    "the next frame seeks the newest second",
    [instance.seeks.at(-1), renderer.renders],
    [1.75, drawn + 3],
  );
  instance.hold = true;
  playhead.seek(0.5);
  await host.run(10_248);

  // 6. Dispose, with a seek still pending, and mount again.
  mounted.dispose();
  await instance.settle();
  TestValidator.equals(
    "a seek resolving after dispose draws nothing",
    renderer.renders,
    drawn + 3,
  );
  TestValidator.equals("no frame pending", host.frames.size, 0);
  TestValidator.equals(
    "only the two quads the test built remain",
    second.instance!.scene.children.map(
      (child: THREE.Object3D): string => child.name,
    ),
    ["hero", "prop"],
  );
  TestValidator.equals(
    "renderer and instance disposed once",
    [renderer.disposed, second.disposed],
    [1, 1],
  );
  mounted.dispose();
  TestValidator.equals(
    "a second dispose does nothing",
    [renderer.disposed, second.disposed],
    [1, 1],
  );
  const third: InspectorMountRecording.Subject =
    new InspectorMountRecording.Subject(2);
  const again: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
    name: "recorded",
    subject: third,
    request,
    playhead,
    host,
    report: new InspectorMountRecording.Report(),
  });
  await third.arrive();
  TestValidator.equals(
    "one renderer alive after mounting again",
    host.renderers.filter(
      (candidate: InspectorMountRecording.Renderer): boolean =>
        candidate.disposed === 0,
    ).length,
    1,
  );
  TestValidator.equals("one frame pending", host.frames.size, 1);
  again.dispose();

  // 7. Failures.
  const failing: InspectorMountRecording.Subject =
    new InspectorMountRecording.Subject(2);
  const failed: InspectorMountRecording.Report =
    new InspectorMountRecording.Report();
  mountAutoMovieInspectorScene({
    name: "recorded",
    subject: failing,
    request,
    playhead,
    host,
    report: failed,
  });
  await failing.fail(new Error("no such film"));
  TestValidator.equals("a failed creation is reported", failed.errors, [
    "no such film",
  ]);
  const empty: InspectorMountRecording.Subject =
    new InspectorMountRecording.Subject(0);
  const invalid: InspectorMountRecording.Report =
    new InspectorMountRecording.Report();
  mountAutoMovieInspectorScene({
    name: "recorded",
    subject: empty,
    request,
    playhead,
    host,
    report: invalid,
  });
  await empty.arrive();
  TestValidator.predicate(
    "a zero duration is reported",
    invalid.errors.length === 1 && invalid.errors[0]!.includes("duration"),
  );
  TestValidator.equals("and its instance disposed", empty.disposed, 1);
  TestValidator.equals(
    "no renderer stays alive",
    host.renderers.filter(
      (candidate: InspectorMountRecording.Renderer): boolean =>
        candidate.disposed === 0,
    ).length,
    0,
  );
}

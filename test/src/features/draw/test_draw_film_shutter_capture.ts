import { planAutoMovieFilmSamples } from "@automovie/engine";
import type {
  IAutoMovieDrawCall,
  IAutoMovieFilmOptics,
  IAutoMovieInspectionRequest,
} from "@automovie/interface";
import {
  AutoMovieDrawFilm,
  isAutoMovieDrawFilmPicture,
  isAutoMoviePlainBeautyRequest,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { createRecordedFilmSubject } from "./createRecordedFilmSubject";

/**
 * A plain `beauty` capture of a second is the delivered frame of that second,
 * accumulated from the same shutter samples, while a capture that inspects
 * anything, marks included, is one sharp sample at its second.
 *
 * Scenarios, on a subject without springs whose optics set a 180° shutter over
 * two samples at 24 fps, at second 10/24:
 *
 * 1. A delivery draw and a capture with the plain request are the film picture;
 *    the plain request is the one `isAutoMoviePlainBeautyRequest` accepts.
 * 2. A capture with marks, parts, hiding, a trail, colouring, a label, a section
 *    or x-ray is not, each refused by `isAutoMoviePlainBeautyRequest`, and no
 *    structural pass is, delivered or not; a plain `graphics` plate is.
 * 3. Drawn as the film picture, the plain capture places the subject at the two
 *    strata midpoints of the trailing 1/48 s interval, then at 10/24 s, and
 *    draws the accumulated samples: the steps of the delivered frame, so its
 *    pixels are frame 10's.
 * 4. Drawn as the capture with marks is, the picture accumulates nothing: it never
 *    places a sample second and draws one sharp sample at 10/24 s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the subject, the second, each request and the picture each scenario expects.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the draw host's film-picture rule and `AutoMovieDrawFilm` over a recording subject and beauty owner, asserting which draws are the film's and the placements and draws each makes; a capture sampled despite its marks, a plain capture drawn sharp, or a structural pass sampled fails.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4078's rule: delivery draws and plain beauty captures accumulate, every other draw is one sharp sample; the sample seconds are the strata midpoints of the trailing 180/360/24 = 1/48 s interval, computed here.
 * @evidence contracts/development/testing.md#distinguishing-cases A delivery draw, the plain capture, each of the eight inspecting request fields, three structural shades and the plate. The page's pixels need a WebGL host and belong to a capture; the sample placement in a transition belongs to test_draw_film_transition_layers.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over a recording subject and beauty owner; no GPU starts.
 */
export async function test_draw_film_shutter_capture(): Promise<void> {
  const seconds: number = 10 / 24;
  const request: (text: string) => IAutoMovieInspectionRequest = (
    text: string,
  ): IAutoMovieInspectionRequest => {
    const params: URLSearchParams = new URLSearchParams(text);
    return parseAutoMovieInspectionRequest((key: string): string | null =>
      params.get(key),
    );
  };
  const call: (
    text: string,
    delivery: boolean,
  ) => Pick<IAutoMovieDrawCall, "request" | "inspectionDiagnostics"> = (
    text: string,
    delivery: boolean,
  ): Pick<IAutoMovieDrawCall, "request" | "inspectionDiagnostics"> => ({
    request: request(text),
    ...(delivery ? { inspectionDiagnostics: "delivery" as const } : {}),
  });

  // 1. Delivery and the plain capture.
  TestValidator.equals(
    "a delivery draw and a plain capture are the film picture",
    [
      isAutoMovieDrawFilmPicture(call("", true)),
      isAutoMovieDrawFilmPicture(call("", false)),
      isAutoMoviePlainBeautyRequest(request("")),
    ],
    [true, true, true],
  );

  // 2. Inspecting captures, structural passes and the plate.
  const inspecting: string[] = [
    "marks=edge",
    "parts=hero",
    "hide=hero",
    "trail=hero",
    "color=hero=ff8800",
    "label=hero",
    "section=x:0.2",
    "xray",
  ];
  TestValidator.equals(
    "a capture that inspects anything is not the film picture",
    inspecting.map((text: string): boolean[] => [
      isAutoMovieDrawFilmPicture(call(text, false)),
      isAutoMoviePlainBeautyRequest(request(text)),
    ]),
    inspecting.map((): boolean[] => [false, false]),
  );
  TestValidator.equals(
    "no structural pass is the film picture; a plain plate is",
    [
      isAutoMovieDrawFilmPicture(call("shade=depth", true)),
      isAutoMovieDrawFilmPicture(call("shade=mask", false)),
      isAutoMovieDrawFilmPicture(call("shade=normal", true)),
      isAutoMovieDrawFilmPicture(call("shade=graphics", false)),
    ],
    [false, false, false, true],
  );

  // 3 and 4. The pictures each rule gives.
  const optics: IAutoMovieFilmOptics = {
    ev100: 10,
    toneMapping: "none",
    samples: 2,
    shutter: { angle: 180 },
  };
  const samples: number[] = planAutoMovieFilmSamples({
    seconds,
    fps: 24,
    optics,
    fovY: 45,
  }).map((sample: { seconds: number }): number => sample.seconds);
  TestValidator.predicate(
    "the samples are the strata midpoints of the trailing 1/48 s",
    samples.length === 2 &&
      nclose(samples[0]!, seconds - (1 / 48) * 0.75, 1e-12) &&
      nclose(samples[1]!, seconds - (1 / 48) * 0.25, 1e-12),
  );
  const plain: string[] = await drawn(
    isAutoMovieDrawFilmPicture(call("", false)),
    seconds,
  );
  const delivered: string[] = await drawn(
    isAutoMovieDrawFilmPicture(call("", true)),
    seconds,
  );
  const marked: string[] = await drawn(
    isAutoMovieDrawFilmPicture(call("marks=edge", false)),
    seconds,
  );
  const at: (value: number) => string = (value: number): string =>
    `seek ${value.toFixed(9)}`;
  TestValidator.equals(
    "the plain capture accumulates the delivered frame's samples",
    plain,
    [at(seconds), at(samples[0]!), at(samples[1]!), at(seconds), "draw 2"],
  );
  TestValidator.equals("delivery draws the same steps", delivered, plain);
  TestValidator.equals("a capture with marks is one sharp sample", marked, [
    "draw 1",
  ]);
}

/**
 * The placements and draws of one picture of a one-shot recording subject at
 * `seconds`, as `AutoMovieDrawFilm` makes them before the host's own placement:
 * `seek <second>` for each placement and `draw <samples>` for the draw, the
 * samples the beauty owner accumulated or 1 for a sharp one.
 */
async function drawn(film: boolean, seconds: number): Promise<string[]> {
  const subject: createRecordedFilmSubject.IDouble = createRecordedFilmSubject({
    transition: null,
    seekShot: true,
    optics: true,
  });
  const steps: string[] = [];
  const beauty: AutoMovieDrawFilm.IProps["beauty"] = {
    sample: async (
      layer: Parameters<AutoMovieDrawFilm.IProps["beauty"]["sample"]>[0],
    ): Promise<IAutoMovieFilmOptics | undefined> => {
      // As `AutoMovieDrawBeauty.sample` and the accumulation place a layer.
      await layer.seek(layer.seconds);
      const optics: IAutoMovieFilmOptics | undefined = layer.scene.optics?.(
        layer.seconds,
      );
      if (optics?.samples === undefined) return undefined;
      for (const sample of planAutoMovieFilmSamples({
        seconds: layer.seconds,
        fps: layer.scene.fps,
        optics,
        fovY: 45,
      }))
        await layer.seek(sample.seconds);
      await layer.seek(layer.seconds);
      return optics;
    },
    draw: (
      layer: Parameters<AutoMovieDrawFilm.IProps["beauty"]["draw"]>[0],
    ): void => {
      steps.push(`draw ${layer.sampled?.samples ?? 1}`);
    },
    plate: (): void => {},
    hold: (): void => {},
    composite: (): void => {},
  };
  const camera: THREE.Camera = new THREE.PerspectiveCamera();
  const picture: AutoMovieDrawFilm = new AutoMovieDrawFilm({
    name: "film",
    scene: subject.subject,
    renderer: {} as THREE.WebGLRenderer,
    beauty,
    shade: "beauty",
    seconds,
    width: 64,
    height: 36,
    transparent: false,
    film,
    camera: (): THREE.Camera => camera,
    prepare: (): void => {},
    restore: (): void => {},
  });
  await picture.prepare();
  picture.draw(camera);

  // Every placement precedes the draw, so the placements lead the steps.
  return [
    ...subject.calls
      .filter(
        (entry: createRecordedFilmSubject.ICall): boolean =>
          entry.name === "seek" || entry.name === "seekShot",
      )
      .map(
        (entry: createRecordedFilmSubject.ICall): string =>
          `seek ${entry.numbers.at(-1)!.toFixed(9)}`,
      ),
    ...steps,
  ];
}

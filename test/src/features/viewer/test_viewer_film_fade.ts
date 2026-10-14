import {disposeFadeToBlack} from "../../../../packages/viewer/src/disposeFadeToBlack";
import {renderFadeToBlackFrame} from "../../../../packages/viewer/src/renderFadeToBlackFrame";
import {resolveAutoMovieFilmBeautyComposition} from "../../../../packages/viewer/src/resolveAutoMovieFilmBeautyComposition";
import type { AutoMovieFilmBeautyComposition } from "../../../../packages/viewer/src/AutoMovieFilmBeautyComposition";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import {namedFacts, nclose} from "../internal/predicates";
import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";
const captureError: (operation: () => void) => unknown=(operation:()=>void):unknown=>{try{operation();return undefined;}catch(error){return error;}};
/**
 * Builder-owned film weights select a beauty operator without resampling. These inputs exercise orchestration; this unit does not observe GPU color parity.
 *
 * Scenarios:
 * 1. Direct, fade and dissolve preserve sampled layer identity and weights.
 * 2. Unsupported cardinalities, weights and complementary sums refuse.
 * 3. Fade endpoints reach the byte shader and source callbacks run directly.
 * 4. Reuse, resize, release and recreation preserve renderer-local ownership.
 * 5. Render, copy and restoration failures retain every failure and restore unaffected state; a caller-owned target retains its canvas backing.
 * 6. A failed fade-copy retirement retains its exact completion, retires the healthy backing once and refuses later source callbacks without retry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampled-layer beauty resolution and fade ownership with the existing controlled renderer, observing callback identity/order, texture extent/identity and actual dispose events; catches dropped admission/restoration or failed-owner release retries without observing GPU color parity.
 * @evidence contracts/testing.md#independent-expectations Supplied layer objects and complementary weights pin operator identity, requested dimensions pin retained extent, named controlled failures pin source-before-restoration Error order, and actual event counts pin one release attempt per owned copy.
 * @evidence contracts/testing.md#distinguishing-cases Covers direct/fade/dissolve authority, malformed schedules, fade endpoints, renderer separation/resize/successful recreation, target backing and each source/copy/composite/restoration failure, then terminal failed retirement with a healthy copy and no later draw.
 * @evidence contracts/testing.md#execution-ownership Unit owns in-memory Three targets and the established explicit renderer-control fixture only, with no native context, browser or process; failure maps are supported case inputs rather than replacement foreign methods, and each new observation uses native texture events.
 */
export function test_viewer_film_fade(): void {
  const directLayer: { shot: string; weight: number; } = { shot: "shot-a", weight: 1 };
  const fadedLayer: { shot: string; weight: number; } = { shot: "shot-a", weight: 0.5 };
  const outgoing: { shot: string; weight: number; } = { shot: "shot-a", weight: 0.25 };
  const incoming: { shot: string; weight: number; } = { shot: "shot-b", weight: 0.75 };
  const direct: AutoMovieFilmBeautyComposition<{ shot: string; weight: number; }> = resolveAutoMovieFilmBeautyComposition([directLayer]);
  const fade: AutoMovieFilmBeautyComposition<{ shot: string; weight: number; }> = resolveAutoMovieFilmBeautyComposition([fadedLayer]);
  const dissolve: AutoMovieFilmBeautyComposition<{ shot: string; weight: number; }> = resolveAutoMovieFilmBeautyComposition([outgoing, incoming]);
  TestValidator.equals(
    "film beauty composition preserves sampled layer identity and weight",
    namedFacts([
      [
        "direct",
        (): boolean => direct.kind === "direct" && direct.layer === directLayer,
      ],
      [
        "fade",
        (): boolean =>
          fade.kind === "fade" &&
          fade.layer === fadedLayer &&
          nclose(fade.weight, 0.5, 0),
      ],
      [
        "dissolve",
        (): boolean =>
          dissolve.kind === "dissolve" &&
          dissolve.outgoing === outgoing &&
          dissolve.incoming === incoming &&
          nclose(dissolve.alpha, 0.75, 0),
      ],
    ]),
    { direct: true, fade: true, dissolve: true },
  );

  const invalid: unknown[] = [
    captureError((): AutoMovieFilmBeautyComposition<never> => resolveAutoMovieFilmBeautyComposition([])),
    captureError((): AutoMovieFilmBeautyComposition<{ weight: number; }> =>
      resolveAutoMovieFilmBeautyComposition([
        { weight: 1 },
        { weight: 0 },
        { weight: 0 },
      ]),
    ),
    captureError((): AutoMovieFilmBeautyComposition<{ weight: number; }> =>
      resolveAutoMovieFilmBeautyComposition([{ weight: Number.NaN }]),
    ),
    captureError((): AutoMovieFilmBeautyComposition<{ weight: number; }> =>
      resolveAutoMovieFilmBeautyComposition([{ weight: -0.1 }]),
    ),
    captureError((): AutoMovieFilmBeautyComposition<{ weight: number; }> =>
      resolveAutoMovieFilmBeautyComposition([{ weight: 1.1 }]),
    ),
    captureError((): AutoMovieFilmBeautyComposition<{ weight: number; }> =>
      resolveAutoMovieFilmBeautyComposition([{ weight: 0.2 }, { weight: 0.7 }]),
    ),
  ];
  TestValidator.predicate(
    "malformed film beauty schedules are refused",
    invalid.every((error: unknown): boolean => error instanceof Error),
  );


  const first: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),second: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(128,72);
  disposeFadeToBlack(first.renderer);let callbacks: number=0;
  for(const weight of [0,.5,1]) renderFadeToBlackFrame(first.renderer,(): void=>{callbacks++;TestValidator.predicate("source is direct display",first.state().target===null);},weight);
  TestValidator.predicate("fade contributions reach shader", first.rendered.length === 3 && first.rendered.every((frame: { target: THREE.WebGLRenderTarget | null; face: number; mip: number; alpha: number; fade: boolean; backing: boolean; srgb: boolean; viewport: number[]; scissor: number[]; scissorTest: boolean; }, index: number): boolean => nclose(frame.alpha, [1, 0.5, 0][index]!, 0)));
  TestValidator.equals("every endpoint resolves its source",callbacks,3);
  renderFadeToBlackFrame(second.renderer,(): undefined=>undefined,.5);
  TestValidator.predicate("copies are reused only within their renderer",first.copied[1]===first.copied[3]&&first.copied[1]!==second.copied[1]);
  first.size.set(320,180);renderFadeToBlackFrame(first.renderer,(): undefined=>undefined,.5);
  TestValidator.equals("source copy dimensions track owned drawing buffer",[first.copied[1]!.image.width,first.copied[1]!.image.height,second.copied[1]!.image.width],[320,180,128]);
  let disposed: number=0;first.copied[1]!.addEventListener("dispose",(): void=>{disposed++;});
  disposeFadeToBlack(first.renderer);disposeFadeToBlack(first.renderer);renderFadeToBlackFrame(first.renderer,(): undefined=>undefined,.5);
  TestValidator.predicate("idempotent release then fresh copy",disposed===1&&first.copied.at(-1)!==first.copied[1]);
  const host: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),target: THREE.WebGLRenderTarget<THREE.Texture<unknown, THREE.TextureEventMap>>=new THREE.WebGLRenderTarget(4,4);host.renderer.setRenderTarget(target);
  renderFadeToBlackFrame(host.renderer,(): undefined=>undefined,.25);
  TestValidator.predicate("composite destination and backing are preserved",host.rendered[0]!.target===target&&host.rendered[1]!.backing&&host.renderer.getRenderTarget()===target);
  for(const invalidWeight of [NaN,Infinity,-.01,1.01]) TestValidator.predicate("invalid fade weight",captureError((): void=>renderFadeToBlackFrame(first.renderer,(): undefined=>undefined,invalidWeight)) instanceof Error);
  for(const operation of ["reset","clear","copy","compositeRender","restoreAuto","restoreColor","quadTone","quadExposure","restoreTone","restoreExposure"]){
    const failed: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),error: Error=new Error(operation);failed.errors.set(operation,error);
    const observed: unknown=captureError((): void=>renderFadeToBlackFrame(failed.renderer,(): undefined=>undefined,.5));
    TestValidator.predicate("failures remain observable",observed===error||(observed instanceof AggregateError&&observed.errors.every((cause: unknown): boolean => cause===error)));
    TestValidator.predicate("target restoration is attempted",failed.calls.includes("screen"));
  }
  const failed: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),primary: Error=new Error("source"),restore: Error=new Error("restore");failed.errors.set("restoreAuto",restore);
  const error: unknown=captureError((): void=>renderFadeToBlackFrame(failed.renderer,(): never=>{throw primary;},.5));
  TestValidator.predicate("aggregate retains primary before restoration",error instanceof AggregateError&&error.errors[0]===primary&&error.errors[1]===restore);
  const backing: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer();backing.renderer.setRenderTarget(target);backing.errors.set("backingRender",primary);backing.errors.set("restoreColor",restore);
  TestValidator.predicate("backing and later restoration failures remain visible",captureError((): void=>renderFadeToBlackFrame(backing.renderer,(): undefined=>undefined,.5)) instanceof AggregateError);
  TestValidator.predicate("foreign callback target refused",captureError((): void=>renderFadeToBlackFrame(first.renderer,(): void=>first.renderer.setRenderTarget(target),.5)) instanceof Error);
  const retirement: ReturnType<typeof createDisplayCompositionRenderer> = createDisplayCompositionRenderer();
  renderFadeToBlackFrame(retirement.renderer, (): void => {}, 0.5);
  const retirementFailure: Error = new Error("Fade copy retirement refused.");
  let sourceAttempts: number = 0;
  let backingAttempts: number = 0;
  let attemptedDraws: number = 0;
  retirement.copied[1]!.addEventListener("dispose", (): never => { ++sourceAttempts; throw retirementFailure; });
  retirement.copied[0]!.addEventListener("dispose", (): void => { ++backingAttempts; });
  const firstRetirement: unknown = captureError((): void => disposeFadeToBlack(retirement.renderer));
  const repeatedRetirement: unknown = captureError((): void => disposeFadeToBlack(retirement.renderer));
  const refusedDraw: unknown = captureError((): void => renderFadeToBlackFrame(retirement.renderer, (): void => { ++attemptedDraws; }, 0.5));
  TestValidator.predicate("fade retirement shares exact failure", firstRetirement === retirementFailure && repeatedRetirement === retirementFailure && refusedDraw === retirementFailure);
  TestValidator.equals("fade failure releases other copies once and blocks source draws", [sourceAttempts, backingAttempts, attemptedDraws], [1, 1, 0]);
  target.dispose();disposeFadeToBlack(first.renderer);disposeFadeToBlack(second.renderer);disposeFadeToBlack(host.renderer);
}

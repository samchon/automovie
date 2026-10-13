import {disposeFadeToBlack,renderFadeToBlackFrame,resolveAutoMovieFilmBeautyComposition} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import {namedFacts} from "../internal/predicates";
import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";
const captureError=(operation:()=>void):unknown=>{try{operation();return undefined;}catch(error){return error;}};
/**
 * Builder-owned film weights select a beauty operator without resampling.
 * GPU color parity is observed separately; these inputs exercise orchestration.
 *
 * Scenarios:
 * 1. Direct, fade and dissolve preserve sampled layer identity and weights.
 * 2. Unsupported cardinalities, weights and complementary sums refuse.
 * 3. Fade endpoints reach the byte shader and source callbacks run directly.
 * 4. Reuse, resize, release and recreation preserve renderer-local ownership.
 * 5. Render, copy and restoration failures retain every failure and restore
 *    unaffected state; a caller-owned target retains its canvas backing.
 */
export const test_viewer_film_fade=():void=>{
  const directLayer = { shot: "shot-a", weight: 1 };
  const fadedLayer = { shot: "shot-a", weight: 0.5 };
  const outgoing = { shot: "shot-a", weight: 0.25 };
  const incoming = { shot: "shot-b", weight: 0.75 };
  const direct = resolveAutoMovieFilmBeautyComposition([directLayer]);
  const fade = resolveAutoMovieFilmBeautyComposition([fadedLayer]);
  const dissolve = resolveAutoMovieFilmBeautyComposition([outgoing, incoming]);
  TestValidator.equals(
    "film beauty composition preserves sampled layer identity and weight",
    namedFacts([
      [
        "direct",
        () => direct.kind === "direct" && direct.layer === directLayer,
      ],
      [
        "fade",
        () =>
          fade.kind === "fade" &&
          fade.layer === fadedLayer &&
          fade.weight === 0.5,
      ],
      [
        "dissolve",
        () =>
          dissolve.kind === "dissolve" &&
          dissolve.outgoing === outgoing &&
          dissolve.incoming === incoming &&
          dissolve.alpha === 0.75,
      ],
    ]),
    { direct: true, fade: true, dissolve: true },
  );

  const invalid = [
    captureError(() => resolveAutoMovieFilmBeautyComposition([])),
    captureError(() =>
      resolveAutoMovieFilmBeautyComposition([
        { weight: 1 },
        { weight: 0 },
        { weight: 0 },
      ]),
    ),
    captureError(() =>
      resolveAutoMovieFilmBeautyComposition([{ weight: Number.NaN }]),
    ),
    captureError(() =>
      resolveAutoMovieFilmBeautyComposition([{ weight: -0.1 }]),
    ),
    captureError(() =>
      resolveAutoMovieFilmBeautyComposition([{ weight: 1.1 }]),
    ),
    captureError(() =>
      resolveAutoMovieFilmBeautyComposition([{ weight: 0.2 }, { weight: 0.7 }]),
    ),
  ];
  TestValidator.predicate(
    "malformed film beauty schedules are refused",
    invalid.every((error) => error instanceof Error),
  );


  const first=createDisplayCompositionRenderer(),second=createDisplayCompositionRenderer(128,72);
  disposeFadeToBlack(first.renderer);let callbacks=0;
  for(const weight of [0,.5,1]) renderFadeToBlackFrame(first.renderer,()=>{callbacks++;TestValidator.predicate("source is direct display",first.state().target===null);},weight);
  TestValidator.equals("fade contributions reach shader",first.rendered.map(x=>x.alpha),[1,.5,0]);
  TestValidator.equals("every endpoint resolves its source",callbacks,3);
  renderFadeToBlackFrame(second.renderer,()=>undefined,.5);
  TestValidator.predicate("copies are reused only within their renderer",first.copied[1]===first.copied[3]&&first.copied[1]!==second.copied[1]);
  first.size.set(320,180);renderFadeToBlackFrame(first.renderer,()=>undefined,.5);
  TestValidator.equals("source copy dimensions track owned drawing buffer",[first.copied[1]!.image.width,first.copied[1]!.image.height,second.copied[1]!.image.width],[320,180,128]);
  let disposed=0;first.copied[1]!.addEventListener("dispose",()=>{disposed++;});
  disposeFadeToBlack(first.renderer);disposeFadeToBlack(first.renderer);renderFadeToBlackFrame(first.renderer,()=>undefined,.5);
  TestValidator.predicate("idempotent release then fresh copy",disposed===1&&first.copied.at(-1)!==first.copied[1]);
  const host=createDisplayCompositionRenderer(),target=new THREE.WebGLRenderTarget(4,4);host.renderer.setRenderTarget(target);
  renderFadeToBlackFrame(host.renderer,()=>undefined,.25);
  TestValidator.predicate("composite destination and backing are preserved",host.rendered[0]!.target===target&&host.rendered[1]!.backing&&host.renderer.getRenderTarget()===target);
  for(const invalidWeight of [NaN,Infinity,-.01,1.01]) TestValidator.predicate("invalid fade weight",captureError(()=>renderFadeToBlackFrame(first.renderer,()=>undefined,invalidWeight)) instanceof Error);
  for(const operation of ["reset","clear","copy","compositeRender","restoreAuto","restoreColor","quadTone","quadExposure","restoreTone","restoreExposure"]){
    const failed=createDisplayCompositionRenderer(),error=new Error(operation);failed.errors.set(operation,error);
    const observed=captureError(()=>renderFadeToBlackFrame(failed.renderer,()=>undefined,.5));
    TestValidator.predicate("failures remain observable",observed===error||(observed instanceof AggregateError&&observed.errors.every(x=>x===error)));
    TestValidator.predicate("target restoration is attempted",failed.calls.includes("screen"));
  }
  const failed=createDisplayCompositionRenderer(),primary=new Error("source"),restore=new Error("restore");failed.errors.set("restoreAuto",restore);
  const error=captureError(()=>renderFadeToBlackFrame(failed.renderer,()=>{throw primary;},.5));
  TestValidator.predicate("aggregate retains primary before restoration",error instanceof AggregateError&&error.errors[0]===primary&&error.errors[1]===restore);
  const backing=createDisplayCompositionRenderer();backing.renderer.setRenderTarget(target);backing.errors.set("backingRender",primary);backing.errors.set("restoreColor",restore);
  TestValidator.predicate("backing and later restoration failures remain visible",captureError(()=>renderFadeToBlackFrame(backing.renderer,()=>undefined,.5)) instanceof AggregateError);
  TestValidator.predicate("foreign callback target refused",captureError(()=>renderFadeToBlackFrame(first.renderer,()=>first.renderer.setRenderTarget(target),.5)) instanceof Error);
  target.dispose();disposeFadeToBlack(first.renderer);disposeFadeToBlack(second.renderer);disposeFadeToBlack(host.renderer);
};

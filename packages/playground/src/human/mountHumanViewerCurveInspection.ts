import type { IAutoMovieHumanConstructionNet } from "@automovie/human";

import type { HumanCurveDesignInspectionState } from "./HumanCurveDesignInspectionState";
import type { HumanViewerPage } from "./HumanViewerPage";
import type { IHumanViewerSession } from "./IHumanViewerSession";
import { mountHumanCurveDesignControls } from "./mountHumanCurveDesignControls";
import { mountHumanSurfaceControls } from "./mountHumanSurfaceControls";

/** Connect the visible selector to this page's actual admitted Human.
 * Measurement refusal is an inspection result and does not invalidate identity.
 * Reusing the same Human and selection retains the last valid design cache.
 *
 * @evidence contracts/common.md#principled-implementation The explicit physical-rest route uses inspectSurface on the same Human/getModel input; the previous route separately calls inspectCurveDesign with its named measurements.
 * @evidence contracts/common.md#clear-and-simple-design This adapter mounts the physical surface editor and, only on the previous route, the separate curve inspector; each follows actual scene/session/capture state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source/control geometry, reference loader or fallback skin is supplied to curve generation.
 * @evidence contracts/common.md#meaningful-documentation Explains identity refusal separation and the same-instance cache key.
 * @evidence contracts/performance.md#efficient-algorithms Rebuilds the editor only when its Human or restored selection changes, and retains generated nets between display-mode changes.
 * @evidence contracts/performance.md#reuse-equivalent-work Human object identity plus the serialized selector state determine whether the mounted cache remains valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replaced editor listeners are disposed before the new editor mounts; page shutdown disposes the last editor.
 */
export function mountHumanViewerCurveInspection(page: HumanViewerPage): void {
  const selection: IHumanViewerSession["curveDesign"] =
    page.current.session.curveDesign;
  const key: string = JSON.stringify([selection ?? null, page.current.session.surfaceMeasurements ?? null]);
  if (page.curveHuman === page.current.human && page.curveSessionKey === key) {
    page.curveControls?.refresh();
    return;
  }
  page.curveControls?.dispose();
  page.curveHuman = page.current.human;
  page.curveSessionKey = key;
  page.curveDisplay = null;
  const container: HTMLElement = document.querySelector("#curve-design")!;
  const physical: IHumanViewerSession["surfaceMeasurements"] = page.current.session.surfaceMeasurements;
  const generated: ReturnType<typeof page.current.human.inspectSurface> | undefined =
    physical === undefined ? undefined : page.current.human.inspectSurface({measurements: physical});
  const surface: ReturnType<typeof mountHumanSurfaceControls> = mountHumanSurfaceControls({
    container, initial: physical, diagnostics: generated?.diagnostics ?? [],
    selectSurface: (measurements: IHumanViewerSession["surfaceMeasurements"]): boolean =>
      page.accept({...page.current.session, surfaceMeasurements: measurements,
        curveDesign: {source: "current-skin", compareExistingSurface: false}},
      measurements === undefined ? "기존 피부 경로 선택" : "새 물리 외피 선택"),
  });
  if (generated !== undefined) {
    page.nets = generated.construction;
    const legend: HTMLElement | null = document.querySelector("#construction-key");
    if (legend !== null) legend.textContent =
      "부분 생성 외피: 피부·단면·가이드가 같은 곡면 계수를 사용합니다. 열린 경계와 미구현 영역을 포함합니다.";
    page.curveControls = {
      captureMetadata: (): Record<string, unknown> => ({
        constructionSource: "generated-rest-surface", surfaceRevision: generated.revision,
        surfaceStatus: generated.status, realizationComplete: generated.realizationComplete,
        approximationQualified: generated.approximationQualified, diagnostics: generated.diagnostics,
      }),
      savedDetailed: (): null => null,
      refresh: (): void => { page.applyDisplayMode(); }, dispose: surface.dispose,
    };
    page.applyDisplayMode();
    return;
  }
  const curves: ReturnType<typeof mountHumanCurveDesignControls> = mountHumanCurveDesignControls({
    container,
    identityKey: page.current.identityKey,
    inspect: (
      props: Parameters<typeof page.current.human.inspectCurveDesign>[0],
    ): ReturnType<typeof page.current.human.inspectCurveDesign> =>
      page.current.human.inspectCurveDesign(props),
    currentSkin: (): IAutoMovieHumanConstructionNet[] =>
      (page.nets ??= page.current.human.inspect()),
    initialDetailed: selection?.detailed,
    initialSource: selection?.source,
    initialCompare: selection?.compareExistingSurface,
    initialShowControlPoints: selection?.showControlPoints,
    initialPelvisRepresentation: selection?.pelvisRepresentation,
    show: (display: HumanCurveDesignInspectionState.Display): void => {
      page.curveDisplay = display;
      const legend: HTMLElement | null =
        document.querySelector("#construction-key");
      if (legend !== null)
        legend.textContent =
          display.metadata.constructionSource === "curve-design"
            ? "중립 T 곡선 · " +
              (display.metadata.showControlPoints === false
                ? "제어점·제어다각형 숨김 · "
                : "베이지어 제어점·제어다각형 · ") +
              "회색: 내부 연결 구성선(외피 아님) · 보라: 차트 경계 · 청록: 연결 레일. 기존 피부는 이 곡선에서 생성된 표면이 아닙니다."
            : "기존 피부를 생성한 기본자세의 단면·가이드·형상선입니다.";
      page.applyDisplayMode();
    },
    onChange: (next: NonNullable<IHumanViewerSession["curveDesign"]>): void => {
      page.current.session.curveDesign = next;
      page.curveSessionKey = JSON.stringify([next, null]);
      const json: HTMLTextAreaElement | null =
        document.querySelector("#json textarea");
      if (json !== null && document.activeElement !== json)
        json.value = JSON.stringify(page.current.session, null, 2);
    },
  });
  page.curveControls = {...curves, dispose: (): void => {
    curves.dispose(); surface.dispose();
  }};
}

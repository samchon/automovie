import type { IAutoMovieHumanConstructionNet } from "@automovie/human";

import type { HumanCurveDesignInspectionState } from "./HumanCurveDesignInspectionState";
import type { HumanViewerPage } from "./HumanViewerPage";
import type { IHumanViewerSession } from "./IHumanViewerSession";
import { mountHumanCurveDesignControls } from "./mountHumanCurveDesignControls";

/** Connect the visible selector to this page's actual admitted Human.
 * Measurement refusal is an inspection result and does not invalidate identity.
 * Reusing the same Human and selection retains the last valid design cache.
 *
 * @evidence contracts/common.md#principled-implementation Calls inspectCurveDesign on the currently accepted Human with named detailed measurements only; current skin inspection remains a distinct source.
 * @evidence contracts/common.md#clear-and-simple-design This adapter connects one mounted editor to scene selection, session persistence and capture metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source/control geometry, reference loader or fallback skin is supplied to curve generation.
 * @evidence contracts/common.md#meaningful-documentation Explains identity refusal separation and the same-instance cache key.
 * @evidence contracts/performance.md#efficient-algorithms Rebuilds the editor only when its Human or restored selection changes, and retains generated nets between display-mode changes.
 * @evidence contracts/performance.md#reuse-equivalent-work Human object identity plus the serialized selector state determine whether the mounted cache remains valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replaced editor listeners are disposed before the new editor mounts; page shutdown disposes the last editor.
 */
export function mountHumanViewerCurveInspection(page: HumanViewerPage): void {
  const selection: IHumanViewerSession["curveDesign"] =
    page.current.session.curveDesign;
  const key: string = JSON.stringify(selection ?? null);
  if (page.curveHuman === page.current.human && page.curveSessionKey === key) {
    page.curveControls?.refresh();
    return;
  }
  page.curveControls?.dispose();
  page.curveHuman = page.current.human;
  page.curveSessionKey = key;
  page.curveDisplay = null;
  const container: HTMLElement = document.querySelector("#curve-design")!;
  page.curveControls = mountHumanCurveDesignControls({
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
      page.curveSessionKey = JSON.stringify(next);
      const json: HTMLTextAreaElement | null =
        document.querySelector("#json textarea");
      if (json !== null && document.activeElement !== json)
        json.value = JSON.stringify(page.current.session, null, 2);
    },
  });
}

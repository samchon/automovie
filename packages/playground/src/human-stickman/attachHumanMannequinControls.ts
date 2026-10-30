import * as THREE from "three";

import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import { HUMAN_CARTOON_EXPRESSIONS } from "./HUMAN_CARTOON_EXPRESSIONS";
import { HUMAN_STICKMAN_POSES } from "./HUMAN_STICKMAN_POSES";
import type { HumanStickmanController } from "./HumanStickmanController";
import { HumanStickmanMotions } from "./HumanStickmanMotions";
import { attachHumanMannequinPoseControls } from "./attachHumanMannequinPoseControls";
import type { buildHumanPolygon } from "./buildHumanPolygon";
import type { buildHumanStickman } from "./buildHumanStickman";

/** Assemble the original public page controls around the same facade and scene.
 *
 * @evidence contracts/common.md#principled-implementation Moves the existing pose/expression/view/pass/hint/transport buttons and status synchronization without changing controller calls, camera calculations or action order.
 * @evidence contracts/common.md#clear-and-simple-design The page keeps construction and mount ownership; this helper owns its existing DOM-control assembly and borrows the same mutable display fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Controls call the public facade and actual camera/material owners; no second clock, FK or coordinate correction is introduced.
 * @evidence contracts/common.md#meaningful-documentation Returned update reflects current facade state; disposal preserves the original pose-control listener retirement and the page owns the remaining DOM lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Fixed page controls reuse the prepared figure and existing camera; synchronization reads only public controller diagnostics and the original small example maps.
 * @evidence contracts/performance.md#reuse-equivalent-work All buttons target the same facade, geometry and display fields used by public snapshots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the same page DOM listeners and pose-control disposer; no renderer, timer, extra loop or snapshot cache is acquired.
 */
export function attachHumanMannequinControls(options: {
  query: URLSearchParams;
  poseName: string;
  style: string;
  clamp: boolean;
  rest: Skeleton.IOutput;
  controller: HumanStickmanController;
  polygon: ReturnType<typeof buildHumanPolygon> | undefined;
  stickman: ReturnType<typeof buildHumanStickman>;
  scene: THREE.Scene;
  grid: THREE.GridHelper;
  camera: THREE.PerspectiveCamera;
  centre: THREE.Vector3;
  directions: Record<string, [number, number, number]>;
  distance: number;
  applyHints: () => void;
  display: { pass: string; hintMode: string; hintDetail: string };
  state: {
    pose: string;
    pass: string;
    clamped: Skeleton.IClamp[];
    expression: IAutoMovieHumanExpression | undefined;
    unsupported: readonly string[];
  };
}): { update: () => void; dispose: () => void } {
  const {
    query,
    poseName,
    style,
    clamp,
    rest,
    controller,
    polygon,
    stickman,
    scene,
    grid,
    camera,
    centre,
    directions,
    applyHints,
    display,
    state,
  }: typeof options = options;
  let distance: number = options.distance;

  // Pose selector and status line.
  const bar: HTMLElement | null = document.getElementById("clips");
  const poseControls: ReturnType<typeof attachHumanMannequinPoseControls> =
    attachHumanMannequinPoseControls(bar, controller, (): void =>
      syncControls(),
    );
  for (const name of Object.keys(HUMAN_STICKMAN_POSES)) {
    const b: HTMLButtonElement = document.createElement("button");
    b.textContent =
      (
        { rest: "기본 자세", demo: "동작 자세", limit: "관절 한계" } as Record<
          string,
          string
        >
      )[name] ?? name;
    b.dataset.control = "pose";
    b.dataset.value = name;
    b.className = name === poseName ? "on" : "";
    b.addEventListener("click", (): void => {
      const next: URLSearchParams = new URLSearchParams(location.search);
      next.set("pose", name);
      controller.setPose(HUMAN_STICKMAN_POSES[name]!);
      history.replaceState(null, "", "?" + next.toString());
      state.pose = name;
      state.clamped = controller.state.clamped;
      syncControls();
    });
    bar?.appendChild(b);
  }
  for (const [key, entries] of Object.entries({
    style: { stickman: "스틱맨", polygon: "부피" },
    expression: {
      neutral: "기본 표정",
      happy: "행복",
      angry: "분노",
      surprised: "놀람",
    },
    pass: { surface: "표면", overlay: "단면과 골격", construction: "구성선" },
    framing: { whole: "전신", face: "얼굴" },
    view: { front: "정면", oblique: "사선", side: "측면", back: "후면" },
    hint: {
      off: "힌트 끄기",
      parts: "부위 색",
      joints: "관절 X-ray",
      combined: "색과 관절 X-ray",
    },
    detail: { major: "주요 관절", all: "손·얼굴 상세 포함" },
  }))
    for (const [value, label] of Object.entries(entries)) {
      const button: HTMLButtonElement = document.createElement("button");
      button.textContent = label;
      button.dataset.control = key;
      button.dataset.value = value;
      button.className =
        (query.get(key) ??
          (
            {
              style,
              expression: "neutral",
              pass: display.pass,
              framing: "whole",
              hint: display.hintMode,
              detail: display.hintDetail,
            } as Record<string, string>
          )[key]) === value
          ? "on"
          : "";
      button.addEventListener("click", (): void => {
        const next: URLSearchParams = new URLSearchParams(location.search);
        next.set(key, value);
        if (key === "expression") {
          controller.setExpression(HUMAN_CARTOON_EXPRESSIONS[value]!);
          state.expression = controller.state.expression;
          state.unsupported = controller.state.unsupported;
          history.replaceState(null, "", "?" + next.toString());
          syncControls();
        } else if (key === "framing") {
          scene.updateMatrixWorld(true);
          const bounds: THREE.Box3 =
            polygon !== undefined && value === "face"
              ? new THREE.Box3(
                  new THREE.Vector3(...polygon.head.min),
                  new THREE.Vector3(...polygon.head.max),
                ).applyMatrix4(polygon.head.object.matrixWorld)
              : new THREE.Box3().setFromObject(
                  polygon?.object ?? stickman.object,
                );
          bounds.getCenter(centre);
          distance =
            (bounds.getSize(new THREE.Vector3()).length() * 0.62) /
            Math.tan(Math.PI / 12);
          camera.position
            .copy(centre)
            .add(
              new THREE.Vector3(
                ...directions[query.get("view") ?? "front"]!,
              ).multiplyScalar(distance),
            );
          camera.lookAt(centre);
          grid.visible = value !== "face";
          query.set(key, value);
          history.replaceState(null, "", "?" + next.toString());
          syncControls();
        } else if (key === "view") {
          const direction: [number, number, number] = directions[value]!;
          camera.position
            .copy(centre)
            .add(new THREE.Vector3(...direction).multiplyScalar(distance));
          camera.lookAt(centre);
          query.set(key, value);
          history.replaceState(null, "", "?" + next.toString());
          syncControls();
        } else if (key === "pass") {
          display.pass = value;
          state.pass = value;
          if (polygon !== undefined) {
            polygon.surface.visible = value !== "construction";
            polygon.sections.visible = value !== "surface";
          }
          stickman.object.visible =
            polygon === undefined || value !== "surface";
          query.set(key, value);
          history.replaceState(null, "", "?" + next.toString());
          syncControls();
        } else if (key === "hint" || key === "detail") {
          if (key === "hint") display.hintMode = value;
          else display.hintDetail = value;
          applyHints();
          query.set(key, value);
          history.replaceState(null, "", "?" + next.toString());
          syncControls();
        } else location.search = next.toString();
      });
      bar?.appendChild(button);
    }
  const motion: HTMLSelectElement = document.createElement("select");
  motion.setAttribute("aria-label", "동작 선택");
  for (const [name, label] of Object.entries({
    walk: "제자리 걷기",
    wave: "손 흔들기",
    "sit-stand": "앉았다 일어나기",
    neutral: "중립 자세",
    rest: "기본 자세",
  })) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = name;
    option.textContent = label;
    motion.appendChild(option);
  }
  bar?.appendChild(motion);
  for (const [label, action] of Object.entries({
    "동작 시작": (): void =>
      controller.play(motion.value as HumanStickmanMotions.Name),
    계속: (): void => controller.play(),
    "일시 정지": (): void => controller.pause(),
    처음으로: (): void => controller.reset(),
  })) {
    const button: HTMLButtonElement = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    bar?.appendChild(button);
  }
  const seek: HTMLInputElement = document.createElement("input");
  seek.type = "range";
  seek.min = "0";
  seek.max = "1";
  seek.step = "0.001";
  seek.value = "0";
  seek.setAttribute("aria-label", "동작 시간");
  seek.addEventListener("input", (): void => {
    if (controller.state.motion === null) {
      controller.play(motion.value as HumanStickmanMotions.Name);
      controller.pause();
    }
    controller.seek(Number(seek.value) * controller.state.duration);
  });
  bar?.appendChild(seek);
  const status: HTMLElement | null = document.getElementById("status");

  /** Reflect the controller's actual live state rather than the initial query. */
  function syncControls(): void {
    const current: HumanStickmanController.IState = controller.state;
    poseControls.update();
    const currentPose: string =
      Object.keys(HUMAN_STICKMAN_POSES).find(
        (name: string): boolean =>
          JSON.stringify(HUMAN_STICKMAN_POSES[name]) ===
          JSON.stringify(current.pose),
      ) ?? "custom";
    const currentExpression: string =
      Object.keys(HUMAN_CARTOON_EXPRESSIONS).find(
        (name: string): boolean =>
          JSON.stringify(HUMAN_CARTOON_EXPRESSIONS[name]) ===
          JSON.stringify(current.expression),
      ) ?? "custom";
    for (const button of bar?.querySelectorAll<HTMLButtonElement>(
      "button[data-control]",
    ) ?? []) {
      const key: string = button.dataset.control!;
      const value: string | undefined =
        key === "pose"
          ? current.motion === null
            ? currentPose
            : undefined
          : key === "expression"
            ? currentExpression
            : key === "view"
              ? (query.get(key) ?? "front")
              : (query.get(key) ??
                (
                  {
                    style,
                    pass: display.pass,
                    framing: "whole",
                    hint: display.hintMode,
                    detail: display.hintDetail,
                  } as Record<string, string>
                )[key]);
      button.classList.toggle("on", button.dataset.value === value);
    }
    seek.value = String(
      current.duration === 0 ? 0 : current.time / current.duration,
    );
    state.clamped = current.clamped;
    state.expression = current.expression;
    state.unsupported = current.unsupported;
    state.pose = current.motion ?? currentPose;
    if (status !== null)
      status.textContent =
        `${query.get("alias") ?? "f1"} · ${style === "polygon" ? "저다각형 부피" : "스틱맨"} · ${rest.bones.length}개 골격 · 관절 제한 ${clamp ? "사용" : "해제"}` +
        (current.motion === null
          ? ` · 자세 ${currentPose}`
          : ` · ${current.motion} ${current.time.toFixed(2)} / ${current.duration.toFixed(2)}초 · ${current.playing ? "재생" : "정지"}`) +
        current.clamped
          .map(
            (c: AutoMovieHumanSkeleton.IClamp): string =>
              `\n${c.path}: ${c.requested} → ${Math.round(c.applied * 100) / 100}`,
          )
          .join("") +
        (display.hintMode !== "off"
          ? ` · 힌트 ${display.hintMode} (${display.hintDetail}${display.hintMode === "joints" || display.hintMode === "combined" ? ", X-ray: 숨은 관절도 표시" : ""})`
          : "") +
        (current.unsupported.length
          ? "\n미지원 표정: " + current.unsupported.join(", ")
          : "");
  }
  syncControls();
  return { update: syncControls, dispose: poseControls.dispose };
}

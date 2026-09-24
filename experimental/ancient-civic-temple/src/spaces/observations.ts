/**
 * docs/spaces/observations.md#geometry-observations의 관찰 분모를 현재
 * built environment에서 유도한다. 공간마다 engine station(중심 네 방위,
 * 네 안쪽 모서리, 개구부 threshold)을 받고 눈높이를 실제 support 위 1.6m로
 * 다시 세운다. 주랑은 여섯 평면 영역 각각의 중심 네 방위를 더한다. 외부는
 * setting, census의 노출 입면·모서리, 네 방향 지붕, 처마 하부, 외부 개구부이고
 * 대지는 조감·두 접근·골목 경사·먼 능선 시점을 더한다. 주랑의 중정 쪽 안쪽 모서리와
 * 현관 몸체 모서리, 지붕 골·떠 있는 처마·파라펫 만남·외곽 모서리 석재 띠의 접합
 * 관찰, 뷰어의 정확한 연직 단면으로 보는 단면 질문, 다섯 reference 비교 질문을 더한다.
 * X/Z 평면으로 자를 수 없는 대각 골 단면만 pose 없는 unverified 항목으로 남긴다.
 * 반환 불가/충돌 station과 이전 결속의 무효 창 threshold는 지우지 않고 pose=null과 이유로 남긴다.
 * 이 목록은 관찰 위치이며 시각 판정 결과가 아니다.
 */
import { builtEnvironmentBuildingCensus, builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { roofStepClosures } from "../geometry/roof-solids";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeRoofEnvelope, templeRoofRules } from "./roofs/assembly";
import { templeColonnadeRegions } from "./rooms/colonnade";

/**
 * 관찰을 고를 때 뷰어가 함께 켜는 검사 보기. 연직 단면은 서버가 현재 source의
 * 실체를 그 평면으로 잘라 그린 정확한 조각을 정사영으로 보고, roof-off는
 * 지붕·천장을 숨긴 절개 조감이다.
 */
export interface TempleView {
  section: "roof-off" | "cut-x" | "cut-z";
  offset: number;
  ortho: boolean;
  span: number;
  flip: boolean;
}

export interface TempleObservation {
  id: string;
  group: "exterior" | "space" | "site" | "junction" | "section" | "reference";
  space: string | null;
  role: string;
  label: string;
  position: IAutoMovieVector3 | null;
  target: IAutoMovieVector3 | null;
  note: string | null;
  view?: TempleView;
}

/** 운영 언어(한국어) 공간명. */
export const templeSpaceNames: Record<string, string> = {
  entrance: "현관", courtyard: "중정", colonnade: "주랑", sanctuary: "제실",
  offering: "봉헌실", administration: "관리실", records: "기록실", storage: "보관실",
  "service-yard": "서비스 마당", "temple-site": "대지",
};

const eye = 1.6;
const directionNames: Record<string, string> = {
  "center-x-minus": "중심→서", "center-x-plus": "중심→동",
  "center-z-minus": "중심→북", "center-z-plus": "중심→남",
  "corner-x-minus-z-minus": "북서 모서리", "corner-x-minus-z-plus": "남서 모서리",
  "corner-x-plus-z-minus": "북동 모서리", "corner-x-plus-z-plus": "남동 모서리",
};

export const templeObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const result: TempleObservation[] = [];
  for (const space of environment.spaces.filter((s) => s.cells.length > 0)) {
    const name = templeSpaceNames[space.id] ?? space.id;
    for (const station of builtSpaceObservationStations(environment, space.id)) {
      const label = station.role === "threshold"
        ? `${name} · threshold(${station.opening ?? "?"})`
        : `${name} · ${directionNames[station.id] ?? station.id}`;
      if (station.pose === null) {
        result.push({ id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role,
          label, position: null, target: null, note: "engine station이 공간 안 pose를 반환하지 않음(unverified)" });
        continue;
      }
      const floor = supportHeight(environment, space.id, station.pose.position);
      const raised = floor === null ? station.pose.position : { ...station.pose.position, y: floor + eye };
      const lift = raised.y - station.pose.position.y;
      result.push({
        id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role, label,
        position: raised,
        target: { ...station.pose.target, y: station.role === "corner" ? station.pose.target.y + lift : raised.y },
        note: floor === null ? "support 없음: engine 높이 유지(눈높이 unverified)"
          : Math.abs(lift) > 1e-6 ? `engine y=${station.pose.position.y.toFixed(3)} → 바닥+1.6m` : null,
      });
    }
  }
  // 창을 봉헌실/제실, 제실/주랑 경계에 두었던 이전 결속이 봉헌실·주랑 안에 만든 창 threshold.
  // 그 위치는 창을 보여 주지 않아 무효였고 창은 외부 향 위쪽 경계로 옮겼다. 질문은
  // 지우지 않고 pose=null로 남기며 창 판독은 exterior.opening과 section.clerestory가 맡는다.
  for (const [space, window] of [
    ["offering", "window-sanctuary-west-north"], ["offering", "window-sanctuary-west-south"],
    ["colonnade", "window-sanctuary-south-west"], ["colonnade", "window-sanctuary-south-east"],
  ] as const) {
    result.push({
      id: `${space}.threshold-${window}`, group: "space", space, role: "threshold",
      label: `${templeSpaceNames[space]} · threshold(${window}) 무효`, position: null, target: null,
      note: "무효 threshold: 창이 이 방의 지붕 위 외부로 열려 방 안에서 보이지 않음(unverified)",
    });
  }
  for (const region of templeColonnadeRegions) {
    const center = { x: (region.west + region.east) / 2, y: eye, z: (region.north + region.south) / 2 };
    for (const [id, dx, dz, text] of [
      ["x-minus", -1, 0, "서"], ["x-plus", 1, 0, "동"], ["z-minus", 0, -1, "북"], ["z-plus", 0, 1, "남"],
    ] as const) {
      result.push({
        id: `colonnade.region-${region.id}.${id}`, group: "space", space: "colonnade", role: "region-center",
        label: `주랑 ${region.id} 영역 · 중심→${text}`, position: center,
        target: { x: center.x + dx * 6, y: eye, z: center.z + dz * 6 }, note: null,
      });
    }
  }
  result.push(...colonnadeCornerObservations(), ...junctionObservations(), ...sectionObservations(), ...referenceObservations());
  result.push(...exteriorObservations(environment), ...siteObservations(environment));
  return result;
};

/**
 * docs/spaces/observations.md#geometry-observations의 주랑 추가 모서리. 엔진 station의
 * 네 모서리는 외접 상자 근처라 중정 쪽 안쪽 모서리 네 곳과 현관 몸체의 두 바깥
 * 모서리를 따로 세운다. 각 위치는 주랑 영역 안쪽 1.05m에서 그 모서리를 본다.
 */
const colonnadeCornerObservations = (): TempleObservation[] => {
  const inner: Array<[string, number, number, number, number, string]> = [
    ["inner-northwest", p.westCourt, p.courtBack, -1, -1, "중정 북서 안쪽 모서리"],
    ["inner-northeast", p.eastCourt, p.courtBack, 1, -1, "중정 북동 안쪽 모서리"],
    ["inner-southwest", p.westCourt, p.courtFront, -1, 1, "중정 남서 안쪽 모서리"],
    ["inner-southeast", p.eastCourt, p.courtFront, 1, 1, "중정 남동 안쪽 모서리"],
    ["entrance-body-west", p.westPorchOuter, p.entranceBack, -1, -1, "현관 몸체 서쪽 모서리"],
    ["entrance-body-east", p.eastPorchOuter, p.entranceBack, 1, -1, "현관 몸체 동쪽 모서리"],
  ];
  return inner.map(([id, x, z, dx, dz, label]) => ({
    id: `colonnade.corner-${id}`, group: "space", space: "colonnade", role: "corner", label: `주랑 · ${label}`,
    position: { x: x + dx * 1.05, y: eye, z: z + dz * 1.05 }, target: { x, y: 1.0, z }, note: null,
  }));
};

/**
 * 접합 관찰: 네 골, 제실 처마 아래 틈과 봉헌실 파라펫 위 통과, 파라펫과 지붕의 만남,
 * 동측 박공 남쪽 끝의 코핑 아래, 네 외곽 모서리의 코핑·기단. 연직 단면 질문은
 * sectionObservations가 맡고, X/Z 평면으로 자를 수 없는 대각 골 단면만 pose=null의
 * unverified로 남긴다. 체적 겹침은 외피 겹침 전수 스캔(npm run self-check)이 잰다.
 */
const junctionObservations = (): TempleObservation[] => {
  const pose = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: id.split(".")[0]!, label, position, target, note: null,
  });
  const section = (id: string, label: string): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: "section", label, position: null, target: null,
    note: "대각 단면 수단 없음: 체적 겹침만 외피 겹침 스캔으로 수치 검사, 골 전 길이 단면 판독은 unverified",
  });
  return [
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      pose(`valley.${id}`, `지붕 골 · ${id}`, { x: sx * 1.2, y: 6.2, z: sz > 0 ? 3.6 : 0.8 },
        { x: sx * p.eastCourt, y: 3.4, z: sz > 0 ? p.courtFront : p.courtBack })),
    pose("eave.sanctuary-west", "제실 서쪽 처마 아래 틈", { x: -8.4, y: 4.9, z: -7.0 }, { x: -6.0, y: 4.8, z: -7.0 }),
    pose("eave.sanctuary-east", "제실 동쪽 처마와 마당", { x: 8.2, y: 2.2, z: -6.0 }, { x: 6.0, y: 4.6, z: -6.0 }),
    pose("eave.sanctuary-south", "제실 남쪽 처마 아래 틈", { x: -2.0, y: 4.6, z: -1.2 }, { x: -2.0, y: 4.9, z: -3.9 }),
    pose("eave.sanctuary-northwest-parapet", "제실 서쪽 처마의 봉헌실 파라펫 위 통과", { x: -6.1, y: 5.0, z: -13.2 }, { x: -6.1, y: 4.9, z: -10.25 }),
    pose("parapet.west", "서측 파라펫과 외쪽 지붕", { x: -7.6, y: 5.4, z: 0 }, { x: p.westInner, y: 4.6, z: 0 }),
    pose("parapet.north-offering", "봉헌실 북측 파라펫과 외쪽 지붕", { x: -8.0, y: 5.4, z: -7.6 }, { x: -8.0, y: 4.6, z: p.northInner }),
    pose("parapet.south", "남측 파라펫과 주랑 외쪽 지붕", { x: -4.0, y: 5.4, z: 7.6 }, { x: -4.0, y: 4.2, z: p.southInner }),
    pose("parapet.east-gable-ridge", "동측 박공 남쪽 용마루와 남측 코핑", { x: 7.36, y: 5.6, z: 6.6 }, { x: 7.36, y: 4.6, z: p.southInner }),
    ...([["northwest", p.westOuter, p.northOuter], ["northeast", p.eastOuter, p.northOuter],
      ["southwest", p.westOuter, p.southOuter], ["southeast", p.eastOuter, p.southOuter]] as const).map(([id, x, z]) =>
      pose(`trim.${id}`, `외곽 모서리 코핑·기단 · ${id}`, { x: x + Math.sign(x) * 3.2, y: 2.4, z: z + Math.sign(z) * 3.2 }, { x, y: 1.6, z })),
    section("section.valleys", "지붕 골 전 길이의 양쪽 단면(네 골은 대각선이라 X/Z 연직 단면으로 따라 자를 수 없다)"),
  ];
};

/**
 * docs/spaces/observations.md#geometry-observations의 연직 단면 질문. 각 항목은 뷰어가
 * 그 평면으로 자른 정확한 단면을 정사영으로 보는 관찰이다: 문과 용마루를 지나는
 * 종횡 단면, 문마다 문턱 종단면, 박공 끝 하부, 채광구, 날개 지붕의 높이 차이 끝면,
 * 처마 돌출, 외곽 모서리와 T 접합, 네 입면의 외벽 하단, 현관의 평행 단면.
 */
const sectionObservations = (): TempleObservation[] => {
  const cut = (id: string, label: string, axis: "x" | "z", offset: number, at: { u: number; y: number }, span: number): TempleObservation => {
    const target = axis === "x" ? { x: offset, y: at.y, z: at.u } : { x: at.u, y: at.y, z: offset };
    return {
      id: `section.${id}`, group: "section", space: null, role: "section", label: `단면 · ${label}`,
      // 정사영 단면 카메라는 target에서 유도한다. 원근으로 열 때의 위치는 건물 밖(평면 법선 40m)에 둔다.
      position: axis === "x" ? { ...target, x: offset + 40 } : { ...target, z: offset + 40 }, target, note: null,
      view: { section: axis === "x" ? "cut-x" : "cut-z", offset, ortho: true, span, flip: false },
    };
  };
  const mid = (a: number, b: number) => (a + b) / 2;
  const doors = templeDoorPassages.map((door) => cut(
    `threshold.${door.id}`, `${door.id} 문턱 종단면`, door.axis === "x" ? "x" : "z", door.center,
    { u: mid(door.wallLow, door.wallHigh), y: 1.2 }, 1.8,
  ));
  const steps = roofStepClosures(templeRoofEnvelope()).map((face, i) => {
    const xs = face.corners.map((c) => c.x);
    const zs = face.corners.map((c) => c.z);
    const ys = face.corners.map((c) => c.y);
    const alongX = Math.max(...xs) - Math.min(...xs) > Math.max(...zs) - Math.min(...zs);
    const cx = mid(Math.min(...xs), Math.max(...xs));
    const cz = mid(Math.min(...zs), Math.max(...zs));
    return cut(`roof-step.${i}`, `날개 지붕 높이 차이 끝면 ${i}`, alongX ? "x" : "z", alongX ? cx : cz,
      { u: alongX ? cz : cx, y: mid(Math.min(...ys), Math.max(...ys)) }, 1.2);
  });
  const eave = templeRoofRules.courtEave;
  return [
    cut("longitudinal-axis", "종단면 X=0(정문·현관·중정·제실 문·제실 용마루·포치)", "x", 0, { u: 0, y: 3.2 }, 7),
    cut("transverse-sanctuary", "횡단면 Z=-6.9(제실 용마루·양 spine·봉헌실 지붕·마당)", "z", -6.9, { u: 0, y: 3.5 }, 7),
    cut("transverse-east-wing", "횡단면 Z=3.7(동측 박공·동측 처마·주랑·중정·서측 날개)", "z", 3.7, { u: 0, y: 3 }, 7),
    cut("longitudinal-east-ridge", "종단면 X=7.36(동측 용마루·마당 쪽 끝·남측 코핑 아래 끝)", "x", 7.36, { u: 3.5, y: 3.5 }, 6),
    ...doors,
    cut("gable.sanctuary-north", "제실 북쪽 박공 끝 하부", "z", p.northInner + 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.sanctuary-south", "제실 남쪽 박공 끝 하부", "z", p.sanctuaryFront - 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.east-north", "동측 박공 마당 쪽 끝 하부", "z", p.yardFront + 0.2, { u: 7.36, y: 3.5 }, 2.5),
    cut("gable.east-south", "동측 박공 남측 파라펫 쪽 끝 하부", "z", p.southInner - 0.2, { u: 7.36, y: 4 }, 2.5),
    cut("gable.porch-front", "포치 박공 앞(삼각 막음)", "z", p.southOuter - 0.1, { u: 0, y: 4 }, 2),
    cut("gable.porch-back", "포치 박공 뒤(후퇴벽 위)", "z", p.entranceBack + 0.15, { u: 0, y: 3.8 }, 2),
    ...[-1, 1].flatMap((x) => [
      cut(`clerestory.north-${x < 0 ? "west" : "east"}`, `북측 박공 채광구 X=${x}`, "x", x, { u: mid(p.northOuter, p.northInner), y: 4.8 }, 1.5),
      cut(`clerestory.south-${x < 0 ? "west" : "east"}`, `남측 박공 채광구 X=${x}`, "x", x, { u: mid(p.sanctuaryFront, p.northRing), y: 4.8 }, 1.5),
    ]),
    ...[-8, -5.8].flatMap((z) => [
      cut(`clerestory.west-${z < -7 ? "north" : "south"}`, `서측 spine 채광구 Z=${z}`, "z", z, { u: mid(p.westRoom, p.westRing), y: 4.2 }, 1.5),
      cut(`clerestory.east-${z < -7 ? "north" : "south"}`, `동측 spine 채광구 Z=${z}`, "z", z, { u: mid(p.eastRing, p.eastRoom), y: 4.2 }, 1.5),
    ]),
    ...steps,
    cut("eave.court-north", "중정 북쪽 처마 돌출", "x", 0, { u: p.courtBack, y: eave }, 1.2),
    cut("eave.court-south", "중정 남쪽 처마 돌출", "x", 0, { u: p.courtFront, y: eave }, 1.2),
    cut("eave.court-west", "중정 서쪽 처마 돌출", "z", 2.2, { u: p.westCourt, y: eave }, 1.2),
    cut("eave.court-east", "중정 동쪽 처마 돌출", "z", 2.2, { u: p.eastCourt, y: eave }, 1.2),
    cut("eave.east-wall", "동측 외벽 처마 돌출", "z", 3.7, { u: p.eastOuter, y: 3.4 }, 1.2),
    cut("eave.east-gable-yard", "동측 박공 마당 쪽 끝 돌출", "x", 8, { u: p.yardFront, y: 3.6 }, 1.2),
    cut("eave.north-canopy-yard", "북쪽 주랑 지붕 마당 쪽 끝 돌출", "z", -2.6, { u: p.eastRoom, y: 3.5 }, 1.2),
    cut("eave.sanctuary-north", "제실 북쪽 끝 돌출", "x", 0, { u: p.northOuter, y: 7.2 }, 1.2),
    cut("eave.sanctuary-south", "제실 남쪽 끝 돌출", "x", 0, { u: p.northRing, y: 7.2 }, 1.2),
    cut("eave.sanctuary-west", "제실 서쪽 처마 돌출", "z", -6.9, { u: p.westRoom, y: 5 }, 1.2),
    cut("eave.sanctuary-east", "제실 동쪽 처마 돌출", "z", -6.9, { u: p.eastRoom, y: 5 }, 1.2),
    cut("eave.porch-front", "포치 앞끝 돌출", "x", 0, { u: p.southOuter, y: 4.4 }, 1.2),
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      cut(`corner.${id}`, `외곽 모서리 L 접합 ${id}`, "x", sx * 10.2, { u: sz * 10.0, y: 1.6 }, 2)),
    ...([[-1, "west"], [1, "east"]] as const).flatMap(([sx, side]) => [
      cut(`tee.${side}-spine-north`, `${side} spine과 북측 외벽 T 접합`, "x", sx * 5.75, { u: p.northInner, y: 2 }, 2),
      cut(`tee.${side}-spine-south`, `${side} spine과 남측 외벽 T 접합`, "x", sx * 5.75, { u: p.southInner, y: 2 }, 2),
      cut(`tee.sanctuary-south-${side}`, `제실 남벽과 ${side} spine T 접합`, "z", mid(p.sanctuaryFront, p.northRing), { u: sx * 5.75, y: 2 }, 2),
    ]),
    ...([["yard-storage", mid(p.yardFront, p.storageBack)], ["storage-records", mid(p.storageFront, p.recordsBack)],
      ["records-office", mid(p.recordsFront, p.officeBack)]] as const).flatMap(([id, z]) => [
      cut(`tee.${id}-east-wall`, `${id} 가로벽과 동측 외벽 T 접합`, "z", z, { u: p.eastInner, y: 1.8 }, 2),
      cut(`tee.${id}-east-spine`, `${id} 가로벽과 동측 spine T 접합`, "z", z, { u: p.eastRoom, y: 1.8 }, 2),
    ]),
    cut("tee.entry-back-returns", "현관 후퇴벽과 두 반환벽", "z", mid(p.entranceBack, p.entranceFront), { u: 0, y: 2 }, 2.5),
    cut("wall-bottom.west", "서측 외벽 하단과 지면", "z", 0, { u: p.westOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.east", "동측 외벽 하단과 지면", "z", 0, { u: p.eastOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.north", "북측 외벽 하단과 지면", "x", 0, { u: p.northOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.south", "남측 외벽 하단과 지면", "x", -6, { u: p.southOuter, y: 0.1 }, 1.2),
    ...[-1.35, -0.9, 0.9, 1.35].map((x) => cut(`entrance.x${x}`, `현관 평행 단면 X=${x}(${Math.abs(x) > 1 ? "기둥 받침" : "계단 끝"})`,
      "x", x, { u: mid(p.entranceFront, p.southOuter), y: 0.8 }, 1.5)),
  ];
};

/**
 * 다섯 reference 비교 질문. 각 이미지의 구도에 가까운 pose로 같은 건물·방으로
 * 읽히는지를 묻는다. 02는 지붕·천장을 숨긴 절개 조감으로 본다. 절개는 검사 수단이고
 * 전달 프레임이 아니다. 시각 판정 결과는 이 목록이 아니라 판정에서 나온다.
 */
const referenceObservations = (): TempleObservation[] => {
  const ref = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3, view?: TempleView): TempleObservation => ({
    id: `reference.${id}`, group: "reference", space: null, role: "reference", label: `reference 비교 · ${label}`,
    position, target, note: "같은 건물·방으로 읽히는지의 시각 비교 질문(판정 전 unverified)", ...(view === undefined ? {} : { view }),
  });
  return [
    ref("01-exterior", "01 외관(정면 좌측 조감)", { x: -8, y: 15, z: 27 }, { x: 0, y: 1.2, z: 0.5 }),
    ref("02-section-axonometric", "02 절개 조감(지붕·천장 숨김)", { x: -17, y: 24, z: 24 }, { x: 0, y: 0, z: 0 },
      { section: "roof-off", offset: 0, ortho: false, span: 4, flip: false }),
    ref("03-courtyard-fountain", "03 중정과 분수(남쪽 주랑에서 북쪽)", { x: -1.2, y: eye, z: 7.3 }, { x: 0, y: 1.2, z: -3.8 }),
    ref("04-worship-hall", "04 제실(북쪽에서 제실 문 쪽)", { x: 0, y: eye, z: -9.2 }, { x: 0, y: 1.4, z: -2.0 }),
    ref("05-records-service-wing", "05 업무 날개(동쪽 주랑에서 세 방 문)", { x: 3.9, y: eye, z: 7.4 }, { x: 5.6, y: 1.4, z: 1.5 }),
  ];
};

/** 1600×1000, 수직 50° 프레임에서 폭 width가 약 78%를 채우는 거리(m). */
const fitDistance = (width: number): number => (width / 0.78) / 2 / (Math.tan(25 * Math.PI / 180) * 1.6);

const exteriorObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const center = { x: 0, y: 2.2, z: 0 };
  const out: TempleObservation[] = [{
    id: "exterior.setting", group: "exterior", space: null, role: "setting", label: "외부 setting · 정면 좌측 조감",
    position: { x: -8, y: 15, z: 27 }, target: { x: 0, y: 1.2, z: 0.5 }, note: null,
  }];
  for (const face of census?.facades ?? []) {
    const width = Math.max(...face.vertices.map((v) => Math.hypot(v.x - face.centroid.x, v.z - face.centroid.z))) * 2;
    const outward = outwardNormal(environment, face.space, face.centroid, face.normal);
    // 지붕·마당 위로 올라간 외부 향 경계(제실 세 벽의 위쪽)는 같은 맞춤 거리에서 면보다 높게 본다.
    const elevated = face.centroid.y > templeRoofRules.courtEave;
    const distance = Math.max(4, fitDistance(Math.max(width, 3)));
    out.push({
      id: `exterior.facade.${face.boundary}`, group: "exterior", space: null, role: "facade",
      label: `입면 · ${face.boundary}`,
      position: {
        x: face.centroid.x + outward.x * distance, y: elevated ? face.centroid.y + 0.8 : eye + 0.6,
        z: face.centroid.z + outward.z * distance,
      },
      target: { ...face.centroid, y: Math.max(1.2, face.centroid.y) }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["northwest", p.westOuter, p.northOuter, "북서"], ["northeast", p.eastOuter, p.northOuter, "북동"],
    ["southwest", p.westOuter, p.southOuter, "남서"], ["southeast", p.eastOuter, p.southOuter, "남동"],
  ] as const) {
    const d = Math.hypot(x, z);
    out.push({
      id: `exterior.corner.${id}`, group: "exterior", space: null, role: "corner", label: `외부 모서리 · ${text}`,
      position: { x: x + x / d * 15, y: 3, z: z + z / d * 15 }, target: { x, y: 2, z }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["north", 0, -1, "북"], ["east", 1, 0, "동"], ["south", 0, 1, "남"], ["west", -1, 0, "서"],
  ] as const) {
    out.push({
      id: `exterior.roof.${id}`, group: "exterior", space: null, role: "roof", label: `지붕 · ${text}쪽 조감`,
      position: { x: x * 24, y: 17, z: z * 24 }, target: center, note: null,
    });
    const edge = id === "north" ? p.northOuter : id === "south" ? p.southOuter : id === "east" ? p.eastOuter : p.westOuter;
    const along = Math.abs(x) > 0 ? { x: edge + x * 3.2, z: 0 } : { x: 0, z: edge + z * 3.2 };
    out.push({
      id: `exterior.underside.${id}`, group: "exterior", space: null, role: "underside", label: `처마 하부 · ${text}`,
      position: { x: along.x + (Math.abs(x) > 0 ? 0 : -6), y: eye, z: along.z + (Math.abs(z) > 0 ? 0 : 6) },
      target: { x: Math.abs(x) > 0 ? edge : 2, y: 3.3, z: Math.abs(z) > 0 ? edge : -2 }, note: null,
    });
  }
  for (const opening of environment.openings) {
    const boundary = environment.boundaries.find((b) => b.id === opening.boundary);
    const face = boundary?.face;
    if (boundary === undefined || face === undefined || boundary.spaces.length !== 1) continue;
    const xs = opening.profile?.outline.map((q) => q.x) ?? [0];
    const ys = opening.profile?.outline.map((q) => q.y) ?? [0];
    const u = (Math.min(...xs) + Math.max(...xs)) / 2;
    const v = (Math.min(...ys) + Math.max(...ys)) / 2;
    const alongZ = Math.abs(face.rotation.y) > 1e-6;
    const mouth = alongZ ? { x: face.origin.x, y: v, z: u } : { x: u, y: v, z: face.origin.z };
    const outward = outwardNormal(environment, boundary.spaces[0]!, mouth, alongZ ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 });
    out.push({
      id: `exterior.opening.${opening.id}`, group: "exterior", space: null, role: "opening", label: `외부 개구부 · ${opening.id}`,
      // 지붕·마당 위의 높은 창은 창 바깥 가까이, 창보다 조금 높은 곳에서 본다.
      position: v > templeRoofRules.courtEave
        ? { x: mouth.x + outward.x * 2.5, y: v + 0.6, z: mouth.z + outward.z * 2.5 }
        : { x: mouth.x + outward.x * 7, y: Math.max(eye, v - 0.8), z: mouth.z + outward.z * 7 },
      target: mouth, note: null,
    });
  }
  const entry = environment.openings.find((o) => o.id === "door-entry");
  if (entry !== undefined) {
    out.push({
      id: "exterior.opening.door-entry", group: "exterior", space: null, role: "opening", label: "외부 개구부 · door-entry(정문 축)",
      position: { x: 0, y: eye, z: p.southOuter + 7 }, target: { x: 0, y: 1.4, z: p.entranceBack }, note: null,
    });
  }
  return out;
};

/**
 * docs/spaces/site.md의 대지 관찰. 조감은 구획·경계석 고리·배치 구역을, 두 접근은
 * 경계석 끊김과 접점 높이를, 서측 골목은 지면 경사를, 정면 거리 시점은 먼 능선이
 * 신전 뒤에 낮게 놓이는지를 본다. 눈높이는 대지 support 위 1.6m다.
 */
const siteObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const standing = (x: number, z: number): IAutoMovieVector3 => {
    const floor = supportHeight(environment, "temple-site", { x, y: 0, z });
    if (floor === null) throw new Error(`temple/observations: 대지 관찰 위치 (${x}, ${z})에 support가 없습니다.`);
    return { x, y: floor + eye, z };
  };
  const entries: [string, string, IAutoMovieVector3, IAutoMovieVector3][] = [
    ["site.aerial", "대지 · 구획 조감", { x: 0, y: 62, z: 16 }, { x: 0, y: 0, z: 1 }],
    ["site.approach-entry", "대지 · 정문 진입 포장과 경계석 끊김", standing(4.5, 17.5), { x: 0, y: 0, z: 11.5 }],
    ["site.approach-service", "대지 · 동측 골목에서 서비스 문", standing(13.3, 0.5), { x: 10.5, y: 1.0, z: -6.4 }],
    ["site.lane-west", "대지 · 서측 골목 경사", standing(-13.3, 12.5), { x: -12.5, y: 0.6, z: -12 }],
    ["site.ridge-front", "대지 · 정면 거리 서쪽에서 먼 능선", standing(-26, 18), { x: -4, y: 4, z: -80 }],
  ];
  return entries.map(([id, label, position, target]) => ({
    id, group: "site", space: "temple-site", role: id.split(".")[1]!, label, position, target, note: null,
  }));
};

/** 면 법선을 공간 밖을 향하게 맞춘다. 0.5m 앞 점이 그 공간 안이면 뒤집는다. */
const outwardNormal = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3, normal: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const probe = { x: at.x + normal.x * 0.5, y: 1.2, z: at.z + normal.z * 0.5 };
  const inside = environment.spaces.find((s) => s.id === space)?.cells.some((cell) =>
    cell.planes.every((plane) => plane.normal.x * probe.x + plane.normal.y * probe.y + plane.normal.z * probe.z <= plane.offset)) ?? false;
  const length = Math.hypot(normal.x, normal.z) || 1;
  const sign = inside ? -1 : 1;
  return { x: sign * normal.x / length, y: 0, z: sign * normal.z / length };
};

/** 그 공간의 수평 support 중 점을 포함하는 가장 높은 면의 높이. */
const supportHeight = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3,
): number | null => {
  const heights = environment.surfaces.filter((entry) => entry.space === space).flatMap((entry) => {
    const surface = entry.surface;
    const inside = (ring: readonly IAutoMovieVector3[]) => ring.reduce((odd, a, i) => {
      const b = ring[(i + 1) % ring.length]!;
      return (a.z > at.z) !== (b.z > at.z) && at.x < (b.x - a.x) * (at.z - a.z) / (b.z - a.z) + a.x ? !odd : odd;
    }, false);
    if (!inside(surface.polygon) || (surface.holes ?? []).some(inside)) return [];
    const rule = surface.height;
    if (rule?.kind === "constant") return [rule.value];
    if (rule?.kind === "plane") return [rule.originHeight + rule.slopeX * at.x + rule.slopeZ * at.z];
    return [];
  });
  return heights.length === 0 ? null : Math.max(...heights);
};

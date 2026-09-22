/**
 * 아홉 방의 바닥 소유 입력을 실제 mesh와 native support로 조립한다.
 * 공간 치수는 각 room source, 구조 두께는 storey가 소유한다. 이 파일은
 * 같은 입력에서 경계면→표면 소유→engine mesh 순서만 수행한다.
 * 모든 방을 함께 계산해야 문턱/주랑/중정 접합의 내부 면이 남지 않는다.
 * surface별 index group은 한 완결 시각 표면의 전체 조각을 묶는다.
 * 재료·model·element·walkable 결속은 후속 환경 조립에서 소비한다.
 */
import {
  buildAutoMoviePolyhedron,
  inspectAutoMovieMeshTopology,
  mergeAutoMovieMeshParts,
} from "@automovie/engine";
import { floorBoundaryFaces } from "./geometry/floor-faces";
import { floorSupportSurfaces } from "./geometry/floor-supports";
import { templeAdministrationFloor } from "./spaces/rooms/administration";
import { templeColonnadeFloor } from "./spaces/rooms/colonnade";
import { templeCourtyardFloor, templeCourtyardOwnsCurb } from "./spaces/rooms/courtyard";
import { templeEntranceFloor } from "./spaces/rooms/entrance";
import { templeOfferingFloor } from "./spaces/rooms/offering";
import { templeRecordsFloor } from "./spaces/rooms/records";
import { templeSanctuaryFloor } from "./spaces/rooms/sanctuary";
import { templeServiceYardFloor } from "./spaces/rooms/service-yard";
import { templeStorageFloor } from "./spaces/rooms/storage";

/**
 * 호출 시마다 현재 소유 입력을 평가한다. 캐시/전역 mutable mesh는 없다.
 * 바닥 slab는 문틀 밑을 포함하지만 support는 유효 통과 영역만 포함한다.
 * mesh query 결과는 실제 호출 때 생성되며 함수 저작 자체는 검증 결과가 아니다.
 */
export const createTempleFloors = () => {
  const inputs = [
    templeEntranceFloor(), templeCourtyardFloor(), templeColonnadeFloor(),
    templeSanctuaryFloor(), templeOfferingFloor(), templeAdministrationFloor(),
    templeRecordsFloor(), templeStorageFloor(), templeServiceYardFloor(),
  ];
  const faces = floorBoundaryFaces(inputs).map((face) => ({
    ...face,
    surface: templeCourtyardOwnsCurb(face) ? "surface.courtyard.floor" : face.surface,
  }));
  const assembly = mergeAutoMovieMeshParts(inputs.map((input) => ({
    id: input.surface,
    mesh: buildAutoMoviePolyhedron(
      faces.filter((face) => face.surface === input.surface).map((face) => face.corners),
    ),
  })));
  return {
    inputs,
    faces,
    assembly,
    supports: inputs.flatMap(floorSupportSurfaces),
    thresholdReservations: inputs.flatMap((input) => input.slabs
      .filter((slab) => slab.opening !== null)
      .map((slab) => ({ ...slab, space: input.space, surface: input.surface }))),
    topology: inspectAutoMovieMeshTopology(assembly.mesh),
  };
};

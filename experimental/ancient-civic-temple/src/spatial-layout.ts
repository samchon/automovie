/**
 * 판정된 공간 owner들을 한 번 평가하는 순수 조립 진입점.
 * 지붕 envelope를 먼저 구하고 동일 결과로 현관·제실·주랑 cell을 만든다.
 * 반환값은 공간 source draft의 기하 입력이며 완성 BuiltEnvironment가 아니다.
 * 벽/바닥/개구부 실체, support, connector, 외부 지면, 렌더는 아직 결속 전이다.
 * viewer/계측의 후속 소비자가 별도 좌표나 cell을 재저작하지 않게 공유한다.
 */
import { templeSpaceHierarchy } from "./spaces/building";
import { templeDoorPassages, templeClerestories } from "./spaces/openings";
import { templeRoofEnvelope } from "./spaces/roofs/assembly";
import { templeAdministration } from "./spaces/rooms/administration";
import { templeColonnade } from "./spaces/rooms/colonnade";
import { templeCourtyard, templeFountainInputs } from "./spaces/rooms/courtyard";
import { templeEntrance } from "./spaces/rooms/entrance";
import { templeOffering } from "./spaces/rooms/offering";
import { templeRecords } from "./spaces/rooms/records";
import { templeSanctuary } from "./spaces/rooms/sanctuary";
import { templeServiceYard } from "./spaces/rooms/service-yard";
import { templeStorage } from "./spaces/rooms/storage";

export const createTempleSpatialLayout = () => {
  const roof = templeRoofEnvelope();
  return {
    roof,
    spaces: templeSpaceHierarchy([
      templeEntrance(roof), templeCourtyard(), templeColonnade(roof),
      templeSanctuary(roof), templeOffering(), templeAdministration(),
      templeRecords(), templeStorage(), templeServiceYard(),
    ]),
    doors: templeDoorPassages,
    clerestories: templeClerestories(),
    fountainInputs: templeFountainInputs(),
  };
};

# 조명 체계의 틀

## 광원 소유와 쓰기 경계 {#lighting-authority}
<!--
@evidence principles/core/common.md#scope-preservation 광원 레코드의 쓰기 채널과, 방 경계·기구 몸체·발광 표면·배치를 spaces·models·materials·instances로 넘기는 경계를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 광원 id 형식 `light:<space-id>:<fixture-role>`, 쓸 수 있는 17개 공간 id, 대지 전체 낮빛의 `light:daylight:<role>` 예외를 정해 source가 id 규칙을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 조명의 systems 소유는 build-allocation, 광원 조건은 lighting-state에서 받고 id 형식과 한 광원 한 공간 소속은 이 branch의 선택이라고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation build-allocation이 "조명은 systems가 소유한다"만 정한 데 비해 쓰기 채널 목록, 공간별 id 규칙, 한 광원 한 공간 소속, 값의 단일 저작 파일을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 쓰는 것은 IAutoMovieLight 필드와 environment 다섯 값뿐이고 방 경계·천장 datum은 spaces, 기구 geometry는 models, 발광 표면은 materials, 배치는 instances에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 모든 기구 광원이 spaces id 하나에 묶여 입력 공간이 이름으로 드러나고 같은 값을 두 파일에서 저작하지 않아 이름 없는 입력이 없다.
@evidence principles/design/systems.md#system-verification-address 컴파일된 광원 목록이 네 광원 종류만 쓰는지, 공간 id가 실제 spaces 방과 일치하는지, 다른 branch 값을 쓰는 광원이 없는지의 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work build-allocation의 조명 배정과 spaces 방 id 17개를 소비했고 한 상태를 두 owner가 쓰거나 권한 없는 입력이 생기는 경우가 없어 부모 수정이 없었다.
@evidence settings/00-production.md#build-allocation "조명은 systems가 소유한다"를 받아 쓰기를 광원 레코드와 environment 값에 한정하고 기구 형상·표면·배치는 각 branch에 남긴다.
@evidence settings/00-production.md#working-language 본문 끝 문단대로 조명 결정을 한국어로 쓰고 API·필드명·광원 id만 원형을 보존한다.
@evidence obligations/design/systems.md#addressable-system-decisions 태양·하늘 fill·창 자연광·기구 묶음마다 독립 H2를 두고 광원 하나를 공간 하나에 묶어 따로 바꾸고 검토하게 한다.
@evidence obligations/design/systems.md#system-ownership-interfaces 입력(spaces 방 id·천장 datum), 출력(광원 레코드·environment 값), 영향받는 owner(models·materials·instances)를 이 H2가 나눈다.
@evidenceExclude models/00-model-frame.md#model-local-frame 창·문의 날씨 면 원점과 yaw는 충전 메시의 배치 기준이다. 조명 레코드는 이미 world 좌표로 쓰며 이 국소 frame을 변환 입력으로 받지 않는다.
@evidenceExclude models/00-model-frame.md#model-furniture-local-frame 가구 뒤 변 원점·걸레받이 홈·공통 손잡이와 미터 UV는 원형 생성에 남긴다. 광원 위치를 가구 mesh의 꼭짓점에서 역산하는 단계가 없다.
@evidenceExclude models/00-model-frame.md#model-reference-scale 사람 점유체와 문 순폭은 모델 사이 척도 대조다. systems의 32개 광원 목록에는 사람 또는 문 유효폭으로 바뀌는 값이 없다.
@evidenceExclude models/00-model-frame.md#model-representation-ceiling 웨더스트립·나사·유리 공기층의 표현 생략은 창호 원형의 한계다. 이 조명은 그러한 내부 부품을 광원으로 실현하지 않는다.
@evidenceExclude models/00-model-frame.md#model-surface-partition-naming sash·leaf·fixture-diffuser 같은 면 이름은 재료 결속의 키다. light id는 공간과 기구 역할에서 만들며 면 이름을 광원 id로 변환하지 않는다.
@evidenceExclude models/00-model-frame.md#model-representation-completion 닫힌 부피와 계열별 구조·의미 판정은 모델 source의 완결을 묻는다. 조명 수나 광원 동일성의 성공으로 그 모델 판정을 대신하지 않는다.
@evidenceExclude models/00-model-frame.md#model-review-set 원형마다 직교·단면·사선 및 face-id 쌍을 요구하는 목록은 모델 검사의 카메라다. 조명의 여섯 사례는 실제 집의 외관·실내와 광원 산출물을 쓰며 중립 모델 카메라를 소비하지 않는다.
@evidenceExclude models/01-windows.md#window-local-frame 날씨 면에서 0.04 m 물린 창틀과 0.14 m 깊이는 모델 안에서 정한다. 낮빛 directional의 위치·회전은 그 들임과 무관하게 집 전체에 고정된다.
@evidenceExclude models/01-windows.md#window-member-sizes frame·sash·mullion·유리 두께를 조명 파일에서 재저작하지 않는다. 창 안 자연광 관찰에 원본 메시가 참여해도 부재 폭으로 새 창 광원을 만들지 않는다.
@evidenceExclude models/01-windows.md#window-muntin-grid 유리의 2×2 격자와 양면 살대는 태양 그림자 수신 장면의 형상이다. 광원 목록의 생성 규칙은 살대 수를 입력으로 읽지 않는다.
@evidenceExclude models/01-windows.md#double-hung-window lower-sash의 이동 범위와 upper-sash 고정은 창 motion 인터페이스다. systems는 창의 열림에 반응하는 상태나 광원을 두지 않는다.
@evidenceExclude models/01-windows.md#fixed-window 계단·차고 고정창의 unit 계층에는 발광원이 없다. 계단참과 차고등은 해당 공간의 천장 datum에서 별도로 정한다.
@evidenceExclude models/01-windows.md#awning-window 욕조 창 π/8 열림과 0.25 m 돌출 예약은 창의 동작 적합이다. 이 조명은 awning 각도를 입력으로 받아 세기나 방향을 바꾸지 않는다.
@evidenceExclude models/01-windows.md#window-sill-trim 안쪽 창대·문선과 외부 trim의 돌출·UV는 창호 접합이다. 같은 태양과 fill을 모든 view에 유지하므로 이 돌출을 방별 조명 보정값으로 쓰지 않는다.
@evidenceExclude models/01-windows.md#window-surface-partitions glass와 obscured-glass를 포함한 아홉 면 id는 materials가 바인딩한다. systems가 읽는 유리의 그림자 통과 조건은 재료의 transmission 경계이며 이 원형의 면 목록을 다시 선언하지 않는다.
@evidenceExclude models/01-windows.md#window-fidelity 방충망·잠금쇠의 생략을 포함한 창 표현 한계는 조명의 정지 상태·예산과 별개다. 광원 체크로 창의 실내외 렌더 완결을 주장하지 않는다.
@evidenceExclude models/02-exterior-doors.md#front-entry-door 현관문 유리 여섯 칸·손잡이·경첩 회전은 문 원형이 소유한다. 포치 벽등 위치는 spaces의 front-door 거친 개구부와 포치 바닥을 기준으로 택한다.
@evidenceExclude models/02-exterior-doors.md#garage-sectional-door 네 패널의 rail-path와 travel 2.30 m는 차고문 동작이다. 차고등은 spaces의 가이드 예약 뒤에 고정하고 travel을 평가 입력으로 받지 않는다.
@evidenceExclude models/02-exterior-doors.md#garden-door-pair 정원 유리문 두 장의 경첩과 순폭은 외부문 모델 결정이다. 이 systems는 후면 정원문 기구 광원을 요구하지 않는다고 정해 해당 문에 새 광원을 붙이지 않는다.
@evidenceExclude models/02-exterior-doors.md#side-yard-gate 목재 대문의 world 형상과 경첩축에는 조명 역할이 없다. 포치 벽등 하나 외에는 외부 기구가 없으며 대문 동작과 연결한 광원도 없다.
@evidenceExclude models/02-exterior-doors.md#exterior-door-surfaces leaf-exterior·leaf-interior·panel-edge의 면 분리는 문 재료의 교체 경로다. 낮빛과 포치등의 레코드에는 이 면 id를 선택하는 필드가 없다.
@evidenceExclude models/02-exterior-doors.md#exterior-door-fidelity 차고 스프링·자물쇠 내부를 생략하는 한계는 문 제작 범위다. 조명은 그러한 내부 장치를 켜거나 시간 상태로 모델링하지 않는다.
@evidenceExclude models/03-interior-doors.md#interior-door-members 문선·문설주·문짝 두께는 방 개구부를 채우는 모델 치수다. 천장 광원은 문짝 치수 대신 방 외곽과 완성 천장 좌표를 쓴다.
@evidenceExclude models/03-interior-doors.md#interior-door-hinges 열한 문 경첩 low/high와 π/2 기준 열림은 충전 원형의 motion 값이다. 조명은 문 개폐 스위치나 문각을 소비하는 갱신 순서를 두지 않는다.
@evidenceExclude models/03-interior-doors.md#interior-door-surfaces jamb-a·jamb-b·casing 양면 구분은 인접 방 마감 결속이다. 광원의 한 공간 소속은 spaces id에서 결정하며 문 면 이름으로 방을 판별하지 않는다.
@evidenceExclude models/03-interior-doors.md#interior-door-fidelity 문 내부 하드웨어를 만들지 않는다는 모델 한계는 조명 필드의 범위를 늘리지 않는다. 같은 문을 비추는 결과와 문 제작 완결은 각각 검사한다.
@evidenceExclude models/04-stair-members.md#stair-balusters 난간살 단면·반복 간격은 계단의 추락 경계 형상이다. 계단참 광원 하나는 중간참 중심과 상층 천장에서 오며 난간살 개수로 분배하지 않는다.
@evidenceExclude models/04-stair-members.md#stair-bottom-member 디딤과 복도 가장자리의 아래 부재는 난간 접합을 닫는다. 복도 두 천장등의 중심 좌표는 그 아래 부재가 아닌 복도 팔의 spaces 외곽에서 정한다.
@evidenceExclude models/04-stair-members.md#stair-side-skirt 열린 계단 옆 흰 경사판은 구조 디딤과 별도 메시다. 계단의 발광점 높이는 판의 경사선을 추종하지 않고 완성 천장 아래 0.05 m다.
@evidenceExclude models/04-stair-members.md#stair-member-surfaces baluster·bottom-rail·stair-skirt의 면 id를 광원 목록으로 읽지 않는다. 각각의 마감은 materials에 남겨 조명의 쓰기 권한과 분리한다.
@evidenceExclude models/04-stair-members.md#stair-member-fidelity 난간 체결 내부와 구조 하중의 생략은 계단 부재 표현 범위다. 조명은 난간 안전성을 검증하는 결과를 내지 않는다.
@evidenceExclude models/05-closet-fittings.md#coat-closet-doors 외투장 두 미닫이문과 두 트랙은 수납 개구부를 닫는다. 이 library에는 외투장 안 별도 등이나 문 열림에 반응하는 광원이 없다.
@evidenceExclude models/05-closet-fittings.md#coat-closet-rod-shelf 외투장 봉·상부 선반은 수납 기능의 고정 부재다. 천장등은 현관 방에 속하고 봉이나 선반을 광원 배치 host로 쓰지 않는다.
@evidenceExclude models/05-closet-fittings.md#linen-closet-fittings 린넨장 다섯 단과 문 이동량은 수납 원형 결정이다. 복도 arrival 광원은 복도 외곽 중심을 쓰며 선반마다 등 다섯 개를 생성하지 않는다.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-surfaces rail·rod·shelf·leaf의 금속·도장 분리는 수납 면 결속이다. 조명 id의 fixture-role은 그 네 표면 이름과 다른 소유다.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-fidelity 수납 트랙 내부 장치를 생략해도 이 systems의 스위치 회로 생략과 같은 결정으로 합치지 않는다. 수납 원형의 기계적 완결은 모델 검사에 남긴다.
@evidenceExclude models/06-interior-trim.md#wall-baseboard 높이 0.10 m의 벽 걸레받이 반복은 벽 하단 마감이다. 조명은 벽 길이 조각마다 광원을 더하지 않으며 바닥 가까운 trim을 위치 입력으로 받지 않는다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-base-run 하부장 세 구간의 plinth·서랍·문은 주방 고정 수납 몸체다. 섬등과 가족실등은 그 문·서랍의 개폐값을 읽지 않는다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-wall-cabinet 상부장 두 몸체의 높이·문짝 분절은 벽 예약의 충전이다. systems는 수납장 아래 작업등을 새로 만들지 않는다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-refrigerator 양문 냉장고의 내부·손잡이·문 동작은 가전 원형이다. 이 systems에는 냉장고 내부 점등 또는 기기 전원 상태가 없다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-range 레인지의 burner·오븐창·조작부는 정지 가전 형상이다. 화구 발광이나 오븐 내부 광원을 조명 목록에 포함하지 않는다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-microwave 전자레인지 문과 control-panel은 가전 표면이며 systems가 조작부 발광을 저작하지 않는다. 공용부 세 pendant와 family-ceiling만 해당 공간 광원이다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-island 싱크·수전·하부 몸통은 설비 원형이 맡는다. pendant 위치와 갓의 수평 여유는 common-island-reservation의 외곽에서 받으며 섬 메시의 정점으로 광원점을 다시 계산하지 않는다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-dishwasher 식기세척기의 회전 문과 내부는 appliance 모델이다. 이 조명에는 세척 운전 시계·기기 내부등·문 스위치가 없다.
@evidenceExclude models/10-kitchen-dining.md#kitchen-island-stool 스툴 좌판과 footrest 치수는 좌석 use 적합을 묻는다. 섬 pendant의 통로 검사 대상은 spaces의 stool use 예약이며 의자 원형의 관절이나 치수를 광원 입력으로 읽지 않는다.
@evidenceExclude models/10-kitchen-dining.md#dining-table 식탁 상판·다리·여섯 좌석 배열은 가구 모델 결정이다. 식탁등의 X/Z와 갓 지름 대조는 dining 예약 상판 구역에서 정하고 아직 없는 식탁 source를 조명 구현 완료로 세지 않는다.
@evidenceExclude models/10-kitchen-dining.md#dining-chair 의자의 seat·leg·back과 꺼낸 상태는 가구의 생활 기능이다. 식탁등 하나를 여섯 의자 수에 맞추어 복제하거나 의자 변환으로 회전시키지 않는다.
@evidenceExclude models/11-living.md#fabric-sofa 패브릭 소파의 쿠션·팔걸이·다리는 이동 가구 원형이다. 거실 천장등은 sofa의 국소 원점과 무관하게 living-plan 중심에 고정한다.
@evidenceExclude models/11-living.md#low-table 낮은 탁자 크기 변형은 거실과 가족실 가구의 적합이다. 두 방 조명은 탁자 길이를 광원 range나 세기로 바꾸는 규칙을 갖지 않는다.
@evidenceExclude models/11-living.md#reading-armchair 독서 의자의 등받이·팔걸이와 사용 점유는 좌석 모델에 남긴다. 설정이 요구하지 않은 독서용 스탠드 광원을 이 의자 옆에 추가하지 않는다.
@evidenceExclude models/11-living.md#dark-bookcase 책장의 선반·책 부피는 거실 수납이다. 책장 칸마다 광원이나 발광 book 면을 생성하는 조명 결정이 없다.
@evidenceExclude models/11-living.md#floor-covering 러그·매트의 얇은 부피와 테두리는 바닥 covering이다. 조명은 covering 높이를 바닥 datum으로 치환하지 않고 spaces의 층 높이를 유지한다.
@evidenceExclude models/11-living.md#fireplace-insert-mantel 검은 화구와 목재 선반은 꺼진 벽난로 원형이다. 정지 기준의 광원 목록에는 화구 불빛이나 시간 변화가 없어 이 부재가 광원 생성 입력이 아니다.
@evidenceExclude models/12-service-rooms.md#laundry-machine 세탁기와 건조기의 drum·유리 문·조작부는 개별 가전이다. laundry 천장등 하나 외에 회전 드럼이나 작동 표시의 조명을 저작하지 않는다.
@evidenceExclude models/12-service-rooms.md#laundry-folding-top 접는 상판과 cleat의 world 형상은 벽 예약 충전이다. 세탁실 발광점은 방 중심에서 정하며 상판 높이로 광원 Y를 정하지 않는다.
@evidenceExclude models/12-service-rooms.md#laundry-upper-storage 동쪽 벽 상부 수납의 미리 변환된 몸체는 instances의 두 번째 yaw를 막는 모델 결정이다. systems의 world light transform에는 그 수납 변환을 합성하지 않는다.
@evidenceExclude models/12-service-rooms.md#mudroom-bench 신발 벤치 좌판·선반과 기존 거친 신발 부피는 수납 원형이다. 머드룸등은 벤치 아래 또는 신발 칸 안 광원을 두지 않는다.
@evidenceExclude models/12-service-rooms.md#mudroom-coat-hooks 서쪽 벽판·고리·외투는 models가 만드는 고정 수납 부재다. 고리 배열을 광원 개수로 읽지 않고 laundry-mudroom 한 공간에 천장등 하나를 둔다.
@evidenceExclude models/12-service-rooms.md#pantry-l-shelf 팬트리 다섯 단 L형 선반은 두 storage 띠를 채운다. 천장등의 좌표는 pantry-plan 외곽 중심이며 다섯 shelf 높이를 평가 입력으로 쓰지 않는다.
@evidenceExclude models/12-service-rooms.md#pantry-containers 선반의 병·상자·바구니는 생활 소품 원형이다. 그 70개 배치 유무에 따라 팬트리 광원 레코드를 생성하거나 생략하지 않는다.
@evidenceExclude models/12-service-rooms.md#garage-shelving 금속 선반과 수납함은 차고 후벽 storage 원형이다. 광원의 가이드 비간섭은 garage 공간 예약에서 대조하며 선반 post 좌표를 소비하지 않는다.
@evidenceExclude models/12-service-rooms.md#garage-workbench 작업대 상판·다리·서랍은 차고 가구다. 작업대 위 별도 작업등을 요구하지 않고 뒤쪽 ceiling 한 개로 차고 광원을 정한다.
@evidenceExclude models/12-service-rooms.md#garage-tool-board 공구판의 board·tool-steel·tool-grip 배열은 수납 표면이다. 각 공구를 발광 대상으로 바꾸거나 tool 색을 광원 색으로 가져오지 않는다.
@evidenceExclude models/13-bedrooms.md#headboard-bed 침대 틀·머리판·침구 변형은 가구 원형이다. 협탁등 높이는 spaces의 등 포함 높이에서 정하고 침대 메시 높이를 광원 좌표로 삼지 않는다.
@evidenceExclude models/13-bedrooms.md#low-dresser 낮은 서랍장의 carcass·drawer-front는 가구 부피다. 침실 천장등과 협탁등 외에 서랍장 기구 광원을 두는 결정이 없다.
@evidenceExclude models/13-bedrooms.md#child-desk 작은 책상과 연필·책 소품은 두 방의 가구 집합이다. 이 조명 목록에는 책상등이 없으며 책상 치수에서 새로운 발광점을 도출하지 않는다.
@evidenceExclude models/13-bedrooms.md#desk-chair 책상 의자의 좌판·다리·등받이는 가구 사용 점유를 채운다. 의자 위치는 ceiling이나 nightstand-lamp의 transform을 갱신하지 않는다.
@evidenceExclude models/13-bedrooms.md#sliding-closet 미닫이 옷장 두 문·봉·선반은 방의 수납 경계다. closet 문 상태에 반응하는 내부등이 없고 각 침실의 rest 광원만 남는다.
@evidenceExclude models/13-bedrooms.md#primary-window-curtains 여덟 커튼의 봉·주름·띠는 원형의 창 앞 점유다. 시스템은 커튼마다 area 광원을 만들지 않고 같은 낮빛을 유지하며 커튼 광학값은 materials에 맡긴다.
@evidenceExclude models/13-bedrooms.md#wardrobe-hanging 옷방 봉·의류 부피는 storage 띠에 속한다. 천장등 중심은 hanging 깊이 밖의 wardrobe-plan에서 택하며 rod 개수로 광원을 늘리지 않는다.
@evidenceExclude models/13-bedrooms.md#wardrobe-shelves 옷방 선반·접힌 직물·바구니는 storage 원형이다. 선반 단마다 발광면이나 point를 더하지 않는 단일 wardrobe ceiling 상태다.
@evidenceExclude models/14-bathrooms.md#shared-toilet 변기 도기·좌대·잠긴 뚜껑 profile은 고정 위생 원형이다. 세 위생실의 ceiling·vanity 광원은 toilet 관절값과 연결되어 있지 않다.
@evidenceExclude models/14-bathrooms.md#vanity-basin 세면장의 W/D·볼·수전은 설비 모델이다. vanity light 위치는 각 spaces의 세면장 예약과 거울 띠에서 받으며 모델을 축소해 광원에 맞추지 않는다.
@evidenceExclude models/14-bathrooms.md#wall-mirror 거울 판·검은 테의 형상은 위생 설비다. 광원점은 spaces의 거울 띠 위에 두고 systems가 반사 mesh나 가상 Reflector 카메라를 저작하지 않는다.
@evidenceExclude models/14-bathrooms.md#towel-bar 수건 봉과 직물은 고정 걸이 원형이다. 같은 벽의 세면등을 수건걸이 id에 결속하는 규칙은 없다.
@evidenceExclude models/14-bathrooms.md#sliding-shower-booth 샤워 유리·미닫이문·레일·수전과 헤드는 한 booth 원형이다. 조명은 샤워 작동·물 상태를 읽지 않고 해당 방의 ceiling와 vanity만 정지 상태로 둔다.
@evidenceExclude models/14-bathrooms.md#bathtub 욕조의 도기 곡면과 수전은 고정 설비다. tub-bathroom 천장등은 욕조 내부 면의 좌표나 담긴 물에서 도출하지 않는다.
@evidenceExclude models/14-bathrooms.md#tub-curtain-rail 욕조 커튼의 local 길이축과 world yaw는 모델·배치 접합이다. 욕실 광원은 그 rail yaw를 공유하는 자식 transform이 아니다.
@evidenceExclude models/14-bathrooms.md#bath-floor-mats 욕실 바닥 매트 두 장은 covering 원형이다. 천장 Y와 세면등 Y는 매트 두께를 더하지 않고 층 완성 바닥 기준을 쓴다.
@evidenceExclude models/14-bathrooms.md#shower-niche-bottles 벽감 선반 위 세 용기는 소품 구성원이다. 벽감 점등을 요구하지 않아 용기 수·높이를 조명 값으로 읽지 않는다.
@evidenceExclude models/15-outdoor.md#terrace-table 테라스 식탁의 좌석 중심·상판·다리는 야외 가구 모델이다. 외부 기구는 포치 벽등 하나뿐이며 테라스 식탁등을 만들지 않는다.
@evidenceExclude models/15-outdoor.md#terrace-chair 네 야외 의자의 사용 상태는 테라스 예약 적합이다. 낮빛 directional은 의자 수나 꺼낸 위치에 따라 분기하지 않는다.
@evidenceExclude models/15-outdoor.md#lap-siding-board siding의 노출 0.15 m·겹침·절단 끝은 외피 부재 형상이다. 그림자 수신 장면에는 참여하지만 태양과 fill 방향의 입력은 아니다.
@evidenceExclude models/15-outdoor.md#exterior-corner-trim 외벽 모서리 trim의 두 판 접합은 외피 마감이다. 모서리마다 별도 광원을 두거나 trim 법선을 light transform으로 쓰지 않는다.
@evidenceExclude models/15-outdoor.md#asphalt-shingle-strip shingle 줄·starter·ridge 형상은 지붕 외피다. 태양의 그림자 예산은 한 개로 고정되어 탭이나 용마루 조각 수와 무관하다.
@evidenceExclude models/15-outdoor.md#eave-gutter-downspout 홈통과 선홈통의 경로·배수 끝은 외장 부재 원형이다. 이 systems에는 홈통을 따라 배치하는 장식등이나 물 상태 광원이 없다.
@evidenceExclude models/16-planting.md#site-tree-prototypes 성목과 뒤뜰 나무의 줄기·가지·잎 군집은 식재 원형이다. 오후 방향은 저작 상수이며 나무 높이로 태양 고도를 역산하지 않는다.
@evidenceExclude models/16-planting.md#site-shrub-prototype 낮은 관목은 maps 기준점을 기다리는 식재 원형이다. 식재 입력이 없어도 네 directional과 방 기구 목록은 같은 정지 값을 낸다.
@evidenceExclude models/18-house-props.md#porch-mat-planter 포치 매트·화분은 진입 축 밖의 생활 소품이다. 꺼진 포치 벽등의 위치는 문설주·포치 바닥에서 정하며 화분을 host로 쓰지 않는다.
@evidenceExclude models/18-house-props.md#kitchen-food-utensils 도마·도구통·병·과일 그릇은 상판 소품이다. pendant 광원은 그 개별 소품의 색·배열·seed를 입력으로 읽지 않는다.
@evidenceExclude models/18-house-props.md#linen-folded-towels 린넨장 30장 수건은 선반 위 직물 구성원이다. 복도 광원 목록에는 수건 묶음마다 발광점을 배정하는 법칙이 없다.
@evidenceExclude models/19-room-accents.md#living-tabletop-props 책·쟁반·꽃병은 탁자 host에 결속되는 생활 소품이다. 조명은 소품 host를 평가하지 않고 거실·가족실 공간의 고정 ceiling을 쓴다.
@evidenceExclude models/19-room-accents.md#wall-art-indoor-plant 액자 인쇄면과 작은 식물은 벽·선반 소품이다. 인쇄 seed를 광원 seed로 가져오거나 액자 전용 spot을 추가하지 않는다.
@evidenceExclude models/19-room-accents.md#sofa-throws 쿠션 둘·접힌 담요의 국소 배열은 좌석 소품이다. 조명은 소파 접점과 무관한 world rest 값이며 직물 부피를 다시 만든다는 쓰기 권한이 없다.
@evidenceExclude materials/00-material-frame.md#material-color-space 재료 hex를 IEC 함수로 선형화하는 절차는 base color의 저작 변환이다. 광원 색은 이 systems가 선형 RGB 상수로 직접 택하며 재료 hex를 광원 색으로 변환하지 않는다.
@evidence materials/00-material-frame.md#material-texture-response 이 재료 틀은 표면 맵·유약·거울 응답을 materials에 두고 발광을 systems에 남긴다. 이 H2도 광원 레코드만 쓰고 갓과 전구의 표면을 재료 owner에 남겨 그 경계를 유지한다.
@evidenceExclude materials/00-material-frame.md#material-response-conventions roughness 대역과 노출 금속 metallic은 물체 표면의 광학값이다. systems는 광원에 roughness·metallic 필드를 쓰지 않으며 도장 금속을 발광 금속으로 치환하지 않는다.
@evidenceExclude materials/00-material-frame.md#material-binding-rule 면마다 한 재료와 single-sided 기본값은 메시 결속의 규칙이다. 광원 레코드에는 face binding 단계가 없고 재료 없는 면의 검사를 조명 개수 검사로 대신하지 않는다.
@evidenceExclude materials/00-material-frame.md#material-review-set 중립 구·평판과 baseline 재료 판은 재료 비교를 위한 소비자다. 조명의 여섯 사례는 집의 외관·실내와 실제 광원 목록이며 견본별 광원이나 노출을 새로 정하지 않는다.
@evidenceExclude materials/01-exterior.md#siding-warm-white siding의 #EDE8DC 도막·물리 맵은 외피 마감 입력이다. 태양과 두 fill은 그 hex에 따라 입면별 세기를 고르는 분기가 없다.
@evidenceExclude materials/01-exterior.md#trim-white PVC·목재 trim의 #F6F4EE와 반광은 돌출 부재 결속이다. 이 systems는 trim을 광원 diffuser로 해석하거나 외장 면의 색을 light color로 가져오지 않는다.
@evidenceExclude materials/01-exterior.md#roof-shingle shingle의 어두운 입자 맵·roughness는 지붕 표면이다. 낮빛 rest state는 지붕 텍스처 모듈이나 탭 패턴을 읽지 않는다.
@evidenceExclude materials/01-exterior.md#brick-red-brown 벽돌과 연속 줄눈의 맵은 기단·굴뚝 마감이다. 꺼진 벽난로 상태에서 벽돌을 발광 화구로 바꾸는 조명 결정이 없다.
@evidenceExclude materials/01-exterior.md#window-frame-charcoal 창틀·cap·flashing의 도장 charcoal은 불투명 표면이다. 조명은 도장 금속의 metallic 값을 directional 종류나 그림자 수로 변환하지 않는다.
@evidenceExclude materials/01-exterior.md#front-door-wood 현관문 목재의 결·roughness는 문짝 표면이다. 포치등의 2,700 K 값은 이 목재 hex를 샘플링한 색이 아니라 systems의 별도 선택이다.
@evidenceExclude materials/01-exterior.md#garage-door-charcoal 차고문의 charcoal 분절 마감은 모델 패널에 결속한다. 차고 ceiling의 4,000 K·9 cd는 문 패널 재료를 전원 상태로 읽지 않는다.
@evidenceExclude materials/01-exterior.md#porch-floor 포치 바닥의 표면 응답은 접지 마감이다. 벽등 Y=1.80 m는 바닥 geometry datum을 기준으로 하며 바닥 텍스처의 색·반복 길이로 높이를 바꾸지 않는다.
@evidenceExclude materials/01-exterior.md#paving-concrete 포장 콘크리트의 얼룩·입자 맵은 대지 표면이다. 방향광의 그림자 camera는 fence-enclosure-plan 범위를 쓰며 포장 맵 경계를 camera 범위로 읽지 않는다.
@evidenceExclude materials/01-exterior.md#fence-wood 울타리 목재의 수직 결은 fence 부재 마감이다. 태양의 그림자 범위는 fence 공간 외곽을 읽지만 목재 재료 반복은 광원 입력이 아니다.
@evidenceExclude materials/02-interior-shell.md#interior-wall-paint 벽 도장의 고정 base color와 미세결은 materials 값이다. 방별로 벽색을 보고 노출을 바꾸지 않는 동일 environment를 유지한다.
@evidenceExclude materials/02-interior-shell.md#interior-ceiling 천장 흰 도장면은 기구와 접하는 마감이다. 천장등 Y는 완성 천장의 spaces datum에서 오며 이 재료의 밝기나 roughness에서 오지 않는다.
@evidenceExclude materials/02-interior-shell.md#interior-trim-white 흰 문선·걸레받이·수납 판의 마감은 표면 결속이다. 시스템은 이 흰 판을 자체 발광원으로 만들지 않고 기존 room ceiling로 비춘다.
@evidenceExclude materials/02-interior-shell.md#oak-floor 마루의 판 이음과 참나무색은 바닥 재료다. ground-bounce의 0.16은 실제 마루 texel을 집계한 동적 반사가 아니라 이 systems가 정한 전역 근사다.
@evidenceExclude materials/02-interior-shell.md#stair-tread-wood 계단 디딤의 밝은 목재와 길이 UV는 발판 마감이다. 계단참 광원 높이는 디딤 재료의 반복 모듈을 입력으로 받지 않는다.
@evidenceExclude materials/02-interior-shell.md#handrail-wood 손잡이의 목재 결은 난간 표면이다. 난간을 따라 선형 발광원을 요구하지 않아 handrail 재료는 lights 목록을 만들지 않는다.
@evidenceExclude materials/02-interior-shell.md#black-coated-metal 검은 도장 손잡이·난간·기구 housing은 비발광 표면이다. 기구의 광원 색·세기를 housing의 검은색으로 덮어쓰지 않는 쓰기 경계다.
@evidenceExclude materials/02-interior-shell.md#beige-carpet 베이지 카펫의 파일 결은 상층 바닥 재료다. 상층 천장과 협탁 light transform은 파일 높이나 텍스처 모듈에 결속하지 않는다.
@evidenceExclude materials/02-interior-shell.md#bath-floor-tile 욕실 바닥 타일의 grid와 roughness는 바닥 결속이다. bath ceiling·vanity의 광원 수는 타일 행·열에서 도출하지 않는다.
@evidenceExclude materials/02-interior-shell.md#bath-wall-tile 욕실 벽 타일의 흰 판·반광은 벽 마감이다. 세면등의 3 cd와 3,000 K는 타일마다 다른 광원 레코드를 만드는 규칙이 아니다.
@evidenceExclude materials/02-interior-shell.md#tile-grout 줄눈은 타일 material 내부의 UV 마스크다. 조명은 줄눈 geometry나 줄눈마다 point를 추가하는 대체 표현을 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#laundry-floor 세탁실 회색 바닥 결은 laundry surface의 광학값이다. laundry-mudroom ceiling은 그 회색값을 보정하는 별도 exposure 없이 같은 environment를 쓴다.
@evidenceExclude materials/02-interior-shell.md#garage-concrete 차고 콘크리트의 입자와 얼룩은 낮은 차고 바닥 마감이다. 차고 발광점 Y=2.50 m는 차고 ceiling datum에서 오고 재료 높이에서는 오지 않는다.
@evidenceExclude materials/03-furnishings.md#light-countertop 밝은 석재 상판의 맥·roughness는 주방·세면장·접는 판에 결속한다. 섬등 발광점 Y=1.95 m는 섬 예약에서 정한 높이이며 상판 텍스처를 광원 값으로 복사하지 않는다.
@evidenceExclude materials/03-furnishings.md#stainless-steel 수전·rail·rod의 헤어라인 금속 응답은 materials가 소유한다. 시스템은 금속 하이라이트를 새 광원이나 금속 물체의 발광으로 해석하지 않는다.
@evidenceExclude materials/03-furnishings.md#black-glass-panel 오븐·조작부의 불투명 검은 유리는 appliance 표면이다. 광원 목록에는 가전 control-panel 점등이 없어 창의 자연광 통과 조건으로 이 재료를 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#white-enamel 도기·에나멜과 lamp-base의 매끈한 응답은 물체 마감이다. 협탁등 point는 갓 안쪽 높이를 쓰며 도기 받침의 흰색을 발광 색으로 읽지 않는다.
@evidenceExclude materials/03-furnishings.md#furniture-wood 선반·벤치·가구의 #A87A4E 오크 결은 비발광 재료다. 팬트리와 머드룸 광원은 목재 부재 수나 결 방향에 따라 변하지 않는다.
@evidenceExclude materials/03-furnishings.md#dark-bookcase-wood 짙은 호두나무와 액자 테는 수납·장식 표면이다. 거실 ceiling 하나 외에 책장 선반 내부 광원을 채택하지 않는다.
@evidenceExclude materials/03-furnishings.md#grey-beige-upholstery 소파 천과 의류의 회베이지 변형은 직물 결속이다. 해당 직물의 배치가 달라져도 rest light 목록의 공간 소속과 세기는 같다.
@evidenceExclude materials/03-furnishings.md#primary-bedding 주침실 이불·베개의 색과 직조는 침구 마감이다. nightstand-lamp-rear/front는 침구의 fold·color를 갱신 입력으로 받지 않는다.
@evidenceExclude materials/03-furnishings.md#olive-bedding bedroom-two 식별색은 bedding와 책·옷의 표면 변형이다. 올리브 방에 별도 색 보정 광원을 두지 않고 공통 warm ceiling와 lamp 색을 쓴다.
@evidenceExclude materials/03-furnishings.md#blue-grey-bedding bedroom-three 청회색은 올리브와 비교할 직물 값이다. 두 방의 같은 2,700 K ceiling를 유지해 조명으로 침구색 차를 대신 만들지 않는다.
@evidenceExclude materials/03-furnishings.md#muted-rug 얇은 러그의 field·border 무늬는 covering 표면이다. 시스템은 그 무늬에 그림자를 그려 광원 결과를 대신하거나 러그별 밝기를 적용하지 않는다.
@evidenceExclude materials/03-furnishings.md#mirror 평면 거울의 Reflector와 은막 PBR은 재료·viewer 반사 경로다. systems는 가상 반사 카메라를 광원 transform 목록에 더하지 않는다.
@evidenceExclude materials/03-furnishings.md#firebox-black 그을린 화구는 명시적으로 꺼져 발광이 없는 표면이다. lighting rest 목록에 불빛이 없다는 판단은 fireplace 재료의 검은색을 point로 변환하지 않는 것이다.
@evidenceExclude materials/03-furnishings.md#planting-bark-foliage 수피·잎의 결정론적 미세결은 식재 마감이다. 태양 색과 sky-fill은 foliage texture나 나무 seed를 입력으로 쓰지 않는다.
@evidence materials/03-furnishings.md#light-fixture-surfaces fixture-diffuser·fixture-glass의 표면 응답은 materials가 맡고 빛의 세기·색온도·그림자는 systems에 남긴다는 인터페이스를 받는다. 이 H2가 그 광원 필드만 쓰는 이유다.
@evidenceExclude materials/03-furnishings.md#food-art-finishes 과일 색 순환과 seed 1952의 액자 붓 획은 소품 인쇄면이다. 조명에는 그 seed나 획이 기여하는 시간·색 변화 채널이 없다.
@evidenceExclude materials/03-furnishings.md#minor-prop-partitions 이 결속 표는 각 소품 surface id를 최종 재료로 잇는다. systems는 표를 바인딩 배열로 소비하지 않으며 기구 표면의 쓰기 경계는 light-fixture-surfaces에서 직접 받는다.
@evidenceExclude instances/00-placement-frame.md#placement-transform-rule 가구의 뒤 변·중심 원점에서 yaw 하나를 만드는 규칙은 model instance의 world 변환이다. 광원 레코드는 이미 systems가 world 좌표로 선언하여 이 가구 변환을 다시 적용하지 않는다.
@evidenceExclude instances/00-placement-frame.md#placement-fit-validity 가구 경계 박스와 route·use·swing의 적합은 개체 source 검사다. 켜진 광원 좌표·갓 외곽의 조명 검사는 spaces 예약에 직접 대조하며 전체 가구 적합 성공을 광원 검사로 대신하지 않는다.
@evidence instances/00-placement-frame.md#lighting-fixture-members 천장 18·pendant 3·세면 3·꺼진 포치 1의 몸체는 systems 위치 선언을 소비하고 네 협탁등은 가구 host에 남긴다. 광원과 몸체가 같은 값의 공동 저작자가 되지 않도록 이 H2의 쓰기 경계에서 그 소비 방향을 유지한다.
@evidenceExclude instances/04-opening-fill.md#opening-fill-membership window/door 한 개구부에 충전 하나를 배정하는 규칙은 건물 instance membership이다. 광원 id는 그 개구부 id 대신 space-id와 fixture-role을 사용한다.
@evidenceExclude instances/04-opening-fill.md#window-fill-placement 열두 창 원형의 yaw 표는 기존 유리의 world 배치다. 자연광은 그 유리 장면을 관찰하지만 systems가 각 창 instance에 area를 결속하는 분기는 없다.
@evidenceExclude instances/04-opening-fill.md#exterior-door-fill-placement 외부문 세 개와 gate identity 변환은 개구부 충전의 배치다. 포치 벽등 하나의 값은 spaces 문설주에서 오며 garden·garage·gate instance마다 외부 light를 만들지 않는다.
@evidenceExclude instances/04-opening-fill.md#opening-fill-observation 정면·반대·양측·개구부 cut·reveal 근접은 충전 접합 검사다. 여섯 조명 사례는 그 모델 충전 완결을 대신 판정하지 않고 빛·좌표·동일성·예산만 판독한다.
@evidenceExclude instances/00-placement-frame.md#reservation-derived-membership 이 H2의 방 가구·설비 예약 membership은 배치 개체를 정한다. 조명은 그 예약을 생성 입력으로 읽지 않고 별도 조명 기구 배치를 받는다.
@evidenceExclude instances/00-placement-frame.md#no-member-variation 배치 개체의 seed·jitter 금지는 models의 반복 형상 변이를 제한한다. 광원은 이 문서의 정지 상태와 명시 좌표만으로 정하며 그 변이 값을 읽지 않는다.
@evidenceExclude instances/01-ground-rooms.md#dining-table-chairs 식탁·의자 개체 수와 변환은 조명 입력이 아니다. 식탁등 위치는 spaces의 식탁 예약 중심에서 정한다.
@evidenceExclude instances/01-ground-rooms.md#island-stools 스툴 세 개의 변환은 광원 입력이 아니다. pendant의 통로 여유는 spaces의 섬·use 예약에서 대조한다.
@evidenceExclude instances/01-ground-rooms.md#kitchen-fixtures 주방 기기와 붙박이 몸체의 원형 배치는 광원 목록·값을 바꾸지 않는다. 섬 위 광원은 spaces의 섬 예약을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#family-seating 가족실 소파·탁자의 개체 id와 변환은 광원을 만들지 않는다. 가족실 천장등은 spaces의 가족실 예약을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#living-furniture 거실 좌석·서가·러그의 배치는 거실 천장등 좌표의 입력이 아니다. 광원은 living-plan의 방 외곽 중심을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#window-curtain-members 커튼 여덟 개의 개체 배치는 창의 발광 광원을 만들지 않는다. 자연광은 외부 개구부와 실제 유리 충전으로 검사한다.
@evidenceExclude instances/01-ground-rooms.md#entry-mat 현관 바닥 매트의 외곽·변환은 현관 천장등이나 포치 벽등의 위치를 정하지 않는다.
@evidenceExclude instances/01-ground-rooms.md#powder-fixtures 파우더룸 변기·세면장·거울·수건걸이의 배치는 세면등 광원의 좌표·세기를 정하지 않는다. 세면등은 spaces의 세면장 예약을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#laundry-fixtures 세탁 기기·벤치의 개체 변환은 세탁실 천장등의 입력이 아니다. 광원은 방 외곽 중심을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#pantry-shelves 팬트리 L 선반과 용기의 배치는 천장등 광원의 입력이 아니다. 광원은 방 외곽 중심을 읽는다.
@evidenceExclude instances/01-ground-rooms.md#garage-storage 차고 선반·작업대의 배치는 차고 천장등의 입력이 아니다. 광원은 차고 공간의 중심과 천장 datum을 읽는다.
@evidenceExclude instances/02-upper-rooms.md#primary-furniture 주침실 침대·협탁·러그의 개체 변환은 침실 조명의 좌표·상태를 정하지 않는다. 천장등과 협탁등은 spaces의 방·침대 예약을 읽는다.
@evidenceExclude instances/02-upper-rooms.md#wardrobe-storage 드레스룸 수납 개체의 변환은 드레스룸 천장등의 입력이 아니다. 광원은 방 외곽과 천장 datum을 읽는다.
@evidenceExclude instances/02-upper-rooms.md#child-bedroom-furniture 두 자녀실 가구의 개체 id·변환은 각 방 천장등의 입력이 아니다. 광원은 두 방의 spaces 외곽을 읽는다.
@evidenceExclude instances/02-upper-rooms.md#bath-fixtures 욕실의 변기·샤워·욕조 개체 변환은 세면등을 만들지 않는다. 세면등은 spaces의 세면장 예약을 읽는다.
@evidenceExclude instances/03-exterior-repetition.md#siding-course-law siding 판의 course·절단은 태양 아래 렌더된 그림자 수신면에 영향을 주지만 광원 레코드의 방향·세기·상태 입력은 아니다.
@evidenceExclude instances/03-exterior-repetition.md#shingle-course-law shingle 판의 course·절단은 태양 아래 렌더된 그림자 수신면에 영향을 주지만 광원 레코드의 방향·세기·상태 입력은 아니다.
@evidenceExclude instances/03-exterior-repetition.md#exterior-exclusions 포치 기둥·난간·차고문을 외장 반복에서 빼는 결정은 태양·벽등 광원 목록의 생성 입력이 아니다.
@evidenceExclude instances/03-exterior-repetition.md#porch-props 포치 발판·화분의 개체 배치는 현관 벽등의 위치·상태를 정하지 않는다. 벽등은 front-door 개구부와 포치 바닥을 읽는다.
@evidenceExclude instances/03-exterior-repetition.md#planting-individuals 대지 식재의 구성원·접지·yaw는 태양 그림자를 받을 수 있지만 태양 광원 레코드의 입력이 아니다.
@evidenceExclude instances/03-exterior-repetition.md#terrace-furniture 테라스 식탁·의자의 개체 배치는 낮빛과 포치 벽등의 광원 값·상태를 정하지 않는다.
@evidenceExclude instances/04-opening-fill.md#interior-door-fill-placement 열한 실내 문짝의 변환은 방마다 정지 조명 하나를 두는 이 systems의 광원 생성 입력이 아니다.
@evidenceExclude instances/04-opening-fill.md#non-door-opening-fills 열린 통로와 수납 미닫이문의 identity 변환은 광원 레코드의 위치·세기·상태를 정하지 않는다.
@evidenceExclude settings/00-production.md#accessibility 「접근성 전달 상태」는 "이 library의 필수 대체 접근은 한국어 문서, 이름 있는 키보드 조작, 카메라 복귀 및 관찰 선택, 색만으로 상태를 구분하지 않는 검사 결과다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#coverage-map 설정 항목의 소유 지도는 광원 좌표를 제공하지 않는다. 조명은 그 지도가 가리키는 build-allocation·lighting-state와 방의 개별 외곽을 직접 인용하고 지도 목록 자체를 위치·색·강도·상태 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#governing-aim 「지배 목표」는 "사용자 지정 목표는 리뷰 거리의 외부 및 각 실내에서 레퍼런스 다섯 장과 같은 집의 구조·부재·재료·생활 기능이 읽히게 하는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#operative-subjects 「작동 주체와 자원」는 "주택과 각 공간은 10-house.md의 해당 H2가 소유한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#operator-access 「조작자와 접근」는 "저작 결정으로 조작자는 마우스와 키보드를 사용하는 데스크톱 검토자다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#use-profile 「사용과 통행 가정」는 "구조·생활 가능성을 검토하기 위한 저작 가정은 성인 둘과 자녀 둘이 쓰는 집이며 특수 의료장비나 상주 보조인의 동선을 요구하지 않는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#entry 「실내 현관」는 "고정 그래프의 1층 현관은 포치에서 들어와 거실과 중앙 단일 꺾임계단에 각각 직접 이어지는 분배 공간이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#garage 「빈 2대 차고」는 "오른쪽에 붙은 차고는 하나의 1층 부속 볼륨이며 두 대용 폭의 어두운 분절 패널문 하나와 상부 채광 유리를 가진다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#house-scale 「규모」는 "사용자가 정한 약 246㎡는 측량값이 아닌 규모 목표다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#kitchen-equipment 「주방 설비」는 "03에서 채택한 주방은 회갈색 패널 수납장, 밝은 상판과 타일 backsplash, 스테인리스 냉장고·레인지·전자레인지, 식기세척기, 싱크와 수도꼭지가 있는 섬으로 읽힌다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#laundry-mudroom 「세탁 겸 머드룸」는 "사용자 지정 세탁·머드룸을 우측 띠와 차고 사이의 완충실로 저작한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#living 「전면 거실」는 "거실은 본채 1층 전면 왼쪽에 있고 현관에서 직접 보이며 후면 공용부와 연결된다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#main-mass 「본채 매스와 지붕」는 "사용자 그래프와 외관 레퍼런스 01의 관계를 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#openings 「개구부의 읽힘」는 "01의 검은 창틀과 흰 외부 trim, 03–05의 흰 실내 문선 및 패널문을 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#pantry 「팬트리」는 "저작 선택으로 팬트리는 주방 또는 그에 바로 닿는 서비스 접근 통로에서 열리는 별도 식품 수납 공간이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#service-band 「우측 서비스 동선」는 "사용자 고정 그래프에 따라 본채 1층 우측 서비스 띠에 팬트리·파우더룸·세탁 겸 머드룸을 놓고 차고와 직접 연결한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#shower-bathroom 「샤워 욕실」는 "상층 복도에서 직접 들어가는 첫 욕실은 유리 샤워부스·세면대·변기를 가진다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#site-identity 「대지와 식재」는 "01을 바탕으로 완만한 평지의 주택 대지, 앞 보도·낮은 연석·차도 가장자리, 차고 진입 콘크리트 차도, 현관 보행길, 잔디와 낮은 화단을 만든다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#stair 「단일 꺾임계단」는 "본채 중앙의 계단 한 개가 현관과 2층 짧은 복도를 연결한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#storage 「수납」는 "사용자의 상층 수납 요구를 실현하는 저작 선택으로 계단참에 가까운 복도 수납에는 린넨 선반과 접힌 수건을 둔다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#tub-bathroom 「욕조 욕실」는 "상층 복도에 자기 문을 가진 두 번째 욕실로, 02의 욕조 겸 샤워·세면대·변기를 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#upper-hall 「상층 복도」는 "계단 상부참에서 시작하는 짧은 복도 하나가 세 침실, 두 욕실, 수납에 직접 닿는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#completion-boundary 「완료와 기록」는 "../contracts/observation-denominator.md#dual-completion의 양쪽 목록과 독립 판정을 적용한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#data-authority 「측정과 프레임의 책임」는 "사용자 지시에 따라 수·id·위치·binding·치수는 컴파일된 산출물에서 읽는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#execution-boundary 「실행과 모듈 경계」는 "사용자 지시로 @automovie/engine의 CommonJS 경계를 유지한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#fidelity 「표현 수준」는 "이 production의 사용자 지시는 매스와 지붕, 개구부 비례/위치, 포치·기둥·처마·trim·굴뚝·계단·난간·창호·문짝, 재료·빛·그림자·조경과 모든 실내가 실제 캡처에서 읽혀야 한다는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#implementation-boundary 「편집과 의존성 경계」는 "사용자가 허용한 편집 범위는 이 production의 저작 파일이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#lifecycle-boundary 「저작 순서」는 "사용자의 제작 순서는 매스/공간 그래프와 표면 분해를 함께 닫고, 실제 외피 부재, 외피 반복 모듈, fit-out, 재료 읽힘과 정리로 전진하는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#reference-authority 다섯 참조의 비측량 권위와 차량·그래프 충돌 처리 자체는 광원 수치 입력이 아니다. 조명은 참조에서 채택한 뒤 오른쪽 그림자·따뜻한 실내 상태를 lighting-state에서 직접 받고 이미지 픽셀로 태양 각도나 cd를 역산하지 않는다.
@evidenceExclude settings/20-verification.md#role-boundary 저작자의 자체 렌더 판정과 감독의 세션·Git 조율은 작업 권한이다. 이 권한을 광원 transform·color·intensity·켜짐 값으로 해석하는 조명 입력은 없고 공간·기구의 수치 결정과 구분한다.
@evidenceExclude settings/20-verification.md#submission-boundary 「커밋과 푸시」는 "사용자의 현재 지시에 따라 저작자가 최소 매 turn 끝과 단계 폐쇄/뷰어 구현 때 커밋·푸시한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#surface-allocation 「표면 분해 인계」는 "../contracts/surface-ownership.md#whole-surface-owner를 1단계 폐쇄의 필수 산출물로 적용한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#validation-boundary 「정규 검증 명령」는 "사용자가 지정한 검증 명령은 이 production 디렉터리에서 README가 소유하는 npm run lint 그대로다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#viewer-handoff 「뷰어 실행 인계」는 "사용자와 조정자의 지시에 따라 뷰어를 구현했으면 시작 명령, 실행 디렉터리, 포트, 열어야 할 경로를 보고한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#visual-grammar 「공통 재료와 외피 인상」는 "레퍼런스에서 채택한 palette는 따뜻한 백색 수평 lap siding, 창틀과 차고문의 짙은 charcoal, 흰 trim, 붉은갈색 벽돌 기단과 굴뚝, 꿀빛/중간갈색 목재, 회베이지 실내 직물이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude spaces/00-building.md#main-building-extent 「본채 외곽과 면적」는 "이 spaces의 외곽 선택은 규모와 좌표를 따른다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/06-openings.md#selected-window-curtain-strips 여섯 창의 정적 커튼 점유는 models와 instances가 소비한다. systems는 이 커튼의 형상·배치·작동을 쓰지 않으며 기존 방·창 id에 속한 광원만 소유한다.
@evidenceExclude spaces/02-stair.md#stair-boundary-heights 「계단 곁 벽과 열린 보호 경계의 높이」는 "계단 구멍 둘레의 평면 띠는 모두 같은 높이의 벽을 뜻하지 않는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-clearance 「난간과 통행의 순폭 예약」는 "경로의 1.15 m 폭 안에서 양쪽 손잡이·난간의 수평 점유를 각각 0.075 m 이내로 예약한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff 「하나의 연결에 속하는 두 flight와 중간참」는 "단일 꺾임계단을 실현한 계단 공간과 단별 치수는 유지한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-floor-opening 「계단 구멍과 전면 창의 경계」는 "위 경로와 하부 대기 면적에 한정하여, 층판 구멍은 X = [-1.80, -0.65]·Z = [-4.56, -0.25]의 세로 부분과 X = [-0.65, 1.87]·Z = [-4.56, -3.41]의 가로 부분을 합친 L형이다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/03-surface-owners.md#exterior-surface-handoff 「입면·지붕·층의 소유」는 벽 몸체·void·절단면을 spaces에, 닫힌 바깥 trim·창틀·문틀·문짝·유리를 models에 배분한다. 광원 소유와 강도는 이 외피 부재 배분을 입력으로 읽지 않으며 조명 기구의 형상 인계는 models/17-light-fixtures.md가 따로 받는다.
@evidenceExclude spaces/03-surface-owners.md#interior-surface-handoff 「방 내부의 완결 면 소유」는 "표면 분해 인계가 요구한 각 방 내부의 완결 면에 대해, 아래 owner는 각 방의 모든 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 한 저작자가 통합할 책임을 가진다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#engine-render-handoff 「공간 산출물에서 실제 렌더로 넘기는 경계」는 "설치된 공개 엔진의 lowerBuiltEnvironment는 환경을 검증하고 실제 model을 가진 element만 세계 변환의 set으로 내리며 원래 built environment도 보존한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#reference-spatial-comparisons 「다섯 참조에 더하는 공간 비교」는 "레퍼런스 권위를 현재 공간 owner에 연결한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#spatial-observation-derivation 「공간 산출물에서 파생할 검사」는 "관찰 배분을 받아 전체 관찰 분모를 이 spaces 층에 그대로 적용한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/05-route-network.md#room-route-network 「문으로 답하는 두 층 동선」는 "아래 이름은 이 spaces 문서가 소스로 넘길 식별자다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions 「외벽 모서리와 지붕 단차의 단일 몸체」는 "이 접합은 본채 외벽과 차고 외벽/공유 벽의 예약 안에서 만나는 외부 경계를 잇는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-junctions 「모서리와 문턱에서 끊기지 않는 경계」는 "위 공유 칸막이는 같은 높이에서 만나는 끝점·L자·T자·십자 접합을 공유한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-ownership 「방 사이의 한 벽체와 두 안쪽 면」는 "이 설계는 두 storey 안에서 기존 방 사이의 칸막이를 한 번만 생성하기 위한 공간 인계다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions 「외벽과 계단 가장자리에서 닫히는 층간 단면」는 "층간 구조는 본채 내부에서 외벽의 동일 안쪽 면에 닿는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-floor-boundary 「한 층간 구조와 서로 다른 두 층의 마감」는 "두 storey의 완성면 사이에 있는 층간 바닥은 upper-storey 바닥의 한 구조다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance 「낮은 지붕과 천장 바탕의 접합 여유」는 "천장은 본채 실내 평면과 차고 실내 평면 각각의 안쪽 면까지이고, 지붕은 자기 외곽과 교차 경계를 갖는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#upper-ceiling-closure 「본채 상층과 계단실의 같은 상부 경계」는 "본채의 최상부 실내 경계는 upper-storey의 완성 천장 높이에 있는 수평 천장이다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base 「낮은 차고의 독립 바닥」는 "차고의 바탕은 차고 안쪽 외곽을 받으며 자기 완성 바닥에서 아래로 0.15 m를 예약한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff 「바닥 아래 지지와 지도 지표의 인계」는 "이 건물은 위 본채/차고 바탕 아래를 연속해서 받치는 채움과 가장자리 지지로 계획한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#ground-threshold-junctions 「외벽 두께 안에서 이어지는 네 출입 경계」는 "본채와 차고의 실내 바닥은 평면에서 벽 안쪽에 끝나지만, 출입 개구부 아래에는 벽 두께를 지나는 지지 바탕이 필요하다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#main-ground-floor-base 「본채의 연속 바닥 바탕」는 "두 층 본채의 ground-storey 바탕은 마감 안쪽 외곽 전체를 받는 연속 지면 지지 방식으로 택한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#bedroom-three-front-window 「오른쪽 자녀실의 정면 창」는 "bedroom-three-front-window는 전면 벽의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-three에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#bedroom-two-front-window 「왼쪽 자녀실의 정면 창」는 "bedroom-two-front-window는 전면 벽의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-two에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-entry-filling 「목재 현관문의 외부 충전」는 "front-door의 void·순폭 목표·경첩/열림은 현관 owner 그대로다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-openings 「거실·침실·계단의 창과 현관문」는 "공통 개구부 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-roof-closures 「박공 삼각 벽과 포치 위의 외벽」는 "전면 전체 입면 owner는 src/spaces/envelope/front.ts다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#garage-front-opening 「닫힌 차고문과 상부 이동 예약」는 "garage-front-door는 차고의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#living-front-window 「포치 아래 거실 묶음창」는 "living-front-window는 전면 벽의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 living-room에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#stair-front-window 「층간 계단실의 작은 창」는 "stair-front-window는 전면 벽의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#chimney-roof-interface 「벽난로에서 지붕까지의 굴뚝」는 "거실 벽난로는 왼쪽 외벽에 붙는다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#left-openings 「굴뚝 뒤에서 방으로 열리는 창」는 "공통 개구부 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#left-roof-closure 「주 지붕 끝의 왼쪽 삼각 벽」는 "src/spaces/envelope/left.ts가 왼쪽 완결 입면을 소유한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#living-left-window 「거실 벽난로 뒤쪽의 창」는 "living-left-window는 왼쪽 벽의 Z = [-5.50, -4.30], Y = [0.75, 2.30] m 개구부로 ground-storey의 living-room에 속하는 방과 외벽이 같은 창이다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#primary-left-window 「주침실 본체의 측면 창」는 "primary-left-window는 왼쪽 벽의 Z = [-8.90, -7.30], Y = [3.91, 5.31] m 개구부로 upper-storey의 primary-bedroom에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#family-rear-window 「가족실의 후면 묶음창」는 "family-rear-window는 후벽의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#garden-door 「공용부에서 정원으로 나가는 문」는 "garden-door는 후벽의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부로 ground-storey의 kitchen-dining-family와 외부 대기를 잇는다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#kitchen-rear-window 「주방 조리대 위의 후면 창」는 "kitchen-rear-window는 후벽의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부로 ground-storey의 kitchen-dining-family에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#primary-rear-window 「주침실의 후면 묶음창」는 "primary-rear-window는 후벽의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#rear-openings 「공용부와 주침실의 정원 쪽 개구부」는 "본채 외곽의 뒤 바깥 면 Z = -10.70 m에서 0.25 m 외벽 예약만큼 들어온 본채 후벽 Z = [-10.70, -10.45] m에 공통 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures 「두 본채 지붕과 차고 아래의 후면」는 "src/spaces/envelope/rear.ts가 본채와 차고의 후면 완결 입면을 소유한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#family-right-window 「가족실의 오른쪽 창」는 "family-right-window는 본채 오른쪽 벽의 Z = [-9.95, -8.25], Y = [0.75, 2.30] m 개구부로 ground-storey의 kitchen-dining-family에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#garage-right-window 「차고의 측면 채광창」는 "garage-right-window는 차고 오른쪽 벽의 Z = [-5.85, -4.25], Y = [1.40, 2.20] m 개구부로 ground-storey의 garage에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#right-openings 「차고 접합을 피한 측면 채광」는 "공통 개구부 인계에 따라 본채 오른쪽 창은 본채 외곽의 외벽 X = [5.50, 5.75] m, 차고 오른쪽 창은 차고 외곽의 외벽 X = [11.45, 11.70] m에 바인딩한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#right-roof-closures 「본채 단차와 차고 위의 벽」는 "오른쪽 노출 입면의 owner는 src/spaces/envelope/right.ts다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#tub-right-window 「욕조 욕실의 높은 흐린 창」는 "tub-right-window는 본채 오른쪽 벽의 Z = [-8.40, -7.50], Y = [4.56, 5.31] m 개구부로 upper-storey의 tub-bathroom에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-mass-allocation 「본채 위의 세 박공과 낮은 차고」는 "본채와 차고 외곽, 두 층 천장을 유지하며 설정의 지붕군을 배치한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-profile-datums 「날씨를 받는 면과 아래면」는 "여기서 높이 함수는 지붕 최상부 날씨 면의 Y를 뜻한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-shared-edges 「전면 박공의 골짜기와 단차」는 "전면 박공은 주 지붕 앞쪽에 합류한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions 「지붕에 닿는 외벽 두께 전체의 상단」는 "본채와 차고의 외벽은 각각 본채와 차고의 기존 외곽과 안쪽 면 사이를 점유하고 자기 지붕 아래에서 닫힌다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof 「전면 왼쪽의 박공 지붕」는 "roof.front-gable.left는 박공 중심보다 -X 쪽의 면이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof 「계단 창 쪽으로 내려가는 박공」는 "roof.front-gable.right는 정면 왼쪽의 전방 박공 가운데 박공 중심보다 +X 쪽의 면이며 src/spaces/roof/front-gable-right.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof 「차고 후벽과 본채 접합」는 "roof.garage.back과 아래면은 src/spaces/roof/garage-back.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof 「패널문 위의 경사면」는 "roof.garage.front는 차고 지붕 영역의 앞 절반이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/main-back.md#main-back-roof 「뒤쪽 처마까지 이어지는 주 지붕」는 "roof.main.back과 아래면은 src/spaces/roof/main-back.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/main-front.md#main-front-roof 「전면 박공과 굴뚝을 받는 면」는 "roof.main.front의 owner는 src/spaces/roof/main-front.ts다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/right-back.md#right-back-roof 「후면까지 닫히는 오른쪽 지붕」는 "roof.right.back과 아래면은 src/spaces/roof/right-back.ts의 완결 면이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/right-front.md#right-front-roof 「높은 지붕 아래에 붙는 앞 면」는 "roof.right.front는 본채 오른쪽 영역의 앞 절반이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/rooms/common.md#common-kitchen-wall-reservation 「왼쪽 벽 주방의 기구와 작업 점유」는 "이 주방은 위 kitchen-dining-family/ground-storey 내부의 기능 구역이며 별도 room이나 칸막이가 없다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/entry.md#entry-coat-storage 「위 계단 아래의 닫힌 외투장」는 "현관에서 연결된 서비스 접근을 따라 닿는 현관 가까운 외투 수납인 외투장을 위 flight 아래의 높은 끝에 둔다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/entry.md#entry-use-routes 「현관문 뒤의 매트와 분배 바닥」는 "같은 front-entry/ground-storey의 목재 현관문과 얕은 매트를 소비한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes 「문을 닫은 차고의 내부 접근」는 "머드룸의 차고 쪽 하부 대기에서 같은 garage 내부의 선반, 작업대, 측면 창, 닫힌 전면문 안쪽으로 이동한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/laundry.md#laundry-equipment-use 「나란한 두 기기와 신발 벤치의 사용」는 "같은 laundry-mudroom/ground-storey 안에서 오른쪽 기기 벽과 왼쪽 신발 벤치를 배정한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route 「기기를 열어도 남기는 차고 횡단」는 "이 경로는 두 출입문과 양쪽 대기를 잇는 같은 방 안의 바닥 띠다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/living.md#living-furniture-use 「벽난로를 향한 좌석과 독서 가구」는 "같은 living-room/ground-storey 안에서 거실 설정의 소파는 오른쪽 계단 분리벽에 등을 대고 왼쪽 벽난로를 향한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/living.md#living-through-route 「두 출입과 창·좌석으로 이어지는 바닥」는 "같은 living-room 내부에서 현관 쪽 문과 공용부 쪽 개구부를 잇는다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/pantry.md#pantry-storage-use 「L형 선반과 식품의 점유」는 "같은 pantry/ground-storey의 선반 평면을 소비한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route 「열린 문에서 선반까지의 사용 통로」는 "위 실문을 90° 열고 pantry 안에서 수납을 사용하는 상태를 예약한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/upper-hall.md#upper-linen-storage 「도착면 앞쪽 린넨장」는 "복도 도착면의 앞쪽에 닫힌 린넨장을 둔다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs 「지도에서 받아야 할 경계와 지표 입력」는 "이 H2는 house-site가 maps로부터 받아야 할 입력과 거부할 불일치를 소유한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#site-access-interface 「외부 네트워크에 넘길 포장 끝」는 "house-site는 본채와 차고, 포치와 아래의 외부 접근 구역을 포함할 site다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#site-local-routes 「포장과 계단의 내부 연결」는 "이 H2는 현관 포치와 외부 진입의 포치·현관 직접 접근과 대지와 식재의 후면 테라스·우측 목재 울타리를 house-site 안의 구간 순서로 잇는다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff 「포장 사이와 지표에서 끝나는 지지」는 "각 완결 포장 owner는 자기 평면 외곽에서 끝나고 상대의 상면/아래면을 동일 좌표로 소비한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-depth-reservation 「낮은 포장의 두께와 경사 바탕」는 "house-site/ground-storey의 외부 접근 중 현관 보행길·측면 관리길·정원 아래 대기의 상면은 각각 front-walk, side-walk, garden-lower-landing이 소유한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support 「높은 포치와 테라스의 닫힌 단면」는 "현관 포치와 정원 테라스는 자기 높은 평탄면과 외부 단을 유지한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/driveway.md#driveway-plan 「차고 문턱으로 오르는 차도」는 "driveway는 대지와 식재의 차고 진입 콘크리트 차도이며 house-site/ground-storey의 외부 포장 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/fence.md#fence-gate-junction 「오른쪽 앞 면의 관리문 접속」는 "위 오른쪽 앞 구간에서 side-yard-gate의 개구부 X 구간을 그대로 비운다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/fence.md#fence-ground-profile 「지표를 받는 높이와 점유」는 "울타리 패널 상단은 관리문의 문짝 상단과 같은 world 높이로 예약한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/front-walk.md#front-walk-plan 「포치 축의 연속 보행면」는 "front-walk는 대지와 식재의 현관 보행길이며 house-site/ground-storey의 외부 보행 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/side-walk.md#side-gate-interface 「측면 울타리 문과 양쪽 대기」는 "위 보행면에서 gate 앞을 side-front-access, 뒤를 side-rear-access의 두 외부 구역으로 택하고 둘 다 house-site/ground-storey에 속한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan 「차도와 테라스 아래 대기를 잇는 보행면」는 "side-walk는 house-site/ground-storey의 연속 외부 보행면이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan 「정원 지표에 닿을 아래 대기」는 "garden-lower-landing은 house-site/ground-storey의 외부 대기 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan 「테라스에서 지표로 내려가는 단」는 "garden-steps는 house-site/ground-storey의 외부 연결 구역이며 위 테라스와 아래 대기를 잇는다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-terrace-plan 「정원문 대기와 포장 테라스」는 "garden-terrace는 대지와 식재가 공용부에서 닿게 둔 작은 포장 테라스이며 house-site/ground-storey의 외부 공간이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidence obligations/core/common.md#layer-boundary 네 파일이 모두 systems 조명 역할 하나만 가지며 기구 몸체는 models, 발광 표면은 materials, 배치는 instances, 방 경계는 spaces로 보내 이 파일들에 다른 전문 계열이 정당화해야 할 결정이 없다.
@evidence obligations/core/common.md#production-language 조명 문서 전체를 working-language의 한국어로 쓰고 IAutoMovieLight 필드명·광원 id·색 벡터 같은 정확한 식별자만 원형으로 두어 읽는 사람이 언어 전환을 추측하지 않게 한다.
@evidence obligations/core/common.md#purpose-fit 00-lighting-frame.md는 권한·상태·예산·리뷰 집합이라는 조명 공통 틀 역할을 맡으며 이것이 없으면 광원 id 규칙, 정지 상태, 32개 상한, 여섯 리뷰 사례가 정해지지 않는다.
-->

[제작 설정의 build 배분](../settings/00-production.md#build-allocation)이 조명을 systems에 맡기고, [빛과 기준 상태](../settings/20-verification.md#lighting-state)가 전면 왼쪽 위 key·뒤 오른쪽 그림자·하늘 fill·켜진 따뜻한 실내등·고정 노출과 white balance를 정한다. 이 branch는 그 조건을 실현하는 광원 레코드만 쓴다. 쓰는 채널은 설치된 공개 타입 `IAutoMovieLight`(directional·point·spot·area)의 `id`·`transform`·`color`·`intensity`·`castShadow`·`shadow`·`range`·`coneAngle`·`width`·`height`와 `IAutoMovieSceneEnvironment`의 `background`·`intensity`·`exposure`·`toneMapping`·`shadows`다. 방 경계·천장 datum은 [storey datum](../spaces/01-storeys.md#storey-datums)과 각 방 owner, 기구의 갓·몸체 geometry는 models, 갓과 전구의 발광 표면은 materials, 기구 개체 배치는 instances가 소유하며 이 branch는 그 값을 다시 정하지 않는다.

기구 광원 id는 `light:<space-id>:<fixture-role>` 형식이며 space-id는 spaces의 방 id(`front-entry`, `living-room`, `kitchen-dining-family`, `service-access`, `powder-room`, `laundry-mudroom`, `pantry`, `garage`, `upper-hall`, `primary-bedroom`, `primary-wardrobe`, `bedroom-two`, `bedroom-three`, `shower-bathroom`, `tub-bathroom`), 계단 `main-stair`, 외부 구역 `front-porch`를 그대로 쓴다. 기구 광원 하나는 그 한 공간에만 속한다. 대지 전체를 비추는 태양·두 sky fill·ground-bounce는 방에 속하지 않으므로 `light:daylight:<role>`로 구분한다. 같은 광원 값을 두 파일에서 저작하지 않는다. [작업 언어](../settings/00-production.md#working-language)에 따라 조명 결정은 한국어로 쓰고 API 이름·필드명·광원 id는 원형을 보존한다.

source owner는 `src/systems/lighting.ts`다. 실제 컴파일 산출물은 directional 4개·point 28개이며 point의 방 id와 좌표를 실제 spaces 외곽·완성 높이에 대조한다. 갓·몸체의 원형과 material 결속은 각각 models·materials가 만들고 이 source는 광원 레코드·environment 값만 쓴다. 최종 관찰 결과는 아래 여섯 사례별로 보고한다.

## 정지 기준 상태와 시계 {#lighting-static-state}
<!--
@evidence principles/core/common.md#scope-preservation 시간 흐름이 없는 library의 조명 상태, 리뷰 프레임 on/off, 꺼진 기구의 레코드 처리, 평가 입력과 순서를 맡는다.
@evidence principles/core/common.md#substantive-completion 모든 광원이 rest 값만 갖고 lightMotions·IAutoMovieProductionLighting·seed를 쓰지 않으며 꺼진 기구는 레코드를 만들지 않는다고 정한다.
@evidence principles/core/common.md#declared-basis 정지 상태는 delivery-scope의 시간 순서 없는 library에서 오고 스위치 회로·조광을 모델링하지 않는 것은 이 branch의 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 켜진 따뜻한 실내등만 정한 데 비해 rest 값 단일 상태, 꺼짐의 레코드 생략, spaces 확정 후 한 번 평가를 더한다.
@evidence principles/design/systems.md#system-authority-confinement on/off 값은 각 기구 H2가 정하고 이 H2는 상태 모델만 두며 꺼진 기구의 형상은 instances에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 평가 입력을 spaces 산출물의 방 외곽·storey 천장 datum과 이 branch의 상수로 한정하고 다른 활성 system이 없어 update 순서가 없다고 적는다.
@evidence principles/design/systems.md#system-verification-address 서로 다른 두 요청 시점과 두 번의 컴파일이 같은 광원 목록·값을 내는지의 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work delivery-scope의 시간 순서 없는 전달물과 lighting-state의 정지 날씨를 소비했고 시계나 순서가 부모 사이에서 충돌하지 않아 부모 수정이 없었다.
@evidence settings/00-production.md#delivery-scope 시간 순서가 있는 영화·shot이 없다는 전달 범위를 받아 조명을 rest 값의 단일 상태로 둔다.
@evidence obligations/design/systems.md#system-state-clock 초기 상태가 유일 상태이고 시계·seed가 없으며 임의 시점이 같은 상태를 낸다고 정한다.
@evidence obligations/design/systems.md#system-ownership-interfaces spaces 산출물 확정 뒤 한 번 평가하고 다른 system과 공동 쓰기 채널이 없다는 순서를 정한다.
-->

이 라이브러리는 시간이 흐르는 장면을 전달하지 않으므로 조명은 하나의 정지 상태다. 모든 광원은 rest 값만 가지며 `IAutoMovieShot.lightMotions`와 `IAutoMovieProductionLighting`을 쓰지 않는다. 시계·seed가 없고 임의 시점 요청은 언제나 같은 상태를 돌려준다. 평가 입력은 spaces 컴파일 산출물의 방 외곽·storey 천장 datum과 이 branch의 상수뿐이며, 조명은 spaces 산출물이 확정된 뒤 한 번 평가된다. 이 production에 다른 활성 system이 없으므로 system 사이의 update 순서나 공동 쓰기 채널은 없다. 리뷰 프레임의 on/off 상태는 [실내 기구](02-interior-fixtures.md)와 [외부 기구](03-exterior-fixtures.md)의 각 H2가 정한 값 하나이며 스위치 회로·조광·자동 점멸은 모델링하지 않는다. 꺼진 기구는 광원 레코드를 만들지 않고 기구 형상만 instances에 남는다.

source owner는 `src/systems/lighting.ts`다. 서로 독립적인 두 `HouseLighting.build()` 산출물과 외관·현관의 두 native 요청 산출물을 대조해 광원 목록과 environment 값이 정확히 같음을 확인했다. 시계·seed·요청 시각에 따른 변경은 없다. 원문 산출물과 대조는 작업 기록의 `lighting-measurements.json`에 보존한다.

## 광원 수와 그림자 예산 {#lighting-budget}
<!--
@evidence principles/core/common.md#scope-preservation 광원 수, 입장 상한, 그림자 광원 수, 초과 시 저하 순서와 보고를 맡는다.
@evidence principles/core/common.md#substantive-completion 광원 32개(directional 4·point 28), 입장 상한 32, 그림자 광원은 태양 하나, 초과 시 range 축소→같은 방 area 병합→조정자 보고의 순서를 정한다.
@evidence principles/core/common.md#declared-basis 그림자 map 하나는 renderer-boundary의 실제 WebGL canvas를 위한 이 branch의 선택이고 방을 빼지 않는 규칙은 build-allocation에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation build-allocation이 성능 때문에 방을 생략하지 말라고만 한 데 비해 32개 상한과 세 단계 저하 순서를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 저하는 광원의 range·종류만 바꾸고 방이나 기구 형상을 지우지 않아 spaces·instances 소유를 건드리지 않는다.
@evidence principles/design/systems.md#system-dependency-basis 저하 발동은 컴파일된 광원 수와 32의 비교라는 이름 있는 입력에만 의존한다.
@evidence principles/design/systems.md#system-verification-address 컴파일된 광원 수와 그림자 광원 수 1, 실제 canvas의 RENDERER와 프레임 오류 유무가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work build-allocation의 방 생략 금지와 renderer-boundary의 실제 GPU canvas를 32개 광원·그림자 1개에 대조했고 상한 안이어서 부모 예산 결정을 고칠 결함이 없었다.
@evidence settings/20-verification.md#renderer-boundary 실제 WebGL canvas에서 그림자 map을 태양 하나로 묶고 RENDERER 보고를 관찰에 넣는다.
@evidence obligations/design/systems.md#system-budget-degradation 입장 상한 32, 그림자 광원 1, range 축소→area 병합→보고의 저하와 실내 그림자 부재라는 보이는 한계를 정한다.
@evidence obligations/core/common.md#proportionate-development 네 파일 14개 H2와 광원 32개를 17개 공간에 배분하되 기능 구분이 조명에 걸린 공용부에 매달린 광원 세 개와 갓 외곽 대조, 위생실에 세면등 세 개를 더 주고 수납·통로에는 천장등 하나씩만 둬 결과 비중에 맞춘다.
-->

현재 광원은 낮빛 directional 4개와 실내 point 28개로 32개이며 입장 상한을 32개로 둔다. 그림자를 던지는 광원은 태양 하나로 제한한다. 실내·외부 기구는 모두 `castShadow`를 쓰지 않는다. 이는 [렌더 경계](../settings/20-verification.md#renderer-boundary)의 실제 WebGL canvas에서 그림자 map 수를 하나로 묶기 위한 이 branch의 선택이며, 실내등의 그림자가 없다는 한계는 리뷰에서 보이는 결과로 기록한다. 광원 수가 설치 엔진의 한도를 넘으면 방을 빼지 않고 `range`를 줄이거나 같은 방의 여러 기구를 area 하나로 합치는 순서로 처리하며, 그래도 넘으면 실제 한도를 조정자에게 보고한다.

source owner는 `src/systems/lighting.ts`다. 실제 컴파일 결과는 directional 4개·point 28개이고 그림자 광원은 태양 하나다. native 조명 캡처의 실제 canvas는 `ANGLE / AMD Radeon(TM) 8060S Graphics / Direct3D11`이며 오류와 실패한 texture가 없었다. 상한 초과가 없어 저하 단계는 발동하지 않았다. 실내 point 광원은 그림자를 만들지 않는다는 표현 한계를 유지한다.

## 조명 리뷰 집합 {#lighting-review-set}
<!--
@evidence principles/core/common.md#scope-preservation 외관 그림자, 공용부 빛 웅덩이, 실내 연속, 좌표·갓 외곽 대조, 컴파일 동일성, 광원 수·RENDERER의 여섯 사례를 맡는다.
@evidence principles/core/common.md#substantive-completion 여섯 사례와 "광원 하나를 빼거나 강도 0이면 해당 사례가 실패해야 한다"는 반증력 기준을 정한다.
@evidence principles/core/common.md#declared-basis 01·03·04·05 프레임은 frame-condition의 참조 역할에서, 좌표 대조는 02·03 H2의 인용 외곽에서 온다고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation frame-condition이 프레임 조건만 정한 데 비해 조명 전용 여섯 사례와 반증력 기준을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 사례는 광원 결과만 묻고 프레임·카메라 조건은 frame-condition에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 각 사례가 대조하는 입력(참조 프레임, 인용 외곽, 두 컴파일, 광원 수)을 이름으로 적는다.
@evidence principles/design/systems.md#system-verification-address 여섯 사례가 각 H2 주장을 반증하고 광원 제거 시 실패해야 한다는 기준으로 통과만 하는 사례를 걸러낸다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work frame-condition의 01·03·04·05 참조 프레임을 여섯 사례에 대조했고 조명 관찰을 받을 프레임이 모두 있어 부모 수정이 없었다.
@evidence settings/20-verification.md#frame-condition 01 외관, 03 공용부, 04·05 실내 참조 프레임을 조명 사례의 관찰 조건으로 쓴다.
@evidence obligations/design/systems.md#system-review-set 상태·예산·인터페이스 실패를 가르는 여섯 유한 사례와 반증력 기준을 정한다.
@evidence settings/20-verification.md#observation-allocation 레퍼런스 01 외관, 03 공용부, 04 현관/거실/계단, 05 복도/침실/욕실과 계단참의 역할 배분을 여섯 사례 중 세 프레임 사례의 대상으로 쓴다.
-->

조명의 유한 리뷰 사례는 여섯이다. 프레임 사례의 대상은 [관찰 배분](../settings/20-verification.md#observation-allocation)의 레퍼런스 역할을 따른다. 첫째, 01 외관 프레임에서 그림자가 뒤 오른쪽에 떨어지고 그늘이 완전 검정이 아닌지를 본다. 둘째, 03 공용부 프레임에서 섬 pendant와 식탁등의 두 빛 웅덩이를 본다. 셋째, 04·05 프레임에서 현관·계단참·복도·침실이 창 빛과 따뜻한 천장등으로 함께 읽히는지 본다. 넷째, 모든 켜진 광원의 좌표가 [실내 기구](02-interior-fixtures.md)가 인용한 방 외곽 안에 있고 매달린 기구의 갓 외곽이 인용한 가구·동선 예약과 겹치지 않는지를 산출물로 대조한다. 다섯째, 두 번의 컴파일과 두 요청 시점이 같은 광원 목록을 내는지 대조한다. 여섯째, 컴파일된 광원 수와 그림자 광원 수 1, 실제 canvas의 RENDERER를 보고한다. 광원 하나를 빼거나 강도를 0으로 바꾸면 해당 사례가 실패해야 하며, 그렇지 않은 사례는 반증력이 없는 것으로 보고 고친다.

source owner는 `src/systems/lighting.ts`다. 여섯 사례의 관찰 결과는 다음과 같다. 기존 81f2521e9c40와 7e8461001b7c의 물리 조명 산출물은 같은 정지 상태이며, 각 캡처의 원래 basis를 작업 기록에 유지한다.

1. 외관에서 처마·포치의 그늘과 뒤 오른쪽 그림자가 읽히며 그늘의 벽이 검정으로 닫히지 않는다. 실제 source의 태양 강도를 0으로 한 별도 native 산출물에서는 그 그림자가 사라지고 지붕·벽 읽힘이 달라졌다.
2. 공용부에서는 두 섬등과 식탁등의 따뜻한 천장 웅덩이가 구분된다. 식탁등 강도 0인 별도 source 산출물에서 식탁 예약 위 웅덩이는 사라지고 두 섬등은 남았다. 식탁 몸체는 미제작 사물 범위이므로 이 관찰로 식탁 모델의 완료를 주장하지 않는다.
3. 현관·계단의 디딤/참·복도 두 팔·침실의 창과 벽은 같은 고정 노출에서 읽힌다. 침실 내부 compiled 관찰에서 천장등과 따뜻한 천장/벽·열린 출입구의 연속을 확인했다. 상층 천장등 강도를 0으로 한 native 산출물에서는 그 따뜻한 연속이 사라지고 협탁 point의 국소 벽 빛만 남았다.
4. 28개 켜진 point의 X/Z는 실제 소속 방 외곽 안이며 Y는 소속 완성 높이 안이다. 계단참은 명시한 중간참 외곽과 높이로 대조했다. 실제 세 pendant의 갓 vertex 외곽은 섬 또는 식탁 상판 예약 안이고 통행 예약으로 돌출하지 않는다.
5. 독립 두 build와 서로 다른 두 native 요청의 실제 광원 목록·environment 값은 같았다.
6. 실제 결과는 광원 32개·그림자 광원 하나이며 AMD 8060S의 D3D11 canvas에서 오류와 texture 실패가 없다. 모든 광원을 각각 누락하거나 강도 0으로 둔 64개 구조 반증은 필수 id·양의 강도·32개 입장 조건에서 거부했다. 이 64개는 GPU 비교가 아니며, 위 세 가지 실제 source 변형의 GPU 비교와 구분한다.

양성 원본은 `lighting-81f2521e9c40-2`, `-3`, `-4`, `lighting-positive-final`에, 반증 원본은 `lighting-sun-zero`, `lighting-dining-zero`, `lighting-upper-zero`에 보존했다. 반증은 별도 source byte 사본을 native viewer로 실행했으며 원래 `lighting.ts`는 SHA-256 `cf8a0c95f3215025dd74a1b3e8357d5788245d99f6a3ec38a87111af38d2bf8d`로 byte-exact 복원했다. 4개의 협탁등 몸체는 미제작 사물이며 광원 좌표 검증이 그 몸체의 갓/배치 검증을 대신하지 않는다.

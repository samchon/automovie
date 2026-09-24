# 공간 설계 population의 공통 의무

## 파일 역할과 공간 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 27개 파일을 기준 평면/높이·경계/접합·동선·입면·방·roof·표면 소유·관찰·대지 역할로 대조했다. 방 목록만 남기면 물리 접합과 외관이 비고, 외피만 남기면 각 방의 직접 문과 이용 영역이 비며, 대지가 없으면 두 접점이 이어질 외부 공간과 외벽 하단이 읽을 지면이 비고, junctions의 단면 규칙이 없으면 네 입면의 석재 띠가 모서리에서 어긋나며, ownership의 띠 분할이 없으면 주랑·제실의 적갈색 띠가 붙을 표면이 없는 서로 다른 후속 결정을 아래 지도에 기록한다.
-->

<!--
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 27파일을 각 역할의 결과에 다시 대조했다. 기준선·방 목록·site·junctions 단면에 더해, ownership의 하부 띠 분할을 빼면 materials가 주랑·제실 벽 하부에만 적갈색을 결속할 경계가 사라진다는 결손이 본문 첫 문단의 ownership 문장으로 드러난다.
-->

이 population은 한 단층 신전의 건물 내부와 외피를 함께 설계한다. [building](../../spaces/building.md)은 외곽·공유 기준선·부모 위계·외부 접점을, [storey](../../spaces/storey.md)는 높이·문턱 지지·외벽 하단을 소유한다. 둘 중 하나가 없으면 방의 평면만 맞아도 도로·문턱·지면을 같은 건물로 연결할 수 없다. [openings](../../spaces/openings.md)는 경계 identity와 실제 void/문/창 위치를, [junctions](../../spaces/junctions.md)는 벽 끝/박공의 폐쇄와 외벽 기단·코핑의 단면을 정한다. 후자는 개구부 표만으로는 막을 수 없는 모서리 중첩·roof 아래 누광과, 네 입면이 따로 정하면 모서리에서 어긋날 석재 띠의 만남을 다룬다. [circulation](../../spaces/circulation.md)은 공용/서비스의 서로 다른 시작과 주랑 경유 순서를 정한다.

[남측](../../spaces/facades/south.md)·[북측](../../spaces/facades/north.md)·[서측](../../spaces/facades/west.md)·[동측](../../spaces/facades/east.md)은 각각 후퇴 현관, 높은 박공/낮은 마당 벽, 긴 무창 봉헌실 벽, 외부 서비스 출입의 완결 외면을 소유한다. 서로를 대체하면 후면과 옆면의 실제 닫힘이 사라진다. rooms의 [현관](../../spaces/rooms/entrance.md)·[중정](../../spaces/rooms/courtyard.md)·[주랑](../../spaces/rooms/colonnade.md)·[제실](../../spaces/rooms/sanctuary.md)·[봉헌실](../../spaces/rooms/offering.md)·[관리실](../../spaces/rooms/administration.md)·[기록실](../../spaces/rooms/records.md)·[보관실](../../spaces/rooms/storage.md)·[서비스 마당](../../spaces/rooms/service-yard.md)은 각각 자기 volume·접근·내부 표면과 용도별 예약을 가져 공간명만 나열한 방을 남기지 않는다.

roofs의 [assembly](../../spaces/roofs/assembly.md)는 높이·두께·돌출·겹침 선택을, [sanctuary](../../spaces/roofs/sanctuary.md)·[west](../../spaces/roofs/west.md)·[east](../../spaces/roofs/east.md)·[porch](../../spaces/roofs/porch.md)·[colonnade](../../spaces/roofs/colonnade.md)는 각 지지 영역·끝선·관찰을 담당한다. 공통 계산만으로 각 roof의 끝을 고를 수 없고, 개별 roof만으로는 교차부의 중복을 해소할 수 없다. [ownership](../../spaces/ownership.md)은 이 소유를 완결 표면 단위로 잇고 주랑·제실 벽 하부 띠처럼 한 방 안의 높이 경계로 생기는 표면 분할을 정한다. [observations](../../spaces/observations.md)는 전체 질문을 현재 산출물에서 유도하고 그 값을 그릴 viewer 경로를 정해 대표 외관 하나만으로 실내 누락이 가려지는 것을 막는다.

[site](../../spaces/site.md)는 건물과 다른 소유 단위로 대지 범위·지면 높이·포장 구획·두 connector·배치 구역·먼 능선을 정한다. 이 파일이 없으면 building의 두 접점이 이어질 외부 공간이 없고 storey의 외벽 하단이 읽을 지면이 없어 건물이 허공에 뜬 채 남는다. 반대로 대지가 건물 파일에 섞이면 외벽 경계가 방과 대지 두 공간을 가져 입면 census가 사라지므로 별도 파일과 별도 뿌리로 둔다.

## 공간과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary building부터 각 방/roof/대지까지는 경계·부피·연결·접합·접근 예약과 지면을 정한다. 기둥/수반/집기와 이웃·나무 실체, 마감 수치, 반복 population과 조명은 후속 분기에 남고 viewer 전달도 공간 geometry를 재작성하지 않는다고 명시돼 있다.
-->

<!--
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 방/입면/roof/대지의 수치는 공간 경계·지면·배치 구역에 쓰이며 물체 곡면·기와 반복·roughness·조명값·이웃 개체 배치를 결정한 단위는 없다. 대지를 maps가 아닌 spaces에 둔 이유와 viewer 전달의 한계가 본문에 구별돼 있다.
-->

27개 파일은 spaces의 topology·외피·대지·치수·표면 배정·관찰 설계다. room 문서의 책상/제단/수반 언급은 방이 수용할 중심·접근·관계의 입력이며 prototype의 곡면·보 단면·기와 mesh를 만드는 설계가 아니다. roof 문서의 경사 매스와 닫힘은 건물 외피가 소유하고 기와/서까래 반복 상세는 후속 모델/반복 분기가 소비한다. 입면의 회벽·기단은 그 재료가 덮을 표면 경계이며 roughness·UV·색 수치는 materials가 소유한다.

building의 두 접점과 storey의 외벽 하단은 같은 spaces의 [대지](../../spaces/site.md)가 만든 지면과 connector를 소비한다. spaces가 먼저 review에 들어가 maps 분기를 열 수 없으므로 대지는 spaces의 별도 소유 단위가 맡는다. 대지 파일도 이웃·나무의 개체 위치나 형상은 정하지 않고 배치 구역만 instances에 넘긴다. observations의 CJS 경로는 같은 source를 계측/화면에 넘기는 관찰 설계이며 engine을 바꾸거나 브라우저에 다른 건물을 저작할 권한이 아니다. 실제 조명과 물줄기 상태는 systems, 독립 물체와 반복은 models/instances, 모든 실행 소스는 src에 남아 있다.

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 방의 역할·기준선·단차·실패 조건은 한국어로 읽히고 영어는 temple/colonnade 같은 identity, cells/profile 같은 API 필드와 예정 source 주소에 쓰인다. 아래 비교에서 문서 용도와 실행 식별자를 구분했다.
-->

<!--
@evidenceReview obligations/core/common.md#production-language #3ef4142 작성·건조 보관·반입의 차이와 대지의 흙띠·경계석·배치 구역이 한국어 본문으로 설명되고 영어는 source/API 주소·좌표·식별자에 한정된다. 반공간과 지면 식도 단위와 부호가 설명돼 파일명 추측이 필요 없다.
-->

[언어 설정](../../settings/00-delivery.md#working-language)에 따라 설계의 결정·이유·관찰은 한국어 기술 서술이다. 관리실의 작성, 기록실의 건조 보관/열람, 보관실의 봉헌물 반입이 한국어로 구별되어 영어 파일명을 추측할 필요가 없다. west/east와 north/south 기준선은 building의 X/Z 표에, cell의 반공간은 colonnade의 부등식에 뜻이 있고 단위 m와 경사 도수는 생산 좌표 규약을 따른다. source 각도 변환과 API의 정확한 철자는 구현 시에도 유지한다.

viewer-path의 한국어 설명과 키보드 조작은 설계 요구이며 이미 UI가 구현됐다는 주장이 아니다. unverified는 실제 계측·렌더가 없는 항목의 상태로 일관되게 쓰고 입력 산술과 실행 결과를 섞지 않는다. 현재 납품에 없는 고대 언어 비문·영화 자막·인물 대사를 spaces 문서가 만들어 내지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 현재 27파일/45 H2를 전체로 읽고 본문 분량을 역할별로 비교했다. 관찰·개구부·기준선·대지·접합·표면 소유는 다수 경계/실패 경우를 다루어 길고 단일 날개/방은 상위 공유 결정을 소비해 짧다. v-077 제출본과 파일/단위 수 및 본문을 비교해 매스·동선 축소가 없음을 기록한다.
-->

<!--
@evidenceReview obligations/core/common.md#proportionate-development 표의 27파일 값을 `npm run self-check`가 같은 방식으로 다시 출력해 일치하고(openings 5102, junctions 4652, observations 7545 포함), v-077 대비 늘어난 열여덟 파일 모두가 v-077→현재 값과 그 파일을 바꾼 변경을 가지며 짧아진 둘과 그대로인 여섯도 구별된다.
-->

비교 기준은 21×20.5m 단층, 같은 층의 아홉 공간, 네 외측 입면, 하나의 주랑, 여섯 roof 문서가 다루는 외피와 그 둘레의 국소 대지다. 이 숫자는 authored 설계의 분포이며 compiled census가 아니다. 현재는 27파일/45 H2다. 아래 문자 수는 해당 Markdown에서 HTML 주석·제목 줄·공백 문자를 제거한 본문의 유니코드 코드 포인트 수이며 `npm run self-check`가 같은 방식으로 파일마다 출력한다. 링크/표 표기 문자는 남겼으므로 독자용 어절 수나 geometry 양으로 읽지 않는다. evidence 문장이 길어져 생긴 분량은 이 비교에 포함하지 않았다.

| 역할 | 파일/H2 | 파일별 본문 문자 수 |
| --- | --- | --- |
| building·storey | 2/7 | 3578·3143 |
| openings·junctions·circulation | 3/8 | 5102·4652·1869 |
| 남·북·서·동 입면 | 4/4 | 1326·887·824·820 |
| 현관·중정·주랑 | 3/3 | 1744·978·1693 |
| 제실·봉헌실 | 2/2 | 733·646 |
| 관리실·기록실·보관실·마당 | 4/4 | 624·580·577·960 |
| assembly·sanctuary·west·east·porch·colonnade roof | 6/7 | 1990·944·909·936·650·1488 |
| ownership·observations | 2/4 | 3860·7545 |
| site | 1/6 | 5518 |

주랑과 현관이 다른 방보다 긴 이유는 각각 구멍 있는 합집합과 구간별 계단 바닥을 따로 결정하기 때문이다. 가장 짧은 porch roof도 두 지지선·앞끝 돌출·후퇴벽 위 뒤끝·삼각 막음의 소유·하부 관찰을 갖는다. site는 범위·지면 식·구획표·connector·배치 구역·능선을 여섯 H2로 나눠 결정하므로 건물 한 문서보다 길다. 반대로 observations는 topology 전집합, 반환 pose의 한계, 실제 문턱/접합/지면, 전송 경계를 모두 책임져 단일 대표 view 설명으로 줄일 수 없다. 동일한 골격의 일반 방보다 이 인터페이스들에 상세가 집중된 것은 납품 효과에 맞는다.

부모 settings는 허용 범위와 방/부재 정체성을 정하고 spaces는 실제 기준선·벽 두께·문 중심·roof 지지선·순환·대지 구획 및 소유를 더했다. 같은 settings 문장을 방 이름만 바꿔 늘린 분포가 아니다. v-077 판정 제출본 a4c1d46870fb186cbf29c5b112a5476a2bfeb0e4를 같은 방식으로 재면 26파일/37 H2였고 기존 26파일은 모두 남았으며 매스·치수·동선 결정도 빠지지 않았다. 기존 파일 중 roofs/colonnade(1583→1488)와 roofs/porch(704→650)만 짧아졌는데, 파라펫 뒤 외쪽 경사로 바꾸며 폐기한 최소 높이 제한·notch 문장이 빠진 결과이고 두 문서의 지지선·끝선·하부 소유 결정은 그대로다. 늘어난 열여덟 파일은 그 뒤의 여러 변경이 겹쳐 있어 파일마다 v-077→현재 값과 그 파일을 바꾼 변경을 모두 적는다. 첫 GPU 렌더 뒤 지붕을 파라펫 뒤 외쪽 경사로 바꾼 재설계가 네 입면에 파라펫·코핑·띠 분할 문장을 더했다. 남측(903→1326)은 코핑 4.85m 파라펫과 포치 지붕을 받치는 후퇴벽, 서측(594→824)은 파라펫 안쪽에서 끝나는 외쪽 지붕과 띠 분할, 북측(691→887)은 봉헌실 구간 파라펫과 제실 박공 끝벽, 동측(682→820)은 동측 처마 벽과 남동 모서리 칸이다. 같은 재설계로 roofs/west(625→909)는 두 후보 영역·파라펫 안쪽 끝·west-inner 높이를, assembly·sanctuary·east roof(1164·675·535→1990·944·936)는 공통 지지·경사와 r1 판정 뒤의 제실 지지·동측 박공 경사 수정을 더했다. courtyard(976→978)와 service-yard(958→960)는 논리 상한의 참조를 주랑 처마 지지 높이 3.20m로 바꾼 문장으로 순증 2자다. junctions(1956→4652)는 파라펫·박공 폐쇄 표, 기단·코핑 단면 H2, 제실 처마·동측 박공 코핑 행과 외피 겹침 스캔 문장, r2 판정 뒤의 L/T 접합·박공 끝 단면 문장과 제실 벽의 나뉜 경계 ID에서 늘었다. observations(5778→7545)는 대지 관찰 묶음, 주랑 추가 모서리와 접합 관찰, 뷰어 실행 인계, r2 판정 뒤의 단면·reference 묶음과 위쪽 경계 관찰에서, ownership(2489→3860)은 대지 두 행과 외부 setting 문장, 하부 띠 H2, 내부 경계벽 reveal 행과 표면 역검사 문장에서, openings(3635→5102)는 채광구 여덟 개와 r2 판정 뒤의 제실 세 벽 위쪽 외부 향 경계 분할에서 늘었다. 대지 이관은 building·storey(3493·2755→3578·3143)에 접점·접지 문장을, circulation(1803→1869)에 서비스 문 connector 문장을 더했다. models를 열며 포치 기둥을 앞으로 옮긴 결정은 entrance(1610→1744)에 기둥 Z=10.00m와 보·삼각 막음 문장을 더했다. 새 site(5518)는 대지 결정을 더했다. 바뀌지 않은 파일은 administration·colonnade room·offering·records·sanctuary·storage 여섯이다. 새 account와 주석은 공간 수를 늘린 것으로 세지 않는다. 이 분포 비교는 실제 구현 깊이·통과·시각 품질의 완료 판정이 아니며 모두 후속 소스/프레임에서 별도로 검토해야 한다.

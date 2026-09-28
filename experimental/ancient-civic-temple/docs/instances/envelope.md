# 건물 배치가 유지하는 공간 실체

건축 독립 부재를 더할 때 spaces producer의 완성 결과를 한 번 소비한다. 이 문서는 배치 집합에서 그 결과를 남기는 membership 결정을 소유하며, 벽·바닥·지붕 형상과 공간 그래프의 좌표를 다시 저작하지 않는다.

## 방과 통행 그래프 유지 {#room-membership}

<!--
@evidence principles/core/common.md#declared-basis createTempleEnvironment의 방·층·boundary·opening·connector 결과가 입력이며 공간 ID와 접촉을 변경 없이 유지한다.
@evidence principles/core/common.md#scope-preservation 현관·중정·주랑·제실·봉헌실·관리실·기록실·보관실·서비스 마당 모두와 두 외부 접근을 유지한다.
@evidence principles/core/common.md#substantive-completion 원래 공간 배열과 모든 경로를 그대로 남기고 새 부재를 해당 공간 ID에만 귀속시켜 두 번째 평면 그래프를 만들지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간 그래프 자체는 부모의 결과이며 배치가 전 공간과 경로를 보존한다는 membership 선택만 여기서 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 공간 producer의 바닥·벽 원형을 그대로 유지하고 방 치수·새 구멍을 배치에서 고치지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 방 귀속은 같은 환경의 ID를 읽고 임의로 비슷한 방 이름이나 복제 그래프를 만들지 않는다.
@evidence principles/design/instances.md#instance-verification-address 여덟 실내 공간의 중심 네 방위·네 모서리·문턱과 서비스 마당에서 실제 남은 통행을 검사한다.
@evidence obligations/design/instances.md#instance-prototype-membership 공간 producer의 전 model·element와 아홉 공간은 빠짐없이 조립 결과에 들어간다.
@evidence obligations/design/instances.md#instance-identity-transform 원래 공간 element의 ID·parent·space·변환을 그대로 유지한다.
@evidence obligations/design/instances.md#instance-placement-review 중앙 정문-분수-제실 축과 동측 서비스 경로의 보행 폭 안에 배치 부재가 들어가지 않는지 문턱과 반대편에서 본다.
@evidence spaces/building.md#containment 건물 뿌리와 한 층·아홉 공간의 포함 관계를 배치 추가 후에도 유지한다.
@evidence spaces/storey.md#ground-storey 바닥과 문턱의 한 층 datum을 그대로 남긴다.
@evidence spaces/circulation.md#public-route 현관에서 주랑 고리로 들어가 제실과 모든 방으로 직접 닿는 원래 경로를 유지한다.
@evidence spaces/circulation.md#service-route 동측 외부 서비스 문과 마당-주랑 연결은 별도 우회 방 없이 유지된다.
@evidence spaces/building.md#approach-contacts 정문 두 석단과 서비스 무단차 외부 접점의 ID·높이를 바꾸지 않는다.
@evidence spaces/site.md#site-connections 대지와 건물은 기존 두 connector만으로 만나며 새 이웃은 통행 그래프에 편입하지 않는다.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume 축상의 넓고 높은 제실은 기존 바닥·벽·개구부와 공간 경계를 그대로 유지한다.
@evidence spaces/rooms/offering.md#offering-volume 서측 긴 봉헌실의 공간과 직접 주랑 문을 그대로 유지한다.
@evidence spaces/rooms/administration.md#office-volume 동측 남쪽 관리실의 공간과 단개문을 그대로 유지한다.
@evidence spaces/rooms/records.md#records-volume 관리실 북쪽 기록실의 별도 공간·직접 주랑 문을 그대로 유지한다.
@evidence spaces/rooms/storage.md#storage-volume 기록실 북쪽 보관실의 공간과 직접 주랑 문을 유지한다.
@evidence spaces/rooms/service-yard.md#yard-volume 북동쪽 하늘 열린 마당과 외부 문·주랑 문 두 접근을 유지한다.
@evidence settings/10-building.md#fixed-graph 한 주랑 고리와 각 방 직접 연결이라는 fixed graph를 변경 없이 소비한다.
@evidence settings/10-building.md#ground-access 정문 석단과 서비스 무단차 접점은 같은 공간 producer에서 유지한다.
@evidence settings/30-interiors.md#sanctuary 제실의 방 정체성과 높은 지붕 하부가 배치 부재에 의해 없어지지 않아야 한다.
@evidence settings/30-interiors.md#offering-room 서측 봉헌실의 긴 내부와 직접 출입을 유지한다.
@evidence settings/30-interiors.md#administration 남동쪽 관리실의 방 위치·직접 출입을 유지한다.
@evidence settings/30-interiors.md#records 동측 중간 기록실의 독립 공간을 유지한다.
@evidence settings/30-interiors.md#storage 동측 북쪽 보관실의 독립 공간을 유지한다.
@evidence settings/30-interiors.md#service-yard 북동 마당의 하늘과 외부 접근을 유지한다.
@evidence settings/00-delivery.md#operator-access 도구가 방 ID와 실제 opening·connector를 찾을 수 있도록 모든 원래 주소를 유지한다.
@evidence settings/00-delivery.md#operative-subjects 연기나 사람을 추가하지 않고 이 building 환경의 고정 사물과 공간 주소를 유지한다.
@evidence settings/00-delivery.md#accessibility 주랑과 실제 문턱 경로를 배치가 막지 않는 조건으로 계승한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 기존 아홉 공간·열 connector를 보존하는 조립이므로 방 포함 관계나 새 이동 경로를 고칠 필요가 없다.
-->

건물 조립은 원래 아홉 공간, 52 boundary, 16 opening, 열 connector를 유지한다. 공간의 model·element와 floor support를 지우거나 복사하지 않는다. 새 원주·보·문틀·문짝·기와·분수만 기존 공간 ID에 결속하여 추가한다. 실내 방에 들어간 뒤 주랑으로 나오는 문이 그대로 보여야 하고, 정문 중앙에서 제실 방향 시선과 서비스 마당의 두 문 경로를 남긴다. 소품은 이 단계의 membership에 아직 들어오지 않았으며 그 완료를 건물 완료에서 추정하지 않는다.

## 외피와 내벽 표면 유지 {#shell-membership}

<!--
@evidence principles/core/common.md#declared-basis 공간 producer의 입면·wall junction·floor·dado·roof model과 element 변환이 단일 입력이다.
@evidence principles/core/common.md#scope-preservation 네 입면과 외곽 모서리, 실내 벽 하부 띠·바닥·지붕 바탕의 전 표면을 유지한다.
@evidence principles/core/common.md#substantive-completion 새 기와·틀을 더한 뒤에도 기존 표면이 원래 위치·재료 경계에 한 번만 남아 있어야 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 만든 실체의 전수 유지 여부를 이 배치 membership이 결정하며 형상 자체를 다시 정의하지 않는다.
@evidence principles/design/instances.md#instance-prototype-boundary 모든 공간 면 model은 원형·변환 그대로 남고 새 건축 model은 building.md의 별도 집합으로 더한다.
@evidence principles/design/instances.md#instance-derivation-authority 벽·바닥·지붕 표면은 한 공간 producer의 결과만 사용해 배치가 두 번째 외피를 만들지 않는다.
@evidence principles/design/instances.md#instance-verification-address 네 입면·외곽 모서리·실내 바닥/하부 띠 경계와 전체 지붕·하부 관찰을 반증 위치로 삼는다.
@evidence obligations/design/instances.md#instance-prototype-membership 기존 전 공간 표면 model·element가 한 번씩 유지된다.
@evidence obligations/design/instances.md#instance-placement-review 새 frame·tile과 기존 reveal·roof 사이 접촉 및 하부 띠의 연속을 실제 표면에서 본다.
@evidence spaces/building.md#footprint X=±10.5m·Z=±10.25m의 원래 외곽을 배치로 넓히지 않는다.
@evidence spaces/facades/east.md#east-envelope 서비스 외부 문과 동측 업무벽 입면을 원래 실체로 유지한다.
@evidence spaces/facades/west.md#west-envelope 서측 봉헌실 바깥벽과 높은 제실의 노출 입면을 유지한다.
@evidence spaces/facades/north.md#north-envelope 뒤쪽 제실·마당 외벽과 높은 채광구를 유지한다.
@evidence spaces/facades/south.md#south-envelope 후퇴 포치와 양쪽 반환벽의 정면 입면을 유지한다.
@evidence spaces/junctions.md#wall-junctions 내벽의 T 접합과 외벽 모서리를 공간의 합성 외피로 유지한다.
@evidence spaces/storey.md#wall-ground-contact 기단 하단이 기존 site grade에 붙는 공간 실체를 유지한다.
@evidence spaces/ownership.md#interior-dado 각 방의 낮은 붉은 벽띠는 기존 wall 표면의 별도 주소로 남긴다.
@evidence spaces/ownership.md#surface-map 바닥·벽·reveal·roof upper/soffit/edge의 소유 ID를 바꾸지 않는다.
@evidence settings/20-envelope.md#walls 회벽 외피와 두꺼운 석재 기단·개구부 깊이를 원래 공간 실체로 유지한다.
@evidence settings/20-envelope.md#stone-floors 큰 석재와 동측 작은 석재 포장은 원래 방 바닥 표면으로 남긴다.
@evidence settings/20-envelope.md#material-language 회벽·석재·목재·붉은 기와의 구분을 전 공간 표면에서 보존한다.
@evidence settings/10-building.md#scale 약 430m²의 단층 외곽과 중정 크기를 instance scale로 고치지 않는다.
@evidence settings/10-building.md#civic-identity 중정·연속 주랑·축상 제실을 가진 시민 신전의 외피 정체성을 유지한다.
@evidence materials/20-space-bindings.md#space-binding-map 모든 기존 surface 주소는 같은 공간 결속표를 소비한다.
@evidence materials/20-space-bindings.md#material-junctions dado·plinth·plaster·roof·timber의 경계가 실제 소유 표면에 남는다.
@evidence materials/20-space-bindings.md#material-review-set 공간 표면 전수 96개의 결속을 유지하고 배치에서 임의 기본 재료를 주지 않는다.
@evidence materials/00-surface-palette.md#dado 기존 붉은 하부 띠의 독립 재료를 유지한다.
@evidence materials/00-surface-palette.md#plaster 네 입면과 실내 벽의 따뜻한 회벽을 유지한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 공간 면의 원형과 변환을 유지하는 집합이므로 새로운 벽 깊이·바닥 높이·표면 소유를 요구하지 않는다.
-->

공간 producer의 전 model·element를 한 번 남긴다. 바닥은 원래 support와 일치하고, dado는 회벽과 다른 surface 주소이며, 네 외곽 입면은 조립 후에도 실제 벽 실체다. 지붕의 붉은 바탕은 기와 반복을 세는 대체물이 아니다. 실제 tile 집합은 building.md가 별도로 소유한다. inspection roof-off는 화면에서만 지붕·천장·독립 목구조를 숨기며 납품 환경의 membership에서는 삭제하지 않는다.

## 대지 표면과 먼 능선 유지 {#ground-membership}

<!--
@evidence principles/core/common.md#declared-basis 공간 producer의 temple-site와 site-distant 표면·support·connector가 입력이다.
@evidence principles/core/common.md#scope-preservation 네 띠의 국소 대지·두 접근·포장·흙띠·경계석과 먼 능선·기슭을 모두 유지한다.
@evidence principles/core/common.md#substantive-completion 원래 대지 element를 site.root 아래에 그대로 남기고 이웃/식생만 site.md에서 추가한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 원래 지면과 능선의 membership을 전수 유지하며 추가 개체 집합과의 소유 경계를 배치 단계에서 확정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 지면·포장·능선은 공간 model을 그대로 쓰고 이웃·나무 원형으로 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 모든 대지 표면과 접점은 한 site producer의 grade·extent를 읽는다.
@evidence principles/design/instances.md#instance-verification-address 외부 setting 조감·두 접근·동서 골목 종단면·낮은 거리 시점에서 유지한 지면을 검사한다.
@evidence obligations/design/instances.md#instance-prototype-membership 원래 site/site-distant model·element 전수가 조립에 유지된다.
@evidence obligations/design/instances.md#instance-placement-review 흙띠-벽·경계석-포장·국소 대지-기슭 접촉을 새 이웃/식생을 포함한 환경에서 본다.
@evidence spaces/site.md#site-extent 국소 직사각형과 네 볼록 cell·site.root를 원래 별도 대지 소유로 유지한다.
@evidence spaces/site.md#distant-ridge 입체 능선과 기슭 model은 외부 배경으로 남기며 보행 공간에 편입하지 않는다.
@evidence settings/40-environment.md#distant-terrain 낮은 입체 배경을 한 번 유지하고 사진 billboard로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#distant-ridge 능선의 별도 earth key를 원래 표면에 유지한다.
@evidence materials/00-surface-palette.md#earth 흙띠·이웃 바닥·기슭은 기존 earth 표면을 유지한다.
@evidence materials/00-surface-palette.md#paving 정면 거리와 동서 골목·두 접근의 포장을 유지한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 원래 대지 표면과 support를 전수 유지하므로 site extent·지면 경사·먼 능선 형상을 수정하지 않는다.
-->

건물 뿌리와 대지 뿌리는 계속 별개다. 원래 지면 조각과 경계석·포장·능선을 유지한 뒤 site.md의 셋 이웃·넷 나무·여섯 풀만 더한다. 국소 대지 밖에는 입체 능선과 기슭 표면만 있으며 새 방·나무·도로를 늘리지 않는다. 정문 석단 발치와 서비스 외부 무단차 높이를 그대로 유지한다.

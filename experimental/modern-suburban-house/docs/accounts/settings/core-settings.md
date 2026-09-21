# 설정의 주소와 상호 일관성

## 집·사용·검토 조건의 결합 {#canon-coherence}
<!--
@evidence obligations/core/settings.md#addressable-canon 전달과 좌표·사용체, 각 침실과 욕실, 개구부와 대지, 렌더·측정·권한·제출을 서로 다른 안정된 H2에 두었다. coverage-map과 operative-subjects는 전용 owner를 가리키며 이 account도 그 주소를 비교할 뿐 별도의 주택 canon을 만들지 않는다.
@evidenceReview obligations/core/settings.md#addressable-canon #cc861eb 주침실·두 자녀방·두 욕실과 서비스 연결/개구부 기준을 서로 다른 변경 경로로 나눈 설명을 실제 H2와 대조했다. 설치·서버·제출도 전용 owner를 가지며 coverage-map은 이들을 가리킬 뿐 두 번째 canon을 만들지 않는다.
@evidence obligations/core/settings.md#internal-coherence 외곽 면적 범위와 두 층 규모, 오른손 좌표와 우측 차고, 점유체와 문·통로·계단 목표, 두 욕실의 직접 복도 접근, 실제 3D와 CJS 서버 선택을 서로 비교했다. 수치 범위가 공집합이 아니고 권한 충돌은 최신 Git 지시의 소유 항목에서 해소했으며 아직 없는 배치와 GPU 결과의 충족까지 추론하지 않는다.
@evidenceReview obligations/core/settings.md#internal-coherence #5ae4761 11.6 m × 10.6 m의 두 층 245.92㎡와 상한을 넘는 259.6㎡ 예를 확인하고 점유체와 통로 하한·축·CJS/브라우저 역할을 함께 읽었다. 예시를 채택 외곽으로 바꾸지 않으며 실제 배치와 GPU 충족은 이 비교가 증명하지 않는다.
-->

[coverage-map](../../settings/00-production.md#coverage-map)은 전달·생활·검토의 파일군을 잇고 [operative-subjects](../../settings/00-production.md#operative-subjects)는 집·빛·문뿐 아니라 조작자와 계측 도구·판정 주체를 전용 H2로 연결한다. 주침실과 두 자녀 침실, 샤워 욕실과 욕조 욕실은 다른 문의 소속과 다른 가구 결정을 바꿀 수 있으므로 10의 별도 H2다. 서비스 띠는 개별 실의 내부 마감이 아닌 연결의 owner이고, openings는 방들이 공유하는 창호의 부재·상태 기준이다. 실행·설치·서버·Git도 변경 권한이 달라 20에서 분리되어 있다. 이 구분을 파일 전체에 대한 하나의 evidence 주소로 뭉치지 않는다.

[house-scale](../../settings/10-house.md#house-scale)의 두 층 면적 조건은 차고·포치를 제외한다. 예를 들어 허용 범위 안의 11.6 m × 10.6 m를 두 층에 적용한 245.92㎡는 235–255㎡ 안이다. 이 계산은 범위가 모순되지 않는 예이며 최종 외곽의 선택이나 돌출부 면적 검사는 아니다. 11.8 m × 11.0 m × 2 = 259.6㎡처럼 폭·깊이 각각은 허용되더라도 면적 상한을 넘는 조합은 본문의 동시 만족 조건으로 거부된다. 이 account가 새 건물 치수를 확정하지 않는다.

[coordinate-units](../../settings/00-production.md#coordinate-units)의 +X는 정면에서 오른쪽 차고, +Z는 앞 보도이며 10의 전면 거실·후면 공용부와 같은 앞뒤를 쓴다. 각도 rad는 공유 값의 단위이고 10의 지붕 경사와 20의 FOV에 쓰인 °는 사람이 읽는 범위 표기이므로 실제 설계값으로 사용할 때 같은 각도로 변환해야 한다. 지리적 북쪽이나 실재 태양 시간은 좌표와 조명의 근거로 채택하지 않았다.

[use-profile](../../settings/00-production.md#use-profile)의 사람 점유 폭 0.60 m와 바구니 포함 폭 0.75 m는 문 목표 0.80 m, 통로 0.90 m, 계단 0.95 m보다 작고, 높이 1.90 m는 머리 공간 목표 2.00 m보다 작다. 이 차이는 검사 목표의 산술적 양립만 보여 준다. 가구·문 작동·굴곡이 있는 실제 통행은 컴파일된 공간에서 따로 검사해야 한다. 계단의 두 flight와 중간참은 상층 복도 한 곳에 도착하며 두 욕실 모두 복도에서 직접 들어가므로 주침실 전용 통로를 요구하지 않는다. 욕조 욕실의 벽 분리와 샤워 욕실의 카펫 종료는 한 개의 공용 욕실을 두 이름으로 부르는 상태를 허용하지 않는다.

정적 library이므로 사건 연대·여행 시간·상영 길이를 만들지 않고 시간 단위만 필요할 때 s로 둔다. 조명은 켜져 있지만 급배수·기기·날씨는 움직이지 않으며 렌더 조작과 생활 기능의 시뮬레이션을 혼동하지 않는다. [execution-boundary](../../settings/20-verification.md#execution-boundary)의 CJS 서버는 엔진 산출물을 브라우저에 전달하고 [renderer-boundary](../../settings/20-verification.md#renderer-boundary)는 그 결과의 실제 WebGL 화면을 요구하므로 서버 해석과 클라이언트 3D는 양립한다. 공개 API와 자원 적합성은 설치본을 읽을 source의 검토 대상으로 남는다.

원본 이미지 02의 차량과 실내 참조 간 계단 차이는 각각 garage의 차량 금지와 stair의 한 계단 선택에 종속된다. 자체 검토는 승인권을 가지지 않으며 설치·서버 기동은 조정자, 명시 경로 커밋·푸시는 저작자다. 공유 checkout에서 pull --rebase를 빼라는 최신 사용자 정정은 submission-boundary에 반영했다. 시각 품질과 실제 관찰 집합은 아직 없는 산출물에 의존하므로 이 일관성 비교로 완료가 되지 않는다.

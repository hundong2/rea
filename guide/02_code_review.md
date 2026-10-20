# 2. 대표 분석 경로의 코드 리뷰

작성일: 2026-10-20

[학습 목차](README.md) · [구조도·근거](../docs/archify/README.md) · [심화](03_advanced.md)

## 분석 범위

기준 revision은 `c374c2fe7290b914d73d9e27af38b498753ec593`이다. 여러 제공자를 모두 추측해 설명하지 않고, 실제 실습과 같은 JavaScript 정적 분석의 진입·조정·결과·정리 경로를 읽었다. 아래는 소스에 근거한 구조 해설이며 별도 성능 개선이나 취약점 재현 주장이 아니다.

## 진입과 공유 워크플로

`scripts/rea.mjs`는 `mcp`, `mcp --http`, 일반 명령을 구분하고 `dist`의 해당 런타임 파일 유무를 검사한다. CLI 경로는 `src/cli.ts`의 등록을 통해 `src/cli/electronCommands.ts`의 JavaScript 분석 명령으로 들어간다. 이 명령은 호출자가 지정한 경로·옵션을 보존해 `runCliJavaScriptApplicationAnalysis()`에 넘긴다.

CLI 어댑터는 `ArtifactResourceScope`와 진행 보고기를 만든 뒤 `analyzeJavaScriptApplication()`을 호출한다. 이 서비스는 입력 스키마를 검증하고 검증된 경계 함수로 이어진다. MCP의 `src/server/registerElectronTools.ts`도 이름이 지정된 계약을 등록해 같은 `analyzeJavaScriptApplicationValidated()`를 호출한다. MCP 전체가 CLI를 셸로 호출하는 구조는 아니다.

## 재구성과 분석기

`JavaScriptArtifactReconstruction.ts`는 선택한 경로의 실재·읽기 권한과 입력 형식을 확인한다. Canonical inventory를 스캔하고 원본 내용 식별값·무결성 정보를 보존한다. 파일을 읽은 뒤 reader를 먼저 정리하고, 이후 분석은 획득한 파일 사실을 대상으로 진행한다.

`createJavaScriptSourceAnalysis()`가 worker 구현을 만든다. worker의 진입은 `src/composition/javascriptAnalysisWorkerProcess.ts`로, 파일을 AST로 파싱하고 static facts와 semantic IR을 투영한다. 요청 heap·timeout과 결과 보관 예산을 전달하며 파싱·분석·투영 단계에서 상태를 보고한다. 디렉터리에 함께 있다는 이유로 두 파일의 실제 런타임 호출 관계를 확정하지 않는다.

부모의 재구성 경로는 모듈 그래프와 Electron 경계, semantic graph를 구성한다. 그래프의 식별값·교차 참조를 검증한 다음 `JavaScriptApplicationEvidence.ts`가 결과를 동결·검증·해시한다. 반환 Evidence에는 대상, provider, operation, parameters, confidence, authority와 limitations가 들어간다.

## 자원 소유권과 실패 처리

`ArtifactResourceScope`는 reader·worker·file handle·private root 등의 소유자를 추적한다. 닫기에 실패한 소유자는 보관해 재시도할 수 있게 하며 이미 불확실한 자원을 없는 것으로 바꾸지 않는다. CLI 경계는 분석 후 scope를 닫고, 닫기 실패를 원래 분석 오류와 함께 표현한다. MCP는 서버에 주입된 scope와 작업 수명 관리 경계를 이용한다.

서비스는 일부 결과를 확보한 후 취소된 경우 그 자료를 Evidence로 마무리해 부분 관찰로 남기려는 경로를 가진다. 파싱 오류, 입력 오류, provider 오류, 자원 제약을 한 종류의 문자열 오류로 덮지 않는다. 이번 실습은 실패 경로 중 **없는 소스 선택**을 실행했으며, 취소·정리 실패 전부를 실제로 재현한 것은 아니다.

## 의존성과 경계

- 구문 분석은 Babel 계열 의존성, 입력·결과 계약은 Zod, CLI는 Incur, MCP는 MCP SDK를 사용한다.
- 네이티브 엔진을 요구하는 제공자와 Node만으로 가능한 형식 분석은 다른 조립 경로다.
- Windows에서는 프로세스 소유권과 파일 admission에 package-owned addon을 사용하며 버전·해시·아키텍처를 검사한다.
- 런타임은 로컬 분석 도구지만, 연결된 에이전트가 모델에 결과를 전달하는 정책은 별개다.

이 문서 작업은 새 provider, runtime injection, 대상 실행·수정 기능을 추가하지 않는다. 그런 확장은 원본 contribution scope와 실제 제공자 검증 조건을 별도로 따라야 한다.

## 확장 지점과 디버깅

새 관찰은 먼저 analyst question과 결과 의미를 정하고 domain·contract에서 표현한다. provider 코드를 domain 안에 끼워 넣지 않고, application이 포트를 통해 사용하도록 연결한다. CLI와 MCP의 의미가 달라지지 않는지 양쪽 결과를 비교한다. schema·카탈로그는 소유하는 원본에서 재생성하며 ignored 산출물 자체를 편집해 해결하지 않는다.

정적 분석을 디버깅할 때는 입력 경로 → inventory → source selection → parse status → module/semantic graph → Evidence 순서로 확인한다. source selection으로 누락된 파일, 동적 채널, unresolved 관계와 parse failure를 구분한다. `confidence=derived`나 해시가 있다고 실행 성공이 증명되는 것은 아니다.

## 검증 지점과 한계

기존 한국어 README에는 IL2CPP와 Godot PCK 행이 영문 대비 빠져 있어 추가했다. 명령 예제는 기존과 동일하게 유지한다. 새 예제는 공개 CLI를 실행하고 실제 Evidence·IPC·선택 범위·입력 오류를 검사한다. 제품 내부 구현을 복제한 toy analyzer를 REA 실행 결과라고 부르지 않는다.

제공자 전체의 속도·정확도, 실제 앱 재구현 성과, 상용 엔진 동작, 사용 토큰·CPU·메모리 개선은 측정하지 않았다. 상세한 실행 검사와 남은 제한은 [검증 기록](verification.md)에 구분한다.

# REA JavaScript 정적 분석 아키텍처

작성일·확인일: 2026-10-20

[대화형 구조도](architecture.html) · [원본 JSON](architecture.json) · [학습 가이드](../../guide/README.md) · [한국어 README](../readme/README_ko.md)

## 분석 범위

- 저장소: <https://github.com/hundong2/rea>
- 분석 revision: `c374c2fe7290b914d73d9e27af38b498753ec593`, package.json 6.7.0.
- `architecture`, schema 1, `showcase`. 주요 구성요소 7개.
- 실제 코드로 확인한 CLI/MCP → JavaScript 분석 서비스 → 아티팩트 재구성 → worker를 대표 경로로 삼았다. 서비스가 완료 결과를 검증한 뒤 Evidence를 생성하고 호출 어댑터로 돌려준다.
- 여러 제공자 전체·클라우드 배포·네이티브 엔진 내부 구조를 나타내는 지도가 아니다. 파일이 같은 폴더에 있다는 이유로 호출 관계를 추가하지 않았다.
- 한국어는 Archify의 지원 Viewer locale이 아니므로 `meta.locale`을 생략했다. 고정 Viewer UI와 `<html lang>`은 영어 fallback이며 완전한 한국어 UI는 아니다.

## 코드 근거

줄 번호는 위 revision을 기준으로 한다. 각 노드의 `sources`에서 파일 근거를 찾을 수 있다.

| 구성요소         | 코드 근거                                                                                                                                                                             | 확인한 관계                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| CLI 분석 명령    | `scripts/rea.mjs:60–113`, `src/cli/electronCommands.ts:267–325`, `src/cli/javascriptApplicationAnalysis.ts:11–51`                                                                     | dispatcher가 CLI 런타임을 선택하고 명령이 공유 분석 함수를 호출 |
| MCP 도구 등록    | `src/server/registerElectronTools.ts:59–122`                                                                                                                                          | 이름이 지정된 계약을 등록해 검증된 분석 함수를 호출             |
| 공유 분석 서비스 | `src/application/javascript/JavaScriptApplicationService.ts:33–115`                                                                                                                   | 입력 검증, 재구성, 결과 검증, Evidence 생성                     |
| 아티팩트 재구성  | `src/application/javascript/JavaScriptArtifactReconstruction.ts:73–212`                                                                                                               | 경로·형식 확인, inventory, 파일 읽기, worker 생성·분석·정리     |
| 분석 worker      | `src/artifacts/javascript/JavaScriptSourceAnalysis.ts:8–12`, `src/javascript/analysis/JavaScriptAnalysisWorker.ts:87–150`, `src/composition/javascriptAnalysisWorkerProcess.ts:20–87` | worker 구현과 파싱·static/semantic 투영 진입                    |
| Evidence 생성    | `src/application/javascript/JavaScriptApplicationEvidence.ts:18–64`                                                                                                                   | 결과 동결, JSON 검증, canonical Evidence 해시                   |
| 로컬 파일·목록   | `src/artifacts/inventory/scanCanonical.ts:53–100`, `src/application/javascript/JavaScriptArtifactReconstruction.ts:96–141`                                                            | 입력을 읽고 내용·목록 식별값 보존                               |

화살표는 호출·획득 방향을 나타낸다. 분석 결과는 호출자에게 반환되며, 분기선의 수직 배치는 호출의 시간 순서를 뜻하지 않는다. 특히 Evidence 생성은 재구성 결과가 반환된 다음에 이뤄진다. 반환 화살표를 중복해 넣지 않고 이 문서에서 의미를 설명한다.

## 상태와 신뢰 경계

이 경로는 대상 소스를 실행하지 않고 파일로 읽는다. worker는 별도의 분석 코드이며 대상 앱 프로세스와 다르다. Evidence에는 대상 식별, 호출자 선택, 결과와 한계가 직렬화된다. 이 그림에 영속 데이터베이스·서버 포트·운영 조직을 가정해 추가하지 않았다.

`ArtifactResourceScope`와 프로세스 소유권 관리가 획득한 자원을 정리한다. worker·파일 수명과 cleanup 실패의 세부 경로는 [코드 리뷰](../../guide/02_code_review.md)에 설명했다. CLI는 작업 범위의 scope를 만들고 닫으며 MCP는 주입된 서버 자원 범위를 이용한다.

MCP에는 stdio 기본 및 HTTP 선택 진입이 있지만 그림에서는 JavaScript 도구 등록 경계만 보여 준다. Native providers, 브라우저·프로세스 관찰, setup/update, Evidence 영속 원장 전체, 취소 중 최종화 회귀 검증은 범위 밖이다.

## 검증 증거

[최종 validation](validation-receipt.json)과 [deliver receipt](delivery-receipt.json)는 9/9 artifact checks, composition errors 0, warnings 0을 통과했다. 기준 revision의 코드 근거 12개가 확인됐다. JSON을 저장소 formatter로 정리한 뒤 최종 validation·deliver를 수행했고 이후 원본 JSON·HTML을 수정하지 않았다. 저장소의 기존 `.gitattributes`가 LF 체크아웃을 고정한다.

표준 [visual-check receipt](architecture.visual-check.json)는 **failed**다. Chrome에서 `Page.loadEventFired`가 15초 내 전달되지 않아 자동 확인을 완료하지 못했다. 표준 명령이 contact sheet·PNG를 생성했다고 주장하지 않는다.

별도 Playwright 브라우저에서 **동일한 전달 HTML**을 열어 [보충 브라우저 기록](manual-browser-review.json)과 [보충 contact sheet](manual-review.html)를 만들었다. 이 기록은 HTML SHA-256·바이트 수에 묶여 있다. 표준 자동 검사 실패 상태를 이 결과로 바꾸지 않는다.

| 화면 크기 | light 페이지 크기 | dark 페이지 크기 |
| --------- | ----------------- | ---------------- |
| 1440×900  | 1440×900          | 1440×900         |
| 1600×1000 | 1600×1000         | 추가 캡처 없음   |
| 1920×1080 | 1920×1080         | 추가 캡처 없음   |
| 2048×1320 | 2048×1320         | 2048×1320        |

이미지 도구로 [1440 light](manual-review-1440x900-light.png), [1440 dark](manual-review-1440x900-dark.png), [2048 light](manual-review-2048x1320-light.png), [2048 dark](manual-review-2048x1320-dark.png)를 직접 검토했다. 두 테마에서 노드·카드·라벨이 잘리지 않고, 관계선 겹침과 큰 화면의 과도한 빈 하단이 없는 것을 확인했다. 검색·포커스·내보내기 전체의 상호작용 검증은 수행하지 않았다.

후보 작성 단계에서 코드 줄 범위 두 곳과 수직 관계 라벨 세 곳을 수정했다. deliver 이후 시각 수정은 없으므로 correction_rounds=0이다.

```text
diagram_type: architecture
output: D:/workspace/laboratory/rea/docs/archify/architecture.html
specification_sha256: 8bd4e4d647e3064e878cc4f27d661acb86d1d49ace64a2065f22e8ef289ac37e
artifact_sha256: 49532a8b5fa0968b41c7f84a12f495fffa6d1b0d0017ccd284e178d21123e80d
validation: 9/9 showcase, 0 errors, 0 warnings
browser_evidence: failed
visual_review: passed
correction_rounds: 0
```

## 다시 확인하기

`<ARCHIFY_SKILL_ROOT>`는 설치된 archify 스킬 폴더, `<REA_ROOT>`는 이 저장소 절대 경로로 바꾼다.

```text
node <ARCHIFY_SKILL_ROOT>/bin/archify.mjs validate architecture docs/archify/architecture.json --repo-root <REA_ROOT> --quality showcase --json
node <ARCHIFY_SKILL_ROOT>/bin/archify.mjs visual-check docs/archify/architecture.html --json
```

REA 빌드·공개 CLI 실습·문서 검사 결과와 미검증 범위는 [학습 검증 기록](../../guide/verification.md)에 따로 정리했다.

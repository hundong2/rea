# REA 한국어 학습 가이드

작성일: 2026-10-20

## 목차

- [출처와 작업 범위](#출처와-작업-범위)
- [한눈에 보기](#한눈에-보기)
- [기초 개념](#기초-개념)
- [핵심 요약](#핵심-요약)
- [상세 정리](#상세-정리)
- [용어 정리](#용어-정리)
- [실습 학습 가이드](#실습-학습-가이드)
- [다음 학습 경로](#다음-학습-경로)

## 출처와 작업 범위

- 입력: [hundong2/rea](https://github.com/hundong2/rea). URL만 전달된 요청을 laboratory의 AGENTS.md에 따른 한국어 학습 자료 생성 요청으로 해석했다.
- 원 프로젝트: [morluto/rea](https://github.com/morluto/rea). 기본 브랜치 `main`, 분석 revision `c374c2fe7290b914d73d9e27af38b498753ec593`, package.json 버전 6.7.0.
- 직접 확인: README·기존 한국어판·라이선스, 실행 dispatcher, CLI/MCP 등록, JavaScript 분석 서비스, 아티팩트 재구성, worker, Evidence 생성, 자원 정리, 개발·Windows 빌드 안내와 관련 테스트.
- 확인일: 2026-10-20. REA 자체 코드는 [MIT](../LICENSE), 제3자 자료는 [고지 문서](../THIRD_PARTY_NOTICES.md)에 따라 구분한다.
- 원문 번역: [기존 한국어 README](../docs/readme/README_ko.md)를 대조·갱신했다. 별도 README_kor.md나 중복 번역 파일은 만들지 않는다.

실제 검증은 자작 JavaScript/Electron 파일의 **정적 분석**에 한정한다. Native decompiler, Android, firmware, 브라우저 캡처, 실제 앱 재구현을 검증한 결과가 아니다. 다른 프로그램에 연결하거나 에이전트 설정을 설치하지 않았다.

## 한눈에 보기

REA는 에이전트가 로컬 소프트웨어를 조사하도록 돕는 Node.js/TypeScript 도구다. CLI와 MCP가 같은 애플리케이션 워크플로를 사용하며, 결과를 단순한 설명문 대신 출처·해시·한계를 포함한 Evidence로 전달한다. 대상에 따라 파일 정적 검사, 디컴파일러 연결, 브라우저 관찰 등 다른 경로를 사용한다.

이 가이드에서는 설치와 실행의 효과를 구분하고, 가장 준비 부담이 작은 자작 JavaScript 앱에서 모듈과 Electron 경계를 관찰한다. [실행 가이드](01_getting_started.md) → [코드 리뷰](02_code_review.md) → [Evidence 심화](03_advanced.md) 순서로 읽는다. [대화형 구조도](../docs/archify/architecture.html)와 [근거·검증](../docs/archify/README.md)도 함께 제공한다.

## 기초 개념

정적 분석은 파일을 데이터로 읽어 구문과 관계를 조사한다. `require('electron')`라는 문자열이 있어도 분석 대상 앱을 실제로 실행해야 하는 것은 아니다. 반면 런타임 관찰은 선택한 프로세스를 실행하거나 연결하므로 부수 효과와 종료·정리 책임이 달라진다.

Electron은 주 프로세스(main), 화면 코드(renderer), 둘 사이를 연결하는 preload를 구분한다. renderer가 `window.notesApi.search()`를 호출하고 preload가 이를 `ipcRenderer.invoke('notes:search')`로 넘기며 main이 `ipcMain.handle()`로 처리하는 구조를 실습에서 만든다. 정적 분석으로 이 구문 연결을 확인해도 실제 앱이 정상 실행된다는 뜻은 아니다.

Evidence는 분석 대상, 사용한 분석기, 정규화한 결과, 신뢰 수준과 한계를 함께 담는다. `observed`는 관찰, `derived`는 자료에서 계산·도출, `inferred`는 추론을 구분한다. 이번 정적 분석 Evidence는 `derived`, 권위 근거는 `shipped-artifact`로 반환됐다.

## 핵심 요약

1. `scripts/rea.mjs`가 일반 CLI와 MCP 진입을 나눈다.
2. CLI의 `analyze-javascript-application`과 MCP의 `analyze_javascript_application`은 같은 서비스로 들어간다.
3. 디렉터리/ASAR 목록과 내용 식별값을 만들고 선택한 소스를 구문 분석한다.
4. worker가 분석을 담당하며 모듈·Electron·의미 그래프를 구성한다.
5. 결과를 검증·동결·해시한 후 Evidence를 만든다.
6. 자원 정리 실패도 결과 판단에 포함한다. 분석 성공만 보고 전체 성공으로 바꾸지 않는다.
7. `--source-path`는 명시적 선택이며 의존 파일을 자동으로 포함하지 않는다.

## 상세 정리

| 경로                                      | 책임                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| `scripts/rea.mjs`                         | 배포 실행 파일, CLI/MCP 분기와 컴파일 결과 유무 확인 |
| `src/cli.ts`, `src/cli/`                  | 명령·옵션을 애플리케이션 입력으로 변환               |
| `src/main.ts`, `src/main/`, `src/server/` | MCP transport·세션·도구 등록·결과 전달               |
| `src/application/`                        | CLI와 MCP가 공유하는 작업 순서와 Evidence 흐름       |
| `src/contracts/`, `src/domain/`           | 입력 계약, 오류·Evidence·그래프 의미                 |
| `src/artifacts/`                          | 목록, 안전한 읽기, 내용 식별, 자원 소유권            |
| `src/javascript/`, `src/composition/`     | JavaScript worker와 제공자 조립                      |
| `src/process/`, `src/windows/`            | 프로세스 소유권·시간·출력·정리, Windows 호스트 경계  |
| `bridge/`, `native/`, `third_party/`      | 엔진 연결, Windows addon, 외부 도구 소스             |
| `tests/`, `docs/`                         | 검증 체계와 사용·개발 안내                           |

이 저장소는 여러 분석 대상을 지원하므로 전체 제공자를 한 그림에 넣지 않았다. [코드 리뷰](02_code_review.md)는 대표 경로의 호출 근거와 확장·디버깅 지점을 구분한다. 새 실습은 JavaScript ESM `.mjs`로 작성해 저장소가 쓰는 Node.js 실행 환경을 그대로 사용한다.

## 용어 정리

| 용어                              | 뜻과 역할                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| MCP · Model Context Protocol      | 에이전트가 도구를 호출하는 연결 규약. REA의 한 어댑터다.                      |
| CLI · Command-Line Interface      | 터미널 명령 인터페이스. 일회성 분석에 사용한다.                               |
| AST · Abstract Syntax Tree        | 추상 구문 트리. 코드를 실행하지 않고 구조를 조사하는 근거다.                  |
| ASAR                              | Electron 앱 파일을 묶는 아카이브 형식. 입력이 디렉터리인지 ASAR인지 검증한다. |
| IPC · Inter-Process Communication | 프로세스 간 통신. 채널 송신과 처리 구문을 대응시킨다.                         |
| context bridge                    | preload가 renderer에 제한된 API를 노출하는 연결 지점이다.                     |
| Evidence                          | 대상·결과·권위·한계·식별 해시를 포함하는 분석 증거다.                         |
| provenance                        | 결과가 어떤 대상·연산·자료에서 나왔는지 추적할 수 있는 출처 정보다.           |
| provider                          | 특정 엔진·형식·관찰 방법을 연결하는 구현이다.                                 |
| resource scope                    | 파일·worker 등 획득한 자원의 정리 책임을 보관하는 범위다.                     |
| unknown                           | 아직 확인되지 않은 사실. 결과에 없다는 이유로 부재로 해석하지 않는다.         |
| Job Object                        | Windows에서 소유한 프로세스 집합의 수명과 종료 등을 다루는 OS 기능이다.       |

## 실습 학습 가이드

개발용 고정 도구는 `.nvmrc`의 Node.js **24.18.0**, packageManager의 **npm 11.16.0**이다. 일반 배포판의 Node 지원 범위와 개발용 고정 버전을 혼동하지 않는다.

```sh
npm ci
npm run build:cached
node guide/examples/01_foundations.mjs
node guide/examples/02_practice.mjs
node guide/examples/03_advanced.mjs
```

Windows 소스 checkout은 빌드만으로 native addon이 생기지 않는다. [Windows 소스 준비](01_getting_started.md#windows-소스-checkout)를 먼저 확인한다. 실습은 임시 폴더에 만든 자작 소스만 검사하고 끝나면 정리한다. 모델 API·Electron·상용 분석기는 필요 없다.

| 순서 | 파일                                              | 학습 목표                                          |
| ---- | ------------------------------------------------- | -------------------------------------------------- |
| 1    | [01_foundations.mjs](examples/01_foundations.mjs) | 실제 CLI Evidence, 그래프와 분석 신뢰 수준         |
| 2    | [02_practice.mjs](examples/02_practice.mjs)       | main/preload/renderer, IPC 채널과 정적 분석 한계   |
| 3    | [03_advanced.mjs](examples/03_advanced.mjs)       | 소스 선택 유지, 미선택 범위, 잘못된 입력 오류      |
| 공통 | [support.mjs](examples/support.mjs)               | 자작 fixture, 공개 CLI 실행, 임시 파일 소유권·정리 |

각 실행에는 결과 검증 assertion이 들어 있다. 분석 대상 코드를 실행하면 생기는 표시 파일이 없는지도 검사한다. 실제 실행 결과와 검사 범위는 [검증 기록](verification.md)에 남긴다.

## 다음 학습 경로

1. 초급: 세 실습을 실행한 뒤 모듈 그래프와 실행 호출 그래프의 차이를 설명한다.
2. 중급: 실습의 채널명을 동적 표현으로 바꾸고 무엇이 미확인으로 남는지 조사한다.
3. 심화: [Evidence·선택 범위·정리](03_advanced.md)를 읽고 실패·취소·한계가 판단에 미치는 영향을 정리한다.
4. 제공자 확장: [CONTRIBUTING](../CONTRIBUTING.md)과 [도구 설계](../docs/tool-design.md), [테스트 지침](../docs/testing.md)을 따른다. 새 실행·주입·수정 기능은 문서 보완과 별개로 scope 결정과 실제 도구 검증이 필요하다.

기여할 때는 재현 명령과 실행한 검사, 확인하지 못한 범위를 함께 적는다. 이 작업은 한국어 자료와 격리된 실습만 추가하며 제공자·제품 기능을 변경하지 않는다.

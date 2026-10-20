# 1. 설치와 첫 정적 분석

작성일: 2026-10-20

[학습 목차](README.md) · [다음: 코드 리뷰](02_code_review.md)

## 설치와 에이전트 설정의 차이

개발 checkout에서 `npm ci`는 잠금 파일에 지정된 의존성을 설치하고 Husky를 준비한다. `npm run build:cached`는 CLI/MCP 런타임과 배포 스킬을 빌드한다. `npx rea-agents setup`은 에이전트 설정과 지침을 추가하는 다른 작업이다. 이번 학습을 실행하는 데 setup은 필요 없다.

Node.js 24.18.0과 npm 11.16.0을 사용한다. `node --version`, `npm --version`으로 확인한 뒤 저장소 루트에서 실행한다.

```sh
npm ci
npm run build:cached
node scripts/rea.mjs --help
```

이 작업에서는 시스템 Node를 바꾸지 않고 공식 배포본을 임시 폴더에서 사용했다. Node ZIP의 SHA-256을 공식 SHASUMS256.txt와 대조했다. 실제 의존성 설치는 npm 11.16.0으로 수행했다.

## Windows 소스 checkout

원본 [Windows 개발 안내](../CONTRIBUTING.md#windows-source-checkouts)처럼 소스 저장소에는 `native/windows/build/`의 addon과 manifest가 없다. `run-exclusive` 및 JavaScript worker의 프로세스 소유권 관리에는 Windows native controls가 필요하다.

소스와 **동일 버전**의 공식 npm tarball에서 두 파일을 복원할 수 있다. 상세 절차는 [원본 안내](../native/windows/README.md#restore-the-artifact-in-a-source-checkout)를 따른다. 이번 분석에서는 6.7.0 tarball의 `manifest.json`, `rea-windows-x64.node`만 무시되는 `native/windows/build/` 경로에 복사하고 다음 검증을 실행했다.

```sh
node scripts/verify-windows-native-artifact.mjs
```

패키지 버전, ABI, Node-API, PE 아키텍처와 addon SHA-256 검사를 통과해야 한다. 버전이 다른 바이너리나 임의 경로를 대신 사용하지 않는다. 복원한 파일·node_modules·dist는 커밋하지 않는다. 다른 엔진은 설치하지 않았다.

이번 재귀 submodule 초기화에서는 Unblob의 Windows 비호환 테스트 이름 때문에 checkout이 실패했다. 해당 하위 저장소에 sparse checkout을 설정해 `tests/`를 제외하고 지정 commit을 checkout한 뒤 재귀 업데이트를 완료했다. 하위 gitlink·소스는 변경하지 않았으며 Unblob 통합 테스트 전체를 사용할 수 있는 환경이라고 주장하지 않는다. 이 우회는 자작 JavaScript 실습의 실행 경로와 무관하다.

## 세 실습의 예상 결과

```sh
node guide/examples/01_foundations.mjs
node guide/examples/02_practice.mjs
node guide/examples/03_advanced.mjs
```

첫 실습은 실제 `analyze-javascript-application` CLI를 자식 프로세스로 실행하고 JSON Evidence를 검증한다. `operation`, `confidence=derived`, 모듈·노드·간선 수를 출력한다. `target_executed=false`는 fixture의 실행 표시 파일이 생성되지 않았다는 검사 결과다.

두 번째는 Electron 창·context bridge·IPC를 확인한다. 자작 파일에서 관찰한 값은 창 1개, context bridge API 1개, IPC 연산 2개, 문자열 채널 1개, 대응되는 renderer 송신 1개다. 실제 Electron 앱 실행이나 UI 기능의 성공을 검증한 결과가 아니다.

세 번째는 `--source-path preload.cjs`를 사용한다. `requested_paths=["preload.cjs"]`, `unselected_files=5`가 보존된다. 없는 파일을 선택하면 `invalid_request`, 종료 코드 1을 확인한다. 전체 artifact의 inventory 식별과 선택한 소스의 분석 범위는 다르다.

각 실습은 임시 소스를 만들고 종료 시 그 디렉터리를 지운다. JSON에는 임시 경로·해시가 들어가므로 매 실행의 전체 바이트가 고정된다고 가정하지 않는다. fixture는 애플리케이션 코드로 import하거나 Electron으로 실행하지 않는다.

## 직접 내 파일을 분석하려면

CLI는 다음 형식이다. 먼저 본인이 선택한 실제 파일 경로로 바꾼다.

```text
node scripts/rea.mjs analyze-javascript-application <추출한-앱-디렉터리> --json
node scripts/rea.mjs analyze-javascript-application <추출한-앱-디렉터리> --source-path preload.cjs --json
```

`--source-path`는 inventory 기준의 정확한 상대 경로이며 여러 번 지정할 수 있다. glob이나 재귀 의존성 선택이 아니다. 정적 분석 명령과 브라우저·프로세스 관찰 명령은 실행 효과가 다르므로 같은 것으로 취급하지 않는다.

## 문제 해결

| 증상                        | 확인할 내용                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| engine-strict 오류          | 시스템 Node 22.18처럼 지원 범위보다 낮은 실행 파일이 PATH 앞에 있는지 확인 |
| compiled runtime missing    | `npm ci`와 `npm run build:cached` 실행 여부                                |
| Windows native unavailable  | 같은 REA 버전 addon·manifest와 검증 결과                                   |
| source path 없음            | 앱 루트에 상대적인 inventory 경로인지 확인                                 |
| timeout/resource constraint | 원본 입력 규모와 선택 범위를 확인하고 오류·부분 Evidence를 보존            |
| JSON 파싱 오류              | stdout 결과와 stderr 진단을 분리했는지 확인                                |

CLI의 진행 JSON은 stderr에 출력된다. 예제는 stdout의 결과 JSON만 파싱하며 시간과 보관 출력 크기를 제한한다.

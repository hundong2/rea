# 학습 자료 검증 기록

확인일: 2026-10-20. 환경: Windows x64, Node.js 24.18.0, npm 11.16.0.

## 실행한 검사

| 항목                                                                | 결과 | 확인 범위                                                                                     |
| ------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| `npm ci`                                                            | 통과 | 잠금 파일 의존성 설치. npm은 allow-scripts 미승인 항목 알림을 출력했으며 임의로 승인하지 않음 |
| Windows addon 검증                                                  | 통과 | 공식 rea-agents 6.7.0 tarball에서 동일 버전 artifact 복원, 버전·ABI·PE·SHA-256 검증           |
| `npm run build:cached`                                              | 통과 | runtime과 packaged skill. 동적 import의 청크 분리 효과가 없다는 기존 bundle 경고 2건은 남음   |
| 실습 01                                                             | 통과 | 공개 CLI, Evidence ID·operation·confidence, 그래프 33노드·46간선, 실행 표시 파일 없음         |
| 실습 02                                                             | 통과 | 창 1, context bridge API 1, IPC 연산 2, literal channel 1, paired renderer transmission 1     |
| 실습 03                                                             | 통과 | preload.cjs 선택 보존, 미선택 파일 5, 없는 소스 선택 시 invalid_request·종료 1                |
| `npm run test:local -- tests/conformance/readmeConsistency.test.ts` | 통과 | 기존 검사 5개, 번역판 onboarding 명령 일치 포함                                               |
| `npm run check:fast`                                                | 통과 | typecheck·lint 및 module boundaries                                                           |
| `npm run docs:check`                                                | 통과 | 문서 사실·생성물·license 검사와 README 검사 5개                                               |
| Markdown 로컬 링크·JS 구문                                          | 통과 | 새 자료와 변경 README의 로컬 파일 존재·예제 구문 검사                                         |
| `git diff --check`                                                  | 통과 | 이번 변경의 공백·패치 검사                                                                    |
| Archify validation·deliver                                          | 통과 | 9/9 showcase, errors 0, warnings 0, 코드 근거 12개                                            |
| 표준 Archify visual-check                                           | 실패 | Chrome 로딩 이벤트 시간 초과, 실패 receipt 보존                                               |
| 보충 브라우저 측정                                                  | 통과 | 4개 화면 크기의 containment, 양 끝 크기의 light/dark 캡처                                     |
| 이미지 직접 검토                                                    | 통과 | light/dark PNG 총 4장, node·label·카드 잘림과 큰 화면 균형                                    |

첫 문서 전체 검사에서는 새 학습 링크 때문에 번역판의 문서 링크 일치 규칙이 실패했다. 원본 검사 규칙을 바꾸지 않고 모든 언어 README에 동일한 학습 링크 두 개를 연결한 뒤 다시 통과했다. 한국어판에만 IL2CPP·Godot PCK의 누락 행과 대조 기록을 추가했다.

## 재현 범위와 제한

실습은 공개 CLI를 사용해 실제 worker·파일 읽기·Evidence 경로를 실행했다. 대상은 직접 만든 텍스트 파일이며 대상 앱은 실행하지 않았다. 기록한 수치는 이 fixture의 결과다. `statistics.modules`는 JavaScript 파일 수로 해석하지 않는다. 실습에서는 원본 반환값을 `reported_modules`로 구분해 보여 준다.

재귀 submodule update는 완료했다. Unblob의 Windows 비호환 테스트 경로 때문에 그 하위 checkout만 `tests/` 제외 sparse checkout을 사용했다. 원본 gitlink는 고정 revision을 그대로 유지한다. Firmware 분석이나 Unblob 테스트 전체를 실행한 것은 아니다.

공식 npm tarball은 Windows addon·manifest 복원에만 사용했다. 빌드·실습은 이 checkout 소스에서 만들었다. 바이너리, dist, node_modules, generated catalog, toolchain 다운로드 파일은 커밋하지 않는다. 이 파일은 provider 전체 검증이나 성능 향상을 주장하지 않는다.

실제 MCP 클라이언트 등록·도구 호출, 원격 HTTP MCP, Hopper/Ghidra/IDA/JEB/JADX, firmware·네트워크·브라우저·runtime 관찰, 취소·정리 실패 전체 회귀, 전체 테스트 모음은 미검증이다. 분석 시간·토큰·CPU·메모리 비교도 측정하지 않았다.

[학습 목차](README.md) · [구조도 receipt와 해시](../docs/archify/README.md)

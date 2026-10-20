/** 목표: 호출자가 선택한 소스 범위와 실패를 Evidence의 일부로 해석한다.
 * 실행: node guide/examples/03_advanced.mjs
 * 기대: preload.cjs 선택 유지, 미선택 파일 존재, 없는 경로는 성공 Evidence가 아님.
 * 선택하지 않은 의존성을 자동으로 읽었다고 추정하지 않는다.
 */
import assert from "node:assert/strict";
import { analyze, invokeAnalysis, withFixture } from "./support.mjs";

await withFixture(async (root) => {
  const selected = analyze(root, ["--source-path", "preload.cjs"]);
  const result = selected.normalized_result;
  assert.deepEqual(result.source_selection.requested_paths, ["preload.cjs"]);
  assert.ok(result.source_selection.unselected_files > 0);
  const missing = invokeAnalysis(root, ["--source-path", "not-present.cjs"]);
  assert.notEqual(missing.value.operation, "analyze_javascript_application");
  assert.equal(missing.value.normalized_result, undefined);
  console.log(
    JSON.stringify(
      {
        source_selection: result.source_selection,
        limitations: selected.limitations,
        invalid_selection_exit: missing.status,
        invalid_selection_code: missing.value.code ?? missing.value.error,
      },
      null,
      2,
    ),
  );
});

// 과제: --source-path를 여러 번 전달해 명시적 선택 순서와 분석 범위를 비교한다.

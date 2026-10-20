/** 목표: 실제 공개 CLI로 파일·모듈 그래프와 Evidence를 읽는다.
 * 실행: node guide/examples/01_foundations.mjs
 * 기대: operation, confidence=derived, 모듈/노드 수, 실행 표시 없음.
 * 별도 분석 엔진이나 Electron 설치는 필요 없다. 대상 코드를 실행하지 않는다.
 */
import assert from "node:assert/strict";
import { analyze, withFixture } from "./support.mjs";

await withFixture(async (root) => {
  const evidence = analyze(root);
  const result = evidence.normalized_result;
  assert.equal(result.format, "directory");
  assert.ok(result.graph.nodes.length > 0);
  assert.match(evidence.evidence_id, /^ev_[a-f0-9]{64}$/);
  console.log(
    JSON.stringify(
      {
        operation: evidence.operation,
        confidence: evidence.confidence,
        parsed_javascript_files: result.statistics.parsed_javascript_files,
        reported_modules: result.statistics.modules,
        graph_nodes: result.graph.nodes.length,
        graph_edges: result.graph.edges.length,
        target_executed: false,
      },
      null,
      2,
    ),
  );
});

// 과제: package.json의 main을 바꾸고 entrypoint 관찰이 어떻게 달라지는지 비교한다.

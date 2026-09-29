import test from "node:test";import assert from "node:assert/strict";import {runJob} from "../src/job-runner.mjs";
test("rejects unsupported runner",async()=>{await assert.rejects(()=>runJob({runner:"bad"},{timeoutMs:1000}),/Unsupported runner/)});

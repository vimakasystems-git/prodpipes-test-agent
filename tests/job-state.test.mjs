import test from "node:test";import assert from "node:assert/strict";import {JobState,retryDelayMs} from "../src/job-state.mjs";
test("deduplicates running and terminal jobs",()=>{const s=new JobState();assert.equal(s.begin({id:"1"}).accepted,true);assert.equal(s.begin({id:"1"}).accepted,false);s.finish("1","completed");assert.equal(s.begin({id:"1"}).accepted,false)});
test("retry backoff is bounded",()=>{assert.equal(retryDelayMs(1),1000);assert.equal(retryDelayMs(2),2000);assert.equal(retryDelayMs(99),30000)});

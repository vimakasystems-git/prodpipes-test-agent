import test from "node:test";import assert from "node:assert/strict";import {validateJob} from "../src/protocol.mjs";
const valid=()=>({id:"j1",protocolVersion:"1",runner:"android",command:"smoke",leaseExpiresAt:new Date(Date.now()+60000).toISOString(),artifact:"app.apk"});
test("accepts valid typed job",()=>assert.equal(validateJob(valid()).id,"j1"));
test("rejects expired lease",()=>assert.throws(()=>validateJob({...valid(),leaseExpiresAt:new Date(0).toISOString()}),/expired/));
test("rejects arbitrary command",()=>assert.throws(()=>validateJob({...valid(),command:"shell"}),/Unsupported command/));
test("rejects unknown runner",()=>assert.throws(()=>validateJob({...valid(),runner:"anything"}),/Unsupported runner/));

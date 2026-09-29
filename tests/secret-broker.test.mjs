import test from "node:test";
import assert from "node:assert/strict";
import {SecretBroker} from "../src/secret-broker.mjs";

test("temporary secret is shown once and stored as metadata only",()=>{
  const broker=new SecretBroker();
  const issued=broker.issue({integration:"cerebrobrasil",target:"odontologic",scopes:["api","mcp"],ttlSeconds:120,maxUses:2});
  assert.match(issued.secret,/^vtmp_/);
  const listed=broker.list();
  assert.equal(listed.length,1);
  assert.equal("secret" in listed[0],false);
});

test("scopes and use limits are enforced",()=>{
  const broker=new SecretBroker();
  const issued=broker.issue({scopes:["api"],ttlSeconds:120,maxUses:1});
  assert.ok(broker.authorize(issued.secret,"api"));
  assert.equal(broker.authorize(issued.secret,"api"),null);
  const other=broker.issue({scopes:["api"],ttlSeconds:120,maxUses:2});
  assert.equal(broker.authorize(other.secret,"mcp"),null);
});

test("revoked temporary secret is rejected",()=>{
  const broker=new SecretBroker();
  const issued=broker.issue({scopes:["*"],ttlSeconds:120,maxUses:5});
  assert.equal(broker.revoke(issued.id),true);
  assert.equal(broker.authorize(issued.secret,"mcp"),null);
});

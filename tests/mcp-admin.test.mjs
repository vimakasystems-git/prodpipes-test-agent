import test from "node:test";
import assert from "node:assert/strict";
import {createMcpServer} from "../src/mcp-server.mjs";

test("admin can issue a temporary MCP secret without persisting plaintext",async()=>{
  const app=createMcpServer({port:0,host:"127.0.0.1",token:"mcp-master",adminToken:"admin-master"});
  const server=await app.start();
  const address=server.address();
  const base=`http://127.0.0.1:${address.port}`;
  try{
    const unauth=await fetch(`${base}/api/admin/integrations`);
    assert.equal(unauth.status,401);

    const issuedResponse=await fetch(`${base}/api/admin/secrets/generate`,{
      method:"POST",
      headers:{"authorization":"Bearer admin-master","content-type":"application/json"},
      body:JSON.stringify({integration:"cerebrobrasil",target:"odontologic",scopes:["mcp"],ttlSeconds:120,maxUses:2})
    });
    assert.equal(issuedResponse.status,201);
    const issued=await issuedResponse.json();
    assert.match(issued.secret,/^vtmp_/);

    const listed=await fetch(`${base}/api/admin/secrets`,{headers:{"authorization":"Bearer admin-master"}}).then(r=>r.json());
    assert.equal(listed.items.length,1);
    assert.equal("secret" in listed.items[0],false);

    const mcp=await fetch(`${base}/mcp`,{
      method:"POST",
      headers:{"authorization":`Bearer ${issued.secret}`,"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})
    });
    assert.equal(mcp.status,200);
    const payload=await mcp.json();
    assert.equal(payload.result.tools.some(tool=>tool.name==="agent_capabilities"),true);
  }finally{
    await app.stop();
  }
});

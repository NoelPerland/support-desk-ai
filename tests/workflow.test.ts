import {test} from "node:test";
import assert from "node:assert/strict";
import {actionStatus,csvCell,exportCsv,isOverdue,validateResult,type RecordItem} from "../lib/domain";
test("action status stays compatible with completed older records",()=>{
 assert.equal(actionStatus({task:"Ship",owner:"Maya",due:"Friday",done:true}),"Done");
 assert.equal(actionStatus({task:"Ship",owner:"Maya",due:"Friday",done:false,status:"In progress"}),"In progress");
});
test("CSV quotes fields and neutralises spreadsheet formulas",()=>{
 assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
 const record:RecordItem={id:"x",kind:"meeting-notes",source:"notes",state:"Open",created_at:"2026-10-30",result:{title:"Review",summary:"Review",decisions:[],questions:[],actions:[{task:"=A1",owner:"Maya, Leo",due:"Friday",done:false,status:"In progress"}]}};
 assert.match(exportCsv([record]),/"'\=A1","Maya, Leo","Friday","In progress"/);
});
test("overdue needs an explicit date; relative dates are never guessed",()=>{
 const now=new Date("2026-10-30T12:00:00Z");
 assert.equal(isOverdue("Friday",now),false);assert.equal(isOverdue("2026-10-29",now),true);assert.equal(isOverdue("2026-10-30",now),false);
});
test("invalid progress and domain mismatches are rejected",()=>{
 assert.throws(()=>validateResult("meeting-notes",{title:"Review",summary:"Review",decisions:[],questions:[],actions:[{task:"Ship",owner:"Maya",due:"Friday",done:false,status:"Maybe"}]}));
});

const Agenda = require("agenda");

const agenda = new Agenda({
  db: { address: process.env.DB_URI, collection: "agendaJobs" },
  processEvery: "30 seconds", 
});

module.exports = agenda;


require("../jobs/subscriptionJobs.js");

(async function () {
  await agenda.start();
  console.log("✅ Agenda started successfully");

  agenda.on("start", (job) => console.log(`🟢 Job started: ${job.attrs.name}`));
  agenda.on("success", (job) => console.log(`✅ Job finished: ${job.attrs.name}`));
  agenda.on("fail", (err, job) => console.log(`❌ Job failed: ${job.attrs.name}`, err));
})();

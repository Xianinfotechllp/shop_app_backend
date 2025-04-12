const app = require('./app');
const http = require("http");
const subscriptionJob = require("./jobs/subscriptionJobs")  ;

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

//cron Job
require("./jobs/subscriptionJobs.js");

server.listen(PORT,()=>{
    console.log(`Server running @ PORT:${PORT}`)
})
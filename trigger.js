import http from 'http';

const payload = JSON.stringify({
  error: {
    name: "TypeError",
    message: "Calculated negative total",
    stack: "Error: Calculated negative total\n at calculateDiscount (sample-target/src/app.js:5:10)"
  },
  targetRepoPath: "./sample-target"
});

const req = http.request("http://localhost:3000/webhook/crash", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  }
}, (res) => {
  res.pipe(process.stdout);
});

req.write(payload);
req.end();
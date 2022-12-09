#!/usr/bin/env node

const minimist = require("minimist");
const { exec: execCallback, spawn, execSync } = require("child_process");
const Encoding = require("encoding-japanese");
const table = require("table");
const toStr = (mat) => Encoding.convert(mat, { from: "SJIS", to: "UNICODE", type: "string" });
const exec = (command) => {
  return new Promise((resolve, reject) => {
    execCallback(command, { encoding: "Shift_JIS" }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: toStr(stdout), stderr: toStr(stderr) });
      }
    });
  });
}

if (process.platform !== "win32") {
  throw new Error("This module only works on Windows");
}

const args = minimist(process.argv.slice(2));

const state = {
  1: "STOPPED",
  2: "START_PENDING",
  3: "STOP_PENDING",
  4: "RUNNING",
  5: "CONTINUE_PENDING",
  6: "PAUSE_PENDING",
  7: "PAUSED",
};

const checkAdmin = () => {
  try {
    execSync("net session", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
};

(async () => {

  if (args.help) {
    console.log(`Usage: ${process.argv[1]} [options] [command]`);
  } 
  else 
  if (args._.length === 0 || args._[0] === "list-units") {
    const { stdout } = await exec("sc queryex type=service state=all");
    const split = stdout.split(/(\r\n|\n)(\r\n|\n)/).filter((v) => v !== "\r\n" && v !== "\n");
 //   console.log(split);
    const services = split.map((v) => {
      const [name, displayName] = v.match(/SERVICE_NAME:\s+(.+)\r\nDISPLAY_NAME:\s+(.+)\r\n/).slice(1);
      const [state] = v.match(/STATE\s+:\s+(\d+)\s/).slice(1);
      const [pid] = v.match(/PID\s+:\s+(\d+)\s/).slice(1);
      return { name, displayName, state, pid };
    });
    console.log(table.table(services.map((v) => [v.name, v.displayName, state[v.state], v.pid])));
  }
  else
  if (args._[0] === "start") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    for (const svc of args._.slice(1)) {
      const spw = spawn("net", ["start", svc], { encoding: "Shift_JIS" });
      spw.stdout.on("data", (data) => {
        console.log(toStr(data));
      });
      spw.stderr.on("data", (data) => {
        console.log(toStr(data));
      });
    }
  }
  else
  if (args._[0] === "stop") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    for (const svc of args._.slice(1)) {
      const spw = spawn("net", ["stop", svc], { encoding: "Shift_JIS" });
      spw.stdout.on("data", (data) => {
        console.log(toStr(data));
      });
      spw.stderr.on("data", (data) => {
        console.log(toStr(data));
      });
    }
  }
  else
  if (args._[0] === "restart") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    for (const svc of args._.slice(1)) {
      const spw = spawn("net", ["stop", svc], { encoding: "Shift_JIS" });
      spw.stdout.on("data", (data) => {
        console.log(toStr(data));
      });
      spw.stderr.on("data", (data) => {
        console.log(toStr(data));
      });
      spw.on("close", (code) => {
        if (code === 0) {
          const spw = spawn("net", ["start", svc], { encoding: "Shift_JIS" });
          spw.stdout.on("data", (data) => {
            console.log(toStr(data));
          });
          spw.stderr.on("data", (data) => {
            console.log(toStr(data));
          });
        }
      });
    }
  }
  else
  if (args._[0] === "status") {
    const { stdout } = await exec(`sc query ${args._[1]}`);
//    const [state] = stdout.match(/STATE\s+:\s+(\d+)\s/).slice(1);
    console.log(stdout);
  }
  else
  if (args._[0] === "enable") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    const { stdout } = await exec(`sc config ${args._[1]} start=auto`);
    console.log(stdout);
  }
  else
  if (args._[0] === "disable") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    const { stdout } = await exec(`sc config ${args._[1]} start=disabled`);
    console.log(stdout);
  }
  else
  if (args._[0] === "pause") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    const { stdout } = await exec(`sc pause ${args._[1]}`);
    console.log(stdout);
  }
  else
  if (args._[0] === "continue") {
    if (!checkAdmin()) {
      console.error("You need to run this command as administrator");
      return;
    }
    const { stdout } = await exec(`sc continue ${args._[1]}`);
    console.log(stdout);
  }
})();
const fs = require('fs')
const child_process = require("child_process");
const { async } = require('hasbin');
const yaml = require("js-yaml");
const chalk = require('chalk');

const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');

let green = false;
let blue = false;
let green_ip;
let blue_ip;
let ips = []

exports.command = 'deploy <inventory_file> <build_job> <build_config_dir>';
exports.desc = 'Execute Build jobs in a virtual environment';
exports.builder = yargs => {
    yargs.options({});
};

async function createSSHCommand(ip) {
    if(ip!=undefined) {
        let cmd = `ssh -i ssh -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@${ip} `;
        return cmd;
    }
}

async function fetchIps(inventory_file) {
    let ips_data = fs.readFileSync(inventory_file, { encoding: "utf8", flag: "r" });
    ips_data = ips_data.split("\n")
    green_ip = ips_data[0].split("=")[1]
    blue_ip = ips_data[1].split("=")[1]
    if(green) {
        ips.push(green_ip)
    }
    if(blue){
        ips.push(blue_ip)
    }
}

async function pullArtifact(artifact, processor) {
    let sshExe;
    let privateKeyPath;
    try {
        if (processor == "Arm64") {
            const vminfo = yaml.load(fs.readFileSync('ssh-config.txt', "utf8"));
            let arr = vminfo.split(" ");
            let ip = arr[3];
            sshExe = `ssh -i "~/Library/Application Support/basicvm/key" -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@${ip} `;
            privateKeyPath = "shared/cwd/ssh"
        } else {
            sshExe = fs.readFileSync("ssh-config.txt", "utf8").split(/\r?\n/)[0];
            let HostKeyCheckDisableCmd = "-o UserKnownHostsFile=/dev/null ";
            sshExe = sshExe + " " + HostKeyCheckDisableCmd;
            privateKeyPath = "/bakerx/ssh";
        }
        console.log(sshExe);
        await child_process.execSync(`${sshExe} \"pwd &"`, { stdio: "inherit" })
    } catch (e) {
        throw Error("Please build the application using pipeline build or node index.js build command.")
    }

    for (let env_ip of ips)
        await child_process.execSync(`${sshExe} \"sudo scp -i ${privateKeyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null releases/${artifact} root@${env_ip}:/root/artifacts/\"`, { stdio: "inherit" })

}

async function createArtifactsFolder(ssh_cmds) {
    for (let sshExe of ssh_cmds)
        await child_process.execSync(sshExe + `mkdir -p artifacts`, { stdio: "inherit" })
}

exports.handler = async(argv) => {
    const { inventory_file, build_job, build_config_dir, processor } = argv;
    console.log("Starting deploy job : " + build_job);

    const doc = yaml.load(fs.readFileSync(build_config_dir, "utf8"));

    let build_job_steps;
    doc.jobs.filter(job => {
        if (job.name == build_job) {
            build_job_steps = job;
        }
    })
    if (typeof build_job_steps == 'undefined') {
        throw Error('Illegal name of build job');
    }

    const artifact = build_job_steps.jar;
    const context = build_job_steps.context;
    const port = build_job_steps.port;
    const url = build_job_steps.url;
    const servers = build_job_steps.servers;
    green = servers.includes("GREEN");
    blue = servers.includes("BLUE");

    await fetchIps(inventory_file)
    if(green)
        console.log("Green=", green_ip)
    if(blue)
        console.log("Blue=", blue_ip)

    let green_ssh_cmd = await createSSHCommand(green_ip)
    let blue_ssh_cmd = await createSSHCommand(blue_ip)

    for (let cmd of doc.setup) {
        if(green) {
            try {
                console.log(chalk.green(green_ssh_cmd + `\"${cmd}\"`));
                await child_process.execSync(green_ssh_cmd + `\"${cmd}\"`, {
                    stdio: "inherit"
                });
            } catch (err) {
                console.log("ERROR in GREEN:",chalk.red(err.message));
            }
        }
        if (blue) {
            try {
                console.log(chalk.green(blue_ssh_cmd + `\"${cmd}\"`));
                await child_process.execSync(blue_ssh_cmd + `\"${cmd}\"`, {
                    stdio: "inherit"
                });
            } catch (err) {
                console.log("ERROR in BLUE:", chalk.red(err.message));
            }
        }
    }
    let ssh_cmds = [];
    if(green){
        ssh_cmds.push(green_ssh_cmd);
    }
    if(blue){
        ssh_cmds.push(blue_ssh_cmd);
    }
    await createArtifactsFolder(ssh_cmds)
    await pullArtifact(artifact, processor)

    for (let step of build_job_steps.steps) {
        try {
            if ('run' in step) {
                for (let sshExe of ssh_cmds) {
                    let cmd = step.run;
                    console.log(chalk.green(step.name + " : " + sshExe + `\"${cmd}\"`));
                    await child_process.execSync(sshExe + `\"${cmd}\" &`, {
                        stdio: "inherit"
                    });
                }
            }
        } catch (err) {
            console.log(chalk.red(err.message));
        }
    }
    let green_deployed = false;
    let blue_deployed = false;
    if (green) {
        green_deployed = await checkIfRunning(green_ssh_cmd,green_ip, "GREEN")
    }
    if (blue) {
        blue_deployed = await checkIfRunning(blue_ssh_cmd,blue_ip, "BLUE")
    }

    async function checkIfRunning(ssh_cmd, ip, name) {

        let counter = 1;
        let deployed = false;
        while (1) {
            try {
                let a = await child_process.execSync(ssh_cmd+`\"lsof -i tcp:8080\"`);
                console.log(a)
                console.log(`Application started on ${name} @ ${ip}`);
                deployed=true;
                break;
            } catch {
                console.log(`Waiting for applications to start ... Attempt : ${counter}`)
                counter++;
                await new Promise(resolve => setTimeout(resolve, 15000));
                if (counter > 5)
                    break;
            }
        }
        return deployed;
    }
    if(green_deployed || blue_deployed){
        console.log(chalk.green("DEPLOYMENT SUCCESSFUL"))
    }
    else{
        console.log(chalk.green("DEPLOYMENT FAILED"))
        return;
    }
    await run(green_ip, blue_ip,context,port,url)
}

let GREEN;
let BLUE;

class Production {
    constructor() {
        this.TARGET = GREEN;
        this.attempt = 0;
        setInterval(this.healthCheck.bind(this), 5000);
    }

    // TASK 1: 
    proxy() {
        let options = {};
        let proxy = httpProxy.createProxyServer(options);
        let self = this;
        // Redirect requests to the active TARGET (BLUE or GREEN)
        let server = http.createServer(function(req, res) {
            // callback for redirecting requests.
        });
        server.listen(8080);
    }

    async failover() {
        console.log(`Switching from GREEN to BLUE SERVER`)
        this.TARGET = BLUE;

    }

    async healthCheck() {
        try {
            if(this.attempt>4){
                console.log("Attempted both servers. Both are down.")
                process.exit(1);
            }
            if(this.TARGET == "BLUE"){
                try {
                    const response = await got("GREEN", {throwHttpErrors: false});
                    if(response.statusCode==200){
                        this.TARGET="GREEN";
                    }
                } catch (e) {
                    console.log("GREEN is still not up.");
                }
            }

            const response = await got(this.TARGET, { throwHttpErrors: false });
            let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);
            if (this.TARGET == GREEN && response.statusCode == 500) {
                    await this.failover(this.TARGET)


            }
            console.log(chalk `{grey Health check on ${this.TARGET}}: ${status}`);
        } catch (error) {
            console.log(error);
            this.attempt++;
            await this.failover(this.TARGET)
        }
    }

}

async function run(green_ip, blue_ip, context, port, url) {
    GREEN = `http://${green_ip}:${port}/${context}/${url}`;
    BLUE = `http://${blue_ip}:${port}/${context}/${url}`;
    console.log(chalk.green('Starting proxy on localhost:8080'));
    let prod = new Production();
    await prod.proxy();
}
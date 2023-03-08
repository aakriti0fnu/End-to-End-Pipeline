const chalk = require('chalk');
const pathUtil = require("path");
const yaml = require("js-yaml");

const fs = require("fs");
const child_process = require("child_process");

var sshExe;

exports.command = 'build <build_job> <build_config_dir>';
exports.desc = 'Execute Build jobs in a virtual environment';

exports.builder = yargs => {
    yargs.options({});
};


exports.handler = async argv => {
    const { build_job, build_config_dir, processor } = argv;
    console.log("Build Job name: ", build_job);
    console.log("Build YAML dir: ", build_config_dir);
    console.log(chalk.green("Configuring the build server..."));

    if (processor == "Arm64") {
        const vminfo = yaml.load(fs.readFileSync('ssh-config.txt', "utf8"));
        arr = vminfo.split(" ");
        ip = arr[3];
        sshExe = `ssh -i "~/Library/Application Support/basicvm/key" -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@${ip} `;
        cleanup = yaml.load(fs.readFileSync('arm-cleanup.yml', "utf8"));
        for (cmd of cleanup.clean) {
            try {
                console.log(chalk.green(sshExe + `\"${cmd}\"`));
                await child_process.execSync(sshExe + `\"${cmd}\"`, {
                    stdio: "inherit"
                });
            } catch (err) {

                console.log(chalk.red(err.message));
            }
        }
    } else {
        sshExe = fs.readFileSync("ssh-config.txt", "utf8").split(/\r?\n/)[0];
        HostKeyCheckDisableCmd = "-o UserKnownHostsFile=/dev/null ";
        sshExe = sshExe + " " + HostKeyCheckDisableCmd;
    }


    try {
        console.log("Starting build job : " + build_job);
        const doc = yaml.load(fs.readFileSync(build_config_dir, "utf8"));
        console.log(doc);

        for (cmd of doc.setup) {
            try {
                console.log(chalk.green(sshExe + `\"${cmd}\"`));
                await child_process.execSync(sshExe + `\"${cmd}\"`, {
                    stdio: "inherit"
                });
            } catch (err) {
                console.log(chalk.red(err.message));
            }
        }
        let build_job_steps;
        doc.jobs.filter(job => {
            if (job.name == build_job) {
                build_job_steps = job;
            }
        })
        if (typeof build_job_steps == 'undefined') {
            throw 'Illegal name of build job';
        }
        // if("iterations" in build_job_steps){
        const iterations = build_job_steps.iterations;
        const snapshots = build_job_steps.snapshots;
        // }
        for (step of build_job_steps.steps) {
            try {
                if ('run' in step) {
                    cmd = step.run;
                    console.log(chalk.green(step.name + " : " + sshExe + `\"${cmd}\"`));
                    await child_process.execSync(sshExe + `\"${cmd}\"`, {
                        stdio: "inherit"
                    });
                } else if ('script' in step) {
                    const script = step.script;
                    let node_command;
                    if (processor == "Arm64") {
                        node_command = `node shared/cwd/lib/${script}`;
                    } else {
                        node_command = `node /bakerx/lib/${script}`;
                    }

                    if ('args' in step) {
                        for (arg of step.args) {
                            arg_val = eval(arg);
                            node_command = node_command + ` ${arg_val}`;
                        }
                    }
                    chalk.green(step.name + " : " + sshExe + `\"${node_command}\"`)
                        //console.log(node_command);
                    await child_process.execSync(sshExe + `\"${node_command}\"`, {
                        stdio: "inherit"
                    });
                     console.log(chalk.greenBright("BUILD SUCCESS"))
                }
            } catch (err) {
                // console.log(chalk.red(err.message));
            }
        }

        cmd = "rm -rf workspace";
        


        await child_process.execSync(sshExe + `\"${cmd}\"`, {
            stdio: "inherit"
        });
         
    } catch (e) {
        console.log(chalk.red("Exception occurred : ", e))
        console.log(chalk.red("BUILD FAILED"));
    }
};
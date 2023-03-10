const chalk = require('chalk');
const path = require('path');
const fs = require('fs')
const child_process = require("child_process")
const yaml = require("js-yaml");

exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({});
};


exports.handler = async(argv) => {
    const { processor } = argv
    let sshCmd = "";
    let sshCmd1 = "";
    let sshCmd2 = "";
    if (processor == "Arm64") {
        console.log(chalk.green("Arm64 processor : proceeding with basic VM"))
        console.log("Checking for image ...");
        try {
            let userPath = require('os').homedir();
            if (fs.existsSync(`${userPath}/.basicvm/baseImages/ubuntu/focal`)) {
                console.log("Focal Image exists. Skipping to VM start process...")
            } else {
                console.log("Focal Image does not exist. Pulling now ...")
                await child_process.execSync(`vm pull ubuntu:focal`, {
                    stdio: "inherit"
                })
            }
        } catch (e) {
            console.log("An error occurred.")
        }
        sshCmd1 = `vm start build-server ubuntu:focal -m 5`
        sshCmd2 = `vm ssh-config build-server > ssh-config.txt`
    } else {

        let userPath = require('os').homedir();
        if (fs.existsSync(`${userPath}/.bakerx/.persist/images/focal`)) {
            console.log("Focal Image exists. Skipping to VM start process...")
        } else {
            console.log("Focal Image does not exist. Pulling now ...")
            await child_process.execSync(`bakerx pull focal cloud-images.ubuntu.com`, {
                stdio: "inherit"
            })
        }

        console.log(chalk.green("Intel/Amd64 processor : proceeding with bakerx"))
        sshCmd1 = `bakerx run build-server focal -m 5120 --ip 192.168.56.10 --sync && rm -f ssh-config.txt`
        sshCmd2 = `bakerx ssh-info build-server >> ssh-config.txt`
    }

    console.log(chalk.green("Preparing computing environment..."))
    await child_process.execSync(sshCmd1, {
        stdio: "inherit"
    })
    await child_process.execSync(sshCmd2, {
        stdio: "inherit"
    })
    const data = yaml.load(fs.readFileSync("ssh-config.txt", "utf8"))
    lines = data.split(/\r?\n/);
    let hostKeyCheckDisableCmd = "-o UserKnownHostsFile=/dev/null";
    var addEnvVariables;
    if (processor == "Arm64") {
        var info = data.split(" ")
        sshExe = `ssh -i "~/Library/Application Support/basicvm/key" -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@${info[3]} `
        checkIfSharedExists = sshExe + `"./checkshared"`;
        copyScript = `scp -i "~/Library/Application Support/basicvm/key" -o StrictHostKeyChecking=no checkshared ubuntu@${info[3]}:/home/ubuntu/`
        await child_process.execSync(copyScript, {
            stdio: "ignore",
            stdout: "inherit"
        })
        await child_process.execSync(checkIfSharedExists, {
            stdio: "inherit",
            stdout: "inherit"
        })

        // addEnvVariables = sshExe + `\"sudo cat shared/cwd/.env | sudo tee -a /etc/environment\"`
        // disableAptUpgrade = sshExe + `\"sudo cat shared/cwd/disable-apt | sudo tee -a /etc/apt/apt.conf.d/20auto-upgrades\"`
        // await child_process.execSync(disableAptUpgrade, {
        //     stdio: "ignore",
        //     stdout: "inherit"
        // })

        // disableAptUpgrade = sshExe + `\"sudo apt remove --purge -y unattended-upgrades\"`
    } else {
        addEnvVariables = lines[0] + " " + hostKeyCheckDisableCmd + ` "sudo cat /bakerx/.env | sudo tee -a /etc/environment"`;
        console.log(addEnvVariables);
        addconf = lines[0] + " " +  hostKeyCheckDisableCmd + ` "sudo cat /bakerx/ifconfig.txt | sudo tee -a /etc/network/interfaces"`
        await child_process.execSync(addEnvVariables, {

            stdio: "ignore"
        })
        await child_process.execSync(addconf, {
          stdio: "ignore",
        })
    }


};
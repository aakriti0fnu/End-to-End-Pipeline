const axios = require("axios")
const chalk = require("chalk")
const os = require("os")
const child_process = require("child_process")
const fs = require('fs')
const { async } = require("hasbin")

exports.command = "prod up"
exports.desc = "Provision cloud instances on droplet"

exports.builder = (yargs) => {
    yargs.options({})
}

exports.handler = async(argv) => {
    const { processor } = argv
    await provision();
}


const token = fs.readFileSync("./.env", { encoding: "utf8", flag: "r" })
var access_token = token.split(/\r?\n/)
console.log("Digital Ocean Token:",access_token[0]);
var dtoken = access_token[0].split('=')[1]
const NCSU_Token = dtoken.replaceAll("\"", "")

// console.log(NCSU_Token)

var config = {}
    // Retrieve our api token from the environment variables.
config.token = NCSU_Token;

//console.log(config.token);

if (!config.token) {
    console.log(chalk `{red.bold NCSU_Token is not defined!}`)
    console.log(`Please set your environment variables with appropriate token.`)
    console.log(
        chalk `{italic You may need to refresh your shell in order for your changes to take place.}`
    )
    process.exit(1)
}

console.log(chalk.green(`Your token is: ${config.token.substring(0, 4)}...`))

// Configure our headers to use our token when making REST api requests.
const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + config.token,
}

//console.log(headers);

class DigitalOceanProvider {

    async createDroplet(dropletName, region, imageName, ssh_fingerprint) {
        if (dropletName == "" || region == "" || imageName == "" || ssh_fingerprint == "") {
            console.log(chalk.red("You must provide non-empty parameters for createDroplet!"))
            return;
        }

        let data = {
            name: dropletName,
            region: region,
            size: "s-2vcpu-4gb",
            image: imageName,
            ssh_keys: [ssh_fingerprint],
            backups: false,
            ipv6: false
        }

        // console.log("Attempting to create: " + JSON.stringify(data))

        let response = await axios
            .post("https://api.digitalocean.com/v2/droplets", data, {
                headers: headers,
            })
            .catch((err) => console.error(chalk.red(`createDroplet: ${err}`)))

        if (!response) return

        // console.log(response.status)
        // console.log(JSON.stringify(response.data))

        if (response.status == 202) {
            console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`))
            let dropletID = response.data.droplet.id
            return dropletID;
        }
    }
    async dropletInfo(id) {
        if (typeof id != "number") {
            // console.log(chalk.red("You must provide an integer id for your droplet!"))
            return
        }

        // Make REST request
        console.log("Waiting for droplet to get ready ...");
        let response = await axios.get(
            `https://api.digitalocean.com/v2/droplets/${id}`, { headers: headers }
        )

        if (!response) return

        if (response.data.droplet) {
            // console.log(JSON.stringify(response.data))
            let droplet = response.data.droplet
            var addr = droplet.networks.v4[0]
            if (addr == undefined) {
                await new Promise(r => setTimeout(r, 2000));
                droplet = await this.dropletInfo(id)
            }
            return droplet.networks.v4[0].ip_address;
        }
    }
};

async function createSSHKey() {
    await child_process.execSync(`yes y | ssh-keygen -t rsa -f "ssh" -q -N ""`, { stdio: "inherit" });
    let ssh_key = fs.readFileSync("ssh.pub", { encoding: "utf8", flag: "r" });
    data = {
        public_key: ssh_key,
        name: "DevOps_M3"
    }
    let ssh_info = await axios
        .post("https://api.digitalocean.com/v2/account/keys", data, {
            headers: headers,
        })
        .catch((err) => console.error(chalk.red(`createDroplet: ${err}`)))
    return ssh_info;
}

async function saveDropletIPs(ip) {
    fs.writeFileSync(`inventory.txt`, `GREEN=${ip[0]}\n`, err => {

        if (err) {
            console.error(err)
        }
    })
    fs.appendFile(`inventory.txt`, `BLUE=${ip[1]}`, err => {

        if (err) {
            console.error(err)
        }
    })
}

async function provision() {
    let client = new DigitalOceanProvider()
    let ssh_info = await createSSHKey();
    console.log(ssh_info)
    let ssh_id = ssh_info.data.ssh_key.id;
    let ssh_fingerprint = ssh_info.data.ssh_key.fingerprint;
    //console.log(ssh_id, " ", ssh_fingerprint)
    let name = "GREEN"
    let region = "nyc1" // Fill one in from #1
    let image = "ubuntu-20-04-x64" // Fill one in from #2
    console.log("Provisioning Green instance ...");
    let green_droplet_id = await client.createDroplet(name, region, image, ssh_fingerprint)
    let green_droplet_ip = await client.dropletInfo(green_droplet_id, name)
    console.log("Provisioning Blue instance ...");
    name = "BLUE"
    let blue_droplet_id = await client.createDroplet(name, region, image, ssh_fingerprint)
    let blue_droplet_ip = await client.dropletInfo(blue_droplet_id, name)
        // let ssh_blue = await createSSHCommand(blue_droplet_ip);
        // let ssh_green = await createSSHCommand(green_droplet_ip);
        // console.log(ssh_blue);
        // await child_process.execSync(ssh_blue+` ls`,{stdio:"inherit"})
        // console.log(ssh_green);
        // await child_process.execSync(ssh_green+` ls`,{stdio:"inherit"})

    await saveDropletIPs([green_droplet_ip, blue_droplet_ip]);
    console.log(`GREEN created with ${green_droplet_ip}`);
    console.log(`BLUE created with ${blue_droplet_ip}`);
}
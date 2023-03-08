const puppeteer = require('puppeteer');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = { tokens: true, tolerant: true, loc: true, range: true }
const chalk = require("chalk");
const child_proc = require('child_process');
const { ClassBody } = require('esprima');
const Random = require("random-js");
const { takeBaselineScreenshots, compareScreenshot, screenshot } = require("./Screenshot");
const { mutate } = require("./mutation")

let snapshots;
var proc;
var mutationfunc;


// metrics
let mutation_metrics = {
    same: 0,
    different: 0,
    pixel_diff: 0,
    size_diff: 0,
    compilation_errors: 0,
    mutation_prcentage: 0,
    diff_images: []
};

let shared_dir = "";

(async() => {
    console.log("You are in the Mutation Coverage function")
    const args = process.argv.slice(2)
    args.forEach((val, index) => {
        console.log(`${index}: ${val}`)
    })
    const processor = args[2];
    if (processor == "Arm64") {
        shared_dir = "shared/cwd"
    } else {
        shared_dir = "/bakerx"
    }
    child_proc.execSync(`mkdir -p ${shared_dir}/mutation-screenshots/`, { stdio: "ignore" });
    child_proc.execSync(`mkdir -p ${shared_dir}/baseline-screenshots/`, { stdio: "ignore" });

    if (args.length == 0 || Number(args[0]) == NaN) {
        throw new Error("Incorrect or Missing arguments required")
    }

    const iterations = args[0]
    snapshots = args.slice(1)[0].split(",")
    await takeBaselineScreenshots(snapshots, shared_dir)
    let jsFiles = await getAllJsFiles(process.cwd() + '/workspace/project/');

    try {
        await mutation_testing(iterations, jsFiles, mutation_metrics);
        mutation_metrics.mutation_prcentage = (mutation_metrics.different / (4 * iterations)) * 100;
        const metricStringify = JSON.stringify(mutation_metrics);
        console.log(metricStringify);

        fs.writeFileSync(`${shared_dir}/mutation-metrics.txt`, metricStringify, err => {
            if (err) {
                console.error(err)
            }
        })
    } catch (e) {
        console.log("Error caught,", e);
    }

    process.exit(0);
})()

// Tester

async function mutation_testing(iterations, jsFiles, mutation_metrics) {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: ['--no-sandbox']
    });

    let diffImgs = [];

    for (let i = 0; i < iterations; i++) {

        await mutate(jsFiles, mutation_metrics);

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

        try {
            let screenshotCaptured = false;
            let count = 0;
            while (!screenshotCaptured && count < 3) {
                await delay(3000);
                for (let url of snapshots)
                    screenshotCaptured = await screenshot(url, i, browser, `${shared_dir}/mutation-screenshots/`);
                count++;
                await delay(500);
            }
            await snapshots.forEach((snapshot) => {
                const splitArray = snapshot.split('/');
                const name = splitArray[splitArray.length - 1];
                const baselineImage = `${name}-baseline.png`;
                const mutatedImage = `${name}-${i}.png`;
                const isValidIter = compareScreenshot(`${shared_dir}/baseline-screenshots/${baselineImage}`, `${shared_dir}/mutation-screenshots/${mutatedImage}`, mutation_metrics)
                if (isValidIter === undefined) {
                    i--;
                } else if (isValidIter === true) { // has to be false so correct after testing
                    diffImgs.push(mutatedImage);
                }
            });
            console.log(`Screenshots of Iteration ${i + 1} were captured`);
        } catch (e) {
            console.log(`Screenshots of Iteration ${i + 1} weren't captured`, e);
        }
        try {
            const proc = await child_proc.execSync("git reset --hard", {
                cwd: process.cwd() + "/workspace/project"
            })
            console.log("Repo rest complete");
        } catch (e) {
            throw new Error("Repo reset failed");
        }
    }
    mutation_metrics.diff_images = diffImgs;

    await browser.close();
}

/************
 * Utils *
 ************/

async function getAllJsFiles(dir) {
    let resp = fs.readdirSync(dir);
    let jsFiles = resp.filter(file => {
        return file.split('.').pop() === "js";
    })
    await jsFiles.forEach((file, index) => {
        jsFiles[index] = dir + file;
    });
    for (const file of resp) {
        if (!(file.endsWith('.git') || file.endsWith('node_modules') || file.endsWith('test'))) {
            if (fs.statSync(dir + file).isDirectory()) {
                let subFiles = await getAllJsFiles(dir + file + '/');
                jsFiles = jsFiles.concat(subFiles)
            }
        }
    }
    return jsFiles;
}
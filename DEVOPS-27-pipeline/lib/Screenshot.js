const puppeteer = require("puppeteer")
const PNG = require('pngjs').PNG;
const fs = require('fs');
const pixelmatch = require('pixelmatch');



async function screenshot(url, tag, browser, patha) {
    try {
        console.log(" this screenshot : ", url);

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            args: ['--no-sandbox']
        });
        const splitArray = url.split('/')
        const name = splitArray[splitArray.length - 1]
        const filename = `${name}-${tag}.png`;
        const page = await browser.newPage();
        try {
            await page.goto(url, {
                waitUntil: "networkidle0"
            });
            await page.content
            await page.screenshot({
                path: patha + filename,
                fullPage: true
            });
        } catch (e) {
            console.log("error navigating to url");
            console.log(e);
            throw e;
        } finally {
            await page.close();
            await browser.close();
        }
        return true;

    } catch (e) {
        console.log("Failed to capture screenshots  : ", e);
        return false;
    }
}

async function takeBaselineScreenshots(screenshotsUrls, shared_dir) {

    try {
        for (const url of screenshotsUrls) {
            console.log("This url : ", url)
            const browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                headless: true,
                args: ['--no-sandbox']
            });
            await screenshot(url, 'baseline', browser, `${shared_dir}/baseline-screenshots/`);
            await browser.close();
        }
    } catch (e) {
        console.log("error creating browser")
    }
    console.log("Baseline Screenshots Captured");
    return true;

}


async function compareScreenshot(file1, file2, mutation_metrics) {
    let img1, img2;
    try {
        img1 = await PNG.sync.read(fs.readFileSync(file1));
        img2 = await PNG.sync.read(fs.readFileSync(file2));
    } catch (e) {
        mutation_metrics.compilation_errors++;
        console.log("Failed to fetch the image files", e);
        throw e;
    }

    const { width, height } = img1;
    const diff = new PNG({ width, height });

    try {
        const difference = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 })
            // const difference = subImageMatch(img1, img2, { threshold: 0.1 });
            // fs.writeFileSync(`diff-${file1}`, PNG.sync.write(diff)); // see diff.png for the difference

        // log diff
        if (`${difference}` == 0) { // Why do this?
            mutation_metrics.same++;
            console.log(`${file1} and ${file2} are same.`)
            return true;
        } else {
            mutation_metrics.different++;
            mutation_metrics.pixel_diff++;
            console.log(`${file1} and ${file2} -- ${difference} pixel different`);
            return false;
        }
    } catch (e) {
        if (e.message === "Image sizes do not match.") {
            mutation_metrics.different++;
            mutation_metrics.size_diff++;
            console.log(`${file1} and ${file2} -- sizes are different`);
            return false;
        }
        console.log("Failed to compare the images");
        return undefined;
    }
}

exports.takeBaselineScreenshots = takeBaselineScreenshots;
exports.screenshot = screenshot;
exports.compareScreenshot = compareScreenshot;
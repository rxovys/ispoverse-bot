const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("data.json", "utf8"));

const userid = config.userid;
const apikey = config.apikey;
const walletaddress = config.walletaddress;
const taskIds = config.taskIds;
const cookies = config.cookies;
const xsrfToken = config.xsrfToken;
const delayBetweenTasks = config.delayBetweenTasks || 2000;
const intervalHours = config.intervalHours || 24;
const intervalMs = intervalHours * 60 * 60 * 1000;

async function claimTask(taskid) {
    const url = "https://dashboard.ispolink.com/admin/api/v1/dailytasks/done";
    let form = new FormData();
    form.append("userid", userid);
    form.append("apikey", apikey);
    form.append("walletaddress", walletaddress);
    form.append("taskid", taskid);

    try {
        const response = await axios.post(url, form, {
            headers: {
                "content-type": `multipart/form-data; boundary=${form._boundary}`,
                "cookie": cookies,
                "x-xsrf-token": xsrfToken,
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        console.log(`✅ Berhasil klaim task ${taskid}:`, response.data);
    } catch (error) {
        console.error(`❌ Gagal klaim task ${taskid}:`, error.response ? error.response.data : error.message);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function claimAllTasks() {
    console.log("\n🚀 Mulai klaim semua task...");
    for (const taskid of taskIds) {
        await claimTask(taskid);
        await delay(delayBetweenTasks);
    }
    console.log(`🎉 Semua task selesai!`);
}

function startCountdown(duration) {
    let remaining = duration;
    const countdown = setInterval(() => {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`⏳ Menunggu: ${hours} jam ${minutes} menit ${seconds} detik`);

        remaining--;

        if (remaining < 0) {
            clearInterval(countdown);
            console.log("\n⏰ Waktu habis, menjalankan tugas lagi!");
            claimAllTasks().then(() => startCountdown(intervalMs / 1000));
        }
    }, 1000);
}

console.log(`🔁 Skrip akan berjalan setiap ${intervalHours} jam.`);
claimAllTasks().then(() => startCountdown(intervalMs / 1000));

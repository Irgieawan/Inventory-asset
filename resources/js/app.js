// ambil auth dari firebase.js
import { auth } from "./firebase.js";

// import function firebase
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// 🔐 LOGIN
window.login = function () {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        alert("Isi email & password dulu!");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Login berhasil!");
            window.location.href = "index.html";
        })
        .catch((error) => {
    document.getElementById("error").innerText = error.message;
});
};

// 🛡️ PROTECT HALAMAN
onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname.includes("index.html")) {
        window.location.href = "index_login.html";
    }
});



const urls = {
    pc: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=1252164346&single=true&output=csv",
    
    Oprasional_Laptop: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=1884258302&single=true&output=csv",

    Keseluruhan_Laptop: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=0&single=true&output=csv",

    Printer: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=813621373&single=true&output=csv",

    Kursi: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=976396197&single=true&output=csv",

    Tablet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?gid=1684694910&single=true&output=csv",
};

function loadData(type) {
    fetch(urls[type])
        .then(res => res.text())
        .then(data => {
            displayTable(data);
        });
}

function displayTable(csv) {
    const rows = csv.split("\n").map(row => row.split(","));

    let html = "<table>";

    rows.forEach((row, i) => {
        html += "<tr>";

        row.forEach(cell => {
            if (i === 0) {
                html += `<th>${cell}</th>`;
            } else {
                html += `<td>${cell}</td>`;
            }
        });

        html += "</tr>";
    });

    html += "</table>";

    document.getElementById("table-container").innerHTML = html;
}
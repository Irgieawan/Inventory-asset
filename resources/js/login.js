import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// 🔐 LOGIN FUNCTION
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
      console.log(error.code);
      document.getElementById("error").innerText = error.message;
    });
};

// 🛡️ PROTECT HALAMAN
onAuthStateChanged(auth, (user) => {
  const isLoginPage = window.location.pathname.includes("Index_Login.html") || window.location.pathname.includes("index_login.html");

  if (!user && !isLoginPage) {
    // protect non-login pages: if not authenticated, go to login
    window.location.href = "Index_Login.html";
  }

  // NOTE: intentionally do NOT auto-redirect authenticated users
  // away from the login page. This allows forcing manual login input
  // even if an auth session exists.
});
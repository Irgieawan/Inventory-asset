// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// 🔑 GANTI dengan config Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBWne2vn1nh8q-NdjzfiAfAqw7L8Ayf0iA",
  authDomain: "inventory-1c8e8.firebaseapp.com",
  projectId: "inventory-1c8e8",
  appId: "1:196655663965:web:9777106f9228f727adf6b4"
};

// init firebase
const app = initializeApp(firebaseConfig);

// export auth
export const auth = getAuth(app);
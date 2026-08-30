import { app, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase Auth
const auth = getAuth(app);

// HTML elements
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const logoutBtn = document.getElementById("logoutBtn");
const bookingList = document.getElementById("bookingList");

// ADMIN LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  loginError.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Login successful:", userCredential.user.email);
    loginError.textContent = "";

  } catch (error) {
    console.error("LOGIN ERROR CODE:", error.code);
    console.error("LOGIN ERROR:", error);

    loginError.textContent =
      "Error: " + error.code;
  }
});

// CHECK LOGIN STATUS
onAuthStateChanged(auth, (user) => {
  console.log("Auth user:", user);

  if (user) {
    loginSection.classList.add("hidden");
    adminSection.classList.remove("hidden");

    loadBookings();
  } else {
    loginSection.classList.remove("hidden");
    adminSection.classList.add("hidden");
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
});

// LOAD BOOKINGS
async function loadBookings() {
  try {
    bookingList.innerHTML = "Loading bookings...";

    const querySnapshot = await getDocs(
      collection(db, "bookings")
    );

    bookingList.innerHTML = "";

    if (querySnapshot.empty) {
      bookingList.innerHTML = `
        <div class="loading">No bookings yet.</div>
      `;
      return;
    }

    querySnapshot.forEach((bookingDoc) => {
      const booking = bookingDoc.data();
      const bookingId = bookingDoc.id;
      const status = booking.status || "pending";

      bookingList.innerHTML += `
        <div class="booking-card">
          <div class="booking-top">
            <div>
              <h3>${booking.name || "Customer"}</h3>
              <p>${booking.phone || ""}</p>
            </div>

            <span class="status ${status}">
              ${status}
            </span>
          </div>

          <div class="booking-details">
            <div><strong>Service:</strong> ${booking.service || "-"}</div>
            <div><strong>Date:</strong> ${booking.date || "-"}</div>
            <div><strong>Time:</strong> ${booking.time || "-"}</div>
            <div><strong>Message:</strong> ${booking.message || "-"}</div>
          </div>

          <div class="booking-actions">
            <button
              class="approve-btn"
              onclick="updateBookingStatus('${bookingId}', 'approved')">
              APPROVE
            </button>

            <button
              class="cancel-btn"
              onclick="updateBookingStatus('${bookingId}', 'cancelled')">
              CANCEL
            </button>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Firestore Error:", error);
    bookingList.innerHTML = "Error loading bookings.";
  }
}

// APPROVE / CANCEL BOOKING
window.updateBookingStatus = async function(id, status) {
  try {
    await updateDoc(
      doc(db, "bookings", id),
      { status: status }
    );

    loadBookings();

  } catch (error) {
    console.error("Update Error:", error);
    alert("Status update nahi hua.");
  }
};

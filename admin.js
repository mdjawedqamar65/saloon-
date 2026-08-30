import { db } from "./firebase-config.js";

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

// Firebase app firebase-config.js me already initialize ho chuka hai
const auth = getAuth();

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const logoutBtn = document.getElementById("logoutBtn");
const bookingList = document.getElementById("bookingList");

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  loginError.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );

    loginError.textContent = "";

  } catch (error) {
    console.error(error);
    loginError.textContent = error.message;
  }
});

// LOGIN STATUS CHECK
onAuthStateChanged(auth, (user) => {
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
  await signOut(auth);
});

// LOAD BOOKINGS
async function loadBookings() {
  try {
    const querySnapshot = await getDocs(collection(db, "bookings"));

    bookingList.innerHTML = "";

    if (querySnapshot.empty) {
      bookingList.innerHTML = "No bookings yet.";
      return;
    }

    querySnapshot.forEach((bookingDoc) => {
      const booking = bookingDoc.data();
      const bookingId = bookingDoc.id;

      bookingList.innerHTML += `
        <div class="booking-card">
          <div class="booking-top">
            <div>
              <h3>${booking.name || "Customer"}</h3>
              <p>${booking.phone || ""}</p>
            </div>

            <span class="status ${booking.status || "pending"}">
              ${booking.status || "pending"}
            </span>
          </div>

          <div class="booking-details">
            <div><strong>Service:</strong> ${booking.service || "-"}</div>
            <div><strong>Date:</strong> ${booking.date || "-"}</div>
            <div><strong>Time:</strong> ${booking.time || "-"}</div>
            <div><strong>Message:</strong> ${booking.message || "-"}</div>
          </div>

          <div class="booking-actions">
            <button class="approve-btn"
              onclick="updateBookingStatus('${bookingId}', 'approved')">
              APPROVE
            </button>

            <button class="cancel-btn"
              onclick="updateBookingStatus('${bookingId}', 'cancelled')">
              CANCEL
            </button>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error(error);
    bookingList.innerHTML = "Error loading bookings.";
  }
}

// UPDATE BOOKING STATUS
window.updateBookingStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status: status
    });

    loadBookings();

  } catch (error) {
    console.error(error);
    alert("Status update nahi hua.");
  }
};

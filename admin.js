import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const bookingList = document.getElementById("bookingList");

// Firebase se bookings load karo
async function loadBookings() {
  try {
    const querySnapshot = await getDocs(collection(db, "bookings"));

    bookingList.innerHTML = "";

    if (querySnapshot.empty) {
      bookingList.innerHTML =
        `<div class="loading">No bookings yet.</div>`;
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
    console.error(error);

    bookingList.innerHTML =
      `<div class="loading">Error loading bookings.</div>`;
  }
}

// Booking status change
window.updateBookingStatus = async function(id, status) {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status: status
    });

    loadBookings();

  } catch (error) {
    console.error(error);
    alert("Status update nahi hua. Dobara try karo.");
  }
};

// Page open hote hi bookings load
loadBookings();

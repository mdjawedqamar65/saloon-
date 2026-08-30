import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

// Mobile menu
menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// Booking date
const dateInput = document.getElementById("date");
dateInput.min = new Date().toISOString().split("T")[0];

// BOOKING FORM
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

bookingForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const submitButton = bookingForm.querySelector(
    "button[type='submit']"
  );

  submitButton.textContent = "PLEASE WAIT...";
  submitButton.disabled = true;

  try {
    await addDoc(collection(db, "bookings"), {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      service: document.getElementById("service").value,
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      message: document.getElementById("message").value.trim(),
      status: "pending",
      createdAt: serverTimestamp()
    });

    formMessage.style.color = "green";
    formMessage.textContent =
      "Appointment request sent successfully! ✨";

    bookingForm.reset();

  } catch (error) {
    console.error("Booking Error:", error);

    formMessage.style.color = "red";
    formMessage.textContent =
      "Something went wrong. Please try again.";
  }

  submitButton.textContent = "REQUEST APPOINTMENT";
  submitButton.disabled = false;
});


// CHECK BOOKING STATUS
const statusForm = document.getElementById("statusForm");
const statusPhone = document.getElementById("statusPhone");
const statusResult = document.getElementById("statusResult");

statusForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const phone = statusPhone.value.trim();

  statusResult.innerHTML = "Checking your booking...";

  try {
    const q = query(
      collection(db, "bookings"),
      where("phone", "==", phone)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusResult.innerHTML = `
        <p style="color:red;">
          No booking found with this phone number.
        </p>
      `;
      return;
    }

    // Latest/first matching booking
    let booking = null;

    querySnapshot.forEach((doc) => {
      booking = doc.data();
    });

    const status = booking.status || "pending";

    let statusText = "";
    let statusColor = "";

    if (status === "approved") {
      statusText = "🟢 APPROVED";
      statusColor = "green";
    } else if (status === "cancelled") {
      statusText = "🔴 CANCELLED";
      statusColor = "red";
    } else {
      statusText = "🟡 PENDING";
      statusColor = "#b8860b";
    }

    statusResult.innerHTML = `
      <div style="
        margin-top:20px;
        padding:20px;
        background:white;
        border:1px solid #e8ddd0;
        text-align:center;
      ">
        <h3 style="margin-bottom:10px;">
          ${booking.name || "Customer"}
        </h3>

        <p><strong>Service:</strong> ${booking.service || "-"}</p>
        <p><strong>Date:</strong> ${booking.date || "-"}</p>
        <p><strong>Time:</strong> ${booking.time || "-"}</p>

        <h3 style="color:${statusColor}; margin-top:15px;">
          ${statusText}
        </h3>
      </div>
    `;

  } catch (error) {
    console.error("Status Error:", error);

    statusResult.innerHTML = `
      <p style="color:red;">
        Error checking booking. Please try again.
      </p>
    `;
  }
});

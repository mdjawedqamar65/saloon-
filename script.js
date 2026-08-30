import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================
// MOBILE MENU
// ============================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}


// ============================
// BOOKING DATE
// ============================

const dateInput = document.getElementById("date");

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}


// ============================
// BOOKING FORM
// ============================

const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

if (bookingForm) {

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = bookingForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.textContent = "PLEASE WAIT...";
      submitButton.disabled = true;
    }

    if (formMessage) {
      formMessage.textContent = "";
    }

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

      if (formMessage) {
        formMessage.style.color = "green";
        formMessage.textContent =
          "Appointment request sent successfully! ✨";
      }

      bookingForm.reset();

    } catch (error) {

      console.error("Booking Error:", error);

      if (formMessage) {
        formMessage.style.color = "red";
        formMessage.textContent =
          "Booking failed: " + error.message;
      }

    } finally {

      if (submitButton) {
        submitButton.textContent = "REQUEST APPOINTMENT";
        submitButton.disabled = false;
      }
    }
  });
}


// ============================
// CHECK BOOKING STATUS
// ============================

const statusForm = document.getElementById("statusForm");
const statusPhone = document.getElementById("statusPhone");
const statusResult = document.getElementById("statusResult");

if (statusForm && statusPhone && statusResult) {

  statusForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const phone = statusPhone.value.trim();

    // Phone empty hai to
    if (!phone) {
      statusResult.innerHTML = `
        <p style="color:red; margin-top:15px;">
          Please enter your phone number.
        </p>
      `;
      return;
    }

    // Turant message dikhega
    statusResult.innerHTML = `
      <p style="margin-top:20px; text-align:center;">
        Checking your booking...
      </p>
    `;

    try {

      console.log("Checking phone:", phone);

      const bookingsRef = collection(db, "bookings");

      const q = query(
        bookingsRef,
        where("phone", "==", phone)
      );

      const querySnapshot = await getDocs(q);

      console.log("Bookings found:", querySnapshot.size);

      // Booking nahi mili
      if (querySnapshot.empty) {

        statusResult.innerHTML = `
          <div style="
            margin-top:20px;
            padding:20px;
            text-align:center;
            border:1px solid #e8ddd0;
          ">
            <h3>No Booking Found</h3>
            <p>
              Please enter the same phone number
              you used while booking.
            </p>
          </div>
        `;

        return;
      }


      // Latest available matching booking
      let booking = null;

      querySnapshot.forEach((bookingDoc) => {
        booking = bookingDoc.data();
      });


      const status = String(
        booking.status || "pending"
      ).toLowerCase();


      let statusText = "🟡 PENDING";
      let statusColor = "#b8860b";


      if (status === "approved") {
        statusText = "🟢 APPROVED";
        statusColor = "green";
      }

      if (status === "cancelled") {
        statusText = "🔴 CANCELLED";
        statusColor = "red";
      }


      // Result show
      statusResult.innerHTML = `
        <div style="
          margin-top:20px;
          padding:20px;
          background:#ffffff;
          border:1px solid #e8ddd0;
          text-align:center;
        ">

          <h3 style="margin-bottom:15px;">
            ${booking.name || "Customer"}
          </h3>

          <p>
            <strong>Service:</strong>
            ${booking.service || "-"}
          </p>

          <p>
            <strong>Date:</strong>
            ${booking.date || "-"}
          </p>

          <p>
            <strong>Time:</strong>
            ${booking.time || "-"}
          </p>

          <h3 style="
            color:${statusColor};
            margin-top:20px;
          ">
            ${statusText}
          </h3>

        </div>
      `;


    } catch (error) {

      console.error("STATUS CHECK ERROR:", error);

      statusResult.innerHTML = `
        <div style="
          margin-top:20px;
          padding:15px;
          color:red;
          text-align:center;
        ">
          Error: ${error.message}
        </div>
      `;
    }

  });

} else {

  console.error(
    "Status form elements not found:",
    {
      statusForm,
      statusPhone,
      statusResult
    }
  );
}

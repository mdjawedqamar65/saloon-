import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

// Aaj se pehle ki date select nahi hogi
const dateInput = document.getElementById("date");
dateInput.min = new Date().toISOString().split("T")[0];

// Booking form
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

bookingForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const submitButton = bookingForm.querySelector("button[type='submit']");
  submitButton.textContent = "PLEASE WAIT...";
  submitButton.disabled = true;

  try {
    await addDoc(collection(db, "bookings"), {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      service: document.getElementById("service").value,
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      message: document.getElementById("message").value,
      status: "pending",
      createdAt: serverTimestamp()
    });

    formMessage.style.color = "green";
    formMessage.textContent =
      "Appointment request sent successfully! ✨";

    bookingForm.reset();

  } catch (error) {
    console.error(error);

    formMessage.style.color = "red";
    formMessage.textContent =
      "Something went wrong. Please try again.";
  }

  submitButton.textContent = "REQUEST APPOINTMENT";
  submitButton.disabled = false;
});

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

const dateInput = document.getElementById("date");
dateInput.min = new Date().toISOString().split("T")[0];

document.getElementById("bookingForm").addEventListener("submit", function(e) {
e.preventDefault();

document.getElementById("formMessage").textContent =
"Your appointment request has been received! ✨";

this.reset();

// Firebase backend connect karne ke baad
// yahi booking database me save hogi.
});

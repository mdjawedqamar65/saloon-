import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ==========================================
// CONFIGURATION
// ==========================================

// Razorpay PUBLIC Key ID
const RAZORPAY_KEY_ID = "rzp_live_TVxhxaQ2eSoKlc";

// Cloudflare Worker URL
const PAYMENT_API =
  "https://sohana-payment.mdjawedqamar65.workers.dev/";


// ==========================================
// MOBILE MENU
// ==========================================

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


// ==========================================
// BOOKING DATE
// ==========================================

const dateInput = document.getElementById("date");

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}


// ==========================================
// BOOKING + RAZORPAY PAYMENT
// ==========================================

const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

if (bookingForm) {

  bookingForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const submitButton = document.getElementById("paymentButton");

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();

    const serviceSelect = document.getElementById("service");
    const amount = Number(serviceSelect.value);

    const selectedOption =
      serviceSelect.options[serviceSelect.selectedIndex];

    const serviceName =
      selectedOption.dataset.name || selectedOption.textContent.trim();

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const message = document.getElementById("message").value.trim();


    if (!name || !phone || !amount || !date || !time) {
      formMessage.style.color = "red";
      formMessage.textContent = "Please fill all required details.";
      return;
    }


    try {

      submitButton.disabled = true;
      submitButton.textContent = "CREATING PAYMENT...";

      formMessage.style.color = "#333";
      formMessage.textContent = "Please wait...";


      // CREATE ORDER
      const response = await fetch(PAYMENT_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          amount: amount
        })
      });


      const data = await response.json();


      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          data.error?.description ||
          "Payment order could not be created."
        );
      }


      // CHECK RAZORPAY SCRIPT
      if (typeof Razorpay === "undefined") {
        throw new Error(
          "Razorpay checkout could not be loaded. Please refresh the page."
        );
      }


      // OPEN RAZORPAY
      const options = {

        key: RAZORPAY_KEY_ID,

        amount: data.order.amount,

        currency: data.order.currency,

        name: "Sohana Beauty Saloon",

        description: serviceName,

        order_id: data.order.id,


        prefill: {
          name: name,
          contact: phone
        },


        notes: {
          customer_name: name,
          phone: phone,
          service: serviceName,
          appointment_date: date,
          appointment_time: time,
          special_request: message
        },


        handler: async function (paymentResponse) {

          try {

            submitButton.disabled = true;
            submitButton.textContent = "SAVING BOOKING...";


            // SAVE ONLY AFTER PAYMENT SUCCESS
            await addDoc(collection(db, "bookings"), {

              name: name,
              phone: phone,

              service: serviceName,
              amount: amount,

              date: date,
              time: time,

              message: message,

              status: "pending",

              paymentStatus: "paid",

              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,

              razorpayOrderId:
                paymentResponse.razorpay_order_id,

              razorpaySignature:
                paymentResponse.razorpay_signature,

              createdAt: serverTimestamp()
            });


            formMessage.style.color = "green";
            formMessage.textContent =
              "Payment successful! Your appointment has been booked. ✨";

            bookingForm.reset();

            alert(
              "Payment Successful! Your appointment has been booked."
            );


          } catch (error) {

            console.error("Firebase Save Error:", error);

            formMessage.style.color = "red";
            formMessage.textContent =
              "Payment was successful, but booking could not be saved. Please contact the salon.";

          } finally {

            submitButton.disabled = false;
            submitButton.textContent = "BOOK & PAY NOW";

          }

        },


        modal: {
          ondismiss: function () {

            submitButton.disabled = false;
            submitButton.textContent = "BOOK & PAY NOW";

            formMessage.style.color = "red";
            formMessage.textContent = "Payment cancelled.";

          }
        }

      };


      const razorpay = new Razorpay(options);

      razorpay.open();


    } catch (error) {

      console.error("Payment Error:", error);

      formMessage.style.color = "red";
      formMessage.textContent =
        "Payment Error: " + error.message;

      submitButton.disabled = false;
      submitButton.textContent = "BOOK & PAY NOW";

    }

  });

}


// ==========================================
// CHECK BOOKING STATUS
// ==========================================

const statusForm = document.getElementById("statusForm");
const statusPhone = document.getElementById("statusPhone");
const statusResult = document.getElementById("statusResult");

if (statusForm && statusPhone && statusResult) {

  statusForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const phone = statusPhone.value.trim();


    if (!phone) {
      statusResult.innerHTML = `
        <p style="color:red; margin-top:15px;">
          Please enter your phone number.
        </p>
      `;
      return;
    }


    statusResult.innerHTML = `
      <p style="margin-top:20px; text-align:center;">
        Checking your booking...
      </p>
    `;


    try {

      const bookingsRef = collection(db, "bookings");

      const q = query(
        bookingsRef,
        where("phone", "==", phone)
      );

      const querySnapshot = await getDocs(q);


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


      let booking = null;

      querySnapshot.forEach((bookingDoc) => {
        booking = bookingDoc.data();
      });


      const status =
        String(booking.status || "pending").toLowerCase();

      let statusText = "🟡 PENDING";
      let statusColor = "#b8860b";


      if (status === "approved") {
        statusText = "🟢 APPROVED";
        statusColor = "green";
      } else if (status === "cancelled") {
        statusText = "🔴 CANCELLED";
        statusColor = "red";
      }


      const paymentText =
        booking.paymentStatus === "paid"
          ? "✅ PAID"
          : "⏳ PENDING";


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

          <p>
            <strong>Payment:</strong>
            ${paymentText}
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

}
